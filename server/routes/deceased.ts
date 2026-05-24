import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { assertPersonOwnership } from "../helpers";
import { insertDeceasedFormFieldsSchema } from "@shared/schema";

export function registerDeceasedRoutes(app: Express, requireAuth: RequestHandler): void {

  // GET /api/deceased-form-fields/:personId/complete — must be before /:personId
  app.get("/api/deceased-form-fields/:personId/complete", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const personId = parseInt(req.params.personId, 10);
      if (isNaN(personId)) return res.status(400).json({ error: "Invalid ID" });
      await assertPersonOwnership(user.id, personId);
      const status = await storage.getDeceasedFormFieldsCompletionStatus(personId);
      res.json(status);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/deceased-form-fields/:personId
  app.get("/api/deceased-form-fields/:personId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const personId = parseInt(req.params.personId, 10);
      if (isNaN(personId)) return res.status(400).json({ error: "Invalid ID" });
      await assertPersonOwnership(user.id, personId);
      const fields = await storage.getDeceasedFormFields(personId);
      res.json(fields ?? null);
    } catch (error) {
      next(error);
    }
  });

  // PATCH /api/deceased-form-fields/:personId — upsert
  app.patch("/api/deceased-form-fields/:personId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const personId = parseInt(req.params.personId, 10);
      if (isNaN(personId)) return res.status(400).json({ error: "Invalid ID" });
      await assertPersonOwnership(user.id, personId);

      const existing = await storage.getDeceasedFormFields(personId);
      let result;
      if (existing) {
        const updateSchema = insertDeceasedFormFieldsSchema.partial().omit({ personId: true });
        const updates = updateSchema.parse(req.body);
        result = await storage.updateDeceasedFormFields(personId, updates);
      } else {
        const parsed = insertDeceasedFormFieldsSchema.parse({ ...req.body, personId });
        result = await storage.createDeceasedFormFields(parsed);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  });
}
