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
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      mode: "cors",
    };
    
    if (data) {
      (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
    }

    const res = await fetch(url, fetchOptions);
    
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
      
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: "include",
        mode: "cors",
      };

      const res = await fetch(url, fetchOptions);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
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
