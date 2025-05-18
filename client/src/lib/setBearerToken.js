import { getAuth } from "firebase/auth";

// Function to directly set Bearer token on all fetch requests
export function setupTokenInterceptor() {
  const originalFetch = window.fetch;
  
  window.fetch = async function(resource, options = {}) {
    // Always initialize headers object if it doesn't exist
    options.headers = options.headers || {};
    
    // Don't add token to non-API requests
    if (typeof resource === 'string' && resource.includes('/api/')) {
      try {
        // Get current Firebase user
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (user) {
          // Get a fresh token
          const token = await user.getIdToken(true);
          
          // Add token to headers directly
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
          };
          
          console.log(`[TokenInterceptor] Added token to ${resource}`);
        } else {
          console.log(`[TokenInterceptor] No user logged in, skipping token for ${resource}`);
        }
      } catch (error) {
        console.error('[TokenInterceptor] Error adding token:', error);
      }
    }
    
    // Call original fetch with (potentially) modified options
    return originalFetch.call(this, resource, options);
  };
  
  console.log('[TokenInterceptor] Fetch interceptor installed');
}