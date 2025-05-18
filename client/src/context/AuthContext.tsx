import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup } from '../lib/firebase';
import { apiRequest } from '../lib/queryClient';
import { getIdToken } from '../lib/tokenAuth';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Setup token refresh timer
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Refresh token every 45 minutes
      refreshToken();
    }, 45 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get ID token from Firebase
          const idToken = await firebaseUser.getIdToken();
          
          // Store token in localStorage for API requests
          localStorage.setItem('firebase_id_token', idToken);
          
          // Save user details from our database
          await fetchUserProfile(firebaseUser, idToken);
        } catch (error) {
          console.error("Error handling auth state change:", error);
          setUser(null);
        }
      } else {
        // User is signed out
        localStorage.removeItem('firebase_id_token');
        setUser(null);
      }
      
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Fetch user profile from our database
  const fetchUserProfile = async (firebaseUser: FirebaseUser, idToken: string) => {
    try {
      // First try to get user profile using token
      const response = await apiRequest('GET', '/api/user');
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return;
      }
      
      // If that fails, register/login user with Google
      const googleAuthResponse = await apiRequest('POST', '/api/auth/google', {
        idToken,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      });
      
      if (googleAuthResponse.ok) {
        const userData = await googleAuthResponse.json();
        setUser(userData);
      } else {
        console.error('Failed to authenticate with backend:', await googleAuthResponse.text());
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    }
  };
  
  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      // Sign in with Google via popup
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get ID token
      const idToken = await result.user.getIdToken();
      
      // Store token
      localStorage.setItem('firebase_id_token', idToken);
      
      // Register with backend
      await fetchUserProfile(result.user, idToken);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Remove token
      localStorage.removeItem('firebase_id_token');
      
      // Clear user state
      setUser(null);
      
      // Call logout endpoint (optional)
      await apiRequest('POST', '/api/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh token
  const refreshToken = async (): Promise<string | null> => {
    try {
      // Get fresh token
      const token = await getIdToken(true);
      
      if (token && auth.currentUser) {
        // Verify token works by checking user profile
        const response = await apiRequest('GET', '/api/user');
        
        if (!response.ok) {
          console.log('Token refresh check failed, fetching user profile again');
          await fetchUserProfile(auth.currentUser, token);
        }
      }
      
      return token;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  };
  
  const value = {
    user,
    isLoading,
    loginWithGoogle,
    logout,
    refreshToken
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};