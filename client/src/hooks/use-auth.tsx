import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useMediaQuery } from "@/hooks/use-media-query";

// Backend user type
interface AuthUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  photoURL: string | null;
  firebaseUid: string | null;
  isGuest: boolean;
}

// Auth context type
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  logout: () => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { auth, isInitialized } = useFirebase();

  // This auth state listener will be set up in the second useEffect below

  // Query for getting the backend user data
  const { data: authUser, error } = useQuery<AuthUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!firebaseUser, // Only fetch when we have a Firebase user
  });

  // For mobile browsers, log any authentication issues
  if (isMobile && error) {
    console.error('Mobile auth error:', error);
  }

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // First sign out from Firebase
      try {
        console.log("Logging out from Firebase");
        if (auth) {
          await auth.signOut();
          console.log("Successfully logged out from Firebase");
        }
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
      // Clear query cache
      queryClient.clear();

      // Reset user state
      setFirebaseUser(null);

      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
    },
    onError: (error) => {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create context value
  const contextValue: AuthContextType = {
    user: authUser || null,
    isLoading: isLoading || Boolean(queryClient.isFetching()),
    error: error as Error | null,
    logout: () => logoutMutation.mutateAsync(),
  };

  // Listen to Firebase auth state changes (single listener)
  useEffect(() => {
    if (!auth) {
      console.log('[AUTH] Firebase auth not initialized');
      setIsLoading(false);
      return;
    }

    // Set a timeout to ensure loading doesn't hang indefinitely
    const loadingTimeout = setTimeout(() => {
      console.log('[AUTH] Auth loading timeout - setting loading to false');
      setIsLoading(false);
    }, 5000);

    console.log('[AUTH] Setting up Firebase auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AUTH] Firebase auth state changed!');
      console.log('[AUTH] Firebase user:', firebaseUser ? firebaseUser.email : 'No user logged in');

      if (firebaseUser) {
        try {
          // Get the ID token
          const idToken = await firebaseUser.getIdToken(true);

          // Store token
          localStorage.setItem('firebase_id_token', idToken);

          // Update user state
          setFirebaseUser(firebaseUser);
          console.log('[AUTH] User authenticated successfully');
        } catch (error) {
          console.error('[AUTH] Error getting ID token:', error);
          setFirebaseUser(null);
          localStorage.removeItem('firebase_id_token');
        }
      } else {
        setFirebaseUser(null);
        localStorage.removeItem('firebase_id_token');
        console.log('[AUTH] User signed out');
      }
      setIsLoading(false);
      clearTimeout(loadingTimeout); // Clear the timeout if auth state changes
    });

    return () => {
      console.log('[AUTH] Cleaning up auth listener');
      clearTimeout(loadingTimeout); // Clear the timeout if the component unmounts
      unsubscribe();
    };
  }, [isInitialized, auth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}