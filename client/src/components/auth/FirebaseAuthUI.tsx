import React, { useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FirebaseAuthUIProps {
  onSignInSuccess?: (user: any) => void;
  onSignInFailure?: (error: any) => void;
}

const FirebaseAuthUI: React.FC<FirebaseAuthUIProps> = ({ 
  onSignInSuccess, 
  onSignInFailure 
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCheckingRedirect, setIsCheckingRedirect] = React.useState(true);

  useEffect(() => {
    // Check for redirect result on component mount
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('[FirebaseUI] Redirect sign-in successful:', result.user.email);
          onSignInSuccess?.(result.user);
          toast({
            title: "Sign in successful",
            description: `Welcome back, ${result.user.displayName || result.user.email}!`,
          });
        }
      } catch (error: any) {
        console.error('[FirebaseUI] Redirect sign-in error:', error);
        onSignInFailure?.(error);
        toast({
          title: "Sign in failed",
          description: error.message || "An error occurred during sign in",
          variant: "destructive",
        });
      } finally {
        setIsCheckingRedirect(false);
      }
    };

    checkRedirectResult();
  }, [onSignInSuccess, onSignInFailure, toast]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    
    // Add scopes for additional user information
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
      console.log('[FirebaseUI] Starting Google sign-in with redirect...');
      await signInWithRedirect(auth, provider);
      // Redirect will happen, no need to handle result here
    } catch (error: any) {
      console.error('[FirebaseUI] Sign-in error:', error);
      setIsLoading(false);
      onSignInFailure?.(error);
      toast({
        title: "Sign in failed",
        description: error.message || "An error occurred during sign in",
        variant: "destructive",
      });
    }
  };

  if (isCheckingRedirect) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Checking authentication...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Sign in to ProbateSwift</CardTitle>
        <CardDescription>
          Choose your preferred sign-in method
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          variant="outline"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </>
          )}
        </Button>
        
        <div className="text-center text-sm text-gray-600">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </CardContent>
    </Card>
  );
};

export default FirebaseAuthUI;