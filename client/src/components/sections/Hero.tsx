import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle, Upload, FileText, CheckCircle, BrainCircuit, ChevronRight, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SwiftLogoWithText } from "@/components/ui/SwiftLogo";
import Assessment from "@/components/sections/Assessment";
import logoBirdImage from "@assets/logo_lite.png";

const Hero: React.FC = () => {
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  
  // Listen for the open-assessment event
  useEffect(() => {
    const handleOpenAssessment = () => {
      setIsAssessmentOpen(true);
    };
    
    window.addEventListener('open-assessment', handleOpenAssessment);
    
    return () => {
      window.removeEventListener('open-assessment', handleOpenAssessment);
    };
  }, []);

  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white to-white opacity-70 -z-10"></div>
      
      {/* Assessment Modal */}
      <Assessment isOpen={isAssessmentOpen} onClose={() => setIsAssessmentOpen(false)} />
      
      <div className="container mx-auto px-4">
        {/* Main content row */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            Navigate probate with ease<span className="text-primary">—precise, swift support when it matters most</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-charcoal/80 mb-6 max-w-3xl">
            ProbateSwift guides you step by step, cutting weeks off the timeline, easing stress, and reducing costs.
          </p>
          
          {/* Logo below paragraph */}
          <div className="flex justify-center mb-8">
            <img 
              src={logoBirdImage}
              alt="ProbateSwift Logo" 
              className="w-[200px] h-auto"
              style={{ filter: 'brightness(1.1) contrast(1.1)' }}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center">
            <div className="flex-1 sm:max-w-[250px]">
              <a href="/auth" aria-label="Start your probate assessment" className="w-full block">
                <Button size="lg" className="bg-primary text-white hover:bg-primary/90 rounded-full shadow-md px-8 py-6 text-lg w-full justify-center">
                  <span>Start for Free</span>
                  <ChevronRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </a>
            </div>
            <p className="text-sm text-charcoal/60 -mt-1 mb-4 sm:hidden">No credit card required</p>
            <div className="sm:hidden mt-4">
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/5 rounded-full w-full justify-center"
                onClick={() => setIsAssessmentOpen(true)}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                <span>Is probate required?</span>
              </Button>
            </div>
            <div className="hidden sm:flex flex-1 sm:max-w-[250px]">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/5 rounded-full px-8 py-6 text-lg w-full justify-center"
                onClick={() => setIsAssessmentOpen(true)}
              >
                <HelpCircle className="h-5 w-5 mr-2" />
                <span>Is probate required?</span>
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-charcoal/60 -mt-8 mb-8 hidden sm:block">No credit card required</p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
