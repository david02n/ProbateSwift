import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { apiRequest } from './queryClient';
import FirebaseApp from './firebase';

// Initialize auth and provider
const auth = getAuth(FirebaseApp);
const provider = new GoogleAuthProvider();

// Custom error subclass
class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

/**
 * Initiates the Google sign-in flow, redirecting the user to the Google login page
 */
export const signInWithGoogle = async (): Promise<void> => {
  // Add scopes if needed
  provider.addScope('profile');
  provider.addScope('email');
  
  // Set custom parameters
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  await signInWithRedirect(auth, provider);
};

/**
 * Handles the redirect result after returning from Google authentication
 * @returns The user object if successful, null if no redirect result
 */
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    
    if (!result) {
      return null; // No redirect result, not coming back from Google auth
    }
    
    // Get the user info and ID token
    const user = result.user;
    const idToken = await user.getIdToken();
    
    if (!user.email) {
      throw new GoogleAuthError('No email provided by Google account');
    }
    
    // Send the token to our backend to create/authenticate the user
    const response = await apiRequest('POST', '/api/auth/google', {
      idToken,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new GoogleAuthError(errorData.message || 'Failed to authenticate with the server');
    }
    
    // Return the user data from our backend
    return await response.json();
    
  } catch (error: any) {
    console.error('Google auth error:', error);
    throw new GoogleAuthError(error.message || 'Authentication failed');
  }
};

/**
 * Signs out the currently signed-in user
 */
export const signOut = async (): Promise<void> => {
  await auth.signOut();
};