import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../config';

// Create rate limiter
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure Helmet with secure defaults
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", 
        'https://*.replit.dev',
        'https://*.firebaseapp.com',
        'https://*.googleapis.com',
        'https://www.gstatic.com'
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        'https://fonts.googleapis.com'
      ],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: [
        "'self'", 
        'https://*.probateswift.com', 
        'https://*.replit.dev', 
        'wss://*.replit.dev',
        'https://*.firebaseapp.com',
        'https://*.googleapis.com',
        'https://firebase.googleapis.com'
      ],
      fontSrc: [
        "'self'", 
        'https:', 
        'data:', 
        'https://fonts.gstatic.com'
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: [
        "'self'",
        'https://*.firebaseapp.com',
        'https://accounts.google.com'
      ],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'sameorigin' },
  hidePoweredBy: true,
  hsts: config.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = config.ALLOWED_ORIGINS;
    const isReplitDomain = origin.includes('.replit.dev') || origin.includes('.kirk.replit.dev');
    
    if (allowedOrigins.includes(origin) || isReplitDomain) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  next();
};

// Request validation middleware
export const validateRequest = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(400).json({
          error: 'Invalid request data',
          details: error.message,
        });
      } else {
        res.status(400).json({
          error: 'Invalid request data',
          details: 'Unknown validation error',
        });
      }
    }
  };
};

// Export all security middleware
export const securityMiddleware = {
  helmet: helmetConfig,
  limiter,
  corsOptions,
  securityHeaders,
  validateRequest,
}; 