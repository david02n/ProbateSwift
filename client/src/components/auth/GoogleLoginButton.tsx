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

  const handleGoogleLogin = () => {
    // Don't set loading state until AFTER popup completes
    // This prevents the spinner from blocking the popup
    
    // Create a fresh provider for each login attempt
    const provider = new GoogleAuthProvider();
    
    // Force account selection every time
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Simple popup login with promise chain (not async/await)
    console.log('Starting Google popup login with account selection');
    
    // Using promise chain for better popup handling
    signInWithPopup(auth, provider)
      .then((result) => {
        console.log('✅ Logged in:', result.user.email);
        setIsLoading(true); // Now we can show loading
        
        // Get token for API requests
        return result.user.getIdToken().then(token => {
          localStorage.setItem('firebase_id_token', token);
          
          // Return both token and user for next step
          return { token, user: result.user };
        });
      })
      .then(({ token, user }) => {
        // Send token to backend
        return fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken: token,
            email: user.email
          }),
          credentials: 'include'
        });
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Backend auth failed');
        }
        
        console.log('Backend auth successful');
        toast({
          title: 'Success',
          description: 'You are now logged in',
          variant: 'default',
        });
        
        // Redirect to dashboard
        window.location.href = '/';
      })
      .catch((error) => {
        console.error('❌ Google login failed:', error);
        
        let message = 'Login failed. Please try again.';
        
        if (error.code === 'auth/popup-blocked') {
          message = 'Please allow popups for this site and try again.';
        } else if (error.code === 'auth/popup-closed-by-user') {
          message = 'Login was cancelled. Please try again.';
        }
        
        toast({
          title: 'Login Failed',
          description: message,
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
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