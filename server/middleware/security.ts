import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../config';

const parseOriginHost = (origin: string) => {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
};

const railwayPublicDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.toLowerCase();
const railwayStaticUrl = process.env.RAILWAY_STATIC_URL?.toLowerCase();
const allowedOriginHosts = new Set(
  config.ALLOWED_ORIGINS
    .map(parseOriginHost)
    .filter((host): host is string => Boolean(host)),
);

if (railwayPublicDomain) {
  allowedOriginHosts.add(railwayPublicDomain);
}

if (railwayStaticUrl) {
  allowedOriginHosts.add(railwayStaticUrl);
}

// Create rate limiter with generous limits for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Very high limit for development
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for auth endpoints during development
    if (process.env.NODE_ENV === 'development' && req.path.startsWith('/api/auth')) {
      return true;
    }
    return false;
  },
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
        'https://*.clerk.accounts.dev',
        'https://*.clerk.dev',
        'https://clerk.probateswift.com',
        'https://challenges.cloudflare.com',
        'https://*.googleapis.com',
        'https://www.gstatic.com',
        'https://accounts.google.com'
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        'https://fonts.googleapis.com'
      ],
      workerSrc: [
        "'self'",
        'blob:'
      ],
      imgSrc: ["'self'", 'data:', 'https:', 'https://challenges.cloudflare.com'],
      connectSrc: [
        "'self'", 
        'https://*.probateswift.com', 
        'https://*.railway.app',
        'wss://*.railway.app',
        'https://*.clerk.accounts.dev',
        'https://*.clerk.dev',
        'https://clerk.probateswift.com',
        'https://challenges.cloudflare.com',
        'https://*.googleapis.com',
        'https://accounts.google.com'
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
        'https://*.clerk.accounts.dev',
        'https://*.clerk.dev',
        'https://clerk.probateswift.com',
        'https://challenges.cloudflare.com',
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

    const originHost = parseOriginHost(origin);
    const isRailwayDomain = origin.includes('.railway.app') || origin.includes('.up.railway.app');
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isProbateSwiftDomain = originHost === 'probateswift.com' || originHost === 'www.probateswift.com';

    if (
      config.ALLOWED_ORIGINS.includes(origin) ||
      (originHost !== null && allowedOriginHosts.has(originHost)) ||
      isProbateSwiftDomain ||
      isRailwayDomain ||
      isLocalhost
    ) {
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
