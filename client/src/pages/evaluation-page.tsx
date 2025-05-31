import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Target, CheckCircle, Clock } from 'lucide-react';
import { useLocation } from 'wouter';
import { EvaluationFlow } from '@/components/evaluation/EvaluationFlow';
import { MilestoneProgress } from '@/components/milestones/MilestoneProgress';
import { ProbateCase } from '@shared/schema';

export default function EvaluationPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Get user's active probate case
  const { data: probateCases = [], isLoading: isLoadingCases } = useQuery({
    queryKey: ['/api/probate-cases'],
    queryFn: getQueryFn,
  });

  const activeCase = Array.isArray(probateCases) ? probateCases.find((c: ProbateCase) => c.userId === user?.id) : null;

  if (isLoadingCases) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading evaluation system...</p>
        </div>
      </div>
    );
  }

  if (!activeCase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Assessment Required</h2>
          <p className="text-gray-600 mb-6">
            You need to complete the initial assessment before accessing the evaluation system.
          </p>
          <Button onClick={() => navigate('/')}>
            Complete Assessment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Advanced Evaluation</h1>
                <p className="text-gray-600">Complete detailed questions to unlock milestone tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Evaluation System Overview
                  </CardTitle>
                  <CardDescription>
                    Our comprehensive evaluation system helps guide you through the probate process with personalized milestones and progress tracking.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Detailed Questions</h3>
                      <p className="text-sm text-gray-600">
                        Answer comprehensive questions about your specific probate situation to get personalized guidance.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Milestone Tracking</h3>
                      <p className="text-sm text-gray-600">
                        Track your progress through game-like milestones that motivate you to complete each step.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Personalized Guidance</h3>
                      <p className="text-sm text-gray-600">
                        Receive customized recommendations based on your specific probate requirements.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Progress Motivation</h3>
                      <p className="text-sm text-gray-600">
                        Stay motivated with clear progress indicators and achievement unlocks.
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={() => setActiveTab("evaluation")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Start Evaluation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evaluation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Evaluation Questions</CardTitle>
                  <CardDescription>
                    Answer these questions to unlock personalized milestones and progress tracking for your probate case.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EvaluationFlow caseId={activeCase.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="milestones" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Milestone Progress</CardTitle>
                  <CardDescription>
                    Track your probate journey through game-like milestones and achievements.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MilestoneProgress caseId={activeCase.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}