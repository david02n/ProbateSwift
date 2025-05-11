import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Configure CORS for cross-domain requests
const corsOptions = {
  // More permissive origin handling for better cross-domain support
  origin: function(origin: any, callback: any) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) {
      log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Log the origin for debugging purposes
    log(`CORS: Request from origin: ${origin}`);
    
    // For the Replit and ProbateSwift domains, always allow
    if (
      origin.includes('probateswift.com') || 
      origin.includes('replit.app') || 
      origin.includes('replit.dev')
    ) {
      log(`CORS: Explicitly allowing ${origin}`);
      return callback(null, true);
    }
    
    // Check against our allowed origins
    const allowedOrigins = [
      // Local development domains
      /localhost:\d+$/,
      /127\.0\.0\.1:\d+$/,
      // Replit domains - be more permissive for replit subdomains
      /\.replit\.dev$/,
      /\.replit\.app$/,
      /\.us-east-1\.csb\.app$/,
      // Production domains
      /\.probateswift\.com$/,
      'https://probateswift.com',
      'https://www.probateswift.com',
      'https://probateswift.replit.app'
    ];
    
    // Check the origin against our allowed patterns
    let allowed = false;
    for (const allowedOrigin of allowedOrigins) {
      if (typeof allowedOrigin === 'string' && origin === allowedOrigin) {
        allowed = true;
        break;
      } else if (allowedOrigin instanceof RegExp && allowedOrigin.test(origin)) {
        allowed = true;
        break;
      }
    }
    
    if (allowed) {
      log(`CORS: Origin ${origin} is allowed`);
      callback(null, true);
    } else {
      log(`CORS: Origin ${origin} is not allowed but allowing anyway for debugging`);
      // Still allow but warn - this can be changed to deny in production
      callback(null, true);
    }
  },
  credentials: true, // CRITICAL: Allow cookies to be sent with requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-CSRF-Token',
    'X-XSRF-Token',
    'Origin', 
    'Accept', 
    'Accept-Language',
    'Access-Control-Allow-Origin',
    'Cookie',
    'Cache-Control',
    'Connection'
  ],
  exposedHeaders: [
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials',
    'Set-Cookie'
  ],
  maxAge: 86400 // Cache preflight requests for 24 hours
};

app.use(cors(corsOptions));

// Add additional headers for better cross-domain support
app.use((req, res, next) => {
  // Extract hostname for dynamic cookie domain setting
  const host = req.headers.host || '';
  log(`Request host: ${host}`);
  
  // Set the Vary header to tell proxies to cache by Origin
  res.setHeader('Vary', 'Origin');
  
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
