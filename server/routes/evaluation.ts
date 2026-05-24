import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { assertCaseOwnership } from "../helpers";
import { insertEvaluationResponseSchema } from "@shared/schema";
import { deriveEvaluationFlags } from "@shared/evaluation-config";

export function registerEvaluationRoutes(app: Express, requireAuth: RequestHandler): void {

  // GET /api/evaluation/:caseId
  app.get("/api/evaluation/:caseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);
      const response = await storage.getEvaluationResponse(caseId);
      res.json(response ?? null);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/evaluation/:caseId — upsert; flags always derived server-side
  app.post("/api/evaluation/:caseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);

      // Accept either { answers: {...} } or a flat answers object
      const answers: Record<string, any> = req.body.answers ?? req.body;
      const derivedFlags = deriveEvaluationFlags(answers);

      const existing = await storage.getEvaluationResponse(caseId);
      let result;
      if (existing) {
        result = await storage.updateEvaluationResponse(caseId, { answers, derivedFlags });
      } else {
        const parsed = insertEvaluationResponseSchema.parse({
          userId: user.id,
          caseId,
          answers,
          derivedFlags,
        });
        result = await storage.createEvaluationResponse(parsed);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/evaluation-responses/:caseId — alias used by estate page
  app.get("/api/evaluation-responses/:caseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);
      const response = await storage.getEvaluationResponse(caseId);
      res.json(response ?? null);
    } catch (error) {
      next(error);
    }
  });
}
