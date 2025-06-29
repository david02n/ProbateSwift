  error: Error | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);


  children: ReactNode;
}


  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        console.log('[Firebase] Starting initialization...');
        console.log('[Firebase] Current hostname:', window.location.hostname);

        // Initialize Firebase with safer app checking
        let app: FirebaseApp;
        let existingApps: FirebaseApp[] = [];

        try {
          existingApps = getApps() || [];
        } catch (error) {
          console.warn('[Firebase] Error checking existing apps, proceeding with new initialization:', error);
          existingApps = [];
        }

        if (existingApps.length > 0) {
          app = existingApps[0];
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

          // Log configuration status
          console.log('[Firebase] Configuration check:');
          console.log('[Firebase] API Key:', firebaseConfig.apiKey ? 'Set' : 'Missing');
          console.log('[Firebase] Project ID:', firebaseConfig.projectId ? 'Set' : 'Missing');
          console.log('[Firebase] Auth Domain:', firebaseConfig.authDomain ? 'Set' : 'Missing');

          // Validate required config
          if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            throw new Error('Missing required Firebase configuration. Please check your environment variables.');
          }

          console.log('[Firebase] Using standard Firebase auth domain:', firebaseConfig.authDomain);

          app = initializeApp(firebaseConfig);
          console.log('[Firebase] Firebase app initialized successfully');
        }

        // Initialize Auth
        const firebaseAuth = getAuth(app);
        console.log('[Firebase] Auth initialized in production mode');

        // Initialize Analytics conditionally
        let firebaseAnalytics: Analytics | null = null;
        try {
          const analyticsSupported = await isSupported();
          if (analyticsSupported) {
            firebaseAnalytics = getAnalytics(app);
            console.log('[Firebase] Analytics initialized');
          }
        } catch (analyticsError) {
          console.warn('[Firebase] Analytics initialization failed:', analyticsError);
        }

        setApp(app);
        setAuth(firebaseAuth);
        setAnalytics(firebaseAnalytics);
        setIsInitialized(true);
        setError(null);

        console.log('[Firebase] Firebase initialization completed');

        // Clean up Firebase initialization and reduce logging conflicts
        const auth = getAuth();
        console.log('[Firebase] Setting up auth state listener');
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log('[Firebase] Auth state changed:', user ? user.email : 'No user');
        });
        const currentUser = auth.currentUser;
        console.log('[Firebase] Current user:', currentUser ? currentUser.email : 'No user');

        return () => unsubscribe();
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

  }
  return context;
}