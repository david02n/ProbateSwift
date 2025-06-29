import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  Check, 
  FileText, 
  HelpCircle, 
  LogOut, 
  User,
  Home,
  PoundSterling,
  Send,
  MessageSquare,
  Upload,
  Trophy
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { AssessmentResult, Executor, EvaluationResponse, ProbateCase } from "@shared/schema";
import { EvaluationFlow } from "@/components/evaluation/EvaluationFlow";
import { MilestoneProgress } from "@/components/milestones/MilestoneProgress";
import { getUnlockedTabs } from "@shared/milestone-config";

// Component for the deceased form milestone with dynamic completion status
const DeceasedFormMilestone: React.FC = () => {
  // Fetch the list of executors to find the deceased person
  const { data: executors = [] } = useQuery<Executor[]>({
    queryKey: ["/api/executors"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Find the deceased person in the executors list
  const deceasedPerson = executors.find(exec => 
    exec.relationshipToDeceased === 'Deceased'
  );
  
  // If no deceased person is found, show a default state
  if (!deceasedPerson) {
    return (
      <div className="mb-8 relative">
        <div className="absolute -left-12 top-0 h-6 w-6 rounded-full bg-mid-grey flex items-center justify-center border-4 border-white">
          <FileText className="h-3 w-3 text-white" />
        </div>
        <div className="bg-muted p-4 rounded-lg border border-mid-grey/10">
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center">
              <span>Complete Deceased Person's Legal Questionnaire</span>
              <span className="ml-2 text-xs py-0.5 px-2 bg-mid-grey/10 text-mid-grey rounded-full">Not Started</span>
            </h3>
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => {
                  window.location.href = '/people';
                }}
              >
                Add Deceased
              </Button>
            </div>
          </div>
          <p className="text-sm text-charcoal/70 mt-2">
            Provide all required deceased-specific information including marital status, foreign assets, and legal history.
          </p>
        </div>
      </div>
    );
  }
  
  // Query the deceased form completion status
  const { data: completionData, isLoading } = useQuery({
    queryKey: [`/api/deceased-form-fields/${deceasedPerson.id}/complete`],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  const isComplete = (completionData as any)?.complete || false;
  
  return (
    <div className="mb-8 relative">
      <div className="absolute -left-12 top-0 h-6 w-6 rounded-full bg-amber flex items-center justify-center border-4 border-white">
        {isComplete ? (
          <Check className="h-3 w-3 text-white" />
        ) : (
          <FileText className="h-3 w-3 text-white" />
        )}
      </div>
      <div className={`p-4 rounded-lg border ${
        isComplete ? 'bg-success/5 border-success/20' : 'bg-amber/5 border-amber/20'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center">
            <span>Complete Deceased Person's Legal Questionnaire</span>
            <span className={`ml-2 text-xs py-0.5 px-2 rounded-full ${
              isComplete ? 'bg-success/10 text-success' : 'bg-amber/10 text-amber'
            }`}>
              {isComplete ? 'Complete' : 'Pending'}
            </span>
          </h3>
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs bg-white"
              onClick={() => {
                window.location.href = `/people/${deceasedPerson.id}/deceased-details`;
              }}
            >
              {isComplete ? 'Review' : 'Complete Now'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-charcoal/70 mt-2">
          {isComplete 
            ? `All deceased-specific information has been completed for ${deceasedPerson.firstName} ${deceasedPerson.lastName}.`
            : 'Provide all required deceased-specific information including marital status, foreign assets, and legal history.'}
        </p>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user, logoutMutation } = useAuth();
  
  // Fetch the user's assessment results
  const { 
    data: assessmentResult,
    isLoading: isLoadingAssessment 
  } = useQuery<AssessmentResult | null>({
    queryKey: ["/api/assessment"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Fetch probate cases
  const {
    data: probateCases = [],
    isLoading: isLoadingCases
  } = useQuery<ProbateCase[]>({
    queryKey: ["/api/probate-cases"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const handleLogout = () => {
    // Simple logout redirect for development
    window.location.href = '/auth';
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

        <Tabs defaultValue="overview" className="w-full">
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
                  {isLoadingAssessment ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : assessmentResult ? (
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                            assessmentResult.isProbateRequired ? 'bg-amber text-white' : 'bg-success text-white'
                          }`}>
                            {assessmentResult.isProbateRequired ? <FileText className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </div>
                          <h3 className="text-lg font-semibold">
                            {assessmentResult.isProbateRequired
                              ? "Probate Required"
                              : "Probate May Not Be Required"}
                          </h3>
                        </div>
                        {assessmentResult.isProbateRequired && (
                          <div className="ml-11">
                            <p className="text-sm text-charcoal/70 mb-2">
                              {assessmentResult.probateType === "grant_of_probate"
                                ? "You will need to apply for a Grant of Probate"
                                : "You will need to apply for Letters of Administration"}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {assessmentResult.hasWill && (
                                <span className="px-2 py-1 bg-lavender/20 text-charcoal rounded text-xs">
                                  Will Exists
                                </span>
                              )}
                              {assessmentResult.isInsolvent && (
                                <span className="px-2 py-1 bg-error/20 text-error rounded text-xs">
                                  Insolvent Estate
                                </span>
                              )}
                              {assessmentResult.hasDispute && (
                                <span className="px-2 py-1 bg-amber/20 text-amber rounded text-xs">
                                  Dispute Present
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => {
                          document.querySelector('[value="tasks"]')?.dispatchEvent(
                            new MouseEvent('click', { bubbles: true })
                          );
                        }}
                      >
                        View Probate Tasks
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <HelpCircle className="h-12 w-12 text-mid-grey mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Assessment Found</h3>
                      <p className="text-charcoal/70 mb-4">
                        Complete our assessment to determine if probate is required for your situation
                      </p>
                      <Button 
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => {
                          // First attempt: redirect to home and trigger the assessment section
                          window.location.href = "/#assessment";
                          
                          // Add a fallback in case the direct link doesn't work
                          setTimeout(() => {
                            // Try to find and click on the assessment section link
                            const assessmentLink = document.querySelector('a[href="#assessment"]');
                            if (assessmentLink) {
                              (assessmentLink as HTMLElement).click();
                            }
                          }, 500);
                        }}
                      >
                        Start Assessment
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
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : "User Profile"}
                      </h3>
                      <p className="text-charcoal/70">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-muted">
                      <span className="text-charcoal/70">Email</span>
                      <span className="font-medium">{user?.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-muted">
                      <span className="text-charcoal/70">Account Created</span>
                      <span className="font-medium">
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-charcoal/70">Last Login</span>
                      <span className="font-medium">
                        {user?.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString()
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
            <Card>
              <CardHeader>
                <CardTitle>Your Tasks</CardTitle>
                <CardDescription>
                  Track your progress through the probate process
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAssessment ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : assessmentResult && assessmentResult.isProbateRequired ? (
                  <div className="space-y-4">
                    <div className="text-sm text-charcoal/70 mb-4">
                      Complete these milestones to progress with your probate application
                    </div>
                    
                    {/* Milestones Timeline */}
                    <div className="relative border-l-2 border-primary/10 ml-4 pl-8 pb-4">
                      
                      {/* Initial Assessment Milestone */}
                      <div className="mb-8 relative">
                        {/* Timeline circle indicator */}
                        <div className="absolute -left-12 top-0 h-6 w-6 rounded-full bg-success flex items-center justify-center border-4 border-white">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        {/* Content */}
                        <div className="bg-success/5 p-4 rounded-lg border border-success/20">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium flex items-center">
                              <span>Probate Assessment</span>
                              <span className="ml-2 text-xs py-0.5 px-2 bg-success/10 text-success rounded-full">Complete</span>
                            </h3>
                            <div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs"
                                onClick={() => window.location.href = "/#assessment"}
                              >
                                Review
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-charcoal/70 mt-2">
                            You've completed your initial assessment. Based on your answers, probate is required.
                          </p>
                        </div>
                      </div>
                      
                      {/* Executor Information Milestone */}
                      <div className="mb-8 relative">
                        <div className="absolute -left-12 top-0 h-6 w-6 rounded-full bg-amber flex items-center justify-center border-4 border-white">
                          <FileText className="h-3 w-3 text-white" />
                        </div>
                        <div className="bg-amber/5 p-4 rounded-lg border border-amber/20">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium flex items-center">
                              <span>Enter Executor Info</span>
                              <span className="ml-2 text-xs py-0.5 px-2 bg-amber/10 text-amber rounded-full">Pending</span>
                            </h3>
                            <div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs bg-white"
                              >
                                Start
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-charcoal/70 mt-2">
                            Provide executor details including contact information and relationship to the deceased.
                          </p>
                        </div>
                      </div>
                      
                      {/* Death Certificate Milestone */}
                      <div className="mb-8 relative">
                        <div className="absolute -left-12 top-0 h-6 w-6 rounded-full bg-mid-grey flex items-center justify-center border-4 border-white">
                          <FileText className="h-3 w-3 text-white" />
                        </div>
                        <div className="bg-muted p-4 rounded-lg border border-mid-grey/10">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium flex items-center">
                              <span>Upload Death Certificate</span>
                              <span className="ml-2 text-xs py-0.5 px-2 bg-mid-grey/10 text-mid-grey rounded-full">Not Started</span>
                            </h3>
                            <div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs"
                                disabled
                              >
                                Upload
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-charcoal/70 mt-2">
                            Upload an official death certificate. This is required for the probate application.
                          </p>
                        </div>
                      </div>
                      
                      {/* Deceased Questionnaire Milestone */}
                      <DeceasedFormMilestone />
                      
                      
                      {/* Will Upload Milestone - Conditional */}
                      {assessmentResult.hasWill && (
                        <div className="mb-8 relative">
                          <div className="absolute -left-12 top-0 h-6 w-6 rounded-full bg-mid-grey flex items-center justify-center border-4 border-white">
                            <FileText className="h-3 w-3 text-white" />
                          </div>
                          <div className="bg-muted p-4 rounded-lg border border-mid-grey/10">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium flex items-center">
                                <span>Upload Will</span>
                                <span className="ml-2 text-xs py-0.5 px-2 bg-mid-grey/10 text-mid-grey rounded-full">Not Started</span>
                              </h3>
                              <div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-xs"
                                  disabled
                                >
                                  Upload
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-charcoal/70 mt-2">
                              Upload the original will and any codicils. This must be the official signed version.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Property Valuation */}
                      <div className="mb-8 relative">
                        <div className="absolute -left-12 top-0 h-6 w-6 rounded-full bg-mid-grey flex items-center justify-center border-4 border-white">
                          <Home className="h-3 w-3 text-white" />
                        </div>
                        <div className="bg-muted p-4 rounded-lg border border-mid-grey/10">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium flex items-center">
                              <span>Property Valuation</span>
                              <span className="ml-2 text-xs py-0.5 px-2 bg-mid-grey/10 text-mid-grey rounded-full">Not Started</span>
                            </h3>
                            <div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs"
                                disabled
                              >
                                Start
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-charcoal/70 mt-2">
                            Enter details and value of any property owned by the deceased.
                          </p>
                        </div>
                      </div>
                      
                      {/* Financial Accounts */}
                      <div className="mb-8 relative">
                        <div className="absolute -left-12 top-0 h-6 w-6 rounded-full bg-mid-grey flex items-center justify-center border-4 border-white">
                          <PoundSterling className="h-3 w-3 text-white" />
                        </div>
                        <div className="bg-muted p-4 rounded-lg border border-mid-grey/10">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium flex items-center">
                              <span>Financial Accounts</span>
                              <span className="ml-2 text-xs py-0.5 px-2 bg-mid-grey/10 text-mid-grey rounded-full">Not Started</span>
                            </h3>
                            <div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs"
                                disabled
                              >
                                Start
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-charcoal/70 mt-2">
                            Enter details of bank accounts, savings, and investments owned by the deceased.
                          </p>
                        </div>
                      </div>
                      
                      {/* Submit Application */}
                      <div className="relative">
                        <div className="absolute -left-12 top-0 h-6 w-6 rounded-full bg-mid-grey flex items-center justify-center border-4 border-white">
                          <Send className="h-3 w-3 text-white" />
                        </div>
                        <div className="bg-muted p-4 rounded-lg border border-mid-grey/10">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium flex items-center">
                              <span>Submit Application</span>
                              <span className="ml-2 text-xs py-0.5 px-2 bg-mid-grey/10 text-mid-grey rounded-full">Locked</span>
                            </h3>
                            <div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs"
                                disabled
                              >
                                Submit
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-charcoal/70 mt-2">
                            Complete all previous tasks before submitting your probate application.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 text-sm text-center text-charcoal/70">
                      Complete all required tasks to submit your probate application
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Check className="h-12 w-12 text-mid-grey mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Tasks Yet</h3>
                    <p className="text-charcoal/70 mb-4 max-w-md mx-auto">
                      Complete your assessment to get a personalized task list for your probate process
                    </p>
                    <Button 
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => {
                        // First attempt: redirect to home and trigger the assessment section
                        window.location.href = "/#assessment";
                        
                        // Add a fallback in case the direct link doesn't work
                        setTimeout(() => {
                          // Try to find and click on the assessment section link
                          const assessmentLink = document.querySelector('a[href="#assessment"]');
                          if (assessmentLink) {
                            (assessmentLink as HTMLElement).click();
                          }
                        }, 500);
                      }}
                    >
                      Start Assessment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
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
                  onComplete={(flags) => {
                    console.log('Evaluation completed with flags:', flags);
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