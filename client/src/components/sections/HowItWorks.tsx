import React from "react";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  HelpCircle, 
  CheckCircle, 
  Clock, 
  Upload, 
  BrainCircuit, 
  FileText, 
  Clipboard, 
  Users, 
  Calculator
} from "lucide-react";
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
            Our intelligent platform guides you through probate with document automation
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ProcessStep 
            number={1} 
            title="Initial Assessment" 
            description="Answer simple questions to determine if probate is needed for your specific situation."
          >
            <Card className="bg-muted p-4">
              <CardContent className="p-0 text-sm">
                <div className="flex items-center mb-2">
                  <HelpCircle className="text-primary mr-2 h-4 w-4" />
                  <span className="font-medium">Was there a valid will?</span>
                </div>
                <div className="flex items-center mb-2">
                  <HelpCircle className="text-primary mr-2 h-4 w-4" />
                  <span className="font-medium">Is there property in the deceased's sole name?</span>
                </div>
                <div className="flex items-center mb-2">
                  <HelpCircle className="text-primary mr-2 h-4 w-4" />
                  <span className="font-medium">Are there financial assets worth more than £5,000?</span>
                </div>
                <div className="flex justify-center mt-4">
                  <div className="rounded-lg bg-white px-3 py-1 text-xs border border-lavender/20">
                    <span className="text-success font-medium">✓</span> Instant result: Probate required/not required
                  </div>
                </div>
              </CardContent>
            </Card>
          </ProcessStep>
          
          <ProcessStep 
            number={2} 
            title="Document Upload & Smart Extraction" 
            description="Upload key documents once and our AI will automatically extract and classify the information."
          >
            <div className="space-y-3">
              <div className="flex items-center p-3 rounded-lg bg-muted">
                <Upload className="text-primary mr-3 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Upload Death Certificate</p>
                  <p className="text-xs text-charcoal/70">Our system extracts name, date, cause of death</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-muted">
                <Upload className="text-primary mr-3 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Upload Bank Statements</p>
                  <p className="text-xs text-charcoal/70">Auto-classified as assets, extracted balance and account details</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-muted">
                <Upload className="text-primary mr-3 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Upload Property Documents</p>
                  <p className="text-xs text-charcoal/70">Extract address, value, and ownership details</p>
                </div>
              </div>
              <div className="flex justify-center mt-2">
                <div className="flex items-center text-xs text-primary">
                  <BrainCircuit className="h-3 w-3 mr-1" />
                  <span>AI processes documents in seconds</span>
                </div>
              </div>
            </div>
          </ProcessStep>
          
          <ProcessStep 
            number={3} 
            title="Executor & Estate Management" 
            description="Manage multiple executors, track assets and liabilities with real-time valuation."
          >
            <div className="space-y-4">
              <div className="flex items-start bg-muted p-3 rounded-lg">
                <Users className="text-primary mt-1 mr-3 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Executor Management</p>
                  <p className="text-xs text-charcoal/70">Add multiple executors with contact details and roles</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col bg-muted p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FileText className="text-success h-4 w-4 mr-2" />
                    <p className="text-sm font-medium">Assets</p>
                  </div>
                  <ul className="text-xs space-y-1 ml-6 list-disc">
                    <li>Bank accounts</li>
                    <li>Properties</li>
                    <li>Investments</li>
                    <li>Vehicles</li>
                  </ul>
                </div>
                <div className="flex flex-col bg-muted p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FileText className="text-error h-4 w-4 mr-2" />
                    <p className="text-sm font-medium">Liabilities</p>
                  </div>
                  <ul className="text-xs space-y-1 ml-6 list-disc">
                    <li>Mortgages</li>
                    <li>Loans</li>
                    <li>Credit cards</li>
                    <li>Utility bills</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-center items-center">
                <Calculator className="text-primary h-4 w-4 mr-2" />
                <span className="text-sm">Real-time estate value: <span className="font-bold">£285,750</span></span>
              </div>
            </div>
          </ProcessStep>
          
          <ProcessStep 
            number={4} 
            title="Application Preparation & Submission" 
            description="Generate complete application forms with information extracted from your documents."
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <Clipboard className="text-primary h-5 w-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Pre-filled PA1 Form</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                    <div className="bg-success h-1.5 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div className="text-xs font-medium">75%</div>
              </div>
              
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <Clipboard className="text-primary h-5 w-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">IHT205 Documentation</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                    <div className="bg-success h-1.5 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div className="text-xs font-medium">60%</div>
              </div>
              
              <div className="flex items-center justify-between bg-muted p-3 rounded-lg text-sm mt-4">
                <div className="flex items-center">
                  <CheckCircle className="text-success mr-2 h-4 w-4" />
                  <span>Documents</span>
                </div>
                <div className="flex items-center">
                  <Clock className="text-amber mr-2 h-4 w-4" />
                  <span>Application</span>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 rounded-full bg-mid-grey mr-2"></div>
                  <span>Distribution</span>
                </div>
              </div>
            </div>
          </ProcessStep>
        </div>
        
        <div className="mt-12 text-center">
          <a href="/auth">
            <Button className="bg-primary text-white hover:bg-primary/90">
              <span>Begin Your Probate Journey</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
