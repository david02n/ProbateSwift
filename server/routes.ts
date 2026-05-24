import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireClerkAuth, setupClerkAuth } from "./clerk";
import { insertAssessmentResultSchema, insertProbateCaseSchema } from "@shared/schema";
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

  // ── Assessment ─────────────────────────────────────────────────────────────

  app.get("/api/assessment", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const results = await storage.getAssessmentResultsByUserId(user.id);
      res.json(results.at(-1) ?? null);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/assessment", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const parsed = insertAssessmentResultSchema.parse({
        ...req.body,
        userId: user.id,
      });
      const created = await storage.createAssessmentResult(parsed);
      res.status(201).json(created);
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
