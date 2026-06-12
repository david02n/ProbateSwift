import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const Pricing: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-inter mb-2">Pricing & Guarantee</h2>
          <p className="text-gray-600">Simple, transparent pricing with no hidden fees</p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Card className="bg-white p-8 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row">
              {/* Left side pricing */}
              <div className="flex-1 mb-8 md:mb-0 md:border-r md:pr-8">
                <h3 className="text-primary font-semibold text-lg mb-2">One-time fee</h3>
                <div className="flex items-baseline mb-1">
                  <span className="text-5xl font-bold text-primary">£295</span>
                  <span className="text-gray-500 text-sm ml-2">one-time payment</span>
                </div>
                <p className="text-gray-600 text-sm mb-8">Pay when you're ready to submit</p>
                
                <h4 className="font-medium mb-4">What's included:</h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">Complete document upload system</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">Intelligent auto-filling technology</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">Step-by-step guidance</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">Instant estate valuation</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">Digital submission to authorities</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">Free for 14 days - pay only when you submit</p>
                  </div>
                </div>
              </div>
              
              {/* Right side CTA */}
              <div className="flex-1 flex flex-col justify-between md:pl-8">
                <div className="flex-grow flex flex-col justify-center mb-8">
                  <a href="/auth" className="mb-6">
                    <Button className="w-full bg-primary text-white hover:bg-primary/90 py-6 flex items-center justify-center rounded-full text-lg">
                      <span className="font-medium">Start for Free</span>
                      <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                    </Button>
                  </a>
                  <p className="text-sm text-center text-gray-500">No credit card required</p>
                </div>
                
                <div className="mt-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-gray-700">No payment required if you change your mind or can't proceed.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Pricing;