import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Clock, 
  Lock,
  Users, 
  FileText, 
  Upload,
  PoundSterling,
  FileCheck,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import type { RoutingState } from '@shared/routing-engine';

interface MilestoneData {
  applicantAdded: boolean;
  deathCertificateUploaded: boolean;
  deceasedAdded: boolean;
  willUploaded: boolean;
  estateValued: boolean;
  ihtComplete: boolean;
}

interface MilestoneStatus {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  locked: boolean;
  prompt?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface MilestoneDashboardProps {
  caseId: number;
  onNavigate?: (section: string) => void;
}

export function MilestoneDashboard({ caseId, onNavigate }: MilestoneDashboardProps) {
  const { data: routingState, isLoading: routingLoading } = useQuery<RoutingState>({
    queryKey: [`/api/routing-state?caseId=${caseId}`],
    enabled: !!caseId,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { data: milestoneStatus, isLoading: milestonesLoading } = useQuery<MilestoneData>({
    queryKey: [`/api/milestone-status?caseId=${caseId}`],
    enabled: !!caseId,
    refetchInterval: 30000,
  });

  if (routingLoading || milestonesLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if fast-track eligible
  const isFastTrackEligible = routingState?.fastTrackEligible && 
                             routingState?.eligibleToApply && 
                             routingState?.estateIsExcepted;

  if (!isFastTrackEligible) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Progress</CardTitle>
          <CardDescription>
            Complete the evaluation and data entry to unlock the fast-track experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Fast-track milestone dashboard is available for straightforward cases with excepted estates. 
              Complete your evaluation and basic information to see if you qualify.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Provide default values for milestone status
  const defaultMilestoneStatus: MilestoneData = {
    applicantAdded: false,
    deathCertificateUploaded: false,
    deceasedAdded: false,
    willUploaded: false,
    estateValued: false,
    ihtComplete: false
  };

  const currentMilestoneStatus = milestoneStatus || defaultMilestoneStatus;

  // Define milestones based on routing state and data
  const milestones: MilestoneStatus[] = [
    {
      id: 'add-applicant',
      title: 'Add Yourself as an Applicant',
      description: 'Add yourself to the People section as the executor',
      icon: Users,
      completed: currentMilestoneStatus.applicantAdded,
      locked: false,
      prompt: !currentMilestoneStatus.applicantAdded ? 
        "You told us you're the only applicant – add yourself to the People section to continue" : undefined,
      action: !currentMilestoneStatus.applicantAdded ? {
        label: 'Add Applicant',
        onClick: () => onNavigate?.('people')
      } : undefined
    },
    {
      id: 'upload-death-cert',
      title: 'Upload Death Certificate',
      description: 'Upload and validate the death certificate',
      icon: Upload,
      completed: currentMilestoneStatus.deathCertificateUploaded,
      locked: false,
      action: !currentMilestoneStatus.deathCertificateUploaded ? {
        label: 'Upload Document',
        onClick: () => onNavigate?.('documents')
      } : undefined
    },
    {
      id: 'add-deceased',
      title: 'Add Deceased Details',
      description: 'Add the deceased person with date of birth and death',
      icon: Users,
      completed: currentMilestoneStatus.deceasedAdded,
      locked: false,
      action: !currentMilestoneStatus.deceasedAdded ? {
        label: 'Add Details',
        onClick: () => onNavigate?.('people')
      } : undefined
    },
    {
      id: 'upload-will',
      title: 'Upload the Will',
      description: 'Upload the will document',
      icon: FileText,
      completed: currentMilestoneStatus.willUploaded,
      locked: false,
      prompt: !currentMilestoneStatus.willUploaded ? 
        "You told us there's a will – please upload it here" : undefined,
      action: !currentMilestoneStatus.willUploaded ? {
        label: 'Upload Will',
        onClick: () => onNavigate?.('documents')
      } : undefined
    },
    {
      id: 'declare-estate',
      title: 'Declare the Estate',
      description: 'Provide gross and net estate values',
      icon: PoundSterling,
      completed: currentMilestoneStatus.estateValued,
      locked: false,
      prompt: !currentMilestoneStatus.estateValued ? 
        "We'll use this to determine your Inheritance Tax form" : undefined,
      action: !currentMilestoneStatus.estateValued ? {
        label: 'Value Estate',
        onClick: () => onNavigate?.('estate')
      } : undefined
    },
    {
      id: 'confirm-iht',
      title: 'Confirm Inheritance Tax Status',
      description: 'Submit or complete your IHT declaration',
      icon: FileCheck,
      completed: currentMilestoneStatus.ihtComplete,
      locked: !currentMilestoneStatus.estateValued,
      prompt: !currentMilestoneStatus.ihtComplete ? 
        "You must submit or complete your IHT declaration before applying for probate" : undefined,
      action: !currentMilestoneStatus.ihtComplete && currentMilestoneStatus.estateValued ? {
        label: 'Handle IHT',
        onClick: () => onNavigate?.('estate')
      } : undefined
    },
    {
      id: 'generate-pa1p',
      title: 'Generate PA1P Form',
      description: 'Generate your probate application form',
      icon: FileText,
      completed: false,
      locked: !currentMilestoneStatus.ihtComplete || 
               !currentMilestoneStatus.willUploaded || 
               !currentMilestoneStatus.deathCertificateUploaded ||
               !currentMilestoneStatus.applicantAdded ||
               !currentMilestoneStatus.deceasedAdded,
      action: currentMilestoneStatus.ihtComplete && 
              currentMilestoneStatus.willUploaded && 
              currentMilestoneStatus.deathCertificateUploaded &&
              currentMilestoneStatus.applicantAdded &&
              currentMilestoneStatus.deceasedAdded ? {
        label: 'Generate Form',
        onClick: () => console.log('Generate PA1P form')
      } : undefined
    }
  ];

  const completedMilestones = milestones.filter(m => m.completed).length;
  const totalMilestones = milestones.length;
  const progressPercent = (completedMilestones / totalMilestones) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Fast-Track Probate Application
              </CardTitle>
              <CardDescription>
                Complete these milestones to submit your probate application
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Fast Track Eligible
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progress: {completedMilestones} of {totalMilestones} complete</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Milestone Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {milestones.map((milestone, index) => {
          const IconComponent = milestone.icon;
          
          return (
            <Card key={milestone.id} className={`transition-all ${
              milestone.completed ? 'border-green-200 bg-green-50' :
              milestone.locked ? 'border-gray-200 bg-gray-50 opacity-60' :
              'border-blue-200 bg-blue-50'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      milestone.completed ? 'bg-green-100' :
                      milestone.locked ? 'bg-gray-100' :
                      'bg-blue-100'
                    }`}>
                      {milestone.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : milestone.locked ? (
                        <Lock className="h-5 w-5 text-gray-500" />
                      ) : (
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{milestone.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {milestone.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`ml-2 ${
                    milestone.completed ? 'bg-green-100 text-green-800' :
                    milestone.locked ? 'bg-gray-100 text-gray-600' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {milestone.completed ? 'Done' : milestone.locked ? 'Locked' : 'Todo'}
                  </Badge>
                </div>
              </CardHeader>
              
              {(milestone.prompt || milestone.action) && (
                <CardContent className="pt-0">
                  {milestone.prompt && (
                    <Alert className="mb-3">
                      <AlertDescription className="text-sm">
                        {milestone.prompt}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {milestone.action && !milestone.locked && (
                    <Button 
                      onClick={milestone.action.onClick}
                      size="sm"
                      className="w-full"
                      variant={milestone.completed ? "outline" : "default"}
                    >
                      {milestone.action.label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  
                  {milestone.locked && (
                    <div className="text-sm text-muted-foreground">
                      Complete previous milestones to unlock
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Summary Actions */}
      {completedMilestones === totalMilestones - 1 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900">Ready to Generate Forms!</h3>
                <p className="text-sm text-green-700">
                  All requirements met. You can now generate your PA1P probate application form.
                </p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                Generate PA1P Form
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}