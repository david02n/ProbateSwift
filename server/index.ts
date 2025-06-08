import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { config } from "./config";
import { securityMiddleware } from "./middleware/security";
import { errorHandler, notFoundHandler, asyncHandler } from "./errors";


const app = express();

// Trust proxy for proper IP and protocol detection
app.set("trust proxy", 1);

// Apply security middleware
app.use(securityMiddleware.helmet);
app.use(securityMiddleware.securityHeaders);
app.use(cors(securityMiddleware.corsOptions));

// Apply rate limiting to all routes
app.use(securityMiddleware.limiter);

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
  server.listen({
    port: config.PORT,
    host: config.HOST,
    reusePort: true,
  }, () => {
    log(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
  });
})().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
