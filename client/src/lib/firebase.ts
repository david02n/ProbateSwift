// FIREBASE CONFIGURATION
// This file now provides fallback initialization and utility functions
// The main Firebase initialization is handled by FirebaseProvider

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
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
    } else {
      // Validate required config
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error('Missing required Firebase configuration. Please check your environment variables.');
      }
      
      fallbackApp = initializeApp(firebaseConfig);
      console.log('[Firebase] Fallback app initialized');
    }
    
    fallbackAuth = getAuth(fallbackApp);
    
    // Connect to Auth Emulator in development
    if (import.meta.env.DEV) {
      try {
        connectAuthEmulator(fallbackAuth, 'http://localhost:9099');
      } catch (error) {
        console.warn('[Firebase] Auth emulator connection failed:', error);
      }
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