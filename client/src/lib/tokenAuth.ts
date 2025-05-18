import { auth } from './firebase';

// Get the current Firebase ID token, refreshing if needed
export async function getIdToken(forceRefresh: boolean = false): Promise<string | null> {
  try {
    // Check if we have a current user
    const user = auth.currentUser;
    if (!user) {
      console.log('No current user found');
      return null;
    }
    
    // Get a fresh token
    const token = await user.getIdToken(forceRefresh);
    
    // Store the token for later use
    localStorage.setItem('firebase_id_token', token);
    
    // For production domains, log detailed info
    if (window.location.hostname.includes('probateswift.com')) {
      console.log(`PRODUCTION: Got fresh token (length: ${token.length})`);
      // Store token timestamp
      localStorage.setItem('token_timestamp', Date.now().toString());
    }
    
    return token;
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

// Get the stored token from localStorage
export function getStoredToken(): string | null {
  return localStorage.getItem('firebase_id_token');
}

// Add token to request headers
export async function addTokenToHeaders(headers: HeadersInit = {}): Promise<HeadersInit> {
  const newHeaders = { ...headers };
  
  // Try to get a fresh token first
  let token = await getIdToken(false);
  
  // If that fails, use the stored token
  if (!token) {
    token = getStoredToken();
  }
  
  // Add the token to headers if available
  if (token) {
    (newHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  return newHeaders;
}

// Set up token refresh
export function setupTokenRefresh(): void {
  // Firebase tokens expire after 1 hour, refresh every 45 minutes
  const REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes
  
  // Clear any existing refresh timer
  if ((window as any).__tokenRefreshTimer) {
    clearInterval((window as any).__tokenRefreshTimer);
  }
  
  // Set up new refresh timer
  (window as any).__tokenRefreshTimer = setInterval(async () => {
    console.log('Refreshing Firebase ID token...');
    
    // Force a token refresh
    const token = await getIdToken(true);
    
    if (token) {
      console.log('Firebase ID token refreshed successfully');
    } else {
      console.log('Token refresh failed - no current user');
    }
  }, REFRESH_INTERVAL);
  
  console.log('Token refresh mechanism activated');
}