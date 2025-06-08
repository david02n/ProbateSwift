import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'wouter';
import { getRedirectResult, signInWithPopup, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { useFirebase } from '@/providers/FirebaseProvider';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Shield, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { EmailSignInForm } from '@/components/auth/EmailSignInForm';

export function SignupPage() {
  const [, setLocation] = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { auth, isInitialized, error: firebaseError } = useFirebase();
  const { setError, setFirebaseUser } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [domainInfo, setDomainInfo] = useState<{
    currentDomain: string;
    authDomain: string;
    isReplitDomain: boolean;
    hasDomainMismatch: boolean;
  } | null>(null);

  // Handle redirect result on page load
  useEffect(() => {
    const handleRedirectResult = async () => {
      if (!auth) return;
      
      try {
        console.log('[SignupPage] Checking for redirect result...');
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('[SignupPage] Redirect result found:', result);
          setIsRedirecting(true);
          await handleSignInSuccess(result);
        }
      } catch (error: any) {
        console.error('[SignupPage] Redirect result error:', error);
        setError(error);
        toast({
          title: "Sign up failed",
          description: "Failed to complete sign-up. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsRedirecting(false);
      }
    };

    if (isInitialized && auth) {
      handleRedirectResult();
    }
  }, [isInitialized, auth, setError, toast]);

  // Analyze domain configuration
  useEffect(() => {
    if (isInitialized && auth) {
      const currentDomain = window.location.hostname;
      const authDomain = auth.app.options.authDomain || '';
      const isReplitDomain = currentDomain.includes('replit.dev') || currentDomain.includes('kirk.replit.dev');
      const hasDomainMismatch = Boolean(authDomain) && currentDomain !== authDomain;

      setDomainInfo({
        currentDomain,
        authDomain,
        isReplitDomain,
        hasDomainMismatch
      });

      console.log('[SignupPage] Domain analysis:', {
        currentDomain,
        authDomain,
        isReplitDomain,
        hasDomainMismatch
      });
    }
  }, [isInitialized, auth]);

  const handleGoogleSignUp = async () => {
    if (!auth) {
      toast({
        title: "Error",
        description: "Authentication not available. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('[SignupPage] Starting Google sign-up process');
      console.log('[SignupPage] Domain info:', domainInfo);
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        context: 'signup',
      });

      console.log('[SignupPage] Provider configured, attempting popup...');
      
      // Try popup first
      try {
        const result = await signInWithPopup(auth, provider);
        console.log('[SignupPage] Popup sign-up successful:', result);
        await handleSignInSuccess(result);
      } catch (popupError: any) {
        console.error('[SignupPage] Popup failed, falling back to redirect:', popupError);
        
        // Check if it's a domain mismatch error
        if (popupError.code === 'auth/internal-error' && domainInfo?.hasDomainMismatch) {
          toast({
            title: "Domain Configuration Issue",
            description: "Redirecting to Google sign-up due to domain configuration...",
          });
        } else {
          toast({
            title: "Popup blocked",
            description: "Redirecting to Google sign-up...",
          });
        }
        
        setIsRedirecting(true);
        await signInWithRedirect(auth, provider);
        // The page will redirect, so we don't need to handle the result here
      }
    } catch (error: any) {
      console.error('[SignupPage] Google sign-up error:', error);
      
      let errorMessage = 'Failed to sign up with Google.';
      
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email address but different sign-in credentials.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid sign-up credentials.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google sign-up is not enabled for this app.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.code === 'auth/internal-error') {
        if (domainInfo?.hasDomainMismatch) {
          errorMessage = 'Domain configuration issue. Please contact support.';
        } else {
          errorMessage = 'Authentication error. Please try again.';
        }
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-up was cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      }

      setError(error);
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignInSuccess = async (result: any) => {
    try {
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
        toast({
          title: "Account created successfully",
          description: `Welcome${user.displayName ? ', ' + user.displayName : ''}!`,
        });
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        throw new Error('Failed to establish session');
      }
    } catch (error) {
      console.error('Session establishment error:', error);
      setError(error as Error);
      toast({
        title: "Sign up failed",
        description: "Could not establish session with the server. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isProcessingAny = isProcessing || isRedirecting;

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
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Join ProbateSwift</h1>
          <p className="text-muted-foreground">
            Create your account to start managing your probate process
          </p>
        </div>

        {/* Domain Warning (if applicable) */}
        {domainInfo?.hasDomainMismatch && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Domain Configuration Notice:</strong> You're accessing from {domainInfo.currentDomain} 
              but auth is configured for {domainInfo.authDomain}. This may cause authentication issues.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Auth Card */}
        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              Choose your preferred sign-up method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google Sign-up Button */}
            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignUp}
                disabled={isProcessingAny}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {isProcessingAny ? (
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
                {isRedirecting ? 'Redirecting...' : 'Continue with Google'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Quick and secure sign-up with your Google account
              </div>
            </div>

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email Sign-up Form */}
            <EmailSignInForm context="signup" />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          By creating an account, you agree to our{' '}
          <a href="/terms" className="underline hover:text-primary">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </a>
        </div>

        {/* Sign in link */}
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button 
            onClick={() => navigate('/auth')}
            className="underline hover:text-primary"
          >
            Sign in here
          </button>
        </div>

        {/* Debug Info (only in development) */}
        {import.meta.env.DEV && domainInfo && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-sm">Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div><strong>Current Domain:</strong> {domainInfo.currentDomain}</div>
              <div><strong>Auth Domain:</strong> {domainInfo.authDomain}</div>
              <div><strong>Is Replit:</strong> {domainInfo.isReplitDomain ? 'Yes' : 'No'}</div>
              <div><strong>Domain Mismatch:</strong> {domainInfo.hasDomainMismatch ? 'Yes' : 'No'}</div>
              <div><strong>Environment:</strong> {import.meta.env.MODE}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 