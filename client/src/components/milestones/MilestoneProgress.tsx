import { useState } from 'react';
import { CheckCircle, Circle, Lock, ChevronRight, FileText, FileCheck, Users, Scale, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  MILESTONES,
  getMilestoneProgress,
  getUnlockedTasks,
  getNextMilestone,
  generatePersonalisedTasks,
  type Milestone,
  type TaskCategory,
  type PersonalisedTask,
} from '@shared/milestone-config';

interface MilestoneProgressProps {
  completedSections: string[];
  evaluationFlags?: Record<string, any> | null;
  onStartEvaluation: () => void;
  onNavigateToTab: (tab: string) => void;
}

const CATEGORY_ICONS: Record<PersonalisedTask["category"], React.ReactNode> = {
  documents: <FileText className="h-4 w-4" />,
  forms:     <FileCheck className="h-4 w-4" />,
  people:    <Users className="h-4 w-4" />,
  legal:     <Scale className="h-4 w-4" />,
  advice:    <Lightbulb className="h-4 w-4" />,
};

const CATEGORY_COLOURS: Record<PersonalisedTask["category"], string> = {
  documents: "bg-blue-100 text-blue-700",
  forms:     "bg-purple-100 text-purple-700",
  people:    "bg-teal-100 text-teal-700",
  legal:     "bg-amber-100 text-amber-700",
  advice:    "bg-orange-100 text-orange-700",
};

export function MilestoneProgress({
  completedSections,
  evaluationFlags,
  onStartEvaluation,
  onNavigateToTab,
}: MilestoneProgressProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const completedMilestones = getMilestoneProgress(completedSections);
  const unlockedTasks = getUnlockedTasks(completedSections);
  const nextMilestone = getNextMilestone(completedSections);
  const personalisedTasks = generatePersonalisedTasks(evaluationFlags);
  
  const progressPercentage = (completedMilestones.length / MILESTONES.length) * 100;

  const isMilestoneCompleted = (milestone: Milestone) => {
    return completedMilestones.some(completed => completed.id === milestone.id);
  };

  const isMilestoneAccessible = (milestone: Milestone) => {
    // First milestone is always accessible
    if (milestone.priority === 1) return true;
    
    // Check if previous milestone is completed
    const previousMilestone = MILESTONES.find(m => m.priority === milestone.priority - 1);
    return previousMilestone ? isMilestoneCompleted(previousMilestone) : false;
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Probate Progress</span>
            <Badge variant={progressPercentage === 100 ? "default" : "secondary"}>
              {Math.round(progressPercentage)}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercentage} className="w-full" />
          
          {nextMilestone && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Next Milestone</h4>
              <p className="text-blue-700 text-sm mb-3">{nextMilestone.description}</p>
              <Button 
                onClick={onStartEvaluation} 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continue Evaluation
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {progressPercentage === 100 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">🎉 All Milestones Complete!</h4>
              <p className="text-green-700 text-sm">
                You've unlocked the full probate workflow. All tools and features are now available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestone List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Milestones</h3>
        {MILESTONES.map((milestone, index) => {
          const isCompleted = isMilestoneCompleted(milestone);
          const isAccessible = isMilestoneAccessible(milestone);
          const isExpanded = expanded === milestone.id;

          return (
            <Card 
              key={milestone.id} 
              className={`transition-all ${
                isCompleted ? 'border-green-200 bg-green-50' : 
                isAccessible ? 'border-blue-200' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : milestone.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : isAccessible ? (
                      <Circle className="h-6 w-6 text-blue-600" />
                    ) : (
                      <Lock className="h-6 w-6 text-gray-400" />
                    )}
                    <div>
                      <h4 className={`font-medium ${
                        isCompleted ? 'text-green-900' :
                        isAccessible ? 'text-blue-900' : 'text-gray-500'
                      }`}>
                        {milestone.name}
                      </h4>
                      <p className={`text-sm ${
                        isCompleted ? 'text-green-700' :
                        isAccessible ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight 
                    className={`h-4 w-4 transition-transform ${
                      isExpanded ? 'transform rotate-90' : ''
                    } ${isAccessible ? 'text-gray-600' : 'text-gray-400'}`} 
                  />
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Required Sections:</h5>
                      <div className="flex flex-wrap gap-2">
                        {milestone.requiredSections.map(section => (
                          <Badge 
                            key={section}
                            variant={completedSections.includes(section) ? "default" : "outline"}
                            className="text-xs"
                          >
                            {section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {isCompleted && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Unlocked Features:</h5>
                        <div className="flex flex-wrap gap-2">
                          {milestone.unlockedTabs.map(tab => (
                            <Button
                              key={tab}
                              variant="outline"
                              size="sm"
                              onClick={() => onNavigateToTab(tab)}
                              className="text-xs"
                            >
                              {tab.charAt(0).toUpperCase() + tab.slice(1)} Tab
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Personalised task list — shown once evaluation flags are available */}
      {personalisedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Action Plan</span>
              <Badge variant="secondary">{personalisedTasks.length} tasks</Badge>
            </CardTitle>
            <p className="text-sm text-gray-500">
              These steps are specific to your probate case, based on your evaluation answers.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {personalisedTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5 text-gray-400">
                    <span className="font-mono text-xs text-gray-400 w-5 inline-block text-right mr-1">
                      {index + 1}.
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h4 className="font-medium text-sm text-gray-900 flex-1">{task.title}</h4>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOURS[task.category]}`}>
                        {CATEGORY_ICONS[task.category]}
                        {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                  </div>
                  {task.tab && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 h-7 text-xs"
                      onClick={() => onNavigateToTab(task.tab!)}
                    >
                      Go
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generic unlocked work areas — shown when no personalised tasks yet */}
      {personalisedTasks.length === 0 && unlockedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Work Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {unlockedTasks.map((category: TaskCategory) => (
                <div key={category.id} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{category.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  <div className="space-y-1">
                    {category.tasks.slice(0, 3).map((task, taskIndex) => (
                      <div key={taskIndex} className="text-xs text-gray-500 flex items-center">
                        <Circle className="h-3 w-3 mr-2" />
                        {task}
                      </div>
                    ))}
                    {category.tasks.length > 3 && (
                      <div className="text-xs text-gray-400">
                        +{category.tasks.length - 3} more tasks...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}