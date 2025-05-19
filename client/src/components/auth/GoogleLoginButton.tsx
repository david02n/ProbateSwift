import React from 'react';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface GoogleLoginButtonProps {
  className?: string;
}

const GoogleLoginButton = ({ className = '' }: GoogleLoginButtonProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Create a fresh Google provider instance
      const provider = new GoogleAuthProvider();
      
      // Set custom parameters - always offer account selection
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('Using simple popup login flow');
      
      // Simple popup authentication - direct and reliable
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Google login successful:', result.user.email);
      
      if (result.user) {
        // Get the token for backend authentication
        const idToken = await result.user.getIdToken();
        
        // Store token for API requests
        localStorage.setItem('firebase_id_token', idToken);
        
        // Verify with backend
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            idToken,
            email: result.user.email,
            displayName: result.user.displayName
          }),
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log('Backend authentication successful');
          
          // Show success toast
          toast({
            title: 'Login Successful',
            description: 'You have been logged in successfully.',
            variant: 'default',
          });
          
          // Redirect to dashboard after successful login
          window.location.href = '/';
        } else {
          throw new Error('Backend authentication failed');
        }
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