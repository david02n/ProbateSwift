// GoogleOneTapLogin is deprecated. Use Stytch login component instead.

interface GoogleOneTapLoginProps {
  onSignInSuccess?: (user: any) => void;
  onSignInError?: (error: any) => void;
  disabled?: boolean;
  context?: 'signin' | 'signup';
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          cancel: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export function GoogleOneTapLogin({ 
  onSignInSuccess, 
  onSignInError, 
  disabled = false,
  context = 'signin'
}: GoogleOneTapLoginProps) {
  const { toast } = useToast();
  const { setError } = useAuthStore();
  const oneTapRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);

  useEffect(() => {
    if (disabled || !window.google?.accounts?.id) {
      return;
    }

    let isMounted = true;

    const initializeOneTap = () => {
      if (!isMounted) return;

      try {
        window.google!.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            if (!isMounted) return;

            try {
              // Create a credential from the ID token
              const credential = GoogleAuthProvider.credential(response.credential);
              
              // Sign in with the credential
              const result = await signInWithCredential(auth, credential);
              
              // Handle successful sign-in
              await handleSignInSuccess(result);
              
              if (onSignInSuccess) {
                onSignInSuccess(result.user);
              }
            } catch (error: any) {
              console.error('One Tap sign-in error:', error);
              
              if (!isMounted) return;

              setError(error);
              
              if (onSignInError) {
                onSignInError(error);
              } else {
                toast({
                  title: "Sign in failed",
                  description: "Failed to sign in with Google One Tap. Please try the regular sign-in button.",
                  variant: "destructive",
                });
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: context,
          prompt_parent_id: oneTapRef.current?.id || undefined,
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Google One Tap:', error);
        if (isMounted) {
          setError(error as Error);
        }
      }
    };

    // Wait for Google Identity Services to load
    const checkGoogleLoaded = () => {
      if (window.google?.accounts?.id) {
        initializeOneTap();
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    checkGoogleLoaded();

    // Cleanup
    return () => {
      isMounted = false;
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          console.warn('Error cancelling One Tap:', error);
        }
      }
    };
  }, [disabled, onSignInSuccess, onSignInError, toast, setError, context]);

  // Prompt One Tap after initialization
  useEffect(() => {
    if (!isInitialized || hasPrompted || disabled) {
      return;
    }

    const promptOneTap = () => {
      if (!window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('One Tap not displayed or skipped:', notification.getReason());
          }
        });
        setHasPrompted(true);
      } catch (error) {
        console.error('Error prompting One Tap:', error);
      }
    };

    // Small delay to ensure everything is ready
    const timer = setTimeout(promptOneTap, 100);

    return () => clearTimeout(timer);
  }, [isInitialized, hasPrompted, disabled]);

  const handleSignInSuccess = async (result: any) => {
    try {
      const { user } = result;
      const idToken = await user.getIdToken();
      
      // Store token
      localStorage.setItem('firebase_id_token', idToken);
      
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
          title: "Sign in successful",
          description: `Welcome${user.displayName ? ', ' + user.displayName : ''}!`,
        });
        
        // Redirect to home page
        window.location.href = '/';
      } else {
        throw new Error('Failed to establish session');
      }
    } catch (error) {
      console.error('Session establishment error:', error);
      toast({
        title: "Sign in failed",
        description: "Could not establish session with the server. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div 
      ref={oneTapRef} 
      id="google-one-tap-container"
      className="google-one-tap-container" 
    />
  );
} 