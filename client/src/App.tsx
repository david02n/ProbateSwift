import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";

// New redesigned pages
import NewDashboardPage from "@/pages/new-dashboard";
import ExecutorsPage from "@/pages/executors-page";
import EstatePage from "@/pages/estate-page";
import DocumentsPage from "@/pages/documents-page";

import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

function Router() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Redirect authenticated users if they visit the auth page
  useEffect(() => {
    if (user && location === "/auth") {
      setLocation("/"); // Redirect to new dashboard
    }
  }, [user, location, setLocation]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes */}
      <ProtectedRoute path="/" component={NewDashboardPage} />
      <ProtectedRoute path="/executors" component={ExecutorsPage} />
      <ProtectedRoute path="/estate" component={EstatePage} />
      <ProtectedRoute path="/documents" component={DocumentsPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} /> {/* Legacy route */}
      
      {/* Home page for non-authenticated users - placed after protected routes to not interfere */}
      {!user && <Route path="/" component={Home} />}
      
      {/* 404 page */}
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
