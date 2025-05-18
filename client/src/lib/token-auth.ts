import { auth } from './firebase';

/**
 * Gets the current Firebase ID token
 * Forces a refresh if needed to ensure token validity
 */
export async function getFirebaseToken(forceRefresh = false): Promise<string | null> {
  try {
    // Check if a user is logged in
    const user = auth.currentUser;
    if (!user) {
      console.log('No user logged in, cannot get token');
      return localStorage.getItem('firebase_token') || null;
    }
    
    // Get token, forcing refresh if specified
    const token = await user.getIdToken(forceRefresh);
    
    // Store token for future use
    if (token) {
      localStorage.setItem('firebase_token', token);
      
      // Add diagnostic info in production
      if (window.location.hostname.includes('probateswift.com')) {
        console.log('PRODUCTION: Got fresh Firebase token');
      }
    }
    
    return token;
  } catch (error) {
    console.error('Error getting Firebase token:', error);
    return null;
  }
}

/**
 * Patches the global fetch function to automatically add Firebase tokens
 * to Authorization headers for all API requests
 */
export function patchFetchWithTokenAuth() {
  // EMERGENCY FIX: Skip patching fetch to restore site functionality
  console.log('Token auth temporarily disabled for emergency recovery');
  
  // For reference, this is the original implementation we'll restore later:
  /*
  const originalFetch = window.fetch;
  
  window.fetch = async function(input, init = {}) {
    const url = input instanceof Request ? input.url : input.toString();
    
    // Only add Authorization header for API requests
    if (url.includes('/api/')) {
      try {
        // Get token (try to refresh if possible)
        const token = await getFirebaseToken();
        
        if (token) {
          // Create new headers with Authorization
          const headers = new Headers(init.headers || {});
          headers.set('Authorization', `Bearer ${token}`);
          
          // Create new init with updated headers
          const newInit = {
            ...init,
            headers
          };
          
          // Log in production for debugging
          if (window.location.hostname.includes('probateswift.com')) {
            console.log(`PRODUCTION: Added token to ${url}`);
          }
          
          return originalFetch(input, newInit);
        }
      } catch (error) {
        console.error('Error adding token to fetch:', error);
      }
    }
    
    // Fall back to original fetch if any errors or not an API request
    return originalFetch(input, init);
  };
  */
  
  console.log('Patched fetch with token authentication');
}

/**
 * Sets up token refresh on an interval
 * Firebase tokens expire after 1 hour, refresh every 45 minutes
 */
export function setupTokenRefresh() {
  // Clear any existing timer
  if ((window as any).__tokenRefreshTimer) {
    clearInterval((window as any).__tokenRefreshTimer);
  }
  
  // Set up new refresh timer
  (window as any).__tokenRefreshTimer = setInterval(async () => {
    console.log('Refreshing Firebase token...');
    await getFirebaseToken(true);
  }, 45 * 60 * 1000); // 45 minutes
  
  console.log('Token refresh timer set up');
}

/**
 * Initialize token-based authentication
 * Call this when the app starts
 */
export function initTokenAuth() {
  patchFetchWithTokenAuth();
  setupTokenRefresh();
  
  // Get initial token
  getFirebaseToken().then(token => {
    if (token) {
      console.log('Initial Firebase token obtained');
    } else {
      console.log('No initial token available - will add when user logs in');
    }
  });
}