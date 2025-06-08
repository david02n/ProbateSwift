import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export function SignupPage() {
  const [, setLocation] = useLocation();

  const handleReplitSignUp = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="h-6 w-6" />
            Join ProbateSwift
          </CardTitle>
          <CardDescription>
            Create your account to start managing your probate process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleReplitSignUp}
            className="w-full"
            size="lg"
          >
            Sign up with Replit
          </Button>
          
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

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button 
              onClick={() => setLocation('/auth')}
              className="underline hover:text-primary"
            >
              Sign in here
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 