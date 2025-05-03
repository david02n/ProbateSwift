import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";

const Hero: React.FC = () => {
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4 md:flex items-center">
        <div className="md:w-1/2 mb-8 md:mb-0 pr-0 md:pr-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-inter leading-tight mb-4">
            Simplify the probate process <span className="text-primary">when you need it most</span>
          </h1>
          <p className="text-lg md:text-xl text-charcoal/80 mb-8 max-w-xl">
            ProbateSwift guides you through every step of the probate journey with clarity and compassion, saving you time, stress, and legal fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#assessment">
              <Button className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 flex items-center">
                <span>Start Your Assessment</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="#how-it-works">
              <Button variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-muted flex items-center">
                <PlayCircle className="mr-2 h-4 w-4" />
                <span>See How It Works</span>
              </Button>
            </a>
          </div>
          <div className="mt-8 flex items-center">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-lavender flex items-center justify-center text-white text-xs">JD</div>
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs">SM</div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs">KL</div>
            </div>
            <div className="ml-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber text-amber" />
                ))}
              </div>
              <p className="text-sm text-charcoal/70">Trusted by 10,000+ families</p>
            </div>
          </div>
        </div>
        
        <div className="md:w-1/2">
          <Card className="bg-muted p-6 md:p-8 rounded-xl shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="ml-4 text-xl font-semibold font-inter">Do I need probate?</h3>
            </div>
            <p className="text-charcoal/80 mb-6">Answer a few simple questions to determine if you need probate for your situation.</p>
            
            {/* CTA Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-6 border border-lavender/30">
              <h4 className="font-medium mb-3 text-center text-lg">Already know probate is required?</h4>
              <p className="text-charcoal/80 mb-5 text-center">
                Register here to start saving time on your probate application
              </p>
              <a href="#" className="block">
                <Button className="w-full bg-primary text-white hover:bg-primary/90 py-3 flex items-center justify-center">
                  <span className="font-medium">Get Started</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="flex items-center text-sm text-mid-grey">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Your information is secure</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Hero;
