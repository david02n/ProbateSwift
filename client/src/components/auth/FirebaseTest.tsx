import { useEffect, useState } from 'react';
import { useFirebase } from '@/providers/FirebaseProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function FirebaseTest() {
  const { app, auth, isInitialized, error } = useFirebase();
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    if (isInitialized) {
      if (error) {
        setTestResult(`❌ Firebase Error: ${error.message}`);
      } else if (app && auth) {
        setTestResult('✅ Firebase initialized successfully');
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
          </div>
        )}
        
        {error && (
          <div className="text-sm text-destructive">
            <strong>Error:</strong> {error.message}
          </div>
        )}
        
        <Button onClick={testAuthMethod} disabled={!isInitialized || !!error}>
          Test Auth Method
        </Button>
      </CardContent>
    </Card>
  );
} 