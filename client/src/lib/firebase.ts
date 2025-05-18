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
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Force token refresh
      const token = await currentUser.getIdToken(true);
      
      // Save to localStorage for cross-domain API requests
      localStorage.setItem('firebase_id_token', token);
      return token;
    }
  } catch (error) {
    console.error('Error getting fresh token:', error);
  }
  
  // Try to get cached token from localStorage as fallback
  return localStorage.getItem('firebase_id_token');
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