import { useEffect, useState } from 'react';
import { getRedirectResult } from 'firebase/auth';
import { useFirebase } from '@/providers/FirebaseProvider';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();
  const { auth, isInitialized, error: firebaseError } = useFirebase();
  const { setError, setFirebaseUser } = useAuthStore();

  useEffect(() => {
    const handleRedirect = async () => {
      if (!auth) return;
      
      try {
        console.log('[AuthCallback] Processing redirect result...');
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
          console.log('[AuthCallback] Redirect result found:', result);
          // User successfully signed in
          const { user } = result;
          const idToken = await user.getIdToken();
          
          // Store token
          localStorage.setItem('firebase_id_token', idToken);
          
          // Update Firebase user state
          setFirebaseUser(user);
          
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
            setStatus('success');
            toast({
              title: "Sign in successful",
              description: `Welcome${user.displayName ? ', ' + user.displayName : ''}!`,
            });
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 2000);
          } else {
            throw new Error('Failed to establish session');
          }
        } else {
          // No redirect result, user probably navigated directly to this page
          console.warn('[AuthCallback] No redirect result found');
          setStatus('error');
          setErrorMessage('No authentication result found. Please try signing in again.');
        }
      } catch (error: any) {
        console.error('[AuthCallback] Auth callback error:', error);
        setStatus('error');
        setError(error);
        
        let errorMessage = 'An error occurred during sign in.';
        
        if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = 'An account already exists with the same email address but different sign-in credentials.';
        } else if (error.code === 'auth/invalid-credential') {
          errorMessage = 'Invalid sign-in credentials.';
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = 'This sign-in method is not enabled for this app.';
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = 'This account has been disabled. Please contact support.';
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email address.';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Invalid password.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Too many failed sign-in attempts. Please try again later.';
        } else if (error.code === 'auth/internal-error') {
          errorMessage = 'Authentication error. Please try again.';
        }

        setErrorMessage(errorMessage);
        
        toast({
          title: "Sign in failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Redirect back to auth page after a delay
        setTimeout(() => {
          window.location.href = '/auth';
        }, 3000);
      }
    };

    if (isInitialized && auth) {
      handleRedirect();
    }
  }, [isInitialized, auth, setError, setFirebaseUser, toast]);

  // Show loading state while Firebase initializes
  if (!isInitialized) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground">Initializing authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if Firebase failed to initialize
  if (firebaseError) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Authentication Error
            </CardTitle>
            <CardDescription>
              Failed to initialize authentication system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {firebaseError.message}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.location.href = '/auth'} 
              className="w-full"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            {status === 'loading' && 'Completing sign in...'}
            {status === 'success' && 'Sign in successful!'}
            {status === 'error' && 'Sign in failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we complete your sign in.'}
            {status === 'success' && 'You will be redirected to your dashboard shortly.'}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Redirecting you to the dashboard...
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center py-4 space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Redirecting you back to the sign-in page...
              </p>
              <Button 
                onClick={() => window.location.href = '/auth'} 
                variant="outline"
                className="w-full"
              >
                Go to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 