import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle, Upload, FileText, CheckCircle, BrainCircuit, ChevronRight, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SwiftLogoWithText } from "@/components/ui/SwiftLogo";
import Assessment from "@/components/sections/Assessment";

const Hero: React.FC = () => {
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);

  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cream to-white opacity-70 -z-10"></div>
      
      {/* Assessment Modal */}
      <Assessment isOpen={isAssessmentOpen} onClose={() => setIsAssessmentOpen(false)} />
      
      <div className="container mx-auto px-4">
        {/* Main content row */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            Navigate probate with ease<span className="text-primary">—precise, swift support when it matters most</span>
          </h1>
          <p className="text-xl md:text-2xl text-charcoal/80 mb-10 max-w-3xl">
            ProbateSwift guides you step by step, cutting weeks off the timeline, easing stress, and reducing costs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <a href="/auth" aria-label="Start your probate assessment">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90 rounded-full shadow-md px-8 py-6 text-lg">
                <span>Start for Free</span>
                <ChevronRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </a>
            <p className="text-sm text-charcoal/60 -mt-1 mb-4 sm:hidden">No credit card required</p>
            <div className="sm:hidden mt-4">
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/5 rounded-full w-full"
                onClick={() => setIsAssessmentOpen(true)}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                <span>Is probate required?</span>
              </Button>
            </div>
            <div className="hidden sm:flex flex-col">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/5 rounded-full px-8 py-6 text-lg"
                onClick={() => setIsAssessmentOpen(true)}
              >
                <HelpCircle className="h-5 w-5 mr-2" />
                <span>Is probate required?</span>
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-charcoal/60 -mt-8 mb-4 hidden sm:block">No credit card required</p>
        </div>
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">One-and-done uploads</h3>
            <p className="text-charcoal/70">
              Snap or drag in death certificates, bank statements and deeds—once is all it takes.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BrainCircuit className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Auto-filled forms</h3>
            <p className="text-charcoal/70">
              Every field populated from your documents. Review, tweak and approve—no manual entry.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Guided journey</h3>
            <p className="text-charcoal/70">
              Clear prompts and progress indicators keep you moving forward with confidence.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Instant valuation</h3>
            <p className="text-charcoal/70">
              Total and net worth calculated for inheritance-tax purposes—no spreadsheets.
            </p>
          </div>
        </div>
        
        {/* Pricing Card */}
        <div className="max-w-lg mx-auto mt-20 bg-gradient-to-r from-primary/5 to-accent/5 p-1 rounded-xl">
          <Card className="bg-white p-6 md:p-8 rounded-xl">
            <div className="flex items-center justify-center mb-3">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mr-2">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <h4 className="font-semibold text-xl">Pay on submission</h4>
            </div>
            <p className="text-charcoal/80 mb-6 text-center">
              Use the full service free for two weeks. Only pay £297 when you're ready to submit your completed forms. No printer required.
            </p>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-charcoal/80 text-sm">Zero upfront risk: Get started for free, no card required.</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-charcoal/80 text-sm">You stay in control: Review and adjust every field before you submit.</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-charcoal/80 text-sm">Speedy results: Forms done in minutes, submissions in hours—not weeks.</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-charcoal/80 text-sm">Huge savings: Skip £1,000+ in legal fees and eliminate endless back-and-forth.</p>
              </div>
            </div>
            <a href="/auth" className="block">
              <Button className="w-full bg-primary text-white hover:bg-primary/90 py-3 flex items-center justify-center rounded-full">
                <span className="font-medium">Start for Free</span>
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
              <p className="text-xs text-center text-charcoal/60 mt-2">No credit card required</p>
            </a>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Hero;
