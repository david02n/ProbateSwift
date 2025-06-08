import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GoogleSignInButton } from './GoogleSignInButton';
import { GoogleOneTapLogin } from './GoogleOneTapLogin';
import { EmailSignInForm } from './EmailSignInForm';
import { FirebaseTest } from './FirebaseTest';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore, useAuthLoading, useIsAuthenticated } from '@/stores/auth-store';
import { useBackendUser } from '@/hooks/use-backend-user';
import { initializeAuthListener } from '@/stores/auth-store';

interface AuthEntryProps {
  onSignInSuccess?: (user: any) => void;
  onSignInError?: (error: any) => void;
  context?: 'signin' | 'signup';
  showDebug?: boolean;
}

export function AuthEntry({ 
  onSignInSuccess, 
  onSignInError,
  context = 'signin',
  showDebug = true
}: AuthEntryProps) {
  const { toast } = useToast();
  const isLoading = useAuthLoading();
  const isAuthenticated = useIsAuthenticated();
  const { data: backendUser, isLoading: backendLoading } = useBackendUser();

  // Initialize auth listener
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initAuth = async () => {
      try {
        unsubscribe = await initializeAuthListener();
      } catch (error) {
        console.error('Failed to initialize auth listener:', error);
      }
    };
    
    initAuth();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Check if Google One Tap is supported
  const supportsOneTap = () => {
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIncognito = window.navigator.webdriver;
    
    // One Tap works best on Chrome desktop and mobile Chrome
    return isChrome && !isIncognito;
  };

  const handleSignInSuccess = (user: any) => {
    if (onSignInSuccess) {
      onSignInSuccess(user);
    }
  };

  const handleSignInError = (error: any) => {
    if (onSignInError) {
      onSignInError(error);
    }
  };

  // Show loading state
  if (isLoading || backendLoading) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is authenticated, redirect or show success
  if (isAuthenticated && backendUser) {
    // Redirect to home page
    window.location.href = '/';
    return null;
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Debug Firebase Test */}
        {showDebug && <FirebaseTest />}

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">
            {context === 'signup' ? 'Join ProbateSwift' : 'Welcome to ProbateSwift'}
          </h1>
          <p className="text-muted-foreground">
            {context === 'signup' 
              ? 'Create your account to get started with probate management'
              : 'Sign in to access your account and manage your probate process'
            }
          </p>
        </div>

        {/* Google One Tap (if supported) */}
        {supportsOneTap() && (
          <GoogleOneTapLogin
            onSignInSuccess={handleSignInSuccess}
            onSignInError={handleSignInError}
            context={context}
          />
        )}

        {/* Main Auth Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {context === 'signup' ? 'Create your account' : 'Sign in to your account'}
            </CardTitle>
            <CardDescription>
              Choose your preferred sign-in method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google Sign-in Button */}
            <div className="space-y-4">
              <GoogleSignInButton 
                className="w-full" 
                context={context}
              />
              <div className="text-center text-sm text-muted-foreground">
                Quick and secure sign-in with your Google account
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

            {/* Email Sign-in Form */}
            <EmailSignInForm context={context} />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          By {context === 'signup' ? 'creating an account' : 'signing in'}, you agree to our{' '}
          <a href="/terms" className="underline hover:text-primary">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </a>
        </div>

        {/* Context switcher */}
        {context === 'signin' && (
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button 
              onClick={() => window.location.href = '/signup'}
              className="underline hover:text-primary"
            >
              Sign up here
            </button>
          </div>
        )}

        {context === 'signup' && (
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button 
              onClick={() => window.location.href = '/signin'}
              className="underline hover:text-primary"
            >
              Sign in here
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 