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
import PeoplePage from "@/pages/executors-page"; // Renamed from ExecutorsPage but file name kept the same
import EstatePage from "@/pages/estate-page";
import DocumentsPage from "@/pages/documents-page";
import DocumentUploadPage from "@/pages/document-upload-page";

import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

// Enhanced router component that handles mobile navigation better
function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const router = useRouter();
  
  // This effect ensures we clean up any hash fragments that might cause issues
  useEffect(() => {
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
