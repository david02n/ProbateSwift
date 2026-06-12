import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { assertCaseOwnership } from "../helpers";
import { config } from "../config";
import {
  deriveFlags,
  deriveReadiness,
  amberFlagKeys,
} from "@shared/evaluation-config";

// Checkout uses a hosted Stripe Payment Link (config.STRIPE_PAYMENT_LINK). We
// redirect the browser to it with ?client_reference_id={caseId}, and the
// checkout.session.completed webhook flips that case to 'paid'. A Stripe client
// is only needed to verify the webhook signature, so a placeholder key is fine
// when no secret API key is set (constructEvent never calls the API).
const stripe =
  config.STRIPE_SECRET_KEY || config.STRIPE_WEBHOOK_SECRET
    ? new Stripe(config.STRIPE_SECRET_KEY || "sk_webhook_verify_only")
    : null;

/** Server-side recomputation of the canPay gate (never trust the client). */
async function computeCanPay(caseId: number): Promise<boolean> {
  const intake = await storage.getIntakeByCaseId(caseId);
  const answers: Record<string, any> = (intake?.answers as Record<string, any>) ?? {};
  // Recompute from answers (not the stored cache) so the canPay gate reflects the
  // current rules.
  const flags = deriveFlags(answers);

  const amberKeys = amberFlagKeys(answers);
  const acks = (intake?.amberAcknowledgements as Record<string, any>) ?? {};
  const amberAcknowledged = amberKeys.length > 0 && amberKeys.every((k) => acks[k]);

  const readiness = deriveReadiness(flags, {
    applicantRole: (intake?.applicantRole as "applicant" | "helper") ?? "applicant",
    amberAcknowledged,
  });
  return readiness.canPay;
}

/** True if the case already has a settled payment. */
async function isCasePaid(caseId: number): Promise<boolean> {
  const rows = await storage.getPaymentsByCaseId(caseId);
  return rows.some((p) => p.status === "paid");
}

export function registerPaymentRoutes(app: Express, requireAuth: RequestHandler): void {

  // GET /api/payments/:caseId — payment status for gating the submission UI
  app.get("/api/payments/:caseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);

      const rows = await storage.getPaymentsByCaseId(caseId);
      const paid = rows.find((p) => p.status === "paid") ?? null;
      res.json({
        paid: !!paid,
        amount: config.PROBATE_FEE_PENCE,
        currency: "gbp",
        payment: paid,
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/payments/checkout — return the Stripe Payment Link to redirect to,
  // tagged with this case so the webhook can mark it paid. Refuses unless the
  // case is ready to pay (canPay) and isn't already paid.
  app.post("/api/payments/checkout", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!config.STRIPE_PAYMENT_LINK) {
        return res.status(503).json({ error: "Payments are not configured." });
      }
      const user = (req as any).user;
      const caseId = parseInt(req.body.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "caseId is required" });
      await assertCaseOwnership(user.id, caseId);

      if (await isCasePaid(caseId)) {
        return res.status(409).json({ error: "This case has already been paid for." });
      }
      if (!(await computeCanPay(caseId))) {
        return res.status(403).json({
          error: "This case isn't ready for submission yet, so there's nothing to pay for.",
        });
      }

      // Record (or reuse) a pending row so the payment is tracked before redirect.
      const existingPending = (await storage.getPaymentsByCaseId(caseId)).find(
        (p) => p.status === "pending",
      );
      if (!existingPending) {
        await storage.createPayment({
          caseId,
          userId: user.id,
          amount: config.PROBATE_FEE_PENCE,
          currency: "gbp",
          status: "pending",
        });
      }

      // Stripe Payment Links accept client_reference_id + prefilled_email as query
      // params; the webhook reads client_reference_id back to attribute the payment.
      const url = new URL(config.STRIPE_PAYMENT_LINK);
      url.searchParams.set("client_reference_id", String(caseId));
      if (user.email) url.searchParams.set("prefilled_email", user.email);

      res.json({ url: url.toString() });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/webhooks/stripe — Stripe → server callback (PUBLIC, signature-verified).
  // The raw body for this path is preserved in server/index.ts (express.raw before
  // express.json), which Stripe signature verification requires.
  app.post("/api/webhooks/stripe", async (req: Request, res: Response) => {
    if (!stripe || !config.STRIPE_WEBHOOK_SECRET) {
      return res.status(503).json({ error: "Webhook not configured" });
    }
    const sig = req.headers["stripe-signature"];
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig as string,
        config.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "invalid signature";
      return res.status(400).send(`Webhook Error: ${msg}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const caseId = parseInt(session.client_reference_id ?? "", 10);
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        if (!isNaN(caseId)) {
          const rows = await storage.getPaymentsByCaseId(caseId);
          // Don't double-apply; reuse a pending row if there is one.
          if (!rows.some((p) => p.status === "paid")) {
            const pending = rows.find((p) => p.status === "pending");
            if (pending) {
              await storage.updatePayment(pending.id, {
                status: "paid",
                stripeCheckoutSessionId: session.id,
                stripePaymentIntentId: paymentIntentId ?? undefined,
                paidAt: new Date(),
              });
            } else {
              // Paid via a direct link with no pending row — record it anyway,
              // taking the owner from the case (payments.userId is a required FK).
              const probateCase = await storage.getProbateCase(caseId);
              if (probateCase) {
                await storage.createPayment({
                  caseId,
                  userId: probateCase.userId,
                  amount: session.amount_total ?? config.PROBATE_FEE_PENCE,
                  currency: session.currency ?? "gbp",
                  status: "paid",
                  stripeCheckoutSessionId: session.id,
                  stripePaymentIntentId: paymentIntentId ?? undefined,
                  paidAt: new Date(),
                });
              }
            }
          }
        } else {
          console.warn("[stripe webhook] checkout.session.completed without a numeric client_reference_id; cannot attribute to a case.");
        }
      }
    } catch (err) {
      // Log but still 200 so Stripe doesn't retry a DB hiccup forever; the
      // session can be reconciled later from the dashboard status check.
      console.error("[stripe webhook] handler error:", err);
    }

    res.json({ received: true });
  });
}
