import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // For debugging in production environments
    const origin = window.location.origin;
    const domain = origin.includes('replit.app') || origin.includes('probateswift.com') 
      ? origin 
      : 'Development';
    
    // Check if it's a mobile browser for special handling
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const mobileState = isMobile ? 'Mobile Browser' : 'Desktop Browser';
    
    console.log(`[API Request] ${method} ${url} from ${domain} (${mobileState})`);
    if (data) {
      console.log('[API Request] Data:', JSON.stringify(data).substring(0, 200) + (JSON.stringify(data).length > 200 ? '...' : ''));
    }
    
    // For mobile authentication requests, update localStorage to help maintain session
    if (isMobile && (url.includes('/api/login') || url.includes('/api/auth/google'))) {
      console.log('[API Request] Mobile authentication request detected');
      localStorage.setItem('mobile_auth_timestamp', Date.now().toString());
      
      // Store minimal user info for session recovery if needed
      if (data && typeof data === 'object' && 'email' in data) {
        localStorage.setItem('mobile_last_email', (data as any).email);
      }
    }
    
    // Check if URL should be absolute in production environments
    let requestUrl = url;
    if ((url.startsWith('/api/') || url === '/api') && 
        (origin.includes('replit.app') || origin.includes('probateswift.com'))) {
      // For absolute URLs in production to avoid cross-domain issues
      requestUrl = `${origin}${url}`;
      console.log(`[API Request] Using absolute URL: ${requestUrl}`);
    }
    
    // Customize fetch options for cross-domain requests in production
    const fetchOptions: RequestInit = {
      method,
      headers: {
        // Default headers for all requests
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Always include cookies
      mode: "cors", // Enable CORS
    };
    
    // Add content-type header if there's data
    if (data) {
      (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
    }
    
    // Enhanced token handling for production environments 
    try {
      // Try to get a fresh token using our dedicated helper
      const getFreshToken = async (): Promise<string | null> => {
        try {
          // Dynamic import to avoid circular dependencies
          const module = await import('./firebase');
          if (typeof module.getFreshToken === 'function') {
            return await module.getFreshToken();
          }
        } catch (e) {
          console.error('[API Request] Error importing getFreshToken:', e);
        }
        
        // Fallback implementation if dynamic import fails
        try {
          const auth = (window as any).firebase?.auth?.();
          if (auth?.currentUser) {
            const token = await auth.currentUser.getIdToken(true);
            if (token) {
              localStorage.setItem('firebase_id_token', token);
              return token;
            }
          }
        } catch (e) {
          console.error('[API Request] Fallback token retrieval failed:', e);
        }
        
        // Last resort - try localStorage
        return localStorage.getItem('firebase_id_token');
      };
      
      // Get token and add to headers if available
      const token = await getFreshToken();
      if (token) {
        console.log("[API Request] Adding Firebase ID token as Bearer token");
        (fetchOptions.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        
        // Set a debug property to help with production troubleshooting
        (window as any).__authDebug = {
          ...(window as any).__authDebug || {},
          lastTokenRefresh: new Date().toISOString(),
          tokenAvailable: true,
          tokenLength: token.length
        };
      } else {
        console.log("[API Request] No Firebase token available");
      }
    } catch (tokenError) {
      console.error("[API Request] Error getting Firebase token:", tokenError);
    }
    
    // Log the request configuration
    console.log(`[API Request] Credentials mode: ${fetchOptions.credentials}`);
    console.log(`[API Request] CORS mode: ${fetchOptions.mode}`);
    
    const res = await fetch(requestUrl, fetchOptions);
    
    // Log detailed response information
    console.log(`[API Response] Status: ${res.status} ${res.statusText}`);
    console.log(`[API Response] URL: ${res.url}`);
    
    // Check if cookies were actually sent (can be checked in browser devtools)
    if (origin.includes('replit.app') || origin.includes('probateswift.com')) {
      console.log(`[API Response] WARNING: Check if cookies are visible in the request headers in your browser devtools`);
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`[API Error] ${method} ${url} failed:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const baseUrl = queryKey[0] as string;
      const caseId = queryKey[1] as number | undefined;
      
      // Construct URL with caseId if provided and the endpoint supports it
      let url = baseUrl;
      
      // Check if we have a caseId and if the endpoint should use it
      if (caseId !== undefined && (
          baseUrl === '/api/assets' || 
          baseUrl === '/api/liabilities' || 
          baseUrl === '/api/executors' || 
          baseUrl === '/api/documents'
        )) {
        url = `${baseUrl}/${caseId}`;
      }
      
      // For debugging in production environments
      const origin = window.location.origin;
      const domain = origin.includes('replit.app') || origin.includes('probateswift.com') 
        ? origin 
        : 'Development';
        
      // Check if it's a mobile browser for special handling
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const mobileState = isMobile ? 'Mobile Browser' : 'Desktop Browser';
      
      console.log(`[Query] GET ${url} from ${domain} (${mobileState})`);
      
      // Check for mobile auth timestamp to help with session recovery
      if (isMobile && url === '/api/user') {
        const mobileAuthTimestamp = localStorage.getItem('mobile_auth_timestamp');
        if (mobileAuthTimestamp) {
          const timeSinceAuth = Date.now() - parseInt(mobileAuthTimestamp);
          console.log(`[Query] Mobile auth was ${timeSinceAuth / 1000} seconds ago`);
        }
      }
      
      // Check if URL should be absolute in production environments
      let requestUrl = url;
      if ((url.startsWith('/api/') || url === '/api') && 
          (origin.includes('replit.app') || origin.includes('probateswift.com'))) {
        // For absolute URLs in production to avoid cross-domain issues
        requestUrl = `${origin}${url}`;
        console.log(`[Query] Using absolute URL: ${requestUrl}`);
      }
      
      // Configure fetch options with explicit CORS and credentials settings
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: "include", // Always include cookies
        mode: "cors", // Enable CORS for cross-domain requests
      };
      
      // Enhanced token handling for production environments
      try {
        // Try to get a fresh token using our dedicated helper
        const getFreshToken = async (): Promise<string | null> => {
          try {
            // Dynamic import to avoid circular dependencies
            const module = await import('./firebase');
            if (typeof module.getFreshToken === 'function') {
              return await module.getFreshToken();
            }
          } catch (e) {
            console.error('[Query] Error importing getFreshToken:', e);
          }
          
          // Fallback implementation if dynamic import fails
          try {
            const auth = (window as any).firebase?.auth?.();
            if (auth?.currentUser) {
              const token = await auth.currentUser.getIdToken(true);
              if (token) {
                localStorage.setItem('firebase_id_token', token);
                return token;
              }
            }
          } catch (e) {
            console.error('[Query] Fallback token retrieval failed:', e);
          }
          
          // Last resort - try localStorage
          return localStorage.getItem('firebase_id_token');
        };
        
        // Get token and add to headers if available
        const token = await getFreshToken();
        if (token) {
          console.log("[Query] Adding Firebase ID token as Bearer token");
          (fetchOptions.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        } else {
          console.log("[Query] No Firebase token available");
        }
      } catch (tokenError) {
        console.error("[Query] Error getting Firebase token:", tokenError);
      }
      
      // In certain browsers, SameSite=None cookies require secure flag
      // Log detailed configuration info for debugging
      console.log(`[Query] Request URL: ${requestUrl}`);
      console.log(`[Query] Credentials mode: ${fetchOptions.credentials}`);
      console.log(`[Query] CORS mode: ${fetchOptions.mode}`);
      
      const res = await fetch(requestUrl, fetchOptions);
      
      // Log detailed response info
      console.log(`[Query Response] Status: ${res.status} ${res.statusText}`);
      console.log(`[Query Response] URL: ${res.url}`);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`[Query] Unauthorized access to ${url}, returning null as configured`);
        return null;
      }

      await throwIfResNotOk(res);
      
      try {
        return await res.json();
      } catch (error) {
        // Type the error more explicitly
        const parseError = error as Error;
        
        // Handle empty or non-JSON responses
        console.error(`[Query Error] Failed to parse JSON response from ${url}:`, parseError);
        if (res.status === 204) { // No Content
          return null;
        }
        throw new Error(`Invalid JSON response from server: ${parseError.message}`);
      }
    } catch (error) {
      console.error(`[Query Error] GET ${queryKey[0]} failed:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,  // Refetch when tab gains focus
      staleTime: 30 * 1000,        // Data becomes stale after 30 seconds
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
