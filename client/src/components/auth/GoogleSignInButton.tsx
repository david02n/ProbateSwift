import { useState } from 'react';
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface GoogleSignInButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  context?: 'signin' | 'signup';
}

export function GoogleSignInButton({ 
  className, 
  variant = 'outline', 
  size = 'default',
  children = 'Sign in with Google',
  context = 'signin'
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();
  const { setError } = useAuthStore();

  // Handle redirect result on component mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setIsRedirecting(true);
          await handleSignInSuccess(result);
        }
      } catch (error: any) {
        console.error('Redirect result error:', error);
        setError(error);
        toast({
          title: "Sign in failed",
          description: "Failed to complete sign-in. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsRedirecting(false);
      }
    };

    handleRedirectResult();
  }, [setError, toast]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      // Validate auth instance
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      console.log('[GoogleSignIn] Starting Google sign-in process');
      console.log('[GoogleSignIn] Auth instance:', auth);
      console.log('[GoogleSignIn] Current domain:', window.location.hostname);
      console.log('[GoogleSignIn] Auth domain:', auth.app.options.authDomain);
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        context: context,
      });

      console.log('[GoogleSignIn] Provider configured:', provider);

      // Check if we're on Replit and use redirect instead of popup
      const isReplitDomain = window.location.hostname.includes('replit.dev') || 
                            window.location.hostname.includes('kirk.replit.dev');
      
      if (isReplitDomain) {
        console.log('[GoogleSignIn] Replit domain detected, using redirect method');
        setIsRedirecting(true);
        await signInWithRedirect(auth, provider);
        // The page will redirect, so we don't need to handle the result here
        return;
      }

      // First try popup for non-Replit domains
      try {
        console.log('[GoogleSignIn] Attempting popup sign-in...');
        const result = await signInWithPopup(auth, provider);
        console.log('[GoogleSignIn] Popup sign-in successful:', result);
        await handleSignInSuccess(result);
      } catch (popupError: any) {
        console.error('[GoogleSignIn] Popup error:', popupError);
        
        // If popup is blocked or closed, try redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request' ||
            popupError.code === 'auth/popup-closed-by-user') {
          
          console.log('[GoogleSignIn] Popup blocked, trying redirect...');
          toast({
            title: "Popup blocked",
            description: "Redirecting to Google sign-in...",
          });
          
          setIsRedirecting(true);
          await signInWithRedirect(auth, provider);
          // The page will redirect, so we don't need to handle the result here
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Log detailed error information for debugging
      console.error('[GoogleSignIn] Detailed error info:', {
        error: error,
        code: error.code,
        message: error.message,
        auth: auth,
        domain: window.location.hostname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        authDomain: auth?.app?.options?.authDomain
      });
      
      let errorMessage = 'Failed to sign in with Google.';
      
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email address but different sign-in credentials.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid sign-in credentials.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google sign-in is not enabled for this app.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled.';
      } else if (error.code === 'auth/internal-error') {
        errorMessage = 'Internal authentication error. Please check your Firebase configuration and try again.';
        console.error('[GoogleSignIn] Internal error - this might be a configuration issue');
      }

      setError(error);
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInSuccess = async (result: any) => {
    try {
      const { user } = result;
      const idToken = await user.getIdToken();
      
      // Store token
      localStorage.setItem('firebase_id_token', idToken);
      
      // Call backend to establish session
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          idToken,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid
        }),
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Sign in successful",
          description: `Welcome${user.displayName ? ', ' + user.displayName : ''}!`,
        });
        
        // Redirect to home page
        window.location.href = '/';
      } else {
        throw new Error('Failed to establish session');
      }
    } catch (error) {
      console.error('Session establishment error:', error);
      setError(error as Error);
      toast({
        title: "Sign in failed",
        description: "Could not establish session with the server. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isProcessing = isLoading || isRedirecting;

  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={isProcessing}
      variant={variant}
      size={size}
      className={className}
    >
      {isProcessing ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      {children}
    </Button>
  );
} 