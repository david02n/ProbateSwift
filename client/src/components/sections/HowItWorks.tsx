import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, HelpCircle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
}

const ProcessStep: React.FC<ProcessStepProps> = ({ number, title, description, children }) => {
  return (
    <div className="flex flex-col md:flex-row items-start mb-12">
      <div className="md:w-1/3 flex flex-col items-center md:items-start mb-4 md:mb-0">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold mb-2">
          {number}
        </div>
        <h3 className="text-xl font-semibold font-inter">{title}</h3>
      </div>
      <div className="md:w-2/3 bg-white p-6 rounded-xl shadow-sm border border-lavender/20">
        <p className="mb-4">{description}</p>
        {children}
      </div>
    </div>
  );
};

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold font-inter mb-4">The ProbateSwift Process</h2>
          <p className="text-lg text-charcoal/80 max-w-2xl mx-auto">
            Our platform guides you through each stage of probate with clarity and support.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ProcessStep 
            number={1} 
            title="Initial Assessment" 
            description="Answer simple questions to determine if probate is needed for your situation."
          >
            <Card className="bg-muted p-4">
              <CardContent className="p-0 text-sm">
                <div className="flex items-center mb-2">
                  <HelpCircle className="text-primary mr-2 h-4 w-4" />
                  <span className="font-medium">Was there a will?</span>
                </div>
                <div className="flex items-center mb-2">
                  <HelpCircle className="text-primary mr-2 h-4 w-4" />
                  <span className="font-medium">What kind of assets did they have?</span>
                </div>
                <div className="flex items-center">
                  <HelpCircle className="text-primary mr-2 h-4 w-4" />
                  <span className="font-medium">Was there jointly owned property?</span>
                </div>
              </CardContent>
            </Card>
          </ProcessStep>
          
          <ProcessStep 
            number={2} 
            title="Will Verification" 
            description="Upload and verify the will or determine who can apply if there isn't one."
          >
            <div className="flex items-center justify-center bg-muted p-4 rounded-lg text-center">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium">Upload the will document</p>
              </div>
            </div>
          </ProcessStep>
          
          <ProcessStep 
            number={3} 
            title="Estate Valuation" 
            description="Track all assets and debts to calculate the estate's value for tax purposes."
          >
            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Assets</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Property</li>
                    <li>Bank accounts</li>
                    <li>Investments</li>
                    <li>Personal items</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Liabilities</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Mortgages</li>
                    <li>Loans</li>
                    <li>Credit cards</li>
                    <li>Funeral costs</li>
                  </ul>
                </div>
              </div>
            </div>
          </ProcessStep>
          
          <ProcessStep 
            number={4} 
            title="Application & Distribution" 
            description="Generate application forms, track progress, and manage estate distribution."
          >
            <div className="flex items-center justify-between bg-muted p-4 rounded-lg text-sm">
              <div className="flex items-center">
                <CheckCircle className="text-success mr-2 h-4 w-4" />
                <span>Application submitted</span>
              </div>
              <div className="flex items-center">
                <Clock className="text-amber mr-2 h-4 w-4" />
                <span>Grant pending</span>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-mid-grey mr-2"></div>
                <span>Distribution</span>
              </div>
            </div>
          </ProcessStep>
        </div>
        
        <div className="mt-12 text-center">
          <Button className="bg-primary text-white hover:bg-primary/90">
            <span>Begin Your Probate Journey</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
