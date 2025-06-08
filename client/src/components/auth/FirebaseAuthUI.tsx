import React, { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface FirebaseAuthUIProps {
  onSignInSuccess?: (user: any) => void;
  onSignInFailure?: (error: any) => void;
}

const FirebaseAuthUI: React.FC<FirebaseAuthUIProps> = ({ 
  onSignInSuccess, 
  onSignInFailure 
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        console.log('[FirebaseUI] User signed in:', user.email);
        onSignInSuccess?.(user);
      }
    });

    return () => unsubscribe();
  }, [onSignInSuccess]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('[FirebaseUI] Starting Google sign-in with popup...');
      const result = await signInWithPopup(auth, provider);
      
      console.log('[FirebaseUI] Sign-in successful:', result.user.email);
      toast({
        title: "Welcome back!",
        description: `Signed in as ${result.user.email}`,
      });
      
    } catch (error: any) {
      console.error('[FirebaseUI] Sign-in error:', error);
      onSignInFailure?.(error);
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (currentUser) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium">Welcome back!</p>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Sign in to ProbateSwift</CardTitle>
        <CardDescription>
          Choose your preferred sign-in method
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="firebaseui-auth-container">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-medium py-3 px-4 rounded-lg transition-colors"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </Button>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          By signing in, you agree to our{' '}
          <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
        </div>
      </CardContent>
    </Card>
  );
};

export default FirebaseAuthUI;