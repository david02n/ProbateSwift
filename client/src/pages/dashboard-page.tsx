import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  FileText,
  HelpCircle,
  LogOut,
  User,
  Home,
  MessageSquare,
  Upload,
  Trophy
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { peekBrowserSessionId } from "@/lib/browserSession";
import { ProbateCase } from "@shared/schema";
import { EvaluationFlow } from "@/components/evaluation/EvaluationFlow";
import { MilestoneProgress } from "@/components/milestones/MilestoneProgress";

const DashboardPage: React.FC = () => {
  const { user, logoutMutation } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");

  // Fetch probate cases
  const {
    data: probateCases = [],
    isLoading: isLoadingCases
  } = useQuery<ProbateCase[]>({
    queryKey: ["/api/probate-cases"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const currentCase = probateCases[0] ?? null;

  // On first authenticated visit, bootstrap a draft case and claim the
  // anonymous landing-assessment intake onto it (PS-1 claim-once flow). The
  // ref guards against a double-create before the cases query refetches.
  const queryClient = useQueryClient();
  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (isLoadingCases || probateCases.length > 0 || bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    (async () => {
      const res = await apiRequest("POST", "/api/probate-cases", { status: "draft" });
      const created = await res.json();
      await apiRequest("POST", "/api/intake/claim", {
        caseId: created.id,
        browserSessionId: peekBrowserSessionId(),
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/probate-cases"] });
    })().catch(() => {
      bootstrappedRef.current = false; // allow a retry on next render if it failed
    });
  }, [isLoadingCases, probateCases.length, queryClient]);

  // Fetch milestone progress — re-runs whenever evaluation is saved
  const {
    data: progress,
    refetch: refetchProgress,
  } = useQuery<{
    completedSections: string[];
    counts: { people: number; assets: number; liabilities: number; documents: number };
    evaluationStarted: boolean;
    evaluationFlags: Record<string, any> | null;
  }>({
    queryKey: ["/api/probate-cases", currentCase?.id, "progress"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!currentCase,
  });

  const completedSections = progress?.completedSections ?? [];
  // The case's intake-derived flags (replaces the former /api/assessment record).
  const flags = progress?.evaluationFlags ?? null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-soft-grey py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {(user as any)?.firstName || "User"}
            </h1>
            <p className="text-charcoal/70">
              Continue your probate journey with ProbateSwift
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="chat">Help & Chat</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Assessment Status Card */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Assessment Status</CardTitle>
                  <CardDescription>
                    Your probate assessment information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {flags ? (
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center mr-3 bg-amber text-white">
                            <FileText className="h-4 w-4" />
                          </div>
                          <h3 className="text-lg font-semibold">Your Probate Path</h3>
                        </div>
                        <div className="ml-11">
                          <p className="text-sm text-charcoal/70 mb-2">
                            {flags.probate_type === "grant_of_probate"
                              ? "You will need to apply for a Grant of Probate"
                              : "You will need to apply for Letters of Administration"}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {flags.has_will && (
                              <span className="px-2 py-1 bg-lavender/20 text-charcoal rounded text-xs">
                                Will Exists
                              </span>
                            )}
                            {flags.needs_specialist_advice && (
                              <span className="px-2 py-1 bg-amber/20 text-amber rounded text-xs">
                                Specialist Advice Suggested
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => setActiveTab("tasks")}
                      >
                        View Probate Tasks
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <HelpCircle className="h-12 w-12 text-mid-grey mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Evaluation Yet</h3>
                      <p className="text-charcoal/70 mb-4">
                        Complete your evaluation to determine your probate path and next steps
                      </p>
                      <Button
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => setActiveTab("evaluation")}
                      >
                        Start Evaluation
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Profile Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>Account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-4">
                      <User className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">
                        {(user as any)?.firstName && (user as any)?.lastName
                          ? `${(user as any).firstName} ${(user as any).lastName}`
                          : "User Profile"}
                      </h3>
                      <p className="text-charcoal/70">{(user as any)?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-muted">
                      <span className="text-charcoal/70">Email</span>
                      <span className="font-medium">{(user as any)?.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-muted">
                      <span className="text-charcoal/70">Account Created</span>
                      <span className="font-medium">
                        {(user as any)?.createdAt
                          ? new Date((user as any).createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-charcoal/70">Last Login</span>
                      <span className="font-medium">
                        {(user as any)?.lastLogin
                          ? new Date((user as any).lastLogin).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Document Upload Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Upload Documents</CardTitle>
                  <CardDescription>
                    Add important files related to your probate application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center mb-6 bg-muted/10 hover:bg-muted/20 transition cursor-pointer">
                    <Upload className="h-12 w-12 text-primary/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Drag & Drop Files</h3>
                    <p className="text-charcoal/70 mb-4 max-w-md mx-auto">
                      Upload PDFs, images, or document files (max 10MB)
                    </p>
                    <input type="file" className="hidden" id="document-upload" multiple />
                    <Button className="bg-primary hover:bg-primary/90" onClick={() => document.getElementById('document-upload')?.click()}>
                      Browse Files
                    </Button>
                  </div>
                  
                  {/* Document Categories */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Document Categories</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center mb-2">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary mr-3">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">Identification</h4>
                            <p className="text-xs text-charcoal/70">ID, passport, etc.</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">Upload</Button>
                      </div>
                      
                      <div className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center mb-2">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary mr-3">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">Death Certificate</h4>
                            <p className="text-xs text-charcoal/70">Official certificate</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">Upload</Button>
                      </div>
                      
                      <div className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center mb-2">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary mr-3">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">Will & Codicils</h4>
                            <p className="text-xs text-charcoal/70">Original Will</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">Upload</Button>
                      </div>
                      
                      <div className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center mb-2">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary mr-3">
                            <Home className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">Property Valuations</h4>
                            <p className="text-xs text-charcoal/70">Home, land, etc.</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">Upload</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Document List Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Documents</CardTitle>
                  <CardDescription>
                    Recently uploaded files
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-mid-grey/50 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Documents Yet</h3>
                      <p className="text-charcoal/70 text-sm mb-4 max-w-md mx-auto">
                        Documents you upload will appear here
                      </p>
                    </div>
                    
                    {/* Sample of how documents would appear */}
                    <div className="hidden">
                      <div className="border-b pb-3 mb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary mr-3">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">death_cert.pdf</h4>
                              <p className="text-xs text-charcoal/70">Death Certificate • 2.4 MB</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            {isLoadingCases ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : currentCase ? (
              <MilestoneProgress
                completedSections={completedSections}
                evaluationFlags={progress?.evaluationFlags}
                onStartEvaluation={() => setActiveTab("evaluation")}
                onNavigateToTab={setActiveTab}
              />
            ) : (
              <Card>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Trophy className="h-12 w-12 text-mid-grey mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Active Case Yet</h3>
                    <p className="text-charcoal/70 mb-4 max-w-md mx-auto">
                      Your progress milestones will appear here once a probate case is created.
                    </p>
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => setActiveTab("evaluation")}
                    >
                      Start Evaluation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Chat & Support Tab */}
          <TabsContent value="chat">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Chat Component */}
              <Card className="col-span-2">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                    Chat Support
                  </CardTitle>
                  <CardDescription>
                    Speak with our probate advisors
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Chat Messages Area */}
                  <div className="h-[400px] overflow-y-auto p-4 bg-muted/30">
                    {/* System Welcome Message */}
                    <div className="flex items-start mb-4">
                      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-3 shrink-0">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm max-w-[80%]">
                        <p className="text-sm font-medium mb-1">ProbateSwift Support</p>
                        <p className="text-sm">Welcome to ProbateSwift! How can I assist you with your probate application today?</p>
                        <span className="text-xs text-charcoal/50 mt-1 block">
                          {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                    
                    {/* Sample User Message */}
                    <div className="flex items-start mb-4 justify-end">
                      <div className="bg-primary/10 p-3 rounded-lg shadow-sm max-w-[80%]">
                        <p className="text-sm">I need help understanding what documents I need for probate.</p>
                        <span className="text-xs text-charcoal/50 mt-1 block">
                          {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-teal text-white flex items-center justify-center ml-3 shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                    
                    {/* Sample Response */}
                    <div className="flex items-start mb-4">
                      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-3 shrink-0">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm max-w-[80%]">
                        <p className="text-sm font-medium mb-1">ProbateSwift Support</p>
                        <p className="text-sm">
                          For probate applications in England and Wales, you'll typically need:
                          <br/><br/>
                          1. Death certificate<br/>
                          2. The original will (if one exists)<br/>
                          3. Completed probate application form<br/>
                          4. Property and asset valuations<br/>
                          5. Details of any debts
                          <br/><br/>
                          You can upload these documents in the "Documents" tab. If you need specific guidance for your situation, I recommend checking the timeline in your "Tasks" tab.
                        </p>
                        <span className="text-xs text-charcoal/50 mt-1 block">
                          {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat Input Area */}
                  <div className="p-4 border-t">
                    <div className="flex items-center">
                      <input 
                        type="text" 
                        placeholder="Type your message here..." 
                        className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <Button className="rounded-l-none bg-primary hover:bg-primary/90">
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Help Resources */}
              <Card>
                <CardHeader>
                  <CardTitle>Help Resources</CardTitle>
                  <CardDescription>Useful guides and FAQs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h4 className="font-medium mb-1 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        Probate Glossary
                      </h4>
                      <p className="text-sm text-charcoal/70">
                        Key terms explained in simple language
                      </p>
                      <Button variant="link" className="p-0 h-auto mt-1 text-primary">View Guide</Button>
                    </div>
                    
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h4 className="font-medium mb-1 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        Document Checklist
                      </h4>
                      <p className="text-sm text-charcoal/70">
                        Complete list of required paperwork
                      </p>
                      <Button variant="link" className="p-0 h-auto mt-1 text-primary">Download PDF</Button>
                    </div>
                    
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h4 className="font-medium mb-1 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        Probate Timeline
                      </h4>
                      <p className="text-sm text-charcoal/70">
                        Understand each step of the process
                      </p>
                      <Button variant="link" className="p-0 h-auto mt-1 text-primary">View Guide</Button>
                    </div>
                    
                    <Button className="w-full mt-4" variant="outline">
                      View All Resources
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="evaluation">
            <div className="space-y-6">
              {probateCases && probateCases.length > 0 ? (
                <EvaluationFlow
                  caseId={probateCases[0].id}
                  onComplete={(_flags) => {
                    refetchProgress();
                  }}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Probate Evaluation</CardTitle>
                    <CardDescription>
                      Complete your detailed probate assessment to determine requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Create a Probate Case First</h3>
                      <p className="text-muted-foreground mb-4">
                        You need to create a probate case before starting the detailed evaluation.
                      </p>
                      <Button onClick={() => window.location.href = "/dashboard"}>
                        Go to Overview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <User className="h-12 w-12 text-mid-grey mb-4" />
                  <h3 className="text-lg font-medium mb-2">Profile Settings</h3>
                  <p className="text-charcoal/70 mb-4 max-w-md mx-auto">
                    Profile settings will be available soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;