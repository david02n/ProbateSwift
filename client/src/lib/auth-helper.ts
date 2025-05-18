import { auth } from './firebase';

/**
 * Simple helper to get a Firebase token and add it to fetch requests
 * This avoids 401 Unauthorized errors in production environments
 */
export async function addTokenToRequest(options: RequestInit = {}): Promise<RequestInit> {
  const newOptions = { ...options };
  
  try {
    // Try to get a token from the current Firebase user
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      if (token) {
        // Store token for backup use
        localStorage.setItem('firebase_token', token);
        
        // Add Authorization header with Bearer token
        if (!newOptions.headers) {
          newOptions.headers = {};
        }
        (newOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        
        // Log success in production
        if (window.location.hostname.includes('probateswift.com')) {
          console.log('Production: Added token to request headers');
        }
      }
    } else {
      // Try to use stored token if available
      const storedToken = localStorage.getItem('firebase_token');
      if (storedToken) {
        if (!newOptions.headers) {
          newOptions.headers = {};
        }
        (newOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${storedToken}`;
        
        if (window.location.hostname.includes('probateswift.com')) {
          console.log('Production: Using stored token for request');
        }
      }
    }
  } catch (error) {
    console.error('Error adding token to request:', error);
  }
  
  return newOptions;
}

/**
 * Apply this patch to fetch to ensure tokens are added to all requests
 * Call this when the application starts
 */
export function patchFetch() {
  const originalFetch = window.fetch;
  
  window.fetch = async function(input, init) {
    // Only modify requests to our own API
    const url = input instanceof Request ? input.url : input.toString();
    if (url.includes('/api/')) {
      const newInit = await addTokenToRequest(init || {});
      return originalFetch(input, newInit);
    }
    
    // Pass through other requests unchanged
    return originalFetch(input, init);
  };
  
  console.log('Patched fetch to add tokens to API requests');
}

/**
 * Initialize this helper when the app starts
 */
export function initAuthHelper() {
  // Patch fetch to add tokens
  patchFetch();
  
  // Set up token refresh
  setInterval(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken(true);
        localStorage.setItem('firebase_token', token);
        console.log('Refreshed Firebase token');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }, 45 * 60 * 1000); // Refresh every 45 minutes
  
  console.log('Authentication helper initialized');
}