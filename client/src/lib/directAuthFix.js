// DIRECT FIX FOR FIREBASE TOKEN AUTHENTICATION
// This is a direct fix for the issue with Firebase tokens not being included in requests

import firebase from 'firebase/app';
import 'firebase/auth';

// This function must be called at application startup
export function applyDirectAuthFix() {
  // Store the original fetch
  const originalFetch = window.fetch;
  
  // Override fetch
  window.fetch = async function(resource, options = {}) {
    // Only add token to API requests
    if (typeof resource === 'string' && resource.includes('/api/')) {
      console.log(`[DIRECT AUTH FIX] Processing request to ${resource}`);
      
      try {
        // Get Firebase instance and check if we have a logged in user
        const user = firebase.auth().currentUser;
        
        if (user) {
          // User is logged in, get a fresh token
          console.log(`[DIRECT AUTH FIX] User authenticated as ${user.email}`);
          const token = await user.getIdToken(true);
          
          // Set up headers if they don't exist
          if (!options.headers) {
            options.headers = {};
          }
          
          // Add authorization header with token
          options.headers['Authorization'] = `Bearer ${token}`;
          console.log('[DIRECT AUTH FIX] Token added to request headers');
          
          // Save token for debugging
          window.__debugAuthToken = {
            token: token.substring(0, 15) + '...',
            timestamp: new Date().toISOString(),
            url: resource
          };
        } else {
          console.log('[DIRECT AUTH FIX] No user logged in, skipping token');
        }
      } catch (error) {
        console.error('[DIRECT AUTH FIX] Error adding token:', error);
      }
    }
    
    // Call original fetch
    return originalFetch.call(this, resource, options);
  };
  
  console.log('[DIRECT AUTH FIX] Applied v1.0.14-May18-2358');
}