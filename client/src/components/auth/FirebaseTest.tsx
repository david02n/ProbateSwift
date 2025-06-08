import { useEffect, useState } from 'react';
import { useFirebase } from '@/providers/FirebaseProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signInWithPopup, GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';

export function FirebaseTest() {
  const { app, auth, isInitialized, error } = useFirebase();
  const [testResult, setTestResult] = useState<string>('');
  const [configInfo, setConfigInfo] = useState<string>('');

  useEffect(() => {
    if (isInitialized) {
      if (error) {
        setTestResult(`❌ Firebase Error: ${error.message}`);
      } else if (app && auth) {
        setTestResult('✅ Firebase initialized successfully');
        
        // Log configuration info (without sensitive data)
        const config = app.options;
        setConfigInfo(`
          Project ID: ${config.projectId || 'Not set'}
          Auth Domain: ${config.authDomain || 'Not set'}
          API Key: ${config.apiKey ? 'Set' : 'Not set'}
          App ID: ${config.appId ? 'Set' : 'Not set'}
          Storage Bucket: ${config.storageBucket || 'Not set'}
          Messaging Sender ID: ${config.messagingSenderId ? 'Set' : 'Not set'}
          Measurement ID: ${config.measurementId ? 'Set' : 'Not set'}
        `);
      } else {
        setTestResult('❌ Firebase not properly initialized');
      }
    } else {
      setTestResult('⏳ Initializing Firebase...');
    }
  }, [isInitialized, error, app, auth]);

  const testAuthMethod = async () => {
    try {
      if (!auth) {
        setTestResult('❌ Auth not available');
        return;
      }

      // Test a simple auth method
      const currentUser = auth.currentUser;
      setTestResult(`✅ Auth test successful. Current user: ${currentUser ? currentUser.email : 'None'}`);
    } catch (err) {
      setTestResult(`❌ Auth test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const testGoogleSignIn = async () => {
    try {
      if (!auth) {
        setTestResult('❌ Auth not available for Google sign-in test');
        return;
      }

      setTestResult('🔄 Testing Google sign-in...');
      
      // Log the actual auth configuration being used
      console.log('[FirebaseTest] Auth configuration:', {
        auth: auth,
        app: auth.app,
        config: auth.app.options,
        currentDomain: window.location.hostname,
        authDomain: auth.app.options.authDomain
      });
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // Check if we're on Replit and use redirect instead of popup
      const isReplitDomain = window.location.hostname.includes('replit.dev') || 
                            window.location.hostname.includes('kirk.replit.dev');
      
      if (isReplitDomain) {
        console.log('[FirebaseTest] Replit domain detected, using redirect method');
        setTestResult('🔄 Redirecting to Google sign-in...');
        await signInWithRedirect(auth, provider);
        return;
      }

      const result = await signInWithPopup(auth, provider);
      setTestResult(`✅ Google sign-in successful! User: ${result.user.email}`);
    } catch (err: any) {
      console.error('Google sign-in test error:', err);
      setTestResult(`❌ Google sign-in failed: ${err.code} - ${err.message}`);
      
      // Log detailed error information
      if (err.code === 'auth/internal-error') {
        console.error('Internal error details:', {
          error: err,
          auth: auth,
          config: app?.options,
          userAgent: navigator.userAgent,
          location: window.location.href,
          authDomain: auth?.app?.options?.authDomain,
          currentDomain: window.location.hostname
        });
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Firebase Test</CardTitle>
        <CardDescription>
          Test Firebase initialization and authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <strong>Status:</strong> {testResult}
        </div>
        
        {isInitialized && !error && (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>App:</strong> {app ? '✅ Available' : '❌ Not available'}
            </div>
            <div className="text-sm">
              <strong>Auth:</strong> {auth ? '✅ Available' : '❌ Not available'}
            </div>
            <div className="text-sm">
              <strong>Environment:</strong> {import.meta.env.DEV ? 'Development' : 'Production'}
            </div>
            <div className="text-sm">
              <strong>Domain:</strong> {window.location.hostname}
            </div>
          </div>
        )}
        
        {configInfo && (
          <div className="text-xs bg-muted p-2 rounded">
            <strong>Configuration:</strong>
            <pre className="whitespace-pre-wrap">{configInfo}</pre>
          </div>
        )}
        
        {error && (
          <div className="text-sm text-destructive">
            <strong>Error:</strong> {error.message}
          </div>
        )}
        
        <div className="space-y-2">
          <Button onClick={testAuthMethod} disabled={!isInitialized || !!error} className="w-full">
            Test Auth Method
          </Button>
          <Button onClick={testGoogleSignIn} disabled={!isInitialized || !!error} className="w-full">
            Test Google Sign-In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 