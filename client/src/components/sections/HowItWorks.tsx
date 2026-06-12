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
    <section id="how-it-works" className="py-20 bg-white relative">
      {/* Background gradient */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-muted to-white opacity-70 -z-10"></div>
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-charcoal/80 max-w-2xl mx-auto">
            Three simple steps to complete your probate application
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ProcessStep 
            number={1} 
            title="Upload your documents" 
            description="Collect death certificates, bank statements and property deeds on any device."
          >
            <div className="space-y-3">
              <div className="flex items-center p-3 rounded-lg bg-white shadow-sm">
                <Upload className="text-primary mr-3 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Easy document upload</p>
                  <p className="text-xs text-charcoal/70">Upload photos or scan documents right from your phone</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-white shadow-sm">
                <BrainCircuit className="text-primary mr-3 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Automatic information extraction</p>
                  <p className="text-xs text-charcoal/70">Our system identifies and extracts all relevant data</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-white shadow-sm">
                <CheckCircle className="text-success mr-3 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Instant processing</p>
                  <p className="text-xs text-charcoal/70">Most documents are processed in under 60 seconds</p>
                </div>
              </div>
            </div>
          </ProcessStep>
          
          <ProcessStep 
            number={2} 
            title="Review auto-filled forms" 
            description="We pull every required detail into the right fields. You confirm it's accurate."
          >
            <div className="space-y-4">
              <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                <FileText className="text-primary mt-1 mr-3 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Forms automatically populated</p>
                  <p className="text-xs text-charcoal/70">The PA1 probate application form and IHT forms are filled out using data from your documents</p>
                </div>
              </div>
              
              <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                <Clipboard className="text-primary mt-1 mr-3 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Easy verification process</p>
                  <p className="text-xs text-charcoal/70">Review each section, approve or adjust as needed</p>
                </div>
              </div>
              
              <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                <Calculator className="text-primary mt-1 mr-3 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Estate valuation calculated</p>
                  <p className="text-xs text-charcoal/70">Total assets and liabilities calculated for inheritance tax purposes</p>
                </div>
              </div>
            </div>
          </ProcessStep>
          
          <ProcessStep 
            number={3} 
            title="Submit—and pay" 
            description="Kick off the government process today. Only then is the £295 fee due."
          >
            <div className="space-y-3">
              <div className="flex items-center p-3 rounded-lg bg-white shadow-sm">
                <CheckCircle className="text-success mr-3 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Digital submission</p>
                  <p className="text-xs text-charcoal/70">Submit your application directly to HMRC and the Probate Registry</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 rounded-lg bg-white shadow-sm">
                <Clock className="text-primary mr-3 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Pay only when you submit</p>
                  <p className="text-xs text-charcoal/70">Use the full service for free—pay £295 only when you're ready to submit</p>
                </div>
              </div>
              
              <div className="flex justify-center mt-4 p-3 bg-success/10 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="text-success h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">No payment required if you change your mind</span>
                </div>
              </div>
            </div>
          </ProcessStep>
        </div>
        
        <div className="mt-16 text-center">
          <a href="/auth">
            <Button size="lg" className="bg-primary text-white hover:bg-primary/90 rounded-full shadow-md px-8 py-6 text-lg">
              <span>Start for Free</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
          <p className="text-sm text-charcoal/60 mt-2">No credit card required</p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
