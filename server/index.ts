import express from "express";
import cors from "cors";
import session from "express-session";
import { clerkMiddleware } from "@clerk/express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { config } from "./config";
import { securityMiddleware } from "./middleware/security";
import { errorHandler, notFoundHandler, asyncHandler } from "./errors";
import { createSessionStore } from "./session-store";


const app = express();

// Trust proxy for proper IP and protocol detection
app.set("trust proxy", 1);

// Apply security middleware
app.use(securityMiddleware.helmet);
app.use(securityMiddleware.securityHeaders);
app.use(cors(securityMiddleware.corsOptions));
app.use(clerkMiddleware());

// Apply rate limiting to all routes
app.use(securityMiddleware.limiter);

// Session middleware for server-side session compatibility
app.use(session({
  store: createSessionStore(),
  name: "probateswift.sid",
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Stripe webhook needs the raw, unparsed body for signature verification, so it
// must be registered BEFORE express.json() consumes the request stream.
app.use("/api/webhooks/stripe", express.raw({ type: "*/*" }));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes
(async () => {
  const server = await registerRoutes(app);

  // Setup development or production static file serving
  if (config.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Auth routes are already registered in registerRoutes function

  // Handle 404s
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  // Start server
  const port = config.PORT;
  const host = config.NODE_ENV === 'production' ? '0.0.0.0' : config.HOST;
  
  server.listen(port, host, () => {
    log(`Server running in ${config.NODE_ENV} mode on ${host}:${port}`);
  });
})().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
