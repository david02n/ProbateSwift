import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Declare the window interface for sharing auth functions
declare global {
  interface Window {
    sharedAuthFunctions?: {
      setActiveTab: (tab: string) => void;
      loginFormEmail?: string;
    };
  }
}

// Define authentication types
type AuthUser = Omit<User, "password">;

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthUser, Error, LoginCredentials>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<AuthUser, Error, RegisterCredentials>;
};

type LoginCredentials = {
  email: string;
  password: string;
};

type RegisterCredentials = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

// Create the auth context
export const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Detect mobile browsers for special handling
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // Query for getting the current user
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<AuthUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // For mobile browsers, log any authentication issues
  if (isMobile && error) {
    console.error('Mobile auth error:', error);
    
    // Check if we have a mobile auth timestamp
    const mobileAuthTimestamp = localStorage.getItem('mobile_auth_timestamp');
    if (mobileAuthTimestamp) {
      const timeSinceAuth = (Date.now() - parseInt(mobileAuthTimestamp)) / 1000;
      console.log(`Mobile auth error occurred ${timeSinceAuth} seconds after authentication attempt`);
    }
  }

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // For mobile devices, store login timestamp for session verification
      if (isMobile) {
        console.log('Mobile login attempt for:', credentials.email);
        localStorage.setItem('mobile_auth_timestamp', Date.now().toString());
        localStorage.setItem('mobile_last_email', credentials.email);
      }
      
      const res = await apiRequest("POST", "/api/login", credentials);
      const data = await res.json();
      return data;
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Store successful auth result in localStorage for mobile session recovery
      if (isMobile) {
        console.log('Mobile login successful, storing session data');
        localStorage.setItem('mobile_auth_success', 'true');
        localStorage.setItem('mobile_auth_user', JSON.stringify({
          id: user.id,
          email: user.email,
          firstName: user.firstName
        }));
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back${user.firstName ? ', ' + user.firstName : ''}!`,
      });
      
      // Redirect to the root path which renders the dashboard
      window.location.href = "/";
    },
    onError: (error: Error) => {
      // Record login errors for mobile troubleshooting
      if (isMobile) {
        console.error('Mobile login error:', error);
        localStorage.setItem('mobile_auth_error', error.message);
      }
      
      // For all login errors, show a toast but don't automatically redirect
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      const data = await res.json();
      return data;
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["/api/user"], user);
      // Clear assessment data from localStorage as it's now saved to the database
      localStorage.removeItem('probate_assessment_result');
      localStorage.removeItem('probate_assessment_answers');
      
      toast({
        title: "Registration successful",
        description: `Welcome to ProbateSwift${user.firstName ? ', ' + user.firstName : ''}!`,
      });
      
      // Query assessment data right away
      queryClient.invalidateQueries({ queryKey: ["/api/assessment"] });
      
      // Redirect to the root path which renders the dashboard
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // First sign out from Firebase
      try {
        console.log("Logging out from Firebase");
        const firebaseModule = await import('../lib/firebase');
        const auth = firebaseModule.auth;
        
        // Sign out from Firebase first
        await auth.signOut();
        console.log("Successfully logged out from Firebase");
      } catch (e) {
        console.error("Error signing out from Firebase:", e);
        // Continue with logout process even if Firebase logout fails
      }
      
      // Clear all Firebase tokens from storage
      console.log("Clearing all Firebase tokens from storage");
      localStorage.removeItem('firebase_id_token');
      sessionStorage.removeItem('firebase_id_token');
      
      // Clear mobile auth data if present
      localStorage.removeItem('mobile_auth_success');
      localStorage.removeItem('mobile_auth_user');
      localStorage.removeItem('mobile_auth_timestamp');
      
      // Then call the backend logout API
      try {
        await apiRequest("POST", "/api/logout");
        console.log("Successfully called backend logout API");
      } catch (e) {
        console.error("Error calling backend logout API:", e);
        // Continue with cleanup process even if API call fails
      }
    },
    onSuccess: () => {
      // Clear all query cache data including user data
      queryClient.clear();
      
      // Explicitly set user data to null
      queryClient.setQueryData(["/api/user"], null);
      
      // Additional token cleanup for production
      if (window.location.hostname.includes('probateswift.com')) {
        console.log("PRODUCTION: Additional token cleanup for probateswift.com");
        
        // Clear any global tokens that might exist
        if ((window as any).__lastAuthToken) {
          (window as any).__lastAuthToken = null;
        }
        
        if ((window as any).__authDebug) {
          (window as any).__authDebug = null;
        }
      }
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Force page reload with special logout parameter to ensure all state is reset
      const timestamp = new Date().getTime();
      window.location.href = `/?logout=${timestamp}&t=${timestamp}`;
    },
    onError: (error: Error) => {
      console.error("Logout mutation error:", error);
      
      toast({
        title: "Logout process completed with warnings",
        description: "You've been logged out, but there were some warnings. Please refresh the page.",
        variant: "destructive",
      });
      
      // Clear tokens even on error
      localStorage.removeItem('firebase_id_token');
      sessionStorage.removeItem('firebase_id_token');
      
      // Force page reload even on error
      setTimeout(() => {
        const timestamp = new Date().getTime();
        window.location.href = `/?logout=${timestamp}&forceClear=true`;
      }, 1500);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}