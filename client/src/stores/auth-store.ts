import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

// Backend user type
export interface AuthUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  photoURL: string | null;
  firebaseUid: string | null;
  isGuest: boolean;
}

// Auth store state
interface AuthState {
  // Firebase user state
  firebaseUser: FirebaseUser | null;
  
  // Backend user state
  user: AuthUser | null;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
  // Error state
  error: Error | null;
  
  // Actions
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // Computed getters
  isAuthenticated: boolean;
  displayName: string;
  
  // Logout action
  logout: () => Promise<void>;
}

// Create the auth store
export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    firebaseUser: null,
    user: null,
    isLoading: true,
    isInitialized: false,
    error: null,
    
    // Actions
    setFirebaseUser: (user) => set({ firebaseUser: user }),
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setInitialized: (initialized) => set({ isInitialized: initialized }),
    
    // Computed getters
    get isAuthenticated() {
      return !!get().firebaseUser && !!get().user;
    },
    
    get displayName() {
      const { user, firebaseUser } = get();
      if (user?.firstName && user?.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
      if (firebaseUser?.displayName) {
        return firebaseUser.displayName;
      }
      if (user?.email) {
        return user.email;
      }
      return 'User';
    },
    
    // Logout action
    logout: async () => {
      try {
        // Import Firebase dynamically to ensure it's initialized
        const { auth } = await import('@/lib/firebase');
        
        // Sign out from Firebase
        await auth.signOut();
        
        // Clear tokens
        localStorage.removeItem('firebase_id_token');
        sessionStorage.removeItem('firebase_id_token');
        
        // Clear mobile auth data
        localStorage.removeItem('mobile_auth_success');
        localStorage.removeItem('mobile_auth_user');
        localStorage.removeItem('mobile_auth_timestamp');
        
        // Reset store state
        set({
          firebaseUser: null,
          user: null,
          error: null,
        });
        
        // Call backend logout (optional, can be done separately)
        try {
          await fetch('/api/logout', { 
            method: 'POST',
            credentials: 'include'
          });
        } catch (e) {
          console.warn('Backend logout failed:', e);
        }
        
      } catch (error) {
        console.error('Logout error:', error);
        set({ error: error as Error });
      }
    },
  }))
);

// Initialize Firebase auth listener
export function initializeAuthListener(): Promise<() => void> {
  return new Promise<() => void>((resolve) => {
    const initializeListener = async () => {
      try {
        // Import Firebase dynamically to ensure it's initialized
        const { auth } = await import('@/lib/firebase');
        
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          const store = useAuthStore.getState();
          
          if (firebaseUser) {
            try {
              // Get fresh token
              const idToken = await firebaseUser.getIdToken(true);
              localStorage.setItem('firebase_id_token', idToken);
              
              // Update Firebase user state
              store.setFirebaseUser(firebaseUser);
              store.setError(null);
            } catch (error) {
              console.error('Error getting ID token:', error);
              store.setFirebaseUser(null);
              store.setError(error as Error);
              localStorage.removeItem('firebase_id_token');
            }
          } else {
            // User signed out
            store.setFirebaseUser(null);
            store.setUser(null);
            store.setError(null);
            localStorage.removeItem('firebase_id_token');
          }
          
          store.setLoading(false);
          store.setInitialized(true);
        });
        
        resolve(unsubscribe);
      } catch (error) {
        console.error('Failed to initialize auth listener:', error);
        const store = useAuthStore.getState();
        store.setError(error as Error);
        store.setLoading(false);
        store.setInitialized(true);
        resolve(() => {}); // Return empty cleanup function
      }
    };
    
    initializeListener();
  });
}

// Selector hooks for specific parts of the auth state
export const useFirebaseUser = () => useAuthStore((state) => state.firebaseUser);
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useDisplayName = () => useAuthStore((state) => state.displayName); 