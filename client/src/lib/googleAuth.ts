import { auth, googleProvider } from './firebase';
import { signInWithRedirect, signInWithPopup, getRedirectResult } from 'firebase/auth';

// Function to sign in with Google
export async function signInWithGoogle() {
  try {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    const isInAppBrowser = /Instagram|FBAN|FBAV|LinkedIn|Twitter/i.test(navigator.userAgent);
    const isProductionDomain = window.location.hostname.includes('probateswift.com');
    const isReplitDomain = window.location.hostname.includes('replit');
    
    // Environment detection logging
    console.log('Google Auth - Device:', isMobile ? 'Mobile' : 'Desktop');
    console.log('Google Auth - Platform:', isIOS ? 'iOS' : (isMobile ? 'Other Mobile' : 'Desktop'));
    console.log('Google Auth - Environment:', isProductionDomain ? 'Production' : (isReplitDomain ? 'Replit' : 'Development'));
    console.log('Google Auth - Domain:', window.location.hostname);
    console.log('Google Auth - Full URL:', window.location.href);
    
    // For production domain, always use redirect for consistent experience
    if (isProductionDomain) {
      console.log('Using redirect method for production domain authentication');
      
      // Set return URL in state parameter
      const state = JSON.stringify({
        returnUrl: window.location.pathname
      });
      
      // Configure provider for production
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        state
      });
      
      // Start redirect flow
      await signInWithRedirect(auth, googleProvider);
      return null; // Function exits here during redirect
    }
    
    // For mobile devices on any domain, use redirect
    if (isMobile) {
      console.log('Using redirect method for mobile authentication');
      
      // Set return URL in state parameter
      const state = JSON.stringify({
        returnUrl: window.location.pathname
      });
      
      // Configure provider for mobile
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        state
      });
      
      // Start redirect flow
      await signInWithRedirect(auth, googleProvider);
      return null; // Function exits here during redirect
    }
    
    // For desktop in development, use popup method
    console.log('Using popup method for authentication');
    
    // Reset any previous custom parameters
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Use popup flow
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
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for authentication. Please try again later or contact support.');
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
    
    // Environment detection
    const domain = window.location.hostname;
    const isProd = domain.includes('probateswift.com');
    const isReplit = domain.includes('replit');
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    console.log('Redirect Handler - Environment:', isProd ? 'Production' : (isReplit ? 'Replit' : 'Development'));
    console.log('Redirect Handler - Device:', isMobile ? 'Mobile' : 'Desktop');
    console.log('Redirect Handler - URL:', window.location.href);
    console.log('Redirect Handler - Auth state:', auth.currentUser ? 'Logged in' : 'Not logged in');
    
    // Get the redirect result
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log('Google redirect result received');
      const user = result.user;
      
      // Log successful authentication
      console.log('User authenticated via redirect:', user.email);
      
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
      
      console.log('Backend authentication successful after redirect');
      
      // Check if we have a return URL in the state
      try {
        if (result.user && result._tokenResponse && result._tokenResponse.state) {
          const stateData = JSON.parse(result._tokenResponse.state);
          if (stateData.returnUrl) {
            console.log('Found return URL in state:', stateData.returnUrl);
            // Will use this for navigation after returning
          }
        }
      } catch (parseError) {
        console.error('Error parsing state data:', parseError);
      }
      
      // Return the user data from the server
      return await response.json();
    }
    
    console.log('No redirect result found');
    return null; // No redirect result
  } catch (error) {
    console.error('Error handling redirect:', error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        domain: window.location.hostname,
        path: window.location.pathname,
        fullUrl: window.location.href
      });
      
      // Check for unauthorized domain errors
      if (error.message && error.message.includes('unauthorized domain')) {
        console.error('CRITICAL: Unauthorized domain error detected for domain:', window.location.hostname);
      }
    }
    throw error;
  }
}