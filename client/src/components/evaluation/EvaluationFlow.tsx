import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { detailedEvaluationSections, deriveEvaluationFlags } from '@shared/evaluation-config';
import type { EvaluationQuestion } from '@shared/evaluation-config';

interface EvaluationFlowProps {
  caseId: number;
  onComplete?: (flags: any) => void;
}

export const EvaluationFlow: React.FC<EvaluationFlowProps> = ({ caseId, onComplete }) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [derivedFlags, setDerivedFlags] = useState<any>(null);
  const queryClient = useQueryClient();

  // Load existing evaluation
  const { data: existingEvaluation, isLoading } = useQuery({
    queryKey: [`/api/evaluation/${caseId}`],
    enabled: !!caseId,
  });

  // Save evaluation mutation
  const saveEvaluationMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/evaluation/${caseId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/evaluation/${caseId}`] });
    },
  });

  // Initialize answers from existing evaluation
  useEffect(() => {
    if (existingEvaluation?.answers) {
      setAnswers(existingEvaluation.answers);
      if (existingEvaluation.derivedFlags) {
        setDerivedFlags(existingEvaluation.derivedFlags);
      }
      if (existingEvaluation.completedAt) {
        setIsComplete(true);
      }
    }
  }, [existingEvaluation]);

  // Auto-save on answer changes
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      const flags = deriveEvaluationFlags(answers);
      setDerivedFlags(flags);
      
      const saveData = {
        answers,
        derivedFlags: flags,
        completed: isComplete
      };
      
      saveEvaluationMutation.mutate(saveData);
    }
  }, [answers, isComplete]);

  const currentSection = detailedEvaluationSections[currentSectionIndex];
  const allQuestions = detailedEvaluationSections.flatMap(section => 
    section.questions.map(q => ({ ...q, sectionId: section.id }))
  );

  // Filter visible questions based on conditional logic
  const visibleQuestions = allQuestions.filter(question => {
    if (!question.conditionalLogic?.showIf) return true;
    
    return Object.entries(question.conditionalLogic.showIf).every(([key, expectedValue]) => {
      const actualValue = answers[key];
      if (Array.isArray(expectedValue)) {
        return expectedValue.includes(actualValue);
      }
      return actualValue === expectedValue;
    });
  });

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  
  if (!currentQuestion) {
    // All questions completed
    if (!isComplete) {
      setIsComplete(true);
      onComplete?.(derivedFlags);
    }
  }

  const handleAnswer = (value: any) => {
    const newAnswers = { ...answers, [currentQuestion.key]: value };
    setAnswers(newAnswers);
  };

  const goToNext = () => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsComplete(true);
      onComplete?.(derivedFlags);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const jumpToSection = (sectionIndex: number) => {
    const targetSection = detailedEvaluationSections[sectionIndex];
    const firstQuestionInSection = visibleQuestions.find(q => q.sectionId === targetSection.id);
    if (firstQuestionInSection) {
      const questionIndex = visibleQuestions.indexOf(firstQuestionInSection);
      setCurrentQuestionIndex(questionIndex);
      setCurrentSectionIndex(sectionIndex);
    }
  };

  const renderQuestionInput = (question: EvaluationQuestion) => {
    const value = answers[question.key];

    switch (question.type) {
      case 'boolean':
        return (
          <RadioGroup
            value={value?.toString() || ''}
            onValueChange={(v) => handleAnswer(v === 'true')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="true" id={`${question.key}-yes`} />
              <Label htmlFor={`${question.key}-yes`} className="flex-1 cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="false" id={`${question.key}-no`} />
              <Label htmlFor={`${question.key}-no`} className="flex-1 cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        );

      case 'select':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value={option} id={`${question.key}-${option}`} />
                <Label htmlFor={`${question.key}-${option}`} className="flex-1 cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleAnswer(Number(e.target.value))}
            placeholder="Enter amount"
            min={question.validation?.min}
            max={question.validation?.max}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleAnswer(e.target.value)}
          />
        );

      case 'text':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Enter your answer"
            rows={4}
          />
        );

      case 'object':
        // For complex objects like names/dates, we'll use a simplified input for now
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This information will be collected in a dedicated form section.
            </p>
            <Button
              variant="outline"
              onClick={() => handleAnswer({ completed: true })}
              disabled={!!value?.completed}
            >
              {value?.completed ? 'Information Provided' : 'Mark as Completed'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading evaluation...</p>
        </CardContent>
      </Card>
    );
  }

  if (isComplete && derivedFlags) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Evaluation Complete</CardTitle>
          <p className="text-muted-foreground">
            Your detailed probate assessment has been completed and saved.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Application Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Probate Type:</span>
                  <Badge variant="outline">{derivedFlags.probate_type?.replace('_', ' ')}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>IHT Form Required:</span>
                  <Badge variant="outline">{derivedFlags.iht_form_required}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Application Ready:</span>
                  <Badge variant={derivedFlags.application_ready ? "default" : "destructive"}>
                    {derivedFlags.application_ready ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Required Documents</h3>
              <div className="space-y-2">
                {derivedFlags.needs_renunciation_form && (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">Renunciation form required</span>
                  </div>
                )}
                {derivedFlags.needs_pa13 && (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">PA13 form required</span>
                  </div>
                )}
                {derivedFlags.needs_translation && (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">Translation required</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!derivedFlags.application_ready && derivedFlags.missing_requirements?.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-2">Outstanding Requirements:</h4>
              <ul className="space-y-1">
                {derivedFlags.missing_requirements.map((req: string, index: number) => (
                  <li key={index} className="text-sm text-amber-700">• {req}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button 
              onClick={() => window.location.href = `/dashboard`}
              className="flex-1"
            >
              Return to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsComplete(false);
                setCurrentQuestionIndex(0);
              }}
              className="flex-1"
            >
              Review Answers
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const progress = ((currentQuestionIndex + 1) / visibleQuestions.length) * 100;
  const currentQuestionSection = detailedEvaluationSections.find(s => s.id === currentQuestion.sectionId);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2">
        {detailedEvaluationSections.map((section, index) => {
          const sectionQuestions = visibleQuestions.filter(q => q.sectionId === section.id);
          const answeredInSection = sectionQuestions.filter(q => answers[q.key] !== undefined).length;
          const isCurrentSection = section.id === currentQuestion.sectionId;
          
          return (
            <Button
              key={section.id}
              variant={isCurrentSection ? "default" : "outline"}
              size="sm"
              onClick={() => jumpToSection(index)}
              className="relative"
            >
              {section.title}
              {answeredInSection > 0 && (
                <Badge className="ml-2 px-1 py-0 text-xs">
                  {answeredInSection}/{sectionQuestions.length}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Main Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {visibleQuestions.length}
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </span>
              {saveEvaluationMutation.isPending && (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Save className="h-3 w-3 animate-pulse" />
                  <span>Saving...</span>
                </div>
              )}
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4">
            <Badge variant="secondary" className="mb-2">
              {currentQuestionSection?.title}
            </Badge>
            <CardTitle className="text-xl">
              {currentQuestion.title}
            </CardTitle>
            {currentQuestion.description && (
              <p className="text-muted-foreground mt-2">
                {currentQuestion.description}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {renderQuestionInput(currentQuestion)}
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center space-x-4">
                {currentQuestion.required && answers[currentQuestion.key] === undefined && (
                  <span className="text-sm text-muted-foreground">
                    This question is required
                  </span>
                )}
                
                <Button
                  onClick={goToNext}
                  disabled={currentQuestion.required && answers[currentQuestion.key] === undefined}
                >
                  {currentQuestionIndex === visibleQuestions.length - 1 ? 'Complete' : 'Next'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};