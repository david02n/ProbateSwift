import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireClerkAuth, setupClerkAuth } from "./clerk";
import { insertIntakeSchema, insertProbateCaseSchema, insertLeadSchema } from "@shared/schema";
import { deriveFlags } from "@shared/evaluation-config";
import { assertCaseOwnership } from "./helpers";
import { strictLimiter } from "./middleware/security";
import { WebSocketServer, WebSocket } from "ws";
import { getAuth } from "@clerk/express";
import { registerCaseRoutes } from "./routes/cases";
import { registerPeopleRoutes } from "./routes/people";
import { registerEstateRoutes } from "./routes/estate";
import { registerDocumentRoutes } from "./routes/documents";
import { registerEvaluationRoutes } from "./routes/evaluation";
import { registerDeceasedRoutes } from "./routes/deceased";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  setupClerkAuth(app);
  console.log("Clerk authentication middleware registered");

  // ── WebSocket server for real-time notifications ───────────────────────────
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
    clientTracking: true,
  });

  wss.on("connection", (ws: WebSocket, req) => {
    // Authenticate the WebSocket connection via Clerk session
    const auth = getAuth(req as any);
    if (!auth.userId) {
      ws.close(1008, "Unauthorized");
      return;
    }

    console.log(`New WebSocket connection from ${req.socket.remoteAddress} (user: ${auth.userId})`);

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log("Received WebSocket message:", message);
        ws.send(
          JSON.stringify({
            type: "echo",
            data: message,
            timestamp: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.error("WebSocket message parsing error:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  /** Broadcast a message to all connected WebSocket clients. */
  const broadcast = (message: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "broadcast",
            data: message,
            timestamp: new Date().toISOString(),
          })
        );
      }
    });
  };

  const requireAuth = requireClerkAuth;

  // ── Utility routes (no auth required) ────────────────────────────────────

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/session-refresh", (req: Request, res: Response) => {
    if (req.session) {
      req.session.touch();
      res.json({
        message: "Session refreshed successfully",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(401).json({ message: "No active session" });
    }
  });

  // ── Intake — anonymous assessment (public) ─────────────────────────────────
  // The landing assessment writes a single anonymous intake row keyed by a
  // client-generated browserSessionId. On signup this row is claimed (below),
  // not copied — so the assessment answers ARE the start of the evaluation.

  // GET /api/intake/anon/:browserSessionId — fetch an anonymous intake (resume)
  app.get("/api/intake/anon/:browserSessionId", strictLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const row = await storage.getIntakeByBrowserSession(req.params.browserSessionId);
      res.json(row ?? null);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/intake/anon — upsert an anonymous intake by browserSessionId
  app.post("/api/intake/anon", strictLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const browserSessionId: string | undefined = req.body.browserSessionId;
      if (!browserSessionId) {
        return res.status(400).json({ error: "browserSessionId is required" });
      }
      const answers: Record<string, any> = req.body.answers ?? {};
      const email: string | undefined = req.body.email;
      const applicantRole: "applicant" | "helper" =
        req.body.applicantRole === "helper" ? "helper" : "applicant";
      const derivedFlags = deriveFlags(answers);

      const existing = await storage.getIntakeByBrowserSession(browserSessionId);
      let result;
      if (existing) {
        result = await storage.updateIntake(existing.id, {
          answers,
          derivedFlags,
          email,
          applicantRole,
        });
      } else {
        const parsed = insertIntakeSchema.parse({
          browserSessionId,
          answers,
          derivedFlags,
          email,
          applicantRole,
        });
        result = await storage.createIntake(parsed);
      }
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/intake/claim — attach the anonymous intake to the signed-in user + case
  app.post("/api/intake/claim", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.body.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid caseId" });
      await assertCaseOwnership(user.id, caseId);

      const browserSessionId: string | undefined = req.body.browserSessionId;
      let claimed = browserSessionId
        ? await storage.claimIntake(browserSessionId, user.id, caseId)
        : undefined;

      // No anonymous row to claim (or it was already claimed) — make sure the
      // case still has an intake record to work against.
      if (!claimed) {
        claimed =
          (await storage.getIntakeByCaseId(caseId)) ??
          (await storage.createIntake(
            insertIntakeSchema.parse({ userId: user.id, caseId }),
          ));
      }
      res.json(claimed);
    } catch (error) {
      next(error);
    }
  });

  // ── Marketing leads (public, no auth) ─────────────────────────────────────
  // Captures early-access / notify-me emails from the relaunch landing
  // assessment. Rate-limited since it is unauthenticated.
  app.post("/api/leads", strictLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = insertLeadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Please enter a valid email address.",
          code: "VALIDATION_ERROR",
        });
      }
      const created = await storage.createLead(parsed.data);
      res.status(201).json({ id: created.id });
    } catch (error) {
      next(error);
    }
  });

  // ── Probate cases (list all / create) ─────────────────────────────────────
  // Specific routes (current, start, :caseId) are handled by registerCaseRoutes below.

  app.get("/api/probate-cases", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const cases = await storage.getProbateCasesByUserId(user.id);
      res.json(cases);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/probate-cases", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const parsed = insertProbateCaseSchema.parse({
        ...req.body,
        userId: user.id,
      });
      const created = await storage.createProbateCase(parsed);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  });

  // ── Domain route modules ──────────────────────────────────────────────────

  registerCaseRoutes(app, requireAuth);
  registerPeopleRoutes(app, requireAuth);
  registerEstateRoutes(app, requireAuth);
  registerDocumentRoutes(app, requireAuth, broadcast);
  registerEvaluationRoutes(app, requireAuth);
  registerDeceasedRoutes(app, requireAuth);

  return httpServer;
}
