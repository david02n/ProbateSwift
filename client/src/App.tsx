import { Switch, Route, Redirect, useLocation, useRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthPage from "@/pages/auth-page";

// New redesigned pages
import NewDashboardPage from "@/pages/new-dashboard";
import PeoplePage from "@/pages/people-page";
import EstatePage from "@/pages/estate-page";
import DocumentsPage from "@/pages/documents-page";
import DocumentUploadPage from "@/pages/document-upload-page";
import DeceasedDetailsPage from "@/pages/deceased-details-page";

import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

// Enhanced router component that handles mobile navigation better
function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const router = useRouter();
  
  // This effect ensures we clean up any hash fragments that might cause issues
  // and initializes Firebase token refreshing for cross-domain auth
  useEffect(() => {
    // DIRECT FIX: Override fetch to always include Firebase token
    const originalFetch = window.fetch;
    window.fetch = async function(resource, options = {}) {
      if (typeof resource === 'string' && resource.includes('/api/')) {
        console.log(`DIRECT TOKEN FIX: Adding token to ${resource}`);
        try {
          // Try to get token directly from Firebase
          const firebaseModule = await import('./lib/firebase');
          const auth = firebaseModule.auth;
          const user = auth.currentUser;
          
          if (user) {
            console.log(`DIRECT TOKEN FIX: User logged in as ${user.email}`);
            const token = await user.getIdToken(true);
            
            // Initialize headers if they don't exist
            options.headers = options.headers || {};
            
            // Add token to headers
            options.headers = {
              ...options.headers,
              'Authorization': `Bearer ${token}`
            };
            
            console.log('DIRECT TOKEN FIX: Added Authorization header with Bearer token');
          } else {
            console.log('DIRECT TOKEN FIX: No user logged in, skipping token');
          }
        } catch (e) {
          console.error('DIRECT TOKEN FIX: Error adding token', e);
        }
      }
      
      return originalFetch.call(this, resource, options);
    };
    console.log('DIRECT TOKEN FIX: Installed fetch interceptor v1.0.13-2355');
    
    // Still initialize Firebase normally
    import('./lib/firebase').then(async module => {
      try {
        // Wait for auth initialization before refreshing tokens
        await module.waitForAuthInit();
        console.log('Firebase Auth initialization complete');
        
        // Then set up token refresh mechanism
        if (typeof module.initTokenRefresh === 'function') {
          module.initTokenRefresh();
          console.log('Initialized Firebase token refresh mechanism');
        }
      } catch (err) {
        console.error('Firebase Auth initialization error:', err);
      }
    }).catch(err => {
      console.error('Failed to load Firebase module:', err);
    });
    
    // Remove hash from URL if present (can cause issues on some mobile browsers)
    if (window.location.hash && window.location.hash !== '#/') {
      console.log('Removing hash fragment:', window.location.hash);
      window.history.replaceState(
        null, 
        document.title, 
        window.location.pathname + window.location.search
      );
    }
    
    // Log navigation for debugging
    console.log('Current path:', location);
    console.log('User authenticated:', !!user);
    
    // Handle special case for root path on mobile
    if (location === '/' && window.innerWidth < 768) {
      console.log('Mobile device detected at root path');
    }
  }, [location, user]);
  
  // Show loading spinner while auth check is in progress
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not authenticated, only show public routes
  if (!user) {
    // Render public routes with more specific route definitions
    return (
      <Switch>
        <Route path="/auth">
          <AuthPage />
        </Route>
        <Route path="/auth/:tab">
          {(params) => <AuthPage tab={params.tab} />}
        </Route>
        <Route path="/" component={Home} />
        <Route path="*" component={NotFound} />
      </Switch>
    );
  }
  
  // If authenticated, show protected routes with more specific route definitions
  return (
    <Switch>
      <Route path="/auth">
        <Redirect to="/" />
      </Route>
      <Route path="/auth/:tab">
        <Redirect to="/" />
      </Route>
      <Route path="/" component={NewDashboardPage} />
      <Route path="/people" component={PeoplePage} />
      <Route path="/people/:personId/deceased-details" component={DeceasedDetailsPage} />
      <Route path="/estate" component={EstatePage} />
      <Route path="/documents" component={DocumentsPage} />
      <Route path="/documents/upload" component={DocumentUploadPage} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
