import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthPage from "@/pages/AuthPage";

import { AppFallback } from "@/components/AppFallback";

// New redesigned pages
import NewDashboardPage from "@/pages/new-dashboard";
import DashboardPage from "@/pages/dashboard-page";
import PeoplePage from "@/pages/people-page";
import EstatePage from "@/pages/estate-page";
import DocumentsPage from "@/pages/documents-page";
import DocumentUploadPage from "@/pages/document-upload-page";
import DeceasedDetailsPage from "@/pages/deceased-details-page";
import EvaluationPage from "@/pages/evaluation-page";

import { useEffect } from "react";
import AuthCallback from '@/pages/AuthCallback';

// Enhanced router component that handles mobile navigation better
function Router() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Clean up URL fragments and handle routing
  useEffect(() => {
    // Clean up any hash fragments
    if (window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle authentication routing
  if (!user) {
    return (
      <Switch>
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/auth" component={AuthPage} />
        <Route>
          <Redirect to="/auth" />
        </Route>
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/new-dashboard" component={NewDashboardPage} />
      <Route path="/people" component={PeoplePage} />
      <Route path="/estate" component={EstatePage} />
      <Route path="/documents" component={DocumentsPage} />
      <Route path="/documents/upload" component={DocumentUploadPage} />
      <Route path="/deceased-details/:personId?" component={DeceasedDetailsPage} />
      <Route path="/evaluation" component={EvaluationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;