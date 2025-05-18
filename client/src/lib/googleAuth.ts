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
      
      // Capture return URL - full URL including protocol is most reliable on mobile
      const returnUrl = window.location.href;
      localStorage.setItem('redirect_return_url', returnUrl);
      
      // Create a state parameter that will survive the redirect
      const state = JSON.stringify({
        returnUrl: window.location.href,
        timestamp: Date.now(),
        isMobile: true
      });
      
      // Configure provider for mobile with extra parameters
      const customParams: {[key: string]: string} = {
        prompt: 'select_account',
        state,
        // For iOS, add these parameters for better handling
        iosId: 'org.reactjs.native.probateswift', 
        app_id: 'probateswift'
      };
      
      // Add login_hint if we have a previous email from localStorage
      const savedEmail = localStorage.getItem('mobile_last_email');
      if (savedEmail) {
        customParams.login_hint = savedEmail;
      }
      
      googleProvider.setCustomParameters(customParams);
      
      // For iOS, specially handle the redirect
      if (isIOS) {
        console.log('iOS device detected, using special handling');
        
        try {
          // First try popup as iOS Safari sometimes blocks redirects
          console.log('First attempting popup method for iOS');
          const result = await signInWithPopup(auth, googleProvider);
          if (result) {
            console.log('iOS popup authentication succeeded');
            return result;
          }
        } catch (iosPopupError) {
          console.log('iOS popup failed, falling back to redirect:', iosPopupError);
          // Fall back to redirect if popup fails
          await signInWithRedirect(auth, googleProvider);
          return null;
        }
      }
      
      // For non-iOS mobile, use redirect flow
      console.log('Starting mobile redirect authentication flow');
      try {
        // Start redirect flow
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectError) {
        console.error('Error starting redirect flow:', redirectError);
        // If redirect fails, try popup as last resort
        console.log('Attempting popup as fallback for mobile');
        return await signInWithPopup(auth, googleProvider);
      }
      
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
      // Include the domain information to help with debugging
      const domain = window.location.hostname;
      const isProd = domain.includes('probateswift.com');
      
      // Critical fix: Use a fully-qualified URL for production but relative URL for development
      // This ensures proper cross-domain cookie handling in both environments
      const apiUrl = isProd 
        ? `https://${domain}/api/auth/google`
        : '/api/auth/google';
      
      console.log(`Using API URL: ${apiUrl} for domain: ${domain}`);
      
      // Generate a session verification token to help identify this authentication attempt
      const sessionVerificationToken = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('auth_verification_token', sessionVerificationToken);
      
      // Store the current time to help with debugging session issues
      localStorage.setItem('auth_request_time', Date.now().toString());
      
      // Add direct user details to help with account creation if token verification fails
      const userData = {
        idToken,
        // Include basic user info as fallback if token verification fails
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        // Include domain information to help server with cookie settings
        domain: window.location.hostname,
        origin: window.location.origin,
        isMobile: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
        // Include verification token and timestamp
        verificationToken: sessionVerificationToken,
        requestTime: Date.now(),
        // Include Firebase UUID to help with account linking
        firebaseUid: user.uid || null
      };
      
      console.log('Sending authentication data to server:', {
        ...userData,
        idToken: '***REDACTED***' // Don't log the actual token
      });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include', // Critical for cookies to be included
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend authentication failed:', errorData);
        throw new Error(errorData.error || 'Failed to authenticate with server');
      }
      
      console.log('Backend authentication successful after redirect');
      
      // Check if we have a return URL in the state parameter
      try {
        // Access potential state from URL query parameters 
        const urlParams = new URLSearchParams(window.location.search);
        const stateParam = urlParams.get('state');
        
        if (stateParam) {
          try {
            const stateData = JSON.parse(stateParam);
            if (stateData.returnUrl) {
              console.log('Found return URL in state parameter:', stateData.returnUrl);
              // Will use this for navigation after returning
            }
          } catch (parseError) {
            console.log('State parameter was not valid JSON');
          }
        } else {
          console.log('No state parameter found in URL');
        }
      } catch (parseError) {
        console.error('Error processing state data:', parseError);
      }
      
      // After successful authentication, make a second request to confirm session
      console.log('Making follow-up request to verify session is established');
      try {
        const verifyResponse = await fetch('/api/user', {
          credentials: 'include' // Critical for sending cookies
        });
        
        if (verifyResponse.ok) {
          console.log('✅ Session verification successful - user is properly authenticated');
        } else {
          console.warn('⚠️ Session verification failed - server returned:', verifyResponse.status);
          // Try to force a refresh of the cookies by doing a direct fetch to the root domain
          if (isProd) {
            console.log('Attempting session recovery for production domain');
            await fetch(`https://${domain}/api/session-refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                verificationToken: sessionVerificationToken
              })
            });
          }
        }
      } catch (verifyError) {
        console.error('Error during session verification:', verifyError);
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