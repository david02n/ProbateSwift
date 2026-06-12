import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { assertCaseOwnership } from "../helpers";
import { buildFormContext, fillForm, isSupportedForm } from "../services/formFiller";

export function registerFormRoutes(app: Express, requireAuth: RequestHandler): void {

  // POST /api/forms/:caseId/generate/:formType — produce a filled, downloadable
  // PDF. Gated behind payment: form generation is the paid deliverable (phase 4–5).
  app.post(
    "/api/forms/:caseId/generate/:formType",
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = (req as any).user;
        const caseId = parseInt(req.params.caseId, 10);
        if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
        await assertCaseOwnership(user.id, caseId);

        const formType = req.params.formType.toLowerCase();
        if (!isSupportedForm(formType)) {
          return res.status(404).json({ error: `Form "${formType}" is not available yet.` });
        }

        // Gate: the case must be paid for before forms are generated.
        const paid = (await storage.getPaymentsByCaseId(caseId)).some((p) => p.status === "paid");
        if (!paid) {
          return res.status(402).json({ error: "Payment is required before generating your forms." });
        }

        const context = await buildFormContext(caseId);
        const { bytes, filename } = await fillForm(formType, context);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(Buffer.from(bytes));
      } catch (error) {
        next(error);
      }
    },
  );
}
