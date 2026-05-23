import { SignIn, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CookieConsentBanner from '@/components/legal/CookieConsentBanner';
import { openCookieSettings } from '@/lib/cookie-consent';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation('/dashboard');
    }
  }, [isLoaded, isSignedIn, setLocation]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col justify-center gap-10 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <Link href="/" className="inline-flex text-sm font-medium text-teal-700 transition hover:text-teal-800">
            Back to ProbateSwift
          </Link>
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Secure probate workspace
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Sign in to continue your probate application
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              Use Clerk sign-in to access your dashboard, upload documents, and continue
              through the ProbateSwift workflow.
            </p>
          </div>
          <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-medium text-slate-900">Privacy-first launch</p>
              <p>Only strictly necessary cookies are active while we finish consent-gated analytics.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-medium text-slate-900">Clerk authentication</p>
              <p>One secure sign-in flow for ProbateSwift accounts and sessions.</p>
            </div>
          </div>
        </div>

        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Sign in or create an account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignIn
              routing="path"
              path="/auth"
              fallbackRedirectUrl="/dashboard"
              signUpFallbackRedirectUrl="/dashboard"
              signUpUrl="/auth"
            />
          </CardContent>
        </Card>

        <div className="text-center text-sm text-slate-500 lg:col-span-2">
          <p>
            By signing in, you agree to our{" "}
            <Link href="/terms" className="font-medium text-slate-700 underline underline-offset-4">
              Terms of Service
            </Link>
            ,{" "}
            <Link href="/privacy" className="font-medium text-slate-700 underline underline-offset-4">
              Privacy Policy
            </Link>
            , and{" "}
            <Link href="/cookies" className="font-medium text-slate-700 underline underline-offset-4">
              Cookie Policy
            </Link>
            .{" "}
            <button
              type="button"
              onClick={openCookieSettings}
              className="font-medium text-slate-700 underline underline-offset-4"
            >
              Manage cookie settings
            </button>
            .
          </p>
        </div>
      </div>
      <CookieConsentBanner />
    </div>
  );
}
