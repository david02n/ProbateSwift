import React, { useEffect, useState } from 'react';
import { signInWithGoogle, handleRedirectResult } from '@/lib/googleAuth';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface GoogleLoginButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  iconOnly?: boolean;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ 
  variant = 'outline',
  className = '', 
  iconOnly = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Detect mobile devices on mount
  useEffect(() => {
    const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobile(mobile);
    
    if (mobile) {
      console.log('GoogleLoginButton: Mobile browser detected');
    }
  }, []);

  // Handle Google redirect result on component mount
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        // Check if there's a URL parameter that indicates we're returning from an auth flow
        const urlParams = new URLSearchParams(window.location.search);
        const isAuthReturn = urlParams.has('state') || urlParams.has('code') || urlParams.has('authReturn');
        
        if (!isAuthReturn) {
          console.log('GoogleLoginButton: Not returning from auth redirect, skipping check');
          return;
        }
        
        setIsLoading(true);
        setAuthError(null);
        console.log('GoogleLoginButton: Checking for redirect result');
        const user = await handleRedirectResult();
        
        if (user) {
          console.log('GoogleLoginButton: User authenticated from redirect', user);
          // Update React Query cache with the user
          queryClient.setQueryData(['/api/user'], user);
          queryClient.invalidateQueries({ queryKey: ['/api/user'] });
          
          toast({
            title: 'Successfully signed in',
            description: user.firstName 
              ? `Welcome ${user.firstName}!` 
              : 'Welcome to ProbateSwift!',
          });
          
          // Clear auth parameters from URL
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          
          // Redirect to dashboard if on auth page with special handling for mobile
          if (window.location.pathname === '/auth') {
            console.log('GoogleLoginButton: Redirecting from auth page to dashboard');
            
            // For mobile browsers, use direct navigation for more reliable cookies
            if (isMobile) {
              console.log('GoogleLoginButton: Using direct navigation for mobile auth success');
              // Small delay to ensure cookies are set
              setTimeout(() => {
                window.location.href = '/';
              }, 100);
            } else {
              // For desktop, use Wouter
              setLocation('/');
            }
          }
        } else {
          console.log('GoogleLoginButton: No redirect result found');
        }
      } catch (error: any) {
        console.error('GoogleLoginButton: Redirect error:', error);
        setAuthError(error.message || 'Authentication failed');
        toast({
          title: 'Sign-in failed',
          description: error.message || 'An error occurred during sign in',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkRedirect();
  }, [toast, setLocation]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      console.log('GoogleLoginButton: Starting Google sign-in process');
      
      // Get current domain for debugging
      const domain = window.location.hostname;
      console.log(`GoogleLoginButton: Authenticating on domain: ${domain}`);
      
      const result = await signInWithGoogle();
      // For popup flow, we might get a result directly
      if (result) {
        console.log('GoogleLoginButton: Popup auth successful');
        // Force reload the user data
        queryClient.setQueryData(['/api/user'], result);
        await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        
        toast({
          title: 'Successfully signed in',
          description: result.firstName 
            ? `Welcome ${result.firstName}!` 
            : 'Welcome to ProbateSwift!',
        });
        
        // Navigate to dashboard if on auth page with special handling for mobile
        if (window.location.pathname === '/auth') {
          console.log('GoogleLoginButton popup: Redirecting from auth page to dashboard');
          
          // For mobile browsers, use direct navigation for more reliable cookies
          if (isMobile) {
            console.log('GoogleLoginButton popup: Using direct navigation for mobile auth success');
            // Small delay to ensure cookies are set
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
          } else {
            // For desktop, use Wouter
            setLocation('/');
          }
        }
      } else {
        // If result is null, we're using redirect flow - add a parameter to indicate auth return
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('authReturn', 'true');
        window.history.replaceState({}, document.title, currentUrl.toString());
        
        // Display toast that we're redirecting
        toast({
          title: 'Redirecting to Google',
          description: 'Please complete authentication with Google',
        });
      }
      
      // For redirect flow, the redirect handler will take care of it
    } catch (error: any) {
      console.error('GoogleLoginButton: Sign-in error:', error);
      setAuthError(error.message || 'Authentication failed');
      toast({
        title: 'Sign-in failed',
        description: error.message || 'An error occurred during sign in',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to try again if there was an error
  const handleRetry = () => {
    setAuthError(null);
    handleGoogleLogin();
  };

  // If there was an auth error, show a retry button
  if (authError) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-red-500 flex items-center gap-1 mb-1">
          <AlertCircle className="h-4 w-4" />
          <span>Sign-in failed: {authError}</span>
        </div>
        <Button
          type="button"
          variant="destructive"
          className={className}
          onClick={handleRetry}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={`${className} ${isLoading ? 'opacity-70' : ''}`}
      onClick={handleGoogleLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <GoogleIcon className="h-4 w-4 mr-2" />
      )}
      {!iconOnly && 'Sign in with Google'}
    </Button>
  );
};

// Simple Google icon component
const GoogleIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
  >
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
    <path fill="none" d="M1 1h22v22H1z" />
  </svg>
);

export default GoogleLoginButton;