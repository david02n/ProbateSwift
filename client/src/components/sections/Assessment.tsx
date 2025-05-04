import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AssessmentProps {
  isOpen: boolean;
  onClose: () => void;
}

type QuestionType = {
  id: number;
  question: string;
  description: string;
  options: { value: string; label: string }[];
}

type AssessmentAnswers = {
  [key: string | number]: string;
};

const questions: QuestionType[] = [
  {
    id: 1,
    question: "Has the person passed away?",
    description: "We can only help with probate for someone who has passed away.",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" }
    ]
  },
  {
    id: 2,
    question: "Did the person leave a valid will?",
    description: "A valid will names executors and describes how assets should be distributed.",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
      { value: "Not sure", label: "Not sure" }
    ]
  },
  {
    id: 3,
    question: "Did the person own any property (house, flat, or land) in their name only?",
    description: "Owning property in their sole name almost always means probate is required.",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "Only jointly owned", label: "Only jointly owned" },
      { value: "No", label: "No" }
    ]
  },
  {
    id: 4,
    question: "Did the person have bank accounts or investments worth more than £10,000 in their sole name?",
    description: "Most financial institutions require probate for accounts over certain thresholds.",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
      { value: "Not sure", label: "Not sure" }
    ]
  },
  {
    id: 5,
    question: "Are there any disputes about the will or inheritances?",
    description: "Disputes can complicate the probate process and may require legal assistance.",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
      { value: "Not sure", label: "Not sure" }
    ]
  },
  {
    id: 6,
    question: "Are there debts that might exceed the value of the estate?",
    description: "This may indicate an insolvent estate which requires special handling.",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
      { value: "Not sure", label: "Not sure" }
    ]
  }
];

export const Assessment: React.FC<AssessmentProps> = ({ isOpen, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [results, setResults] = useState<{
    isProbateRequired: boolean;
    probateType: string | null;
    message: string;
  } | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const currentQuestion = questions[currentQuestionIndex];
  
  const saveAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      const res = await apiRequest("POST", "/api/assessment", assessmentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessment"] });
      toast({
        title: "Assessment saved",
        description: "Your probate assessment has been saved",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving assessment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    
    // Check first question - if they answer No, end assessment
    if (currentQuestion.id === 1 && value === "No") {
      setResults({
        isProbateRequired: false,
        probateType: null,
        message: "We can only assist with probate for someone who has passed away."
      });
      return;
    }
    
    // Move to next question or calculate results
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate results
      const isProbateRequired = determineIfProbateRequired(newAnswers);
      const probateType = newAnswers["2"] === "Yes" ? "grant_of_probate" : "letters_of_administration";
      
      setResults({
        isProbateRequired,
        probateType,
        message: isProbateRequired 
          ? "Based on your answers, probate is required. We can help you through this process."
          : "Based on your answers, probate may not be required. You should consult with a solicitor to confirm."
      });
      
      // Save assessment if logged in
      if (user) {
        saveAssessmentMutation.mutate({
          userId: user.id,
          isProbateRequired,
          probateType,
          hasWill: newAnswers["2"] === "Yes",
          hasDispute: newAnswers["5"] === "Yes",
          isInsolvent: newAnswers["6"] === "Yes" || newAnswers["6"] === "Not sure",
          assessmentData: JSON.stringify({
            answers: newAnswers,
            result: {
              isProbateRequired,
              probateType,
              message: isProbateRequired 
                ? "Based on your answers, probate is required. We can help you through this process."
                : "Based on your answers, probate may not be required. You should consult with a solicitor to confirm."
            }
          })
        });
      }
    }
  };
  
  const determineIfProbateRequired = (newAnswers: AssessmentAnswers): boolean => {
    // Logic to determine if probate is required based on answers
    // Property in sole name almost always requires probate
    if (newAnswers["3"] === "Yes") return true;
    
    // Significant assets in sole name
    if (newAnswers["4"] === "Yes") return true;
    
    // Default to true to be cautious
    return true;
  };
  
  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResults(null);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-[600px] max-w-[90vw] max-h-[90vh] overflow-auto">
        <div className="p-6 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          >
            <X size={20} />
          </button>
          
          <CardContent className="px-0 pt-6">
            {!results ? (
              <>
                {/* Progress indicators */}
                <div className="flex justify-center mb-8">
                  {questions.map((q, index) => (
                    <div 
                      key={q.id}
                      className={`h-2.5 w-2.5 rounded-full mx-1.5 ${
                        index < currentQuestionIndex 
                          ? "bg-green-500" 
                          : index === currentQuestionIndex 
                            ? "bg-amber-500" 
                            : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
                
                {/* Question */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold flex items-center">
                    <span className="bg-blue-500 text-white rounded-full h-6 w-6 inline-flex items-center justify-center mr-2">
                      {currentQuestion.id}
                    </span>
                    {currentQuestion.question}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {currentQuestion.description}
                  </p>
                </div>
                
                {/* Options */}
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  className="space-y-3 mt-4"
                >
                  {currentQuestion.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={option.value} 
                        id={`option-${option.value}`} 
                        onClick={() => handleAnswer(option.value)}
                      />
                      <Label htmlFor={`option-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                
                {/* Navigation buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentQuestionIndex === 0}
                  >
                    Back
                  </Button>
                  
                  <Button
                    disabled={!answers[currentQuestion.id]}
                    onClick={() => handleAnswer(answers[currentQuestion.id])}
                  >
                    {currentQuestionIndex < questions.length - 1 ? "Next" : "Complete Assessment"}
                  </Button>
                </div>
              </>
            ) : (
              /* Results */
              <div className="text-center py-8">
                <h3 className="text-xl font-bold mb-4">
                  {results.isProbateRequired 
                    ? "Probate Is Required" 
                    : "Probate May Not Be Required"}
                </h3>
                <p className="text-gray-700 mb-6">
                  {results.message}
                </p>
                
                {results.isProbateRequired && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-md">
                    <p className="font-medium text-blue-800">
                      You will need to apply for {results.probateType === "grant_of_probate" 
                        ? "Grant of Probate" 
                        : "Letters of Administration"}
                    </p>
                    <p className="text-sm text-blue-700">
                      {results.probateType === "grant_of_probate"
                        ? "This is required when the deceased left a valid will."
                        : "This is required when the deceased did not leave a valid will."}
                    </p>
                  </div>
                )}
                
                <div className="mt-8 space-x-4">
                  <Button variant="outline" onClick={handleRestart}>
                    Restart Assessment
                  </Button>
                  <Button onClick={onClose}>
                    Return to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default Assessment;