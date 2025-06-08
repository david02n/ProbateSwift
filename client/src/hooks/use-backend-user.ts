import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore, useFirebaseUser } from '@/stores/auth-store';
import { AuthUser } from '@/stores/auth-store';

// API function to fetch user data
async function fetchUserData(): Promise<AuthUser | null> {
  const response = await fetch('/api/user', {
    credentials: 'include',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('firebase_id_token')}`,
    },
  });

  if (response.status === 401) {
    return null; // User not authenticated
  }

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  return response.json();
}

// Hook to manage backend user data
export function useBackendUser() {
  const firebaseUser = useFirebaseUser();
  const { setUser, setError } = useAuthStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user', firebaseUser?.uid],
    queryFn: fetchUserData,
    enabled: !!firebaseUser, // Only fetch when we have a Firebase user
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Handle query state changes
  useEffect(() => {
    if (query.data !== undefined) {
      setUser(query.data);
      setError(null);
    }
  }, [query.data, setUser, setError]);

  useEffect(() => {
    if (query.error) {
      setError(query.error as Error);
      setUser(null);
    }
  }, [query.error, setError, setUser]);

  // Invalidate user data
  const invalidateUser = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
  };

  // Update user data optimistically
  const updateUser = (updates: Partial<AuthUser>) => {
    queryClient.setQueryData(['user', firebaseUser?.uid], (old: AuthUser | null) => {
      if (!old) return old;
      return { ...old, ...updates };
    });
  };

  return {
    ...query,
    invalidateUser,
    updateUser,
  };
}

// Hook to check if user is fully authenticated (both Firebase and backend)
export function useIsFullyAuthenticated() {
  const firebaseUser = useFirebaseUser();
  const { data: backendUser, isLoading } = useBackendUser();
  
  return {
    isAuthenticated: !!firebaseUser && !!backendUser,
    isLoading,
    firebaseUser,
    backendUser,
  };
} 