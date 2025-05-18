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
    
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data) {
      fetchOptions.body = JSON.stringify(data);
    }

    // Get Firebase token for authentication
    try {
      // Try to get a token from Firebase Auth or localStorage
      const getFirebaseToken = async (): Promise<string | null> => {
        try {
          // Try to get token from Firebase Auth
          const { auth } = await import('./firebase');
          if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken(true);
            if (token) {
              // Store the token for future API calls
              localStorage.setItem('firebase_id_token', token);
              return token;
            }
          }
        } catch (error) {
          console.error('[API Request] Error getting token from Firebase:', error);
        }
        
        // Fallback to stored token if Firebase auth fails
        return localStorage.getItem('firebase_id_token');
      };
      
      // Get token and add to Authorization header
      const token = await getFirebaseToken();
      if (token) {
        console.log("[API Request] Adding Firebase token to Authorization header");
        (fetchOptions.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        
        // Add diagnostic info in production
        if (window.location.hostname.includes('probateswift.com')) {
          console.log("PRODUCTION: Added token to request headers", {
            url,
            tokenInfo: {
              length: token.length,
              prefix: token.substring(0, 5) + '...'
            }
          });
        }
      } else {
        console.warn("[API Request] No Firebase token available");
      }
    } catch (error) {
      console.error('[API Request] Token handling error:', error);
    }

    const requestUrl = url.startsWith("http") ? url : `${origin}${url}`;
    const response = await fetch(requestUrl, fetchOptions);
    
    // Add token from headers if present (for login responses)
    const authToken = response.headers.get('x-auth-token');
    if (authToken) {
      localStorage.setItem('firebase_id_token', authToken);
      console.log('[API Request] Saved token from response headers');
    }
    
    return response;
  } catch (error) {
    console.error(`[API Request] ${method} ${url} failed:`, error);
    throw error;
  }
}

const queryFn: QueryFunction = async ({ queryKey }) => {
  const url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
  
  if (typeof url !== "string") {
    throw new Error(`Invalid query key: ${queryKey}`);
  }
  
  const res = await apiRequest("GET", url);
  await throwIfResNotOk(res);
  
  if (url.includes('/api/address-lookup')) {
    console.log('[Query] Address lookup response received');
  }
  
  return res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const getQueryFn = (path: string) => async () => {
  const res = await apiRequest("GET", path);
  await throwIfResNotOk(res);
  return res.json();
};