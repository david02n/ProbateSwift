import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration with domain-specific auth settings
const hostname = window.location.hostname;

// Determine environment type
const isProbateswiftCom = hostname === 'probateswift.com' || hostname === 'www.probateswift.com';
const isReplitDev = hostname.includes('replit.dev');
const isReplitApp = hostname.includes('replit.app');

// Configure Firebase with environment-appropriate settings
const firebaseConfig = {
  apiKey: "AIzaSyCWeCvuiXsoQCdn_E4yRDh2QT4j4-fQBo0",
  // Dynamic authDomain based on environment
  // For development in Replit: use the Replit domain
  // For production: use probateswift.com
  authDomain: isReplitDev ? hostname : "probateswift.com",
  projectId: "probate-458709",
  storageBucket: "probate-458709.firebasestorage.app",
  messagingSenderId: "321971954611",
  appId: "1:321971954611:web:580f68844b10e7e6e6e1c6",
  measurementId: "G-1YW4Q67L65"
};

// Log which configuration we're using for debugging purposes
console.log(`[Firebase] Using authDomain: ${firebaseConfig.authDomain} on ${hostname}`);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;

// Only initialize analytics in browser environment
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn('Analytics initialization error:', e);
  }
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider with optimal parameters
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Helper function to wait for Firebase Auth to initialize
// This addresses the race condition where API calls happen before Firebase Auth is ready
export function waitForAuthInit(): Promise<void> {
  return new Promise((resolve) => {
    // Check if auth is already initialized with a user
    if (auth.currentUser) {
      console.log("Firebase already initialized with user:", auth.currentUser.email);
      return resolve();
    }
    
    console.log("Waiting for Firebase Auth state...");
    
    // Otherwise wait for auth state to change
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // Clean up the listener to avoid memory leaks
      unsubscribe();
      
      if (user) {
        console.log("Firebase Auth initialized with user:", user.email);
      } else {
        console.log("Firebase Auth initialized, no user logged in");
      }
      
      // Auth state has loaded (user may be null, that's fine)
      // The key is that Firebase has had a chance to check for a user
      resolve();
    });
  });
}

// Global token cache
let cachedToken: string | null = null;
let tokenTimestamp: number = 0;

// Helper function to get fresh tokens and maintain auth state across domains
// This is critical for production environments where cookies don't work cross-domain
export async function getFreshToken(): Promise<string | null> {
  // Special handling for production environment at probateswift.com
  const isProduction = window.location.hostname.includes('probateswift.com') || 
                      window.location.hostname.includes('replit.app');
  
  // Debug all environments to identify token issues
  console.log(`[Auth] Getting Firebase token for ${window.location.hostname}`);
  
  // Check if we have a cached token that's less than 30 minutes old
  const tokenAge = Date.now() - tokenTimestamp;
  if (cachedToken && tokenAge < 30 * 60 * 1000) {
    console.log(`[Auth] Using cached token (age: ${tokenAge/1000}s)`);
    return cachedToken;
  }
  
  // Wait for Firebase Auth to initialize before attempting to get token
  await waitForAuthInit();
  
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log(`[Auth] Current user found: ${currentUser.email}`);
      
      // Force token refresh - critical for production environments
      const token = await currentUser.getIdToken(true);
      
      // Update cache
      cachedToken = token;
      tokenTimestamp = Date.now();
      
      // Save to both storage options for resilience
      localStorage.setItem('firebase_id_token', token);
      sessionStorage.setItem('firebase_id_token', token);
      
      // Log token info (without revealing the actual token)
      console.log(`[Auth] Successfully got token (length: ${token.length})`);
      
      // Add metadata for debugging
      localStorage.setItem('firebase_token_time', new Date().toISOString());
      localStorage.setItem('firebase_user_email', currentUser.email || 'unknown');
      
      // For direct testing in console
      (window as any).__firebaseAuthDebug = {
        hasToken: true,
        tokenLength: token.length,
        userEmail: currentUser.email,
        timestamp: new Date().toISOString()
      };
      
      return token;
    } else {
      console.warn('[Auth] No current user found for token refresh');
      cachedToken = null;
      tokenTimestamp = 0;
      
      // Try emergency retrieval from storage
      const stored = localStorage.getItem('firebase_id_token') || 
                    sessionStorage.getItem('firebase_id_token');
                    
      if (stored) {
        console.log('[Auth] Found stored token, but user not logged in - clearing token');
        localStorage.removeItem('firebase_id_token');
        sessionStorage.removeItem('firebase_id_token');
      }
      
      return null;
    }
  } catch (error) {
    console.error('[Auth] Error getting fresh token:', error);
    
    // Reset cache on error
    cachedToken = null;
    tokenTimestamp = 0;
    
    // Clear storage on error as token might be invalid
    localStorage.removeItem('firebase_id_token');
    sessionStorage.removeItem('firebase_id_token');
    
    return null;
  }
  
  // Try to get cached token from storage as fallback
  // Check both storage locations with production priority
  const localToken = localStorage.getItem('firebase_id_token');
  const sessionToken = sessionStorage.getItem('firebase_id_token');
  
  if (isProduction) {
    if (localToken) {
      console.log('PRODUCTION: Using cached token from localStorage');
      return localToken;
    } else if (sessionToken) {
      console.log('PRODUCTION: Using cached token from sessionStorage');
      return sessionToken;
    } else {
      console.log('PRODUCTION ERROR: No token available in any storage');
      return null;
    }
  }
  
  return localToken || sessionToken || null;
}

// Setup function to keep token fresh (call this on app initialization)
export function initTokenRefresh() {
  // Set up interval to refresh token
  const refreshInterval = 45 * 60 * 1000; // 45 minutes
  
  setInterval(async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken(true);
        localStorage.setItem('firebase_id_token', token);
        console.log('Token refreshed automatically');
      } catch (e) {
        console.error('Failed to refresh token:', e);
      }
    }
  }, refreshInterval);
}

export default app;