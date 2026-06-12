import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import RelaunchLanding from "@/pages/relaunch-landing";
import AuthPage from "@/pages/AuthPage";
import ClerkCallbackPage from "@/pages/ClerkCallbackPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import CookiesPage from "@/pages/CookiesPage";

// The dashboard is the single canonical authenticated surface. The former
// standalone pages (people/estate/documents/evaluation/deceased-details) are
// legacy: orphaned, on an older design system, and superseded by dashboard
// tabs. Their routes redirect to /dashboard; the files are retained for
// salvage as estate/people management is folded into the dashboard (Phase B).
import DashboardPage from "@/pages/dashboard-page";

import { useEffect } from "react";

// Enhanced router component that handles mobile navigation better
function Router() {
  const { user, isLoading } = useAuth();

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
        <Route path="/sso-callback" component={ClerkCallbackPage} />
        <Route path="/auth/*" component={AuthPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/cookies" component={CookiesPage} />
        <Route path="/" component={RelaunchLanding} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/sso-callback" component={ClerkCallbackPage} />
      <Route path="/dashboard" component={DashboardPage} />
      {/* Legacy routes → consolidated into the dashboard */}
      <Route path="/people"><Redirect to="/dashboard" /></Route>
      <Route path="/estate"><Redirect to="/dashboard" /></Route>
      <Route path="/documents"><Redirect to="/dashboard" /></Route>
      <Route path="/documents/upload"><Redirect to="/dashboard" /></Route>
      <Route path="/deceased-details/:personId?"><Redirect to="/dashboard" /></Route>
      <Route path="/evaluation"><Redirect to="/dashboard" /></Route>
      <Route path="/auth/*">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/auth">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/cookies" component={CookiesPage} />
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
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
