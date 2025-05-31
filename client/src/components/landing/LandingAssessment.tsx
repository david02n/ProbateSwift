import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { landingPageQuestions, deriveLandingPageResult } from '@shared/evaluation-config';

interface LandingAssessmentProps {
  onComplete?: (result: any) => void;
}

export const LandingAssessment: React.FC<LandingAssessmentProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<any>(null);

  const currentQuestion = landingPageQuestions[currentStep];
  const visibleQuestions = landingPageQuestions.filter(q => {
    if (!q.conditionalLogic?.showIf) return true;
    
    return Object.entries(q.conditionalLogic.showIf).every(([key, expectedValue]) => {
      const actualValue = answers[key];
      if (Array.isArray(expectedValue)) {
        return expectedValue.includes(actualValue);
      }
      return actualValue === expectedValue;
    });
  });

  const isCurrentQuestionVisible = visibleQuestions.includes(currentQuestion);
  const currentVisibleIndex = visibleQuestions.indexOf(currentQuestion);

  const handleAnswer = (value: any) => {
    const newAnswers = { ...answers, [currentQuestion.key]: value };
    setAnswers(newAnswers);
    
    // Auto-advance to next question after a short delay
    setTimeout(() => {
      const nextVisibleQuestions = landingPageQuestions.filter(q => {
        if (!q.conditionalLogic?.showIf) return true;
        
        return Object.entries(q.conditionalLogic.showIf).every(([key, expectedValue]) => {
          const actualValue = newAnswers[key];
          if (Array.isArray(expectedValue)) {
            return expectedValue.includes(actualValue);
          }
          return actualValue === expectedValue;
        });
      });

      const currentIndex = nextVisibleQuestions.indexOf(currentQuestion);
      if (currentIndex < nextVisibleQuestions.length - 1) {
        const nextQuestion = nextVisibleQuestions[currentIndex + 1];
        const nextGlobalIndex = landingPageQuestions.indexOf(nextQuestion);
        setCurrentStep(nextGlobalIndex);
      } else {
        // Assessment complete
        const assessmentResult = deriveLandingPageResult(newAnswers);
        setResult(assessmentResult);
        setIsComplete(true);
        onComplete?.(assessmentResult);
      }
    }, 300);
  };

  const goBack = () => {
    if (currentVisibleIndex > 0) {
      const prevQuestion = visibleQuestions[currentVisibleIndex - 1];
      const prevGlobalIndex = landingPageQuestions.indexOf(prevQuestion);
      setCurrentStep(prevGlobalIndex);
    }
  };

  const restartAssessment = () => {
    setCurrentStep(0);
    setAnswers({});
    setIsComplete(false);
    setResult(null);
  };

  if (isComplete && result) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {result.eligible ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <AlertCircle className="h-16 w-16 text-amber-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {result.eligible ? 'You appear eligible for probate' : 'Important information about your situation'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Next Steps:</h3>
            <ul className="space-y-2">
              {result.nextSteps.map((step: string, index: number) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 font-semibold mt-1">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {result.warnings.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-amber-600">Important Notes:</h3>
              <ul className="space-y-2">
                {result.warnings.map((warning: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            {result.eligible && (
              <Button 
                onClick={() => window.location.href = '/auth'} 
                className="flex-1"
              >
                Continue to ProbateSwift
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={restartAssessment}
              className="flex-1"
            >
              Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isCurrentQuestionVisible) {
    // Skip to next visible question
    const nextVisibleQuestion = visibleQuestions.find(q => 
      landingPageQuestions.indexOf(q) > currentStep
    );
    if (nextVisibleQuestion) {
      const nextIndex = landingPageQuestions.indexOf(nextVisibleQuestion);
      setCurrentStep(nextIndex);
    }
    return null;
  }

  const progress = ((currentVisibleIndex + 1) / visibleQuestions.length) * 100;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            Question {currentVisibleIndex + 1} of {visibleQuestions.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <CardTitle className="text-xl mt-6">
          {currentQuestion.title}
        </CardTitle>
        {currentQuestion.description && (
          <p className="text-muted-foreground">
            {currentQuestion.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentQuestion.type === 'boolean' && (
            <RadioGroup
              value={answers[currentQuestion.key]?.toString() || ''}
              onValueChange={(value) => handleAnswer(value === 'true')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="true" id="yes" />
                <Label htmlFor="yes" className="flex-1 cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="false" id="no" />
                <Label htmlFor="no" className="flex-1 cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          )}

          {currentQuestion.type === 'select' && currentQuestion.options && (
            <RadioGroup
              value={answers[currentQuestion.key] || ''}
              onValueChange={(value) => handleAnswer(value)}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div key={option} className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="flex-1 cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentVisibleIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <span className="text-sm text-muted-foreground self-center">
            {answers[currentQuestion.key] !== undefined ? 'Answer recorded' : 'Select an option to continue'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};