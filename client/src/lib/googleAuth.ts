import { auth, googleProvider } from './firebase';
import { signInWithRedirect, signInWithPopup, getRedirectResult } from 'firebase/auth';

// Function to sign in with Google using popup as primary method
export async function signInWithGoogle() {
  try {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    const isInAppBrowser = /Instagram|FBAN|FBAV|LinkedIn|Twitter/i.test(navigator.userAgent);
    
    // Log device information and environmental context
    console.log('Device type:', isMobile ? 'Mobile' : 'Standard browser');
    console.log('Initiating Google sign-in with popup...');
    console.log('Current domain:', window.location.hostname);
    
    // IMPORTANT: Always use popup first for all devices for better UX
    // This keeps users on the same page instead of redirecting
    const result = await signInWithPopup(auth, googleProvider);
      
    if (result) {
      console.log('Popup authentication successful');
      
      // Get the ID token to send to the backend
      const idToken = await result.user.getIdToken();
      
      console.log('ID token retrieved, sending to backend');
      
      // Send the token to your backend via HTTPS
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idToken,
          // Include basic user info as fallback if token verification fails
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL 
        }),
        credentials: 'include', // Important for cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend authentication failed:', errorData);
        throw new Error(errorData.error || 'Failed to authenticate with server');
      }
      
      console.log('Backend authentication successful');
      return await response.json();
    }
    
    return null;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    
    // Handle specific popup errors
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Your browser blocked the login popup. Please allow popups for this site and try again.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Login popup was closed. Please try again.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Login process was cancelled. Please try again.');
    } else {
      // For other errors, pass the error through
      throw error;
    }
  }
}

// Function to handle redirect result
export async function handleRedirectResult() {
  try {
    console.log('Checking for redirect result...');
    
    // Add extra logging to help diagnose the issue
    console.log('Current URL:', window.location.href);
    console.log('Auth state:', auth.currentUser ? 'Logged in' : 'Not logged in');
    
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log('Google redirect result received');
      const user = result.user;
      
      // Log user details (without sensitive information)
      console.log('User authenticated:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isAnonymous: user.isAnonymous,
        emailVerified: user.emailVerified,
        hasPhotoURL: !!user.photoURL
      });
      
      // Get the ID token to send to the backend
      const idToken = await user.getIdToken();
      
      console.log('ID token retrieved, sending to backend');
      
      // Send the token to your backend via HTTPS
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idToken,
          // Include basic user info as fallback if token verification fails
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL 
        }),
        credentials: 'include', // Important for cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend authentication failed:', errorData);
        throw new Error(errorData.error || 'Failed to authenticate with server');
      }
      
      console.log('Backend authentication successful');
      // Return the user data from the server
      return await response.json();
    }
    
    console.log('No redirect result found');
    return null; // No redirect result
  } catch (error) {
    console.error('Error handling redirect:', error);
    // Add error details to the log
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}