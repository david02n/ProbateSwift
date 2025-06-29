import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import StytchLoginComponent from './StytchLoginComponent'; // assuming this component is defined elsewhere

export function AuthPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="h-6 w-6" />
            Welcome to ProbateSwift
          </CardTitle>
          <CardDescription>
            Sign in to access your account and manage your probate process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StytchLoginComponent />
          <div className="text-center text-sm text-muted-foreground">
            By signing in, you agree to our{' '}
            <a href="/terms" className="underline hover:text-primary">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}