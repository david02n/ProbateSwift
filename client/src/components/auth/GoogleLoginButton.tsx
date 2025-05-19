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
      
      // Create a fresh provider for each login attempt
      const provider = new GoogleAuthProvider();
      
      // Simple popup login - no fancy parameters
      console.log('Starting Google popup login');
      const result = await signInWithPopup(auth, provider);
      
      console.log('✅ Logged in:', result.user.email);
      
      // Get token for API requests
      const token = await result.user.getIdToken();
      localStorage.setItem('firebase_id_token', token);
      
      // Send token to backend
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: token,
          email: result.user.email
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log('Backend auth successful');
        toast({
          title: 'Success',
          description: 'You are now logged in',
          variant: 'default',
        });
        window.location.href = '/';
      } else {
        throw new Error('Backend auth failed');
      }
      
    } catch (error: any) {
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