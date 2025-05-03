import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Check, FileText, HelpCircle, LogOut, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { AssessmentResult } from "@shared/schema";

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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-soft-grey py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user?.firstName || "User"}
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
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
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
                        onClick={() => window.location.href = "/#assessment"}
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
            <Card>
              <CardHeader>
                <CardTitle>Your Documents</CardTitle>
                <CardDescription>
                  Upload and manage your probate documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-mid-grey mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Documents Yet</h3>
                  <p className="text-charcoal/70 mb-4 max-w-md mx-auto">
                    Upload important documents like death certificates, wills, and property valuations here
                  </p>
                  <Button className="bg-primary hover:bg-primary/90">
                    Upload Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                    
                    {/* Milestones List */}
                    <div className="border rounded-lg divide-y">
                      {/* Initial Assessment Milestone */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-success/10 text-success flex items-center justify-center mr-3">
                            <Check className="h-4 w-4" />
                          </div>
                          <span className="font-medium">Probate Assessment</span>
                        </div>
                        <span className="text-xs py-1 px-2 bg-success/10 text-success rounded-full">Complete</span>
                      </div>
                      
                      {/* Executor Information Milestone */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-amber/10 text-amber flex items-center justify-center mr-3">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-medium">Enter Executor Info</span>
                        </div>
                        <div>
                          <span className="text-xs py-1 px-2 bg-amber/10 text-amber rounded-full mr-2">Pending</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs"
                          >
                            Start
                          </Button>
                        </div>
                      </div>
                      
                      {/* Death Certificate Milestone */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-mid-grey/10 text-mid-grey flex items-center justify-center mr-3">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-medium">Upload Death Certificate</span>
                        </div>
                        <div>
                          <span className="text-xs py-1 px-2 bg-mid-grey/10 text-mid-grey rounded-full mr-2">Not Started</span>
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
                      
                      {/* Will Upload Milestone */}
                      {assessmentResult.hasWill && (
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-mid-grey/10 text-mid-grey flex items-center justify-center mr-3">
                              <FileText className="h-4 w-4" />
                            </div>
                            <span className="font-medium">Upload Will</span>
                          </div>
                          <div>
                            <span className="text-xs py-1 px-2 bg-mid-grey/10 text-mid-grey rounded-full mr-2">Not Started</span>
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
                      )}
                      
                      {/* Property Valuation */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-mid-grey/10 text-mid-grey flex items-center justify-center mr-3">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-medium">Enter Property Values</span>
                        </div>
                        <div>
                          <span className="text-xs py-1 px-2 bg-mid-grey/10 text-mid-grey rounded-full mr-2">Not Started</span>
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
                      
                      {/* Bank Accounts */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-mid-grey/10 text-mid-grey flex items-center justify-center mr-3">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-medium">Add Financial Accounts</span>
                        </div>
                        <div>
                          <span className="text-xs py-1 px-2 bg-mid-grey/10 text-mid-grey rounded-full mr-2">Not Started</span>
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
                      
                      {/* Submit Application */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-mid-grey/10 text-mid-grey flex items-center justify-center mr-3">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-medium">Submit Probate Application</span>
                        </div>
                        <div>
                          <span className="text-xs py-1 px-2 bg-mid-grey/10 text-mid-grey rounded-full mr-2">Locked</span>
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
                      onClick={() => window.location.href = "/#assessment"}
                    >
                      Start Assessment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
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