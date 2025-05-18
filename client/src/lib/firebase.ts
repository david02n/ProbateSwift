import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration with your provided values
const firebaseConfig = {
  apiKey: "AIzaSyCWeCvuiXsoQCdn_E4yRDh2QT4j4-fQBo0",
  authDomain: "probate-458709.firebaseapp.com",
  projectId: "probate-458709",
  storageBucket: "probate-458709.firebasestorage.app",
  messagingSenderId: "321971954611",
  appId: "1:321971954611:web:580f68844b10e7e6e6e1c6",
  measurementId: "G-1YW4Q67L65"
};

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

// Helper function to get fresh tokens and maintain auth state across domains
// This is critical for production environments where cookies don't work cross-domain
export async function getFreshToken(): Promise<string | null> {
  // Special handling for production environment at probateswift.com
  const isProduction = window.location.hostname.includes('probateswift.com');
  
  if (isProduction) {
    console.log('PRODUCTION: Getting Firebase token for probateswift.com');
  }
  
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Force token refresh - critical for production environments
      const token = await currentUser.getIdToken(true);
      
      // Save to localStorage for cross-domain API requests
      localStorage.setItem('firebase_id_token', token);
      
      if (isProduction) {
        console.log('PRODUCTION: Successfully got fresh token (length: ' + token.length + ')');
        
        // In production, also store in sessionStorage as additional backup
        sessionStorage.setItem('firebase_id_token', token);
        
        // For debugging - store token verification time
        localStorage.setItem('firebase_token_time', new Date().toISOString());
      }
      
      return token;
    } else {
      if (isProduction) {
        console.log('PRODUCTION WARNING: No current user found for token refresh');
      }
    }
  } catch (error) {
    console.error('Error getting fresh token:', error);
    
    if (isProduction) {
      // Log detailed error info in production
      console.error('PRODUCTION TOKEN ERROR:', JSON.stringify(error));
    }
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