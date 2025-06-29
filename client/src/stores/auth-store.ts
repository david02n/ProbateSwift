import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Backend user type for Replit Auth
export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

// Auth store state
interface AuthState {
  // Backend user state
  user: AuthUser | null;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
  // Error state
  error: Error | null;
  
  // Actions
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
    user: null,
    isLoading: true,
    isInitialized: false,
    error: null,
    
    // Actions
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setInitialized: (initialized) => set({ isInitialized: initialized }),
    
    // Computed getters
    get isAuthenticated() {
      return !!get().user;
    },
    
    get displayName() {
      const { user } = get();
      if (user?.firstName && user?.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
      if (user?.email) {
        return user.email;
      }
      return 'User';
    },
    
    // Logout action
    logout: async () => {
      try {
        // Only Stytch logout supported now. Implement Stytch logout here.
        // Example: await stytchClient.logout();
      } catch (error) {
        console.error('Logout error:', error);
        set({ error: error as Error });
      }
    },
  }))
);

// Selector hooks for specific parts of the auth state
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useDisplayName = () => useAuthStore((state) => state.displayName); 