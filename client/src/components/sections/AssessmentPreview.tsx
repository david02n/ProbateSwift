import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface QuestionProps {
  number: number;
  question: string;
  description: string;
  options: string[];
  name: string;
  value: string;
  onChange: (value: string) => void;
}

const Question: React.FC<QuestionProps> = ({ 
  number, 
  question, 
  description, 
  options, 
  name, 
  value, 
  onChange 
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold mr-3">
          {number}
        </div>
        <h3 className="text-xl font-semibold font-inter">{question}</h3>
      </div>
      <p className="text-charcoal/70 mb-4 pl-11">{description}</p>
      <div className="space-y-3 pl-11">
        <RadioGroup value={value} onValueChange={onChange} name={name}>
          {options.map((option, index) => (
            <div key={index} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-muted transition">
              <RadioGroupItem id={`${name}-${index}`} value={option} className="text-primary" />
              <Label htmlFor={`${name}-${index}`} className="ml-2 cursor-pointer flex-grow">{option}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};

const AssessmentPreview: React.FC = () => {
  const [answers, setAnswers] = useState({
    passed: "",
    certificate: "",
    will: ""
  });

  const handleChange = (name: keyof typeof answers) => (value: string) => {
    setAnswers(prev => ({ ...prev, [name]: value }));
  };

  return (
    <section id="assessment" className="py-16 bg-gradient-to-b from-muted to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-inter mb-4">Do I Need Probate?</h2>
          <p className="text-lg text-charcoal/80 max-w-2xl mx-auto">
            Try our assessment tool to quickly determine if probate is required for your situation.
          </p>
        </div>
        
        <Card className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-lavender/30">
          <CardContent className="p-0">
            <Question
              number={1}
              question="Has the person passed away?"
              description="We can only help once someone has officially died."
              options={["Yes", "No"]}
              name="passed"
              value={answers.passed}
              onChange={handleChange("passed")}
            />
            
            <Question
              number={2}
              question="Do you have the official death certificate?"
              description="You'll need this document before you can apply for probate."
              options={["Yes", "No"]}
              name="certificate"
              value={answers.certificate}
              onChange={handleChange("certificate")}
            />
            
            <Question
              number={3}
              question="Did the person leave a will?"
              description="This helps us know which probate process you'll need to follow."
              options={["Yes", "No", "Not sure"]}
              name="will"
              value={answers.will}
              onChange={handleChange("will")}
            />
            
            <div className="flex justify-end">
              <Button className="bg-primary text-white hover:bg-primary/90">
                <span>Continue</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-mid-grey">Want to see the full assessment?</p>
          <a href="#" className="text-primary hover:underline font-medium">Create a free account</a>
        </div>
      </div>
    </section>
  );
};

export default AssessmentPreview;
