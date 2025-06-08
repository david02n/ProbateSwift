import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// FIREBASE CONFIGURATION
// Critical for proper authentication in all environments

// Get current hostname for environment detection
const hostname = window.location.hostname;
const isProd = hostname.includes('probateswift.com');

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "321971954611",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: "G-1YW4Q67L65"
};

// Initialize Firebase only if it hasn't been initialized already
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  
  // Log initialization for debugging
  console.log('[Firebase] Initialized with config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    environment: import.meta.env.MODE
  });
} else {
  app = getApps()[0];
}

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Analytics only in browser and if supported
export const analytics = typeof window !== 'undefined' 
  ? isSupported().then(yes => yes ? getAnalytics(app) : null)
  : null;

// Development environment setup
if (import.meta.env.DEV) {
  // Connect to auth emulator if running locally
  if (window.location.hostname === 'localhost') {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    console.log('[Firebase] Connected to Auth Emulator');
  }
}

// Helper function to wait for Firebase Auth to initialize
export async function waitForAuthInit(): Promise<void> {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      console.log("[Firebase] Auth already initialized with user:", auth.currentUser.email);
      return resolve();
    }
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
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
    const user = auth.currentUser;
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

// Setup automatic token refresh
export function initTokenRefresh() {
  const REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes
  
  setInterval(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken(true);
        localStorage.setItem('firebase_id_token', token);
        console.log('[Firebase] Token refreshed automatically');
      }
    } catch (error) {
      console.error('[Firebase] Token refresh failed:', error);
    }
  }, REFRESH_INTERVAL);
  
  console.log('[Firebase] Token refresh mechanism initialized');
}

export default app;