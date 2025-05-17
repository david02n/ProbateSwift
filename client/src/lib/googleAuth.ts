import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithPopup, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { apiRequest } from './queryClient';
import { auth } from './firebase';

// Initialize provider
const provider = new GoogleAuthProvider();

// Set persistence to browser session for Firebase auth
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
 * Get the correct return URL based on the current environment
 * This is crucial for Firebase auth to work correctly across domains
 */
const getReturnUrl = (): string => {
  const origin = window.location.origin;
  const hostname = window.location.hostname;
  
  // For production domain, ensure we use the proper origin
  if (hostname === 'probateswift.com' || hostname.endsWith('.probateswift.com')) {
    return `https://${hostname}/auth?authReturn=true`;
  }
  
  // Add state parameter to help identify return from auth
  return `${origin}/auth?authReturn=true`;
};

/**
 * Initiates the Google sign-in flow, first trying popup and falling back to redirect if necessary
 * @returns User data if popup authentication succeeded, otherwise null (for redirect)
 */
export const signInWithGoogle = async () => {
  // Add scopes if needed
  provider.addScope('profile');
  provider.addScope('email');
  
  // Log environment info for debugging
  console.log('Environment info for debugging:');
  console.log('- URL:', window.location.href);
  console.log('- Origin:', window.location.origin);
  console.log('- Hostname:', window.location.hostname);
  console.log('- Firebase authDomain:', auth.app.options.authDomain);
  
  // Detect mobile browsers - especially iOS which needs special handling
  const userAgent = navigator.userAgent;
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/i.test(userAgent);
  
  console.log('- Device type:', isMobile ? (isIOS ? 'iOS Mobile' : 'Android Mobile') : 'Desktop');
  
  // Set custom parameters
  provider.setCustomParameters({
    prompt: 'select_account',
    // Ensure the return URL uses the proper domain
    redirect_uri: getReturnUrl()
  });
  
  // For iOS devices, we should go straight to redirect as popup rarely works correctly
  if (isIOS) {
    console.log('iOS device detected, using redirect for better compatibility');
    await signInWithRedirect(auth, provider);
    return null; // No immediate result with redirect flow
  }
  
  try {
    // For non-iOS devices, first try with popup, which is more reliable on most browsers
    console.log('Attempting Google sign-in with popup...');
    const result = await signInWithPopup(auth, provider);
    console.log('Popup sign-in successful, user:', result.user.email);
    
    // Process the result immediately if popup succeeds
    return await processAuthResult(result);
  } catch (error: any) {
    // Special handling for mobile or cross-domain issues
    const errorCode = error.code;
    const errorMessage = error.message;
    
    console.log(`Popup sign-in failed (${errorCode}), falling back to redirect:`, errorMessage);
    
    // Check if we had a cross-origin error that suggests we should use redirect
    if (errorCode === 'auth/popup-blocked' || 
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/internal-error' ||
        errorMessage.includes('cross-origin')) {
      console.log('Redirecting for authentication due to popup issues...');
      
      // Some browsers/devices work better with redirect
      await signInWithRedirect(auth, provider);
      return null; // No immediate result with redirect flow
    }
    
    // For other errors, throw them to be handled by the calling component
    throw new GoogleAuthError(`Sign-in failed: ${errorMessage || 'Unknown error'}`);
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
    
    // Log debugging info
    const currentOrigin = window.location.origin;
    const hostname = window.location.hostname;
    console.log(`Processing auth on domain: ${hostname} (${currentOrigin})`);
    
    // Send the token to our backend to create/authenticate the user
    const response = await apiRequest('POST', '/api/auth/google', {
      idToken,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      
      try {
        // Try to parse as JSON
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || 'Server authentication failed';
      } catch(e) {
        // If not valid JSON, use the text directly
        errorMessage = errorText || `Failed to authenticate (${response.status})`;
      }
      
      throw new GoogleAuthError(errorMessage);
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
    // Special handling for error codes
    const errorCode = typeof error.code === 'string' ? error.code : 'unknown';
    const errorMessage = error.message || 'Authentication redirect failed';
    
    console.error(`Google auth redirect error [${errorCode}]:`, errorMessage);
    
    if (errorCode === 'auth/credential-already-in-use') {
      throw new GoogleAuthError('This Google account is already linked to another user');
    } else if (errorCode === 'auth/account-exists-with-different-credential') {
      throw new GoogleAuthError('An account already exists with the same email but different sign-in credentials');
    } else {
      throw new GoogleAuthError(`Authentication failed: ${errorMessage}`);
    }
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