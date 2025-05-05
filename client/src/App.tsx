import { Switch, Route, Redirect } from "wouter";
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
import ExecutorsPage from "@/pages/executors-page";
import EstatePage from "@/pages/estate-page";
import DocumentsPage from "@/pages/documents-page";
import DocumentUploadPage from "@/pages/document-upload-page";

import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { user, isLoading } = useAuth();
  
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
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  // If authenticated, only show protected routes (including redirect from auth page)
  return (
    <Switch>
      <Route path="/auth">
        <Redirect to="/" />
      </Route>
      <Route path="/" component={NewDashboardPage} />
      <Route path="/executors" component={ExecutorsPage} />
      <Route path="/estate" component={EstatePage} />
      <Route path="/document-upload" component={DocumentUploadPage} />
      <Route path="/documents" component={DocumentsPage} />
      <Route component={NotFound} />
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
