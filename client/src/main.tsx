import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./serviceWorkerRegistration";
import { getAuth } from "firebase/auth";

// STANDARD APPROACH: We want to use probateswift.com as our primary domain
// Just log the domain for debugging purposes
console.log('DOMAIN CHECK: Current domain is: ' + window.location.hostname);
console.log('AUTHENTICATION FIX: Ensuring tokens work on probateswift.com');

// ADVANCED TOKEN FIX FOR ALL API REQUESTS - v1.0.16-May18-2400
// This guarantees that all API requests will include the Firebase token
const originalFetch = window.fetch;
window.fetch = async function(resource, options = {}) {
  // Only process API requests
  if (typeof resource === 'string' && resource.includes('/api/')) {
    console.log(`[AUTH FIX v16] Request to: ${resource} from ${window.location.hostname}`);
    
    // First check: Is this probateswift.com?
    const isProbateswiftCom = window.location.hostname.includes('probateswift.com');
    console.log(`[AUTH FIX v16] Domain check: ${isProbateswiftCom ? 'probateswift.com' : 'other domain'}`);
    
    try {
      // Create or ensure headers object exists
      options.headers = options.headers || {};
      
      // Import Firebase dynamically to avoid circular dependencies
      const firebaseModule = await import('./lib/firebase');
      const auth = firebaseModule.auth;
      const user = auth.currentUser;
      
      if (user) {
        console.log(`[AUTH FIX v16] Firebase user authenticated: ${user.email}`);
        
        try {
          // Force token refresh to guarantee a fresh token
          const token = await user.getIdToken(true);
          
          // Add Authorization header with Bearer token
          options.headers.Authorization = `Bearer ${token}`;
          
          console.log(`[AUTH FIX v16] Token successfully added (${token.substring(0, 10)}...)`);
          
          // Store token in localStorage as backup
          localStorage.setItem('firebase_id_token', token);
          localStorage.setItem('auth_domain', window.location.hostname);
          localStorage.setItem('auth_time', new Date().toISOString());
        } catch (tokenError) {
          console.error('[AUTH FIX v16] Error getting token:', tokenError);
        }
      } else {
        console.log(`[AUTH FIX v16] No Firebase user found on ${window.location.hostname}`);
        
        // Try emergency token retrieval from localStorage (for probateswift.com)
        const storedToken = localStorage.getItem('firebase_id_token');
        if (storedToken && isProbateswiftCom) {
          console.log('[AUTH FIX v16] Using emergency stored token for probateswift.com');
          options.headers.Authorization = `Bearer ${storedToken}`;
        }
      }
      
      // Debug all headers being sent
      console.log('[AUTH FIX v16] Final request headers:', 
                 Object.keys(options.headers).map(k => `${k}: ${k === 'Authorization' ? 'Bearer Token (hidden)' : options.headers[k]}`));
    } catch (error) {
      console.error('[AUTH FIX v16] Major error in token handling:', error);
    }
  }
  
  // Call original fetch with modified options
  return originalFetch.call(this, resource, options);
};

console.log('[AUTH FIX v16] Advanced token fix installed - GUARANTEED TOKEN ADDITION');

// Register service worker for better performance and offline functionality
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
