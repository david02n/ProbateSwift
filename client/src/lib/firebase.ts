// FIREBASE CONFIGURATION
// This file now provides fallback initialization and utility functions
// The main Firebase initialization is handled by FirebaseProvider

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Temporary workaround for Replit domains
// This allows testing on Replit while keeping production config for probateswift.com
const getFirebaseConfig = () => {
  const currentDomain = window.location.hostname;
  const isReplitDomain = currentDomain.includes('replit.dev') || currentDomain.includes('kirk.replit.dev');
  
  // Create a copy of the config
  const config = { ...firebaseConfig };
  
  if (isReplitDomain) {
    // For Replit domains, use the current domain as auth domain
    // This ensures the auth domain matches the current domain
    config.authDomain = currentDomain;
    console.log('[Firebase] Running on Replit domain, using current domain as auth domain:', currentDomain);
  } else {
    console.log('[Firebase] Running on production domain, using configured auth domain');
  }
  
  return config;
};

// Validate Firebase configuration
function validateFirebaseConfig() {
  const config = getFirebaseConfig();
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field => !config[field as keyof typeof config]);
  
  if (missingFields.length > 0) {
    console.error('[Firebase] Missing required configuration fields:', missingFields);
    throw new Error(`Missing required Firebase configuration: ${missingFields.join(', ')}`);
  }
  
  // Check for domain mismatch
  const currentDomain = window.location.hostname;
  const configuredAuthDomain = config.authDomain;
  
  console.log('[Firebase] Configuration validation passed');
  console.log('[Firebase] Project ID:', config.projectId);
  console.log('[Firebase] Auth Domain:', configuredAuthDomain);
  console.log('[Firebase] Current Domain:', currentDomain);
  console.log('[Firebase] API Key:', config.apiKey ? 'Set' : 'Missing');
  console.log('[Firebase] App ID:', config.appId ? 'Set' : 'Missing');
  
  // Warn about domain mismatch
  if (configuredAuthDomain && currentDomain !== configuredAuthDomain) {
    console.warn('[Firebase] DOMAIN MISMATCH WARNING:');
    console.warn(`[Firebase] Current domain: ${currentDomain}`);
    console.warn(`[Firebase] Configured auth domain: ${configuredAuthDomain}`);
    console.warn('[Firebase] This will cause auth/internal-error. You need to either:');
    console.warn('[Firebase] 1. Add the current domain to Firebase Console > Authentication > Settings > Authorized domains');
    console.warn('[Firebase] 2. Or update your environment variables to match the current domain');
  }
}

// Fallback initialization for components that need immediate access
let fallbackApp: FirebaseApp | null = null;
let fallbackAuth: Auth | null = null;
let fallbackAnalytics: Analytics | null = null;

// Initialize Firebase if not already initialized
function ensureFirebaseInitialized(): { app: FirebaseApp; auth: Auth } {
  if (!fallbackApp) {
    const existingApps = getApps();
    
    if (existingApps.length > 0) {
      fallbackApp = existingApps[0];
      console.log('[Firebase] Using existing Firebase app');
    } else {
      // Validate required config
      validateFirebaseConfig();
      
      try {
        const config = getFirebaseConfig();
        fallbackApp = initializeApp(config);
        console.log('[Firebase] Fallback app initialized successfully');
      } catch (error) {
        console.error('[Firebase] Failed to initialize app:', error);
        throw new Error(`Firebase app initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    try {
      fallbackAuth = getAuth(fallbackApp);
      console.log('[Firebase] Auth instance created');
    } catch (error) {
      console.error('[Firebase] Failed to create auth instance:', error);
      throw new Error(`Firebase auth initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  if (!fallbackApp || !fallbackAuth) {
    throw new Error('Firebase initialization failed');
  }
  
  return { app: fallbackApp, auth: fallbackAuth };
}

// Export fallback instances
export const app = (() => {
  const { app } = ensureFirebaseInitialized();
  return app;
})();

export const auth = (() => {
  const { auth } = ensureFirebaseInitialized();
  return auth;
})();

// Initialize Analytics conditionally
export const analytics = (async () => {
  if (!fallbackAnalytics) {
    try {
      const analyticsSupported = await isSupported();
      if (analyticsSupported) {
        fallbackAnalytics = getAnalytics(app);
      }
    } catch (error) {
      console.warn('[Firebase] Analytics initialization failed:', error);
    }
  }
  return fallbackAnalytics;
})();

// Helper function to wait for Firebase Auth to initialize
export async function waitForAuthInit(): Promise<void> {
  return new Promise((resolve) => {
    const { auth: currentAuth } = ensureFirebaseInitialized();
    
    if (currentAuth.currentUser) {
      console.log("[Firebase] Auth already initialized with user:", currentAuth.currentUser.email);
      return resolve();
    }
    
    const unsubscribe = currentAuth.onAuthStateChanged((user: any) => {
      unsubscribe();
      console.log("[Firebase] Auth initialized:", user ? `with user ${user.email}` : "no user");
      resolve();
    });
  });
}

// Token management
let cachedToken: string | null = null;
let tokenTimestamp = 0;
const TOKEN_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function getFreshToken(): Promise<string | null> {
  // Use cached token if available and not expired
  const tokenAge = Date.now() - tokenTimestamp;
  if (cachedToken && tokenAge < TOKEN_CACHE_DURATION) {
    return cachedToken;
  }

  await waitForAuthInit();
  
  try {
    const { auth: currentAuth } = ensureFirebaseInitialized();
    const user = currentAuth.currentUser;
    
    if (!user) {
      cachedToken = null;
      tokenTimestamp = 0;
      return null;
    }

    const token = await user.getIdToken(true);
    cachedToken = token;
    tokenTimestamp = Date.now();

    // Store token for cross-domain requests
    if (window.location.hostname.includes('replit.app') || 
        window.location.hostname.includes('probateswift.com')) {
      localStorage.setItem('firebase_id_token', token);
      sessionStorage.setItem('firebase_id_token', token);
    }

    return token;
  } catch (error) {
    console.error('[Firebase] Error getting fresh token:', error);
    cachedToken = null;
    tokenTimestamp = 0;
    return null;
  }
}

// Initialize token refresh mechanism
export function initTokenRefresh() {
  const { auth: currentAuth } = ensureFirebaseInitialized();
  
  // Set up token refresh listener
  currentAuth.onIdTokenChanged(async (user: any) => {
    if (user) {
      try {
        const token = await user.getIdToken(true);
        cachedToken = token;
        tokenTimestamp = Date.now();
        
        // Store token for cross-domain requests
        if (window.location.hostname.includes('replit.app') || 
            window.location.hostname.includes('probateswift.com')) {
          localStorage.setItem('firebase_id_token', token);
          sessionStorage.setItem('firebase_id_token', token);
        }
      } catch (error) {
        console.error('[Firebase] Error refreshing token:', error);
      }
    }
  });
}

export default app;