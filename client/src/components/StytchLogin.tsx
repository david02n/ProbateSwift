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
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'magic' | 'password'>('magic');
  const [authType, setAuthType] = useState<'signin' | 'signup'>('signin');

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

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/${authType === 'signin' ? 'password-login' : 'password-signup'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          password
        }),
        credentials: 'include',
      });

      if (response.ok) {
        onSuccess?.();
      } else {
        throw new Error('Failed to authenticate');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Invalid email or password');
      onError?.(error);
    } finally {
      setIsLoading(false);
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
      {/* Auth mode toggles */}
      <div className="flex justify-center gap-2 mb-2">
        <Button
          type="button"
          variant={mode === 'magic' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('magic')}
        >
          Magic Link
        </Button>
        <Button
          type="button"
          variant={mode === 'password' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('password')}
        >
          Password
        </Button>
      </div>
      {mode === 'password' && (
        <div className="flex justify-center gap-2 mb-2">
          <Button
            type="button"
            variant={authType === 'signin' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAuthType('signin')}
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={authType === 'signup' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAuthType('signup')}
          >
            Sign Up
          </Button>
        </div>
      )}
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

      {/* Error message */}
      {error && (
        <div className="text-center text-red-600 text-xs mb-2">{error}</div>
      )}

      {/* Email/Password Form */}
      {mode === 'magic' ? (
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
      ) : (
        <form onSubmit={handlePasswordAuth} className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete={authType === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {authType === 'signup' ? 'Signing up...' : 'Signing in...'}
              </>
            ) : (
              <>
                {authType === 'signup' ? 'Sign Up' : 'Sign In'}
              </>
            )}
          </Button>
        </form>
      )}

      {mode === 'magic' ? (
        <p className="text-xs text-center text-gray-500">
          We'll email you a magic link for a password-free sign in.
        </p>
      ) : (
        <p className="text-xs text-center text-gray-500">
          {authType === 'signup'
            ? 'Create a new account using email and password.'
            : 'Sign in with your email and password.'}
        </p>
      )}
    </div>
  );
}