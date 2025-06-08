import { useEffect, useState } from 'react';
import { useFirebase } from '@/providers/FirebaseProvider';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export function AuthTest() {
  const { app, auth, isInitialized, error: firebaseError } = useFirebase();
  const { firebaseUser, user, isAuthenticated, isLoading } = useAuthStore();
  const [domainInfo, setDomainInfo] = useState<{
    currentDomain: string;
    authDomain: string;
    isReplitDomain: boolean;
    hasDomainMismatch: boolean;
  } | null>(null);

  useEffect(() => {
    if (isInitialized && auth) {
      const currentDomain = window.location.hostname;
      const authDomain = auth.app.options.authDomain || '';
      const isReplitDomain = currentDomain.includes('replit.dev') || currentDomain.includes('kirk.replit.dev');
      const hasDomainMismatch = Boolean(authDomain) && currentDomain !== authDomain;

      setDomainInfo({
        currentDomain,
        authDomain,
        isReplitDomain,
        hasDomainMismatch
      });
    }
  }, [isInitialized, auth]);

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean, label: string) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {label}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Authentication System Status
        </CardTitle>
        <CardDescription>
          Real-time status of your authentication system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Firebase Status */}
        <div className="space-y-3">
          <h3 className="font-semibold">Firebase Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center justify-between">
              <span>Initialized:</span>
              {getStatusBadge(isInitialized, isInitialized ? 'Yes' : 'No')}
            </div>
            <div className="flex items-center justify-between">
              <span>App Available:</span>
              {getStatusBadge(!!app, app ? 'Yes' : 'No')}
            </div>
            <div className="flex items-center justify-between">
              <span>Auth Available:</span>
              {getStatusBadge(!!auth, auth ? 'Yes' : 'No')}
            </div>
            <div className="flex items-center justify-between">
              <span>Environment:</span>
              <Badge variant="outline">{import.meta.env.MODE}</Badge>
            </div>
          </div>
        </div>

        {/* Domain Configuration */}
        {domainInfo && (
          <div className="space-y-3">
            <h3 className="font-semibold">Domain Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center justify-between">
                <span>Current Domain:</span>
                <Badge variant="outline">{domainInfo.currentDomain}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Auth Domain:</span>
                <Badge variant="outline">{domainInfo.authDomain || 'Not set'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Is Replit Domain:</span>
                {getStatusBadge(domainInfo.isReplitDomain, domainInfo.isReplitDomain ? 'Yes' : 'No')}
              </div>
              <div className="flex items-center justify-between">
                <span>Domain Mismatch:</span>
                {getStatusBadge(!domainInfo.hasDomainMismatch, domainInfo.hasDomainMismatch ? 'Yes' : 'No')}
              </div>
            </div>
          </div>
        )}

        {/* Authentication Status */}
        <div className="space-y-3">
          <h3 className="font-semibold">Authentication Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center justify-between">
              <span>Loading:</span>
              {getStatusBadge(!isLoading, isLoading ? 'Yes' : 'No')}
            </div>
            <div className="flex items-center justify-between">
              <span>Firebase User:</span>
              {getStatusBadge(!!firebaseUser, firebaseUser ? 'Yes' : 'No')}
            </div>
            <div className="flex items-center justify-between">
              <span>Backend User:</span>
              {getStatusBadge(!!user, user ? 'Yes' : 'No')}
            </div>
            <div className="flex items-center justify-between">
              <span>Authenticated:</span>
              {getStatusBadge(isAuthenticated, isAuthenticated ? 'Yes' : 'No')}
            </div>
          </div>
        </div>

        {/* User Info */}
        {firebaseUser && (
          <div className="space-y-3">
            <h3 className="font-semibold">Firebase User Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Email:</span>
                <span className="font-mono">{firebaseUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Display Name:</span>
                <span className="font-mono">{firebaseUser.displayName || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>UID:</span>
                <span className="font-mono text-xs">{firebaseUser.uid.substring(0, 8)}...</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Email Verified:</span>
                {getStatusBadge(firebaseUser.emailVerified, firebaseUser.emailVerified ? 'Yes' : 'No')}
              </div>
            </div>
          </div>
        )}

        {/* Backend User Info */}
        {user && (
          <div className="space-y-3">
            <h3 className="font-semibold">Backend User Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span>ID:</span>
                <span className="font-mono">{user.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Email:</span>
                <span className="font-mono">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Name:</span>
                <span className="font-mono">{user.firstName} {user.lastName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Firebase UID:</span>
                <span className="font-mono text-xs">{user.firebaseUid?.substring(0, 8)}...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {firebaseError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Firebase Error:</strong> {firebaseError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Domain Mismatch Warning */}
        {domainInfo?.hasDomainMismatch && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Domain Configuration Issue:</strong> You're accessing from {domainInfo.currentDomain} 
              but auth is configured for {domainInfo.authDomain}. This may cause authentication issues.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            size="sm"
          >
            Refresh
          </Button>
          <Button 
            onClick={() => window.location.href = '/auth'} 
            variant="outline"
            size="sm"
          >
            Go to Auth
          </Button>
          <Button 
            onClick={() => window.location.href = '/signup'} 
            variant="outline"
            size="sm"
          >
            Go to Signup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 