import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { assertCaseOwnership } from "../helpers";
import { insertIntakeSchema, insertReferralEventSchema } from "@shared/schema";
import {
  deriveFlags,
  deriveReadiness,
  deriveSpecialist,
  amberFlagKeys,
} from "@shared/evaluation-config";

export function registerEvaluationRoutes(app: Express, requireAuth: RequestHandler): void {

  // GET /api/evaluation/:caseId — the case's intake record (or null)
  app.get("/api/evaluation/:caseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);
      const intake = await storage.getIntakeByCaseId(caseId);
      res.json(intake ?? null);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/evaluation/:caseId — upsert the case's intake; flags always derived server-side
  app.post("/api/evaluation/:caseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);

      // Accept either { answers: {...} } or a flat answers object
      const answers: Record<string, any> = req.body.answers ?? req.body;
      const derivedFlags = deriveFlags(answers);

      const existing = await storage.getIntakeByCaseId(caseId);
      let result;
      if (existing) {
        result = await storage.updateIntake(existing.id, { answers, derivedFlags });
      } else {
        const parsed = insertIntakeSchema.parse({
          userId: user.id,
          caseId,
          answers,
          derivedFlags,
        });
        result = await storage.createIntake(parsed);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/evaluation-responses/:caseId — alias used by the estate page
  app.get("/api/evaluation-responses/:caseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);
      const intake = await storage.getIntakeByCaseId(caseId);
      res.json(intake ?? null);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/intake/:caseId/readiness — the four-way readiness router (PS-5)
  app.get("/api/intake/:caseId/readiness", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);

      const intake = await storage.getIntakeByCaseId(caseId);
      const answers: Record<string, any> = (intake?.answers as Record<string, any>) ?? {};
      // Always recompute from answers: derivedFlags is a pure function of answers
      // and the stored copy can be stale after a rules change (a stale copy was
      // referring happy-path cases to a solicitor). Storage stays a cache only.
      const flags = deriveFlags(answers);

      const amberKeys = amberFlagKeys(answers);
      const acks = (intake?.amberAcknowledgements as Record<string, any>) ?? {};
      const amberAcknowledged = amberKeys.length > 0 && amberKeys.every((k) => acks[k]);

      const readiness = deriveReadiness(flags, {
        applicantRole: (intake?.applicantRole as "applicant" | "helper") ?? "applicant",
        amberAcknowledged,
      });
      res.json(readiness);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/intake/:caseId/acknowledge — dismiss amber flag(s) (PS-5)
  // Body: { flagKey?: string, all?: boolean }. Red flags are never dismissible.
  app.post("/api/intake/:caseId/acknowledge", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);

      const intake = await storage.getIntakeByCaseId(caseId);
      if (!intake) return res.status(404).json({ error: "No intake for this case" });

      const answers: Record<string, any> = (intake.answers as Record<string, any>) ?? {};
      const amberKeys = amberFlagKeys(answers);
      const toAck: string[] = req.body.all
        ? amberKeys
        : amberKeys.includes(req.body.flagKey)
          ? [req.body.flagKey]
          : [];

      const acks: Record<string, { by: string; at: string }> = {
        ...((intake.amberAcknowledgements as Record<string, { by: string; at: string }>) ?? {}),
      };
      const at = new Date().toISOString();
      for (const key of toAck) acks[key] = { by: user.id, at };

      const updated = await storage.updateIntake(intake.id, { amberAcknowledgements: acks });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/intake/:caseId/referral — warm handoff to a partner (PS-5)
  // Requires explicit consent; logs a referral event with a structured summary.
  app.post("/api/intake/:caseId/referral", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);

      if (req.body.consent !== true) {
        return res.status(400).json({ error: "Explicit consent is required to refer this case." });
      }

      const intake = await storage.getIntakeByCaseId(caseId);
      const answers: Record<string, any> = (intake?.answers as Record<string, any>) ?? {};
      // Always recompute from answers: derivedFlags is a pure function of answers
      // and the stored copy can be stale after a rules change (a stale copy was
      // referring happy-path cases to a solicitor). Storage stays a cache only.
      const flags = deriveFlags(answers);
      const specialist = deriveSpecialist(answers);

      const summary = {
        hasWill: flags.has_will ?? null,
        probateType: flags.probate_type ?? null,
        estateValueBand: answers.estate_value_estimate ?? null,
        specialistSeverity: specialist.specialistSeverity,
        specialistReasons: specialist.specialistReasons,
      };

      const event = await storage.createReferralEvent(
        insertReferralEventSchema.parse({
          caseId,
          userId: user.id,
          reasons: specialist.specialistReasons,
          summary,
          consentedAt: new Date(),
        }),
      );
      res.status(201).json(event);
    } catch (error) {
      next(error);
    }
  });
}
