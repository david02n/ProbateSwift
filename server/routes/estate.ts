import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { assertCaseOwnership } from "../helpers";
import { insertEstateAssetSchema, insertEstateLiabilitySchema } from "@shared/schema";
import { NotFoundError } from "../errors";

export function registerEstateRoutes(app: Express, requireAuth: RequestHandler): void {

  // ── Assets ──────────────────────────────────────────────────────────────────

  // GET /api/assets/:caseId — all assets for a case
  app.get("/api/assets/:caseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);
      const assets = await storage.getEstateAssetsByCaseId(caseId);
      res.json(assets);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/assets — create asset
  app.post("/api/assets", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.body.caseId, 10);
      if (!caseId || isNaN(caseId)) {
        return res.status(400).json({ error: "caseId is required" });
      }
      await assertCaseOwnership(user.id, caseId);

      const parsed = insertEstateAssetSchema.parse({ ...req.body, caseId });
      const created = await storage.createEstateAsset(parsed);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  });

  // PATCH /api/assets/:id — update asset
  app.patch("/api/assets/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const assetId = parseInt(req.params.id, 10);
      if (isNaN(assetId)) return res.status(400).json({ error: "Invalid ID" });
      const asset = await storage.getEstateAsset(assetId);
      if (!asset) throw new NotFoundError("Asset not found");
      await assertCaseOwnership(user.id, asset.caseId);

      const updateSchema = insertEstateAssetSchema.partial().omit({ caseId: true });
      const updates = updateSchema.parse(req.body);
      const updated = await storage.updateEstateAsset(assetId, updates);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // DELETE /api/assets/:id — delete asset
  app.delete("/api/assets/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const assetId = parseInt(req.params.id, 10);
      if (isNaN(assetId)) return res.status(400).json({ error: "Invalid ID" });
      const asset = await storage.getEstateAsset(assetId);
      if (!asset) throw new NotFoundError("Asset not found");
      await assertCaseOwnership(user.id, asset.caseId);
      await storage.deleteEstateAsset(assetId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // ── Liabilities ─────────────────────────────────────────────────────────────

  // GET /api/liabilities/:caseId — all liabilities for a case
  app.get("/api/liabilities/:caseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);
      const liabilities = await storage.getEstateLiabilitiesByCaseId(caseId);
      res.json(liabilities);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/liabilities — create liability
  app.post("/api/liabilities", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.body.caseId, 10);
      if (!caseId || isNaN(caseId)) {
        return res.status(400).json({ error: "caseId is required" });
      }
      await assertCaseOwnership(user.id, caseId);

      const parsed = insertEstateLiabilitySchema.parse({ ...req.body, caseId });
      const created = await storage.createEstateLiability(parsed);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  });

  // PATCH /api/liabilities/:id — update liability
  app.patch("/api/liabilities/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const liabilityId = parseInt(req.params.id, 10);
      if (isNaN(liabilityId)) return res.status(400).json({ error: "Invalid ID" });
      const liability = await storage.getEstateLiability(liabilityId);
      if (!liability) throw new NotFoundError("Liability not found");
      await assertCaseOwnership(user.id, liability.caseId);

      const updateSchema = insertEstateLiabilitySchema.partial().omit({ caseId: true });
      const updates = updateSchema.parse(req.body);
      const updated = await storage.updateEstateLiability(liabilityId, updates);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // DELETE /api/liabilities/:id — delete liability
  app.delete("/api/liabilities/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const liabilityId = parseInt(req.params.id, 10);
      if (isNaN(liabilityId)) return res.status(400).json({ error: "Invalid ID" });
      const liability = await storage.getEstateLiability(liabilityId);
      if (!liability) throw new NotFoundError("Liability not found");
      await assertCaseOwnership(user.id, liability.caseId);
      await storage.deleteEstateLiability(liabilityId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
}
