import { z } from 'zod';
import path from 'path';

// Define the environment schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Server configuration
  PORT: z.string().transform(Number).default('5000'),
  HOST: z.string().default('0.0.0.0'),
  
  // Security
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters').default('development-session-secret-change-me'),
  COOKIE_SECRET: z.string().min(32, 'Cookie secret must be at least 32 characters').default('development-cookie-secret-change-me'),
  
  // Domains and CORS
  ALLOWED_ORIGINS: z.string()
    .transform(s => s.split(',').map(origin => origin.trim()))
    .default('http://localhost:5000,https://probateswift.com'),
  
  // Database
  DATABASE_URL: z.string().url('Invalid database URL').optional(),
  
  // File upload
  UPLOAD_DIR: z.string().default(path.join(process.cwd(), 'uploads')),
  MAX_FILE_SIZE: z.string().transform(Number).default('5242880'), // 5MB in bytes
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('eu-west-2'),
  S3_BUCKET_NAME: z.string().default('probateswift-documents'),

  // n8n integration
  N8N_WEBHOOK_SECRET: z.string().optional(),

  // App base URL (used to construct callback URLs sent to n8n)
  APP_BASE_URL: z.string().optional(),

  // GetAddress.io
  GET_ADDRESS_API_KEY: z.string().optional(),

  // Document processing
  GEMINI_API_KEY: z.string().optional(),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));
      
      if (missingVars.length > 0) {
        console.error('Missing required environment variables:', missingVars.join(', '));
      }
      
      const invalidVars = error.errors
        .filter(err => err.code !== 'invalid_type')
        .map(err => `${err.path.join('.')}: ${err.message}`);
      
      if (invalidVars.length > 0) {
        console.error('Invalid environment variables:', invalidVars.join(', '));
      }
    }
    throw error;
  }
};

// Export the validated config
export const config = parseEnv();

// Export type for the config
export type Config = z.infer<typeof envSchema>;

// Helper function to check if we're in production
export const isProduction = config.NODE_ENV === 'production';

// Helper function to get cookie options
export const getCookieOptions = (req: { secure?: boolean; headers: { [key: string]: string | undefined } }) => {
  const isSecure = isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https';
  
  return {
    secure: isSecure,
    httpOnly: true,
    sameSite: isSecure ? 'lax' as const : 'none' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}; 
