import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  analytics: Analytics | null;
  isInitialized: boolean;
  error: Error | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Check if Firebase is already initialized
        const existingApps = getApps();
        let firebaseApp: FirebaseApp;

        if (existingApps.length > 0) {
          // Use existing app
          firebaseApp = existingApps[0];
          console.log('[Firebase] Using existing Firebase app');
        } else {
          // Initialize new Firebase app
          const firebaseConfig = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID,
            measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
          };

          // Validate required config
          if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            throw new Error('Missing required Firebase configuration. Please check your environment variables.');
          }

          // Dynamic auth domain configuration for Replit domains
          const currentDomain = window.location.hostname;
          const isReplitDomain = currentDomain.includes('replit.dev') || currentDomain.includes('kirk.replit.dev');
          
          if (isReplitDomain) {
            // For Replit domains, use the current domain as auth domain
            firebaseConfig.authDomain = currentDomain;
            console.log('[Firebase] Running on Replit domain, using current domain as auth domain:', currentDomain);
          } else {
            console.log('[Firebase] Running on production domain, using configured auth domain');
          }

          // Check for domain mismatch (this should now be resolved)
          const configuredAuthDomain = firebaseConfig.authDomain;
          
          if (configuredAuthDomain && currentDomain !== configuredAuthDomain) {
            console.warn('[Firebase] DOMAIN MISMATCH WARNING:');
            console.warn(`[Firebase] Current domain: ${currentDomain}`);
            console.warn(`[Firebase] Configured auth domain: ${configuredAuthDomain}`);
            console.warn('[Firebase] This will cause auth/internal-error. You need to either:');
            console.warn('[Firebase] 1. Add the current domain to Firebase Console > Authentication > Settings > Authorized domains');
            console.warn('[Firebase] 2. Or update your environment variables to match the current domain');
          }

          firebaseApp = initializeApp(firebaseConfig);
          console.log('[Firebase] Firebase app initialized successfully');
        }

        // Initialize Auth
        const firebaseAuth = getAuth(firebaseApp);
        
        // Connect to Auth Emulator in development
        if (import.meta.env.DEV) {
          try {
            connectAuthEmulator(firebaseAuth, 'http://localhost:9099');
            console.log('[Firebase] Connected to Auth emulator');
          } catch (emulatorError) {
            console.warn('[Firebase] Auth emulator connection failed:', emulatorError);
          }
        }

        // Initialize Analytics conditionally
        let firebaseAnalytics: Analytics | null = null;
        try {
          const analyticsSupported = await isSupported();
          if (analyticsSupported) {
            firebaseAnalytics = getAnalytics(firebaseApp);
            console.log('[Firebase] Analytics initialized');
          }
        } catch (analyticsError) {
          console.warn('[Firebase] Analytics initialization failed:', analyticsError);
        }

        setApp(firebaseApp);
        setAuth(firebaseAuth);
        setAnalytics(firebaseAnalytics);
        setIsInitialized(true);
        setError(null);

        console.log('[Firebase] Firebase initialization completed');
      } catch (err) {
        console.error('[Firebase] Initialization error:', err);
        setError(err as Error);
        setIsInitialized(true); // Set to true so we don't get stuck loading
      }
    };

    initializeFirebase();
  }, []);

  const value: FirebaseContextType = {
    app,
    auth,
    analytics,
    isInitialized,
    error
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
} 