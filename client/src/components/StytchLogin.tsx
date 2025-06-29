import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';

interface StytchLoginProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export default function StytchLoginComponent({ onSuccess, onError }: StytchLoginProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // Send magic link via our backend
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          loginRedirectURL: `${window.location.origin}/auth/callback`,
          signupRedirectURL: `${window.location.origin}/auth/callback`
        }),
        credentials: 'include',
      });

      if (response.ok) {
        setEmailSent(true);
        onSuccess?.();
      } else {
        throw new Error('Failed to send magic link');
      }
    } catch (error) {
      console.error('Magic link error:', error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      // Redirect to Google OAuth via our backend
      window.location.href = `/api/auth/google?redirect_url=${encodeURIComponent(window.location.origin)}/auth/callback`;
    } catch (error) {
      console.error('Google login error:', error);
      onError?.(error);
      setIsGoogleLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="text-center py-8">
        <Mail className="h-12 w-12 mx-auto mb-4 text-green-600" />
        <h3 className="text-lg font-medium mb-2">Check your email</h3>
        <p className="text-sm text-gray-600 mb-4">
          We sent a magic link to <strong>{email}</strong>
        </p>
        <Button
          variant="outline"
          onClick={() => setEmailSent(false)}
          className="text-sm"
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Google OAuth Button */}
      <Button
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading}
        variant="outline"
        className="w-full"
        size="lg"
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FaGoogle className="mr-2 h-4 w-4" />
        )}
        Continue with Google
      </Button>

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

      {/* Email Magic Link Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <Button
          type="submit"
          disabled={isLoading || !email}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending magic link...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send magic link
            </>
          )}
        </Button>
      </form>

      <p className="text-xs text-center text-gray-500">
        We'll email you a magic link for a password-free sign in.
      </p>
    </div>
  );
}