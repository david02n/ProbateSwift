import { SignIn, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import CookieConsentBanner from '@/components/legal/CookieConsentBanner';
import { openCookieSettings } from '@/lib/cookie-consent';

// Brand-matched appearance for the embedded sign-in widget so it sits inside the
// ProbateSwift palette (navy / cream) instead of the default light-blue Clerk look.
const signInAppearance = {
  variables: {
    colorPrimary: '#082D48',
    colorText: '#1E2A33',
    colorTextSecondary: '#5C6670',
    colorBackground: '#FFFFFF',
    colorInputBackground: '#FFFFFF',
    colorInputText: '#1E2A33',
    borderRadius: '12px',
    fontFamily: 'inherit',
  },
  elements: {
    // Flatten every Clerk wrapper so the widget has no card/box of its own —
    // it should sit directly inside our white panel, not as a card-in-a-card.
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none border-none bg-transparent',
    card: 'shadow-none border-none bg-transparent p-0 gap-5',
    header: 'hidden',
    socialButtons: 'gap-2',
    socialButtonsBlockButton:
      'border border-[#E3D9C9] bg-white hover:bg-[#F6F0E7] text-[#1E2A33] shadow-none',
    socialButtonsBlockButtonText: 'font-medium text-[15px]',
    dividerRow: 'my-1',
    dividerLine: 'bg-[#E3D9C9]',
    dividerText: 'text-[#8A8278] text-[13px]',
    formFieldLabel: 'text-[#1E2A33] font-medium',
    formFieldInput: 'border-[#E3D9C9] bg-white focus:border-[#082D48] focus:ring-0',
    formButtonPrimary:
      'bg-[#082D48] hover:bg-[#06223A] text-[#F6F0E7] font-semibold normal-case text-[15px] shadow-none',
    footer: 'bg-transparent border-none shadow-none',
    footerAction: 'text-[#5C6670]',
    footerActionText: 'text-[#5C6670]',
    footerActionLink: 'text-[#082D48] hover:text-[#06223A] font-semibold',
  },
} as const;

const reassurances = [
  {
    title: 'Free until you submit',
    body: 'Fill everything in and see your completed forms before paying a penny. No card needed to start.',
  },
  {
    title: 'One flat fee — £295, all in',
    body: 'Your inheritance tax forms are included. No percentage of the estate, no hourly billing.',
  },
  {
    title: 'Your data, protected',
    body: 'Bank-level encryption, stored securely and never sold. Only strictly necessary cookies are active.',
  },
  {
    title: 'A real human behind it',
    body: 'Built by the founder, who went through probate himself — not a faceless firm.',
  },
];

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation('/dashboard');
    }
  }, [isLoaded, isSignedIn, setLocation]);

  return (
    <div className="min-h-screen bg-[#F6F0E7] px-6 py-12 text-[#1E2A33] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-[1160px] flex-col justify-center gap-12 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-[56px]">
        {/* Left: brand + offer reassurances */}
        <div className="space-y-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-[#082D48] no-underline transition hover:opacity-80"
          >
            <img src="/assets/swift_navy.png" alt="" className="block h-[34px] w-[34px]" />
            <span className="text-[20px] font-extrabold tracking-[-0.02em]">ProbateSwift</span>
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E4EAF0] px-[14px] py-[7px] text-[13px] font-bold tracking-[0.02em] text-[#082D48]">
              Secure probate workspace
            </div>
            <h1 className="m-0 max-w-[520px] text-[34px] font-extrabold leading-[1.06] tracking-[-0.025em] text-[#082D48] md:text-[44px]">
              Pick up where you left off.
            </h1>
            <p className="m-0 max-w-[520px] text-[18px] leading-[1.55] text-[#5C6670]">
              Create an account or sign in to access your dashboard, upload documents, and continue
              through the ProbateSwift workflow. It only takes a moment.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {reassurances.map((item) => (
              <div
                key={item.title}
                className="rounded-[16px] border border-[#E3D9C9] bg-white p-[18px]"
              >
                <div className="mb-1.5 flex items-start gap-2.5">
                  <span className="mt-0.5 font-extrabold text-[#082D48]">✓</span>
                  <p className="m-0 text-[15px] font-bold text-[#1E2A33]">{item.title}</p>
                </div>
                <p className="m-0 pl-[26px] text-[14px] leading-[1.5] text-[#5C6670]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: sign-in card */}
        <div className="w-full">
          <div className="mx-auto max-w-[440px] rounded-[22px] border border-[#E3D9C9] bg-white p-7 shadow-[0_30px_60px_-36px_rgba(8,45,72,0.4)] sm:p-9">
            <div className="mb-6">
              <h2 className="m-0 text-[24px] font-extrabold tracking-[-0.02em] text-[#082D48]">
                Sign in to ProbateSwift
              </h2>
              <p className="m-0 mt-1.5 text-[15px] text-[#5C6670]">
                Welcome back. Sign in or create an account to continue.
              </p>
            </div>
            <SignIn
              appearance={signInAppearance}
              routing="path"
              path="/auth"
              fallbackRedirectUrl="/dashboard"
              signUpFallbackRedirectUrl="/dashboard"
              signUpUrl="/auth"
            />
          </div>

          <p className="mx-auto mt-6 max-w-[440px] text-center text-[14px] leading-[1.6] text-[#8A8278]">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="font-semibold text-[#082D48] underline underline-offset-4">
              Terms of Service
            </Link>
            ,{' '}
            <Link href="/privacy" className="font-semibold text-[#082D48] underline underline-offset-4">
              Privacy Policy
            </Link>
            , and{' '}
            <Link href="/cookies" className="font-semibold text-[#082D48] underline underline-offset-4">
              Cookie Policy
            </Link>
            .{' '}
            <button
              type="button"
              onClick={openCookieSettings}
              className="cursor-pointer border-none bg-transparent p-0 font-semibold text-[#082D48] underline underline-offset-4"
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
