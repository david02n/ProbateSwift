import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { apiRequest } from "./queryClient";

/**
 * Sign in with Google using popup
 * This is the main authentication function that handles both Firebase auth
 * and backend authentication in one flow
 */
export async function signInWithGoogle() {
  try {
    // 1. Sign in with Firebase using Google popup
    const result = await signInWithPopup(auth, googleProvider);
    
    // 2. Get the ID token
    const idToken = await result.user.getIdToken();
    
    // 3. Store token in localStorage for API requests
    localStorage.setItem('firebase_id_token', idToken);
    console.log('Google sign-in successful, token stored');
    
    // 4. Register/login with backend
    try {
      const response = await apiRequest('POST', '/api/auth/google', {
        idToken,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      });
      
      if (!response.ok) {
        console.error('Backend authentication failed:', await response.text());
        return null;
      }
      
      const userData = await response.json();
      console.log('Backend authentication successful');
      
      // 5. Save user data for app use
      return userData;
    } catch (error) {
      console.error('Error authenticating with backend:', error);
      return null;
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

/**
 * Sign out from Firebase and clear local storage
 */
export async function signOut() {
  try {
    // Sign out from Firebase
    await auth.signOut();
    
    // Clear token
    localStorage.removeItem('firebase_id_token');
    console.log('Signed out successfully');
    
    // Optionally notify backend
    try {
      await apiRequest('POST', '/api/logout');
    } catch (error) {
      console.error('Error logging out from backend:', error);
    }
    
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    return false;
  }
}

/**
 * Refresh the Firebase ID token
 * Call this periodically to ensure the token doesn't expire
 */
export async function refreshIdToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user logged in, cannot refresh token');
      return null;
    }
    
    // Force token refresh
    const freshToken = await user.getIdToken(true);
    
    // Store the token
    localStorage.setItem('firebase_id_token', freshToken);
    console.log('Token refreshed successfully');
    
    return freshToken;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

/**
 * Get the current ID token, refreshing if needed
 * This is used by the API requests to add the token to headers
 */
export async function getIdToken(forceRefresh: boolean = false): Promise<string | null> {
  try {
    // Check if we have a current user
    const user = auth.currentUser;
    if (!user) {
      console.log('No current user, using stored token if available');
      return localStorage.getItem('firebase_id_token');
    }
    
    // Get a fresh token if requested
    if (forceRefresh) {
      const token = await user.getIdToken(true);
      localStorage.setItem('firebase_id_token', token);
      return token;
    }
    
    // Get current token
    const token = await user.getIdToken();
    localStorage.setItem('firebase_id_token', token);
    return token;
  } catch (error) {
    console.error('Error getting ID token:', error);
    return localStorage.getItem('firebase_id_token');
  }
}

/**
 * Setup token refresh interval
 * Call this when the app initializes to ensure tokens stay fresh
 */
export function setupTokenRefresh() {
  // Firebase tokens expire after 1 hour
  // Refresh every 45 minutes to ensure we always have a valid token
  const REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes
  
  // Clear any existing refresh interval
  if ((window as any).__tokenRefreshInterval) {
    clearInterval((window as any).__tokenRefreshInterval);
  }
  
  // Set up new refresh interval
  (window as any).__tokenRefreshInterval = setInterval(async () => {
    console.log('Refreshing Firebase ID token...');
    await refreshIdToken();
  }, REFRESH_INTERVAL);
  
  console.log('Token refresh mechanism initialized');
}

/**
 * Initialize token-based authentication
 * Call this when the app starts
 */
export function initFirebaseAuth() {
  // Set up token refresh
  setupTokenRefresh();
  
  // Log when running in production environment
  if (window.location.hostname.includes('probateswift.com')) {
    console.log('PRODUCTION: Firebase token authentication initialized for probateswift.com');
  }
  
  // Check for existing token
  const storedToken = localStorage.getItem('firebase_id_token');
  if (storedToken) {
    console.log('Found existing Firebase token in storage');
  }
}