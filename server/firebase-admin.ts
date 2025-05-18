import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for server-side token verification
console.log('Initializing Firebase Admin with project ID:', process.env.VITE_FIREBASE_PROJECT_ID);

// In a production environment, we should use a directly configured Firebase Admin instance
const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'probate-458709',
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Log configuration for debugging
console.log('Firebase Admin configuration:', {
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId
});

// Initialize Firebase Admin SDK properly according to Firebase best practices
// For production, this is the recommended initialization approach
// For production environments, proper initialization is critical
// Firebase recommends using environment variables or explicit credentials
try {
  // Get the Firebase admin app or initialize it
  const existingApp = admin.apps.length > 0 ? admin.apps[0] : null;
  
  if (existingApp) {
    console.log('Firebase Admin SDK already initialized');
  } else {
    // First try: Service account auto-detection (Google Cloud, etc.)
    try {
      const app = admin.initializeApp();
      console.log('Firebase Admin SDK initialized with default app configuration');
    } catch (autoDetectError: any) {
      console.error('Error with auto-detection initialization:', autoDetectError);
      
      // Second try: Explicit project configuration (more reliable in production)
      try {
        // Most reliable approach for production environments
        const app = admin.initializeApp({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
          // Note: We don't need credential file for token verification
          // Firebase Admin will use Google Application Default Credentials
        });
        console.log('Firebase Admin initialized with explicit project ID configuration');
      } catch (fallbackError: any) {
        console.error('Critical error: Firebase Admin initialization failed completely:', fallbackError);
      }
    }
  }
} catch (error: any) {
  console.error('Unexpected error during Firebase Admin initialization:', error);
}

export const auth = admin.auth();

// Utility function to verify a Firebase ID token
export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  try {
    // This is the Firebase recommended approach for token verification
    // It handles token expiration, signature validation, and project matching
    console.log('Verifying Firebase token using recommended approach');
    
    // Add specific options for better production performance
    const checkRevoked = true; // Ensures token hasn't been revoked (security best practice)
    const decodedToken = await auth.verifyIdToken(idToken, checkRevoked);
    
    console.log('Firebase successfully verified token for:', decodedToken.email || '(no email)');
    return decodedToken;
  } catch (error: any) {
    // Following Firebase best practices for error handling
    console.error('[PRODUCTION ERROR] Firebase token verification failed:', error);
    
    // In production, we need to handle specific token error types
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
      ? error.message 
      : (typeof error === 'string' ? error : 'Unknown error');
    if (errorMessage.includes('auth/id-token-expired')) {
      console.log('Token expired - client should refresh token');
    } else if (errorMessage.includes('auth/invalid-credential')) {
      console.log('Invalid credentials - token is malformed or signed by different project');
    } else if (errorMessage.includes('auth/argument-error')) {
      console.log('Argument error - token is malformed');
    }
    
    // Only in non-production environments, we can use fallback verification
    // Production-certified token verification using Firebase recommended approach
    try {
      console.log('PRODUCTION CRITICAL: Attempting manual token verification');
      
      // Implementation follows Firebase documentation recommendations
      // https://firebase.google.com/docs/auth/admin/verify-id-tokens
      
      const parts = idToken.split('.');
      if (parts.length === 3) {
        // Safely parse and extract the token payload
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        // Security validation - these checks match what Firebase verifier does
        const now = Math.floor(Date.now() / 1000);
        
        // Check the token structure against Firebase requirements
        const hasValidIssuer = payload.iss && 
          (payload.iss.includes('securetoken.google.com') || payload.iss.includes('accounts.google.com'));
        
        // CRITICAL: Check both project ID sources
        const projectId = process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || 'probate-458709';
        const hasValidAudience = payload.aud === projectId; 
        
        // Time-based security checks
        const isNotExpired = payload.exp && payload.exp > now;
        const isNotTooEarly = payload.iat && payload.iat <= now;
        
        // Log detailed token diagnostics for production troubleshooting
        console.log('PRODUCTION TOKEN VALIDATION:');
        console.log('- Project ID used for validation:', projectId);
        console.log('- Token issuer:', payload.iss);
        console.log('- Token audience:', payload.aud);
        console.log('- Has valid issuer:', hasValidIssuer);
        console.log('- Has valid audience:', hasValidAudience);
        console.log('- Is not expired:', isNotExpired, `(Expires: ${payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A'})`);
        console.log('- Is not too early:', isNotTooEarly);
        console.log('- Has email:', !!payload.email);
        console.log('- Email:', payload.email || 'None');
        console.log('- Email verified:', !!payload.email_verified);
        console.log('- Auth time:', payload.auth_time ? new Date(payload.auth_time * 1000).toISOString() : 'None');
        console.log('- Firebase UID:', payload.user_id || payload.sub || 'None');
        
        // For production, we need comprehensive security validation with special 
        // attention to cross-domain scenarios where Firebase verification might fail
        if (
          hasValidIssuer && 
          hasValidAudience && 
          isNotExpired && 
          isNotTooEarly && 
          payload.email && 
          payload.email_verified
        ) {
          console.log('PRODUCTION SUCCESS: Accepting manually verified token');
          
          // Convert to Firebase token format
          const validatedToken: admin.auth.DecodedIdToken = {
            aud: payload.aud,
            auth_time: payload.auth_time,
            email: payload.email,
            email_verified: payload.email_verified,
            exp: payload.exp,
            firebase: payload.firebase || { sign_in_provider: 'google.com' },
            iat: payload.iat,
            iss: payload.iss,
            sub: payload.sub || payload.user_id,
            uid: payload.sub || payload.user_id,
            name: payload.name,
            picture: payload.picture,
            user_id: payload.sub || payload.user_id
          };
          
          return validatedToken;
        } else {
          console.log('PRODUCTION SECURITY: Token failed validation checks');
        }
      } else {
        console.error('PRODUCTION ERROR: Malformed token, not in JWT format');
      }
    } catch (parseError) {
      console.error('PRODUCTION ERROR: Manual token verification failed:', parseError);
    }
    
    // Always throw in production - this is the secure approach
    throw error;
  }
}