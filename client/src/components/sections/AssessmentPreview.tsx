import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QuestionProps {
  number: number;
  question: string;
  description: string;
  options: string[];
  value: string;
  onAnswer: (value: string) => void;
  onBack?: () => void;
  showBackButton: boolean;
}

const Question: React.FC<QuestionProps> = ({ 
  number, 
  question, 
  description, 
  options, 
  value,
  onAnswer,
  onBack,
  showBackButton
}) => {
  // Using the value passed in as the selected value
  const handleChange = (selectedValue: string) => {
    // Automatically go to next question when an option is selected
    onAnswer(selectedValue);
  };

  return (
    <div>
      <div className="flex items-center mb-3">
        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold mr-3">
          {number}
        </div>
        <h3 className="text-xl font-semibold font-inter">{question}</h3>
      </div>
      <p className="text-charcoal/70 mb-5 pl-11">{description}</p>
      <div className="space-y-3 pl-11 mb-6">
        <RadioGroup value={value} onValueChange={handleChange} name={`question-${number}`}>
          {options.map((option, index) => {
            const optionId = `question-${number}-${index}`;
            return (
              <div 
                key={index} 
                className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-muted transition"
                onClick={() => {
                  // When clicking anywhere in the div, select this option
                  handleChange(option);
                  
                  // Also focus the radio item to show visual indication
                  document.getElementById(optionId)?.focus();
                }}
              >
                <RadioGroupItem id={optionId} value={option} className="text-primary" />
                <Label htmlFor={optionId} className="ml-2 cursor-pointer flex-grow">{option}</Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>
      
      {showBackButton && (
        <div className="flex justify-start">
          <Button 
            variant="outline"
            className="text-primary border-primary hover:bg-primary/5"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>Back</span>
          </Button>
        </div>
      )}
    </div>
  );
};

interface ResultProps {
  type: "probate-required" | "no-probate" | "end-flow";
  title: string;
  description: string;
  restart: () => void;
}

const Result: React.FC<ResultProps> = ({ type, title, description, restart }) => {
  return (
    <div className="text-center">
      <div className="mb-4 flex justify-center">
        {type === "probate-required" && (
          <CheckCircle className="h-12 w-12 text-success" />
        )}
        {type === "no-probate" && (
          <Info className="h-12 w-12 text-primary" />
        )}
        {type === "end-flow" && (
          <AlertCircle className="h-12 w-12 text-amber" />
        )}
      </div>
      <h3 className="text-xl font-semibold font-inter mb-3">{title}</h3>
      <p className="text-charcoal/80 mb-6">{description}</p>
      
      {type === "probate-required" && (
        <Link href="/auth">
          <Button className="bg-primary text-white hover:bg-primary/90">
            Register to Begin
          </Button>
        </Link>
      )}
      
      <div className="mt-4">
        <button 
          onClick={restart} 
          className="text-primary hover:underline font-medium"
        >
          Restart Assessment
        </button>
      </div>
    </div>
  );
};

const AssessmentPreview: React.FC = () => {
  // Define all the assessment questions
  const assessmentQuestions = [
    {
      id: "passed",
      question: "Has the person passed away?",
      description: "We can only help once someone has officially died.",
      options: ["Yes", "No"]
    },
    {
      id: "certificate",
      question: "Do you have the official death certificate?",
      description: "You'll need this document before you can apply for probate.",
      options: ["Yes", "No"]
    },
    {
      id: "location",
      question: "Did the person live in England or Wales?",
      description: "This service is for people who died in England or Wales only.",
      options: ["Yes", "No"]
    },
    {
      id: "will",
      question: "Did the person leave a will?",
      description: "This helps us know which probate process you'll need to follow.",
      options: ["Yes", "No", "Not sure"]
    },
    {
      id: "executor",
      question: "Are you named as an executor in the will?",
      description: "Only named executors can apply for probate if there is a will.",
      options: ["Yes", "No", "Not applicable"]
    },
    {
      id: "property",
      question: "Did the person own any property (house, flat, or land) in their name only?",
      description: "Owning property in their sole name almost always means probate is required.",
      options: ["Yes", "Only jointly owned", "No"]
    },
    {
      id: "accounts",
      question: "Did the person have bank accounts, savings, or investments in their sole name?",
      description: "Assets held just in their name may require probate to access.",
      options: ["Yes", "No", "Not sure"]
    },
    {
      id: "value",
      question: "Are the total assets in their sole name worth more than £5,000?",
      description: "Most banks ask for probate if the account balance is above this amount.",
      options: ["Yes", "No", "Not sure"]
    },
    {
      id: "released",
      question: "Have any banks or financial institutions already released funds without asking for probate?",
      description: "Some banks may release small amounts without needing probate.",
      options: ["Yes", "No", "Haven't contacted them yet"]
    },
    {
      id: "transfer",
      question: "Are you planning to sell or transfer any property that was owned by the person who died?",
      description: "You'll need probate to sell or transfer property.",
      options: ["Yes", "No"]
    },
    {
      id: "disputes",
      question: "Are there any disagreements or disputes about the will or inheritance?",
      description: "Disputes can slow the process, but probate is still usually required.",
      options: ["Yes", "No"]
    },
    {
      id: "debts",
      question: "Are there any debts that might be more than the total value of the estate?",
      description: "Even if the estate is insolvent (more debts than assets), probate is usually still required.",
      options: ["Yes", "No", "Not sure"]
    }
  ];

  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    type: "probate-required" | "no-probate" | "end-flow";
    title: string;
    description: string;
  } | null>(() => {
    // Try to load saved result from localStorage on component mount
    const savedResult = localStorage.getItem('probate_assessment_result');
    return savedResult ? JSON.parse(savedResult) : null;
  });
  // Track question navigation history to enable back navigation
  const [questionHistory, setQuestionHistory] = useState<number[]>([]);
  
  // Save result to localStorage whenever it changes
  useEffect(() => {
    if (result) {
      localStorage.setItem('probate_assessment_result', JSON.stringify(result));
      
      // Also save the answers for further processing
      localStorage.setItem('probate_assessment_answers', JSON.stringify(answers));
    } else {
      localStorage.removeItem('probate_assessment_result');
      localStorage.removeItem('probate_assessment_answers');
    }
  }, [result, answers]);

  const handleAnswer = (answer: string) => {
    const currentQuestion = assessmentQuestions[currentQuestionIndex];
    const updatedAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(updatedAnswers);
    
    // Apply assessment logic
    if (currentQuestion.id === "passed" && answer === "No") {
      setResult({
        type: "end-flow",
        title: "Probate Not Applicable Yet",
        description: "Probate starts only after someone has passed away."
      });
      return;
    }
    
    if (currentQuestion.id === "certificate" && answer === "No") {
      setResult({
        type: "end-flow",
        title: "Death Certificate Required",
        description: "You'll need to register the death before continuing with probate."
      });
      return;
    }
    
    if (currentQuestion.id === "location" && answer === "No") {
      setResult({
        type: "end-flow",
        title: "Service Not Available",
        description: "We currently only support probate for England and Wales."
      });
      return;
    }
    
    if (currentQuestion.id === "executor" && answer === "No") {
      setResult({
        type: "end-flow",
        title: "Executor Required",
        description: "You'll need to speak to the person named as executor in the will."
      });
      return;
    }
    
    if (currentQuestion.id === "property" && answer === "Yes") {
      setResult({
        type: "probate-required",
        title: "Probate Will Be Required",
        description: "Probate will be needed to transfer or sell this property."
      });
      return;
    }
    
    if (currentQuestion.id === "value" && answer === "Yes") {
      setResult({
        type: "probate-required",
        title: "Probate Will Be Required",
        description: "Probate is likely required to access these funds."
      });
      return;
    }
    
    if (currentQuestion.id === "transfer" && answer === "Yes") {
      setResult({
        type: "probate-required",
        title: "Probate Will Be Required",
        description: "You'll need probate to manage property sales or transfers."
      });
      return;
    }
    
    if (currentQuestion.id === "disputes" && answer === "Yes") {
      setResult({
        type: "probate-required",
        title: "Probate Will Be Required",
        description: "You may need legal advice — but probate is still likely required."
      });
      return;
    }
    
    if (currentQuestion.id === "debts" && (answer === "Yes" || answer === "Not sure")) {
      setResult({
        type: "probate-required",
        title: "Probate Will Be Required",
        description: "Probate is likely required, even if the estate has debts."
      });
      return;
    }
    
    // Skip executor question if no will
    if (currentQuestion.id === "will" && (answer === "No" || answer === "Not sure")) {
      // Skip the executor question (index 4) but add current index to history first
      setQuestionHistory(prev => [...prev, currentQuestionIndex]);
      setCurrentQuestionIndex(currentQuestionIndex + 2);
      return;
    }

    // Last question, show summary
    if (currentQuestionIndex === assessmentQuestions.length - 1) {
      setResult({
        type: "no-probate",
        title: "Probate May Not Be Required",
        description: "Based on your answers, it seems probate might not be required. You can still register to prepare, or check with a bank or solicitor to confirm."
      });
      return;
    }
    
    // Move to next question and update history
    setQuestionHistory(prev => [...prev, currentQuestionIndex]);
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  // Go back to previous question
  const handleBack = () => {
    if (questionHistory.length > 0) {
      // Get the last question from history
      const previousIndex = questionHistory[questionHistory.length - 1];
      // Update history by removing the last item
      setQuestionHistory(prev => prev.slice(0, -1));
      // Go back to previous question
      setCurrentQuestionIndex(previousIndex);
    }
  };

  const restartAssessment = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResult(null);
    setQuestionHistory([]);
  };
  
  const openAssessment = () => {
    setAssessmentOpen(true);
    if (result) {
      restartAssessment();
    }
  };
  
  const closeAssessment = () => {
    setAssessmentOpen(false);
  };
  
  const currentQuestion = assessmentQuestions[currentQuestionIndex];

  return (
    <section id="assessment" className="py-16 bg-gradient-to-b from-muted to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-inter mb-4">Do I Need Probate?</h2>
          <p className="text-lg text-charcoal/80 max-w-2xl mx-auto">
            Try our assessment tool to quickly determine if probate is required for your situation.
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto text-center">
          <Card className="bg-white p-8 rounded-xl shadow-md border border-lavender/30">
            <CardContent className="p-0 flex flex-col items-center">
              <div className="mb-6 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Start Your Probate Assessment</h3>
              <p className="text-charcoal/80 mb-6">
                Answer a few simple questions to determine if probate is required for your specific situation. Our intelligent assessment will guide you through the process.
              </p>
              <Button
                className="bg-primary text-white hover:bg-primary/90 px-6"
                onClick={openAssessment}
              >
                Begin Assessment
              </Button>
            </CardContent>
          </Card>
          
          {/* Result summary if previously completed */}
          {result && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center mb-2">
                {result.type === "probate-required" ? (
                  <CheckCircle className="h-5 w-5 text-success mr-2" />
                ) : result.type === "end-flow" ? (
                  <AlertCircle className="h-5 w-5 text-amber mr-2" />
                ) : (
                  <Info className="h-5 w-5 text-primary mr-2" />
                )}
                <h4 className="font-medium">{result.title}</h4>
              </div>
              <p className="text-sm text-charcoal/80">{result.description}</p>
              <Button 
                variant="link" 
                className="text-primary p-0 h-auto mt-2"
                onClick={openAssessment}
              >
                Start Again
              </Button>
            </div>
          )}
          
          <p className="mt-6 text-mid-grey">
            Want to save your assessment progress?{" "}
            <Link href="/auth?tab=register" className="text-primary hover:underline font-medium">
              Create a free account
            </Link>
          </p>
        </div>
      </div>
      
      {/* Assessment Modal */}
      <Dialog open={assessmentOpen} onOpenChange={setAssessmentOpen}>
        <DialogContent className="sm:max-w-[550px] p-0">
          <div className="p-6 relative">
            <button 
              onClick={closeAssessment} 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <X size={20} />
            </button>
            
            <DialogHeader className="mb-6">
              <DialogTitle className="text-center text-xl">Probate Assessment</DialogTitle>
              <DialogDescription className="text-center text-sm text-gray-600">
                Answer the following questions to determine if probate is needed
              </DialogDescription>
            </DialogHeader>
            
            {/* Progress indicators */}
            <div className="flex justify-center mb-8">
              {assessmentQuestions.map((q, index) => (
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
            
            {result ? (
              <Result 
                type={result.type}
                title={result.title}
                description={result.description}
                restart={restartAssessment}
              />
            ) : (
              <Question
                number={currentQuestionIndex + 1}
                question={currentQuestion.question}
                description={currentQuestion.description}
                options={currentQuestion.options}
                value={answers[currentQuestion.id] || ""}
                onAnswer={handleAnswer}
                onBack={handleBack}
                showBackButton={questionHistory.length > 0}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AssessmentPreview;
