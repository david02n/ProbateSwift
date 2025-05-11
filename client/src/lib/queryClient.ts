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
    
    console.log(`[API Request] ${method} ${url} from ${domain}`);
    if (data) {
      console.log('[API Request] Data:', JSON.stringify(data).substring(0, 200) + (JSON.stringify(data).length > 200 ? '...' : ''));
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
      headers: data ? { 
        "Content-Type": "application/json",
        // Add headers to support CORS with credentials
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Always include cookies
      mode: "cors", // Enable CORS
    };
    
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
      const url = queryKey[0] as string;
      
      // For debugging in production environments
      const origin = window.location.origin;
      const domain = origin.includes('replit.app') || origin.includes('probateswift.com') 
        ? origin 
        : 'Development';
      
      console.log(`[Query] GET ${url} from ${domain}`);
      
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
      } catch (parseError) {
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
