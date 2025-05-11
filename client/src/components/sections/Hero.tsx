import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle, Upload, FileText, CheckCircle, BrainCircuit, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SwiftLogoWithText } from "@/components/ui/SwiftLogo";

const Hero: React.FC = () => {
  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cream to-white opacity-70 -z-10"></div>
      
      <div className="container mx-auto px-4">
        {/* Main content row */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            Simplifying probate <span className="text-primary">when you need it most</span>
          </h1>
          <p className="text-xl md:text-2xl text-charcoal/80 mb-10 max-w-3xl">
            Guided, automated estate settlement that saves you time, stress, and legal fees.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <a href="#assessment" aria-label="Start your probate assessment">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90 rounded-full shadow-md px-8 py-6 text-lg">
                <span>Start Free Assessment</span>
                <ChevronRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </a>
            <a href="/auth" aria-label="Register to use ProbateSwift">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5 rounded-full px-8 py-6 text-lg">
                <span>Create Account</span>
              </Button>
            </a>
          </div>
        </div>
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Upload Documents Once</h3>
            <p className="text-charcoal/70">
              Death certificates, bank statements, property deeds - we'll extract the data automatically
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BrainCircuit className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI-Powered Analysis</h3>
            <p className="text-charcoal/70">
              Our system intelligently extracts and organizes key information from your documents
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Complete Estate Management</h3>
            <p className="text-charcoal/70">
              Assets and liabilities are automatically organized with accurate valuation for probate
            </p>
          </div>
        </div>
        
        {/* Already know probate is required card - moved below features */}
        <div className="max-w-md mx-auto mt-16 bg-gradient-to-r from-primary/5 to-accent/5 p-1 rounded-xl">
          <Card className="bg-white p-6 md:p-8 rounded-xl">
            <h4 className="font-medium mb-3 text-center text-xl">Already know probate is required?</h4>
            <p className="text-charcoal/80 mb-5 text-center">
              Register to start using our advanced document processing and estate management tools
            </p>
            <a href="/auth" className="block">
              <Button className="w-full bg-primary text-white hover:bg-primary/90 py-3 flex items-center justify-center rounded-full">
                <span className="font-medium">Get Started</span>
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </a>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Hero;
