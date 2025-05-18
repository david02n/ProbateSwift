import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation, useRoute } from "wouter";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { handleRedirectResult } from "@/lib/googleAuth";

// Extend Window interface to include our shared functions
declare global {
  interface Window {
    sharedAuthFunctions?: {
      setActiveTab: (tab: string) => void;
      loginFormEmail?: string;
    };
  }
}
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { SwiftLogo } from "@/assets/SwiftLogo";

// Login form schema with validation
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Registration form schema with validation
const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Define props for AuthPage for better TypeScript support
interface AuthPageProps {
  tab?: string;
  mobile?: boolean;
}

const AuthPage: React.FC<AuthPageProps> = ({ tab }) => {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Initialize tab from URL parameters or props and detect mobile mode
  useEffect(() => {
    // Get tab from URL if present
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    const mobileParam = searchParams.get('mobile');
    const authReturn = searchParams.get('state') || searchParams.get('authReturn');
    
    // Check mobile status from different sources
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice || mobileParam === 'true');
    
    // Log for debugging
    console.log('Auth page initialized');
    console.log('URL location:', location);
    console.log('Tab from props:', tab);
    console.log('Tab from URL:', tabParam);
    console.log('Mobile detection:', isMobileDevice, isIOS ? '(iOS)' : '');
    console.log('Mobile from URL param:', mobileParam);
    console.log('Auth return parameter:', authReturn);
    
    // Check for redirect results - this is critical for both mobile and production logins
    console.log('Checking for redirect authentication result...');
    
    // Process redirect result - this is the main authentication flow for mobile and production
    (async () => {
      try {
        // For production domains, always check for redirect result
        const isProductionDomain = window.location.hostname.includes('probateswift.com');
        console.log('Authentication Environment:', isProductionDomain ? 'Production' : 'Development/Testing');
        
        // Get the redirect result from Firebase
        const result = await handleRedirectResult();
        
        if (result) {
          console.log('Authentication redirect processed successfully');
          
          // Show success notification
          if (isMobileDevice) {
            // On mobile, use a simpler approach
            alert('Login successful');
          }
          
          // Always use window.location for redirecting after authentication
          // This ensures cookies are properly set before navigation
          console.log('Redirecting to dashboard after successful authentication');
          window.location.href = '/';
        } else {
          console.log('No redirect result found - user may need to log in');
        }
      } catch (error) {
        console.error('Error handling authentication redirect:', error);
        
        // Improved error handling for all platforms
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Authentication redirect error details:', errorMessage);
        
        // Show a user-friendly error on all platforms
        if (isMobileDevice || isIOS) {
          alert('There was a problem with your login. Please try again.');
        }
      }
    })();
    
    // Set tab based on available data
    if (tabParam === 'register' || tabParam === 'login') {
      console.log('Setting tab from URL param:', tabParam);
      setActiveTab(tabParam);
    } else if (tab === 'register' || tab === 'login') {
      console.log('Setting tab from props:', tab);
      setActiveTab(tab);
    }
    
    // Handle hash fragments (common in mobile browsers)
    if (window.location.hash) {
      if (window.location.hash.includes('tab=')) {
        const hashTab = window.location.hash.includes('tab=register') ? 'register' : 'login';
        console.log('Setting tab from hash:', hashTab);
        setActiveTab(hashTab);
      }
      if (window.location.hash.includes('mobile=true')) {
        console.log('Mobile mode from hash detected');
        setIsMobile(true);
      }
    }
    
    // Add meta tags for better mobile handling
    if (isMobileDevice) {
      // For very old browsers
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
      }
    }
  }, [tab, location]);
  
  // Share the setActiveTab function with the parent window for error handling
  window.sharedAuthFunctions = {
    setActiveTab
  };

  // Login form setup
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form setup
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  // Handle login submission with special mobile handling
  const onLoginSubmit = (values: LoginFormValues) => {
    // Save email in shared window object to aid in potential login retries
    if (window.sharedAuthFunctions) {
      window.sharedAuthFunctions.loginFormEmail = values.email;
    }
    
    // Log for debugging mobile issues
    if (isMobile) {
      console.log('Mobile login submission with special handling');
    }
    
    loginMutation.mutate(values, {
      onSuccess: (data) => {
        console.log('Login successful');
        // For mobile devices, use direct navigation for more reliable redirect
        if (isMobile) {
          console.log('Using direct navigation for mobile login success');
          // Small delay to allow cookies to be set
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        }
      },
      onError: (error) => {
        console.error('Login error:', error);
        // For mobile, show clear error and provide guidance
        if (isMobile) {
          alert('Login failed. Please check your credentials and try again.');
        }
      }
    });
  };

  // Handle register submission with special mobile handling
  const onRegisterSubmit = (values: RegisterFormValues) => {
    // Get assessment data from localStorage if available
    const savedResult = localStorage.getItem('probate_assessment_result');
    const savedAnswers = localStorage.getItem('probate_assessment_answers');
    
    // Add metadata to track that the user came from an assessment
    const userRegisterData = {
      ...values,
      assessment: savedResult ? {
        result: JSON.parse(savedResult),
        answers: savedAnswers ? JSON.parse(savedAnswers) : {},
      } : undefined
    };
    
    // Log for debugging mobile issues
    if (isMobile) {
      console.log('Mobile registration submission with special handling');
    }
    
    registerMutation.mutate(userRegisterData, {
      onSuccess: (data) => {
        console.log('Registration successful');
        // For mobile devices, use direct navigation for more reliable redirect
        if (isMobile) {
          console.log('Using direct navigation for mobile registration success');
          // Small delay to allow cookies to be set
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        }
      },
      onError: (error) => {
        console.error('Registration error:', error);
        // For mobile, show clear error and provide guidance
        if (isMobile) {
          alert('Registration failed. The email might already be in use or there was a server error.');
        }
      }
    });
  };

  // Enhanced redirect handling for mobile and desktop browsers
  useEffect(() => {
    // If user is authenticated, redirect programmatically
    // This is more reliable on mobile browsers
    if (user && !isLoading) {
      console.log('User is authenticated, redirecting to dashboard');
      
      // Use window.location for more reliable mobile redirects
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        console.log('Mobile browser detected, using window.location');
        window.location.href = '/';
      }
      // Otherwise let Wouter handle it via the return
    }
  }, [user, isLoading]);
  
  // Redirect if already logged in (will be used if useEffect redirect doesn't trigger)
  if (user) {
    console.log('Redirecting with Wouter');
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-soft-grey to-white">
      <div className="text-xs text-gray-400 absolute bottom-1 right-2">v1.0.10-May18-2330</div>
      <div className="flex flex-col md:flex-row w-full">
        {/* Authentication Form Column */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex items-center justify-center">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="space-y-1 flex flex-col items-center">
              <SwiftLogo className="h-12 w-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-center">Welcome to ProbateSwift</CardTitle>
              <CardDescription className="text-center">
                Enter your details to continue with probate
              </CardDescription>
            </CardHeader>

            <Tabs
              defaultValue="login"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                    <CardContent className="space-y-4 pt-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your email"
                                type="email"
                                autoComplete="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your password"
                                type="password"
                                autoComplete="current-password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ArrowRight className="h-4 w-4 mr-2" />
                        )}
                        Login
                      </Button>
                      
                      <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                          </span>
                        </div>
                      </div>
                      
                      <GoogleLoginButton 
                        className="w-full" 
                      />
                    </CardFooter>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="First name"
                                  autoComplete="given-name"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Last name"
                                  autoComplete="family-name"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your email"
                                type="email"
                                autoComplete="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Create a password"
                                type="password"
                                autoComplete="new-password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ArrowRight className="h-4 w-4 mr-2" />
                        )}
                        Create Account
                      </Button>
                      
                      <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                          </span>
                        </div>
                      </div>
                      
                      <GoogleLoginButton 
                        className="w-full" 
                      />
                    </CardFooter>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Hero/Information Column */}
        <div className="hidden md:flex md:w-1/2 bg-primary text-white p-12 flex-col justify-center">
          <div className="max-w-xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Simplify Your Probate Journey</h1>
            <p className="text-lg mb-8">
              ProbateSwift helps you navigate the probate process with ease, providing step-by-step guidance
              tailored to your specific situation.
            </p>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-start">
                <div className="bg-white/10 p-3 rounded-full mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Secure & Confidential</h3>
                  <p className="text-white/80">
                    Your information is encrypted and protected throughout the process
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-white/10 p-3 rounded-full mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Fast & Efficient</h3>
                  <p className="text-white/80">
                    Save time with our streamlined process and intelligent guidance
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-white/10 p-3 rounded-full mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
                  <p className="text-white/80">
                    Get assistance whenever you need it with our AI-powered chat support
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;