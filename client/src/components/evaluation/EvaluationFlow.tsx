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
import { useToast } from '@/hooks/use-toast';
import { detailedEvaluationSections, deriveFlags } from '@shared/evaluation-config';
import type { EvaluationQuestion } from '@shared/evaluation-config';
import { EvaluationResults } from './EvaluationResults';

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
  const [showResults, setShowResults] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load existing evaluation
  const { data: existingEvaluation, isLoading } = useQuery({
    queryKey: [`/api/evaluation/${caseId}`],
    enabled: !!caseId,
  });

  // Save evaluation mutation
  const saveEvaluationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', `/api/evaluation/${caseId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/evaluation/${caseId}`] });
    },
  });

  // Initialize answers from the existing record (the landing-assessment answers
  // are claimed onto the case, so they arrive here). Anything already answered is
  // hidden from the flow — we never re-ask it.
  const [hasInitialized, setHasInitialized] = useState(false);
  const [blockerMessage, setBlockerMessage] = useState<string | null>(null);
  // Keys answered BEFORE this session (landing assessment or a prior visit). These
  // are never re-asked. Captured once at load so fields the user fills in THIS
  // session don't disappear from under them as they type.
  const [preAnsweredKeys, setPreAnsweredKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (existingEvaluation && typeof existingEvaluation === 'object' && 'answers' in existingEvaluation && !hasInitialized) {
      const evaluation = existingEvaluation as any;
      if (evaluation.answers) {
        setAnswers(evaluation.answers);
        setPreAnsweredKeys(
          new Set(
            Object.keys(evaluation.answers).filter(
              (k) => evaluation.answers[k] !== undefined && evaluation.answers[k] !== null,
            ),
          ),
        );
      }
      if ('derivedFlags' in evaluation && evaluation.derivedFlags) {
        setDerivedFlags(evaluation.derivedFlags);
      }
      if ('completedAt' in evaluation && evaluation.completedAt) {
        setIsComplete(true);
      }

      setHasInitialized(true);
    }
  }, [existingEvaluation, hasInitialized]);

  // Auto-save on answer changes
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      const flags = deriveFlags(answers);
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

  // Filter sections based on conditional logic (e.g., skip Will & Executors if no will)
  const visibleSections = detailedEvaluationSections.filter(section => {
    if (section.id === 'will_executors') {
      // Only show Will & Executors section if there is a will
      return answers.has_will === true;
    }
    return true;
  });

  // All questions visible given conditional logic (used for progress + section nav).
  const allVisibleQuestions = allQuestions.filter(question => {
    // First check if the section should be visible
    const sectionVisible = visibleSections.some(section => section.id === question.sectionId);
    if (!sectionVisible) return false;

    if (!question.conditionalLogic?.showIf) return true;

    return Object.entries(question.conditionalLogic.showIf).every(([key, expectedValue]) => {
      const actualValue = answers[key];
      if (Array.isArray(expectedValue)) {
        return expectedValue.includes(actualValue);
      }
      return actualValue === expectedValue;
    });
  });

  // The questions we actually ASK: everything visible, minus what was already
  // answered before this session (e.g. in the landing assessment). This is what
  // implements "don't make them answer the same thing twice".
  const visibleQuestions = allVisibleQuestions.filter(q => !preAnsweredKeys.has(q.key));

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
    
    // Check for blocker answers that make user ineligible
    const blockerChecks = {
      'deceased_domiciled_uk': {
        value: false,
        message: 'ProbateSwift cannot assist with estates where the deceased was not domiciled in the UK. You may need to seek specialist legal advice for international probate matters.'
      },
      'deceased_lived_england_wales': {
        value: false,
        message: 'ProbateSwift is designed for probate applications in England and Wales only. For other jurisdictions, please contact the relevant probate registry.'
      },
      'named_executor_in_will': {
        value: false,
        condition: () => !newAnswers.acting_under_poa,
        message: 'Only named executors or their legally appointed representatives can apply for probate when there is a will. You may need to contact the named executors or seek legal advice.'
      }
    };

    const blocker = blockerChecks[currentQuestion.key as keyof typeof blockerChecks];
    if (blocker && value === blocker.value) {
      const hasCondition = 'condition' in blocker && typeof blocker.condition === 'function';
      if (!hasCondition || (hasCondition && blocker.condition())) {
        setAnswers(newAnswers);
        setBlockerMessage(blocker.message);
        return;
      }
    }
    
    // Auto-advance to next question after a brief delay for visual feedback
    setTimeout(() => {
      if (currentQuestionIndex < visibleQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Check if we've completed a section
        const currentSectionQuestions = visibleQuestions.filter(q => q.sectionId === currentQuestion.sectionId);
        const isLastInSection = currentSectionQuestions[currentSectionQuestions.length - 1].key === currentQuestion.key;
        
        if (isLastInSection) {
          showSectionCompletionPrompt(currentQuestion.sectionId);
        }
        
        setIsComplete(true);
        onComplete?.(derivedFlags);
      }
    }, 300);
  };

  const showSectionCompletionPrompt = (sectionId: string) => {
    const prompts = {
      'deceased_details': {
        title: 'Section 1 Complete!',
        description: 'Next, add the deceased person\'s details in the People tab.'
      },
      'tax_estate_threshold': {
        title: 'Section 2 Complete!', 
        description: 'Please add assets and liabilities in the Estate tab.'
      },
      'will_executors': {
        title: 'Section 3 Complete!',
        description: 'Upload the will and any codicils in the Documents tab.'
      },
      'about_applicant': {
        title: 'Section 4 Complete!',
        description: 'Add all applicants in the People tab.'
      },
      'iht_readiness': {
        title: 'Evaluation Complete!',
        description: 'Proceed to your milestone dashboard to continue.'
      }
    };
    
    const prompt = prompts[sectionId as keyof typeof prompts];
    if (prompt) {
      toast({
        title: prompt.title,
        description: prompt.description,
        duration: 5000,
      });
    }
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
            <div 
              className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleAnswer(true)}
            >
              <RadioGroupItem value="true" id={`${question.key}-yes`} />
              <Label htmlFor={`${question.key}-yes`} className="flex-1 cursor-pointer">Yes</Label>
            </div>
            <div 
              className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleAnswer(false)}
            >
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
              <div 
                key={option} 
                className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleAnswer(option)}
              >
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
            onChange={(e) => {
              const newAnswers = { ...answers, [currentQuestion.key]: Number(e.target.value) };
              setAnswers(newAnswers);
            }}
            onBlur={() => {
              // Auto-advance on blur for number inputs
              setTimeout(() => {
                if (currentQuestionIndex < visibleQuestions.length - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                } else {
                  setIsComplete(true);
                  onComplete?.(derivedFlags);
                }
              }, 300);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // Auto-advance on Enter key
                setTimeout(() => {
                  if (currentQuestionIndex < visibleQuestions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                  } else {
                    setIsComplete(true);
                    onComplete?.(derivedFlags);
                  }
                }, 300);
              }
            }}
            placeholder="Enter amount"
            min={question.validation?.min}
            max={question.validation?.max}
          />
        );

      case 'date':
        const today = new Date().toISOString().split('T')[0];
        const isWillOrCodicilDate = question.key.includes('will') || question.key.includes('codicil');
        
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => {
              const newAnswers = { ...answers, [currentQuestion.key]: e.target.value };
              setAnswers(newAnswers);
              
              // Auto-advance after date selection
              setTimeout(() => {
                if (currentQuestionIndex < visibleQuestions.length - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                } else {
                  setIsComplete(true);
                  onComplete?.(derivedFlags);
                }
              }, 300);
            }}
            max={isWillOrCodicilDate ? today : undefined}
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

  // Show comprehensive results when evaluation is complete
  if ((isComplete && derivedFlags) || showResults) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <EvaluationResults
          answers={answers}
          caseId={caseId}
          applicantRole={(existingEvaluation as any)?.applicantRole}
          amberAcknowledgements={(existingEvaluation as any)?.amberAcknowledgements}
          onContinue={() => window.location.href = `/dashboard`}
          onRetakeEvaluation={() => {
            setIsComplete(false);
            setShowResults(false);
            setCurrentSectionIndex(0);
            setCurrentQuestionIndex(0);
            // Retake = review everything again, so un-hide the previously-answered
            // questions (their saved values stay as pre-filled defaults).
            setPreAnsweredKeys(new Set());
          }}
        />
      </div>
    );
  }

  // Show blocker message if user is ineligible
  if (blockerMessage) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Unable to Proceed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{blockerMessage}</p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setBlockerMessage(null);
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
                }}
              >
                Go Back
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
        {visibleSections.map((section, index) => {
          const sectionQuestions = allVisibleQuestions.filter(q => q.sectionId === section.id);
          const answeredInSection = sectionQuestions.filter(q => answers[q.key] !== undefined).length;
          const isCurrentSection = section.id === currentQuestion.sectionId;
          const isComplete = answeredInSection === sectionQuestions.length;
          const isSkipped = section.id === 'will_executors' && answers.has_will === false;
          
          return (
            <Button
              key={section.id}
              variant={isCurrentSection ? "default" : "outline"}
              size="sm"
              onClick={() => jumpToSection(index)}
              className="relative"
            >
              {section.title}
              {isSkipped ? (
                <Badge className="ml-2 px-1 py-0 text-xs bg-gray-100 text-gray-600">
                  Skipped
                </Badge>
              ) : isComplete ? (
                <Badge className="ml-2 px-1 py-0 text-xs bg-green-100 text-green-800">
                  Complete
                </Badge>
              ) : answeredInSection > 0 ? (
                <Badge className="ml-2 px-1 py-0 text-xs bg-blue-100 text-blue-800">
                  {answeredInSection}/{sectionQuestions.length}
                </Badge>
              ) : null}
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
                
                {Object.keys(answers).length > 3 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowResults(true)}
                  >
                    View Results
                  </Button>
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