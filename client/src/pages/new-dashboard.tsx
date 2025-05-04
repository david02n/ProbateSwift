import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { AssessmentResult } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import NewHeader from "@/components/layout/NewHeader";
import Assessment from "@/components/sections/Assessment";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Circle,
  FileText,
  Home,
  Upload,
  PoundSterling,
  Clock,
  ChevronRight,
  Send,
  Calendar,
  CheckCheck
} from "lucide-react";

const NewDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  
  // Fetch assessment results
  const { 
    data: assessmentResult,
    isLoading: isLoadingAssessment 
  } = useQuery<AssessmentResult | null>({
    queryKey: ["/api/assessment"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Calculate estate data based on assessment result
  const estateValue = assessmentResult ? "£450K" : "£0";
  const completionDate = assessmentResult ? "12 November 2025" : "Not yet determined";
  const progressPercent = assessmentResult ? 10 : 0;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NewHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Dashboard Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-600">
              {assessmentResult ? (
                <>
                  Welcome {user?.firstName || "User"}, you're applying for probate 
                  {assessmentResult.hasWill ? " with a will" : " without a will"}
                </>
              ) : (
                <>Welcome {user?.firstName || "User"}, let's start your probate journey</>
              )}
            </p>
          </div>
          
          {/* Next Step Card */}
          <div className="bg-[#FBF8F3] p-5 rounded-lg flex justify-between items-center mb-8">
            <div>
              <h2 className="font-bold text-lg mb-1">Next Step</h2>
              {assessmentResult ? (
                <p className="text-gray-700">Prepare your application for grant of probate</p>
              ) : (
                <p className="text-gray-700">Complete the probate assessment to determine your needs</p>
              )}
            </div>
            <Button 
              className="bg-[#002B49] hover:bg-[#002B49]/90"
              onClick={() => setIsAssessmentOpen(true)}
            >
              {assessmentResult ? "start application" : "begin assessment"}
            </Button>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Estate Value */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-gray-600 font-medium mb-1">Estate Value</h3>
                <div className="text-3xl font-bold text-[#16A34A]">{estateValue}</div>
                <div className="text-sm text-gray-500 mt-1">estimated</div>
              </CardContent>
            </Card>
            
            {/* Expected Completion */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-gray-600 font-medium mb-1">When probate may be granted</h3>
                <div className="text-3xl font-bold text-amber-500">{completionDate}</div>
                <div className="text-sm text-gray-500 mt-1">estimated</div>
              </CardContent>
            </Card>
            
            {/* Progress */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-gray-600 font-medium mb-1">Progress</h3>
                <div className="text-3xl font-bold text-primary">{progressPercent}%</div>
                <div className="text-sm text-gray-500 mt-1">Complete</div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Chat & Upload */}
            <div className="space-y-6">
              {/* Application Assistant */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4">Application Assistant</h3>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <Button className="w-full bg-[#002B49] hover:bg-[#002B49]/90 mb-1">
                    begin chat
                  </Button>
                </CardContent>
              </Card>
              
              {/* Quick Upload */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4">Upload Docs</h3>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 mb-3">drag & drop file<br />OR</p>
                    <Button variant="outline" className="w-full">
                      choose file
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column - Task List */}
            <div className="md:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">Your Tasks</h3>
                    <p className="text-sm text-gray-500">Track your progress through the probate process</p>
                  </div>
                  
                  {isLoadingAssessment ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 mb-2">
                        Complete these milestones to progress with your probate application
                      </div>
                      
                      {assessmentResult ? (
                        <>
                          {/* Task 1 - Assessment (Complete) */}
                          <div className="border rounded-lg p-4">
                            <div className="flex justify-between">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                    <CheckCheck className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <h4 className="font-medium">Probate Assessment</h4>
                                  <p className="text-sm text-gray-500 mt-1">
                                    You've completed your initial assessment. Based on your answers, probate is required.
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full h-fit">Complete</span>
                            </div>
                            <div className="ml-8 mt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-7"
                                onClick={() => setIsAssessmentOpen(true)}
                              >
                                Review
                              </Button>
                            </div>
                          </div>
                          
                          {/* Task 2 - Executor Info (Pending) */}
                          <div className="border rounded-lg p-4 border-amber-200 bg-amber-50">
                            <div className="flex justify-between">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                                    <Circle className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <h4 className="font-medium">Enter Executor Info</h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Provide executor details including contact information and relationship to the deceased.
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full h-fit">Pending</span>
                            </div>
                            <div className="ml-8 mt-2">
                              <Button size="sm" className="text-xs h-7 bg-[#002B49] hover:bg-[#002B49]/90">Start</Button>
                            </div>
                          </div>
                          
                          {/* Task 3 - Death Certificate (Not Started) */}
                          <div className="border rounded-lg p-4">
                            <div className="flex justify-between">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center">
                                    <Circle className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <h4 className="font-medium">Upload Death Certificate</h4>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Upload an official death certificate. This is required for the probate application.
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full h-fit">Not Started</span>
                            </div>
                            <div className="ml-8 mt-2">
                              <Button size="sm" className="text-xs h-7" variant="outline" disabled>Upload</Button>
                            </div>
                          </div>
                          
                          {/* Task 4 - Will Upload (Conditional) */}
                          {assessmentResult?.hasWill && (
                            <div className="border rounded-lg p-4">
                              <div className="flex justify-between">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center">
                                      <Circle className="h-3 w-3 text-white" />
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <h4 className="font-medium">Upload Will</h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                      Upload the original will and any codicils. This must be the official signed version.
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full h-fit">Not Started</span>
                              </div>
                              <div className="ml-8 mt-2">
                                <Button size="sm" className="text-xs h-7" variant="outline" disabled>Upload</Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Task 1 - Assessment (Not Started) */}
                          <div className="border rounded-lg p-4 border-amber-200 bg-amber-50">
                            <div className="flex justify-between">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                                    <Circle className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <h4 className="font-medium">Complete Assessment</h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Answer questions about your situation to determine if probate is required.
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full h-fit">Required</span>
                            </div>
                            <div className="ml-8 mt-2">
                              <Button 
                                size="sm" 
                                className="text-xs h-7 bg-[#002B49] hover:bg-[#002B49]/90"
                                onClick={() => setIsAssessmentOpen(true)}
                              >
                                Start Assessment
                              </Button>
                            </div>
                          </div>
                          
                          {/* Other tasks shown as locked */}
                          <div className="border rounded-lg p-4 opacity-50">
                            <div className="flex justify-between">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center">
                                    <Circle className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <h4 className="font-medium">Enter Executor Info</h4>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Complete assessment first to unlock this task.
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full h-fit">Locked</span>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* More tasks would continue here */}
                      
                      <p className="text-center text-sm text-gray-500 mt-4">
                        Complete all required tasks to submit your probate application
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      {/* Assessment Modal */}
      <Assessment 
        isOpen={isAssessmentOpen}
        onClose={() => setIsAssessmentOpen(false)}
      />
    </div>
  );
};

// Make sure to export as default for routing
export default NewDashboardPage;