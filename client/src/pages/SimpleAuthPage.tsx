import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SimpleAuthPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Only Stytch login is supported now. Remove legacy handlers.

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to ProbateSwift
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your account
          </p>
        </div>

        {/* Auth Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign in to your account</CardTitle>
            <CardDescription className="text-center">
              Use your Google account to sign in securely
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span>Sign in with Replit</span>
              )}
            </Button>
            
            <div className="mt-4 text-center text-sm text-gray-500">
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
            </div>
          </CardContent>
        </Card>

        {/* Environment info for debugging */}
        {import.meta.env.DEV && (
          <Card className="border-dashed border-gray-300">
            <CardContent className="pt-6">
              <div className="text-xs text-gray-500 space-y-1">
                <div><strong>Environment:</strong> {import.meta.env.MODE}</div>
                <div><strong>Domain:</strong> {window.location.hostname}</div>
                <div><strong>Project ID:</strong> {import.meta.env.VITE_FIREBASE_PROJECT_ID}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}