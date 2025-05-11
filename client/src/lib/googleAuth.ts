import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithPopup, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { apiRequest } from './queryClient';
import FirebaseApp from './firebase';

// Initialize auth and provider
const auth = getAuth(FirebaseApp);
const provider = new GoogleAuthProvider();

// Set persistence to browser session
setPersistence(auth, browserSessionPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

// Custom error subclass
class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

/**
 * Initiates the Google sign-in flow, first trying popup and falling back to redirect if necessary
 * @returns User data if popup authentication succeeded, otherwise null (for redirect)
 */
export const signInWithGoogle = async () => {
  // Add scopes if needed
  provider.addScope('profile');
  provider.addScope('email');
  
  // Determine the current origin for redirect
  const origin = window.location.origin;
  
  // Set custom parameters
  provider.setCustomParameters({
    prompt: 'select_account',
    // Ensure the return URL is on the same domain
    redirect_uri: `${origin}/auth`
  });
  
  try {
    // First try with popup, which is more reliable on most browsers
    console.log('Attempting Google sign-in with popup...');
    const result = await signInWithPopup(auth, provider);
    console.log('Popup sign-in successful, user:', result.user.email);
    
    // Process the result immediately if popup succeeds
    return await processAuthResult(result);
  } catch (error: any) {
    console.log('Popup sign-in failed, falling back to redirect:', error.message);
    // Fall back to redirect method
    await signInWithRedirect(auth, provider);
    return null; // No immediate result with redirect flow
  }
};

/**
 * Process authentication result from either popup or redirect
 */
const processAuthResult = async (result: any) => {
  if (!result) {
    console.error('No authentication result to process');
    return null;
  }
  
  try {
    // Get the user info and ID token
    const user = result.user;
    const idToken = await user.getIdToken();
    
    if (!user.email) {
      throw new GoogleAuthError('No email provided by Google account');
    }
    
    console.log('Sending Google auth data to backend...');
    
    // Get the current origin for checking if we need to prepend a base URL
    const currentOrigin = window.location.origin;
    const isProbateSwiftApp = currentOrigin.includes('probateswift');
    
    // Determine the API URL - may need absolute URL for cross-domain scenarios in production
    const apiUrl = isProbateSwiftApp && currentOrigin.includes('replit.app') 
      ? '/api/auth/google'  // Use relative URL for normal cases 
      : '/api/auth/google';
      
    console.log('Using API URL:', apiUrl);
    
    // Send the token to our backend to create/authenticate the user
    const response = await apiRequest('POST', apiUrl, {
      idToken,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new GoogleAuthError(errorData.message || 'Failed to authenticate with the server');
    }
    
    console.log('Backend authentication successful');
    
    // Return the user data from our backend
    return await response.json();
  } catch (error: any) {
    console.error('Failed to process auth result:', error);
    throw new GoogleAuthError(error.message || 'Failed to process authentication');
  }
};

/**
 * Handles the redirect result after returning from Google authentication
 * @returns The user object if successful, null if no redirect result
 */
export const handleRedirectResult = async () => {
  try {
    console.log('Checking for redirect result...');
    const result = await getRedirectResult(auth);
    
    if (!result) {
      console.log('No redirect result found');
      return null; // No redirect result, not coming back from Google auth
    }
    
    console.log('Redirect result found, processing...');
    return await processAuthResult(result);
    
  } catch (error: any) {
    console.error('Google auth redirect error:', error);
    throw new GoogleAuthError(error.message || 'Authentication failed');
  }
};

/**
 * Signs out the currently signed-in user
 */
export const signOut = async (): Promise<void> => {
  try {
    await auth.signOut();
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};