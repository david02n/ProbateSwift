import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { assertCaseOwnership, assertPersonOwnership } from "../helpers";
import { insertExecutorSchema } from "@shared/schema";
import { config } from "../config";
import axios from "axios";

export function registerPeopleRoutes(app: Express, requireAuth: RequestHandler): void {

  // GET /api/executors — all people for authenticated user (across all their cases)
  app.get("/api/executors", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const cases = await storage.getProbateCasesByUserId(user.id);
      const peopleArrays = await Promise.all(
        cases.map(c => storage.getPeopleByCaseId(c.id))
      );
      const people = peopleArrays.flat();
      res.json(people);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/executors/:id — single person
  app.get("/api/executors/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const personId = parseInt(req.params.id, 10);
      if (isNaN(personId)) return res.status(400).json({ error: "Invalid ID" });
      const person = await assertPersonOwnership(user.id, personId);
      res.json(person);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/executors — create person
  app.post("/api/executors", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      // Validate caseId belongs to user
      const caseId = parseInt(req.body.caseId, 10);
      if (!caseId || isNaN(caseId)) {
        return res.status(400).json({ error: "caseId is required" });
      }
      await assertCaseOwnership(user.id, caseId);

      const parsed = insertExecutorSchema.parse({
        ...req.body,
        caseId,
        userId: user.id,
      });

      const created = await storage.createExecutor(parsed);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  });

  // PUT /api/executors/:id — update person
  app.put("/api/executors/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const personId = parseInt(req.params.id, 10);
      if (isNaN(personId)) return res.status(400).json({ error: "Invalid ID" });
      await assertPersonOwnership(user.id, personId);

      const updateSchema = insertExecutorSchema.partial().omit({ userId: true, caseId: true });
      const updates = updateSchema.parse(req.body);

      const updated = await storage.updateExecutor(personId, updates);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // DELETE /api/executors/:id — delete person
  app.delete("/api/executors/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const personId = parseInt(req.params.id, 10);
      if (isNaN(personId)) return res.status(400).json({ error: "Invalid ID" });
      await assertPersonOwnership(user.id, personId);
      await storage.deleteExecutor(personId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // GET /api/address-lookup?postcode=SW1A1AA — proxy to GetAddress.io
  app.get("/api/address-lookup", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postcode = req.query.postcode as string;
      if (!postcode) {
        return res.status(400).json({ error: "postcode query parameter is required" });
      }

      if (!config.GET_ADDRESS_API_KEY) {
        // Return empty result gracefully in dev without an API key
        return res.json({ suggestions: [] });
      }

      const encoded = encodeURIComponent(postcode.trim());
      const url = `https://api.getaddress.io/autocomplete/${encoded}?api-key=${config.GET_ADDRESS_API_KEY}`;
      const response = await axios.get(url, { timeout: 5000 });
      res.json(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return res.status(404).json({ error: "Postcode not found" });
      }
      next(error);
    }
  });
}
