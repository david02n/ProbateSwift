import { Switch, Route, Redirect } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

// The landing page is the most common entry point for logged-out visitors, so
// it stays in the main bundle. Everything else is code-split into its own chunk
// and only fetched when the matching route is visited — this keeps the initial
// JS download (and mobile main-thread work) small.
import RelaunchLanding from "@/pages/relaunch-landing";

const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const ClerkCallbackPage = lazy(() => import("@/pages/ClerkCallbackPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const CookiesPage = lazy(() => import("@/pages/CookiesPage"));

// New redesigned pages (authenticated app) — never needed by logged-out visitors.
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const PeoplePage = lazy(() => import("@/pages/people-page"));
const EstatePage = lazy(() => import("@/pages/estate-page"));
const DocumentsPage = lazy(() => import("@/pages/documents-page"));
const DocumentUploadPage = lazy(() => import("@/pages/document-upload-page"));
const DeceasedDetailsPage = lazy(() => import("@/pages/deceased-details-page"));
const EvaluationPage = lazy(() => import("@/pages/evaluation-page"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}

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
    return <PageLoader />;
  }

  // Handle authentication routing
  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/sso-callback" component={ClerkCallbackPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/people" component={PeoplePage} />
        <Route path="/estate" component={EstatePage} />
        <Route path="/documents" component={DocumentsPage} />
        <Route path="/documents/upload" component={DocumentUploadPage} />
        <Route path="/deceased-details/:personId?" component={DeceasedDetailsPage} />
        <Route path="/evaluation" component={EvaluationPage} />
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
    </Suspense>
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
