import React from 'react';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
// Import our new token-based authentication function
import { signInWithGoogle } from '@/lib/firebase-auth';
import { useToast } from '@/hooks/use-toast';

interface GoogleLoginButtonProps {
  className?: string;
}

const GoogleLoginButton = ({ className = '' }: GoogleLoginButtonProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Detect mobile device
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
      
      // Get domain information for debugging and analytics
      const domain = window.location.hostname;
      const fullHost = window.location.host;
      const isProd = domain.includes('probateswift.com');
      const isReplit = domain.includes('replit');
      
      console.log('Starting Google login from:', fullHost);
      console.log('Environment type:', isProd ? 'Production' : (isReplit ? 'Replit' : 'Development'));
      console.log('Device type:', isMobile ? (isIOS ? 'iOS' : 'Mobile') : 'Desktop');
      console.log('Current path:', window.location.pathname);
      
      // For mobile devices, add a returnUrl parameter to help with redirects
      if (isMobile) {
        // Store current URL in localStorage to help with redirect after auth
        localStorage.setItem('auth_return_url', window.location.href);
        localStorage.setItem('auth_timestamp', Date.now().toString());
        
        // On mobile, especially iOS, set a flag to help with popup/redirect handling
        localStorage.setItem('mobile_auth_pending', 'true');
        
        console.log('Mobile device detected, using special auth flow');
      }
      
      // Use the signInWithGoogle function from googleAuth.ts
      const result = await signInWithGoogle();
      
      if (result) {
        console.log('Google login successful, redirecting to dashboard');
        
        // Show success toast
        toast({
          title: 'Login Successful',
          description: 'You have been logged in successfully.',
          variant: 'default',
        });
        
        // Redirect to dashboard after successful login
        window.location.href = '/';
      }
      
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Handle different error types with specific messages
      let errorMessage = 'There was a problem logging in with Google. Please try again.';
      
      if (error.code) {
        // Firebase auth error codes
        if (error.code === 'auth/popup-blocked') {
          errorMessage = 'Login popup was blocked by your browser. Please allow popups for this site.';
        } else if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Login was cancelled. Please try again to log in.';
        } else if (error.code === 'auth/unauthorized-domain') {
          errorMessage = 'This domain is not authorized for authentication. Please contact support.';
          // Log detailed domain information to help diagnose the issue
          console.error('Unauthorized domain error:', {
            domain: window.location.hostname,
            fullHost: window.location.host,
            origin: window.location.origin,
            path: window.location.pathname,
            href: window.location.href
          });
        }
      }
      
      toast({
        title: 'Google Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleGoogleLogin}
      className={`w-full flex items-center justify-center gap-2 ${className}`}
      type="button"
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="animate-spin h-5 w-5 border-2 border-gray-300 rounded-full border-t-blue-600 mr-2"></span>
      ) : (
        <FcGoogle className="h-5 w-5" />
      )}
      <span>Continue with Google</span>
    </Button>
  );
};

export default GoogleLoginButton;