import { useEffect, useState } from 'react';
import { useFirebase } from '@/providers/FirebaseProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signInWithPopup, GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';

export function FirebaseTest() {
  const { app, auth, isInitialized, error } = useFirebase();
  const [testResult, setTestResult] = useState<string>('');
  const [configInfo, setConfigInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      // Try popup first
      await signInWithPopup(auth, provider);
      // If successful, you can handle the result here or in an auth state listener
    } catch (error: any) {
      // If popup fails for any reason, fall back to redirect
      console.warn('Popup failed, falling back to redirect:', error);
      await signInWithRedirect(auth, provider);
    } finally {
      setIsLoading(false);
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
          <Button onClick={handleGoogleSignIn} disabled={!isInitialized || !!error} className="w-full">
            Test Google Sign-In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 