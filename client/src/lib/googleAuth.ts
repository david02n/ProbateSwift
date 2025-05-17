import { auth, googleProvider } from './firebase';
import { signInWithRedirect, signInWithPopup, getRedirectResult } from 'firebase/auth';

// Function to sign in with Google using redirect (better for mobile)
export async function signInWithGoogle() {
  try {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    
    // Log device information
    console.log('Device type:', isMobile ? 'Mobile' : 'Standard browser');
    console.log('Initiating Google sign-in redirect...');
    
    // For iOS devices and mobile, we use popup to avoid redirect issues
    if (isIOS || (isMobile && /Instagram|FBAN|FBAV/i.test(navigator.userAgent))) {
      console.log('Using popup for iOS/in-app browser');
      return await signInWithPopup(auth, googleProvider);
    } else {
      // For all other devices use redirect
      console.log('Using redirect for standard browser');
      await signInWithRedirect(auth, googleProvider);
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

// Function to handle redirect result
export async function handleRedirectResult() {
  try {
    console.log('Checking for redirect result...');
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log('Google redirect result received');
      const user = result.user;
      
      // Get the ID token to send to the backend
      const idToken = await user.getIdToken();
      
      // Send the token to your backend via HTTPS
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
        credentials: 'include', // Important for cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to authenticate with server');
      }
      
      // Return the user data from the server
      return await response.json();
    }
    
    return null; // No redirect result
  } catch (error) {
    console.error('Error handling redirect:', error);
    throw error;
  }
}