import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import StytchLoginComponent from '@/components/StytchLogin';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle URL parameters for callbacks and errors
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      setError('Authentication failed. Please try again.');
    }
    
    if (token) {
      // Handle successful authentication callback
      handleAuthCallback(token);
    }
  }, []);

  const handleAuthCallback = async (token: string) => {
    setIsLoading(true);
    try {
      // Send the token to our backend for verification and session creation
      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'You have been logged in successfully.',
        });
        setLocation('/');
      } else {
        throw new Error('Authentication verification failed');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      setError('Failed to complete authentication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    toast({
      title: 'Check your email',
      description: 'We sent you a magic link to complete your login.',
    });
  };

  const handleAuthError = (error: any) => {
    console.error('Authentication error:', error);
    setError('Authentication failed. Please try again.');
    toast({
      title: 'Error',
      description: 'Something went wrong. Please try again.',
      variant: 'destructive',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Completing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to ProbateSwift
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account or create a new one
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Use your email to sign in or create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <StytchLoginComponent
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
            />
            {/* Only Stytch login is supported now. */}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}