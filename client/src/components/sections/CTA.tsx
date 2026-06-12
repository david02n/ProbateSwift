import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

const CTA: React.FC = () => {
  return (
    <section className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to turn paperwork into progress?</h2>
        <p className="text-xl max-w-2xl mx-auto mb-12">
          Start for Free and finish your probate application today.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
          <div className="text-left">
            <h3 className="text-xl font-semibold mb-4 border-b border-white/20 pb-2">Why ProbateSwift?</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-accent mr-3 mt-0.5 flex-shrink-0" />
                <p>Zero upfront risk: Get started for free, no card required.</p>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-accent mr-3 mt-0.5 flex-shrink-0" />
                <p>You stay in control: Review and adjust every field before you submit.</p>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-accent mr-3 mt-0.5 flex-shrink-0" />
                <p>Speedy results: Forms done in minutes, submissions in hours—not weeks.</p>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-accent mr-3 mt-0.5 flex-shrink-0" />
                <p>Huge savings: Skip £1,000+ in legal fees and eliminate endless back-and-forth.</p>
              </li>
            </ul>
          </div>
          
          <div className="text-left">
            <h3 className="text-xl font-semibold mb-4 border-b border-white/20 pb-2">Pricing & Guarantee</h3>
            <div className="bg-white/10 p-6 rounded-xl mb-4">
              <p className="text-lg font-medium mb-2">One-time fee of £295</p>
              <p className="text-white/80 mb-4">Pay when you're ready to submit</p>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-accent mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm">No payment required if you change your mind or can't proceed.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <a href="/auth">
            <Button size="lg" className="bg-white text-primary hover:bg-accent/5 rounded-full shadow-md px-8 py-6 text-lg">
              <span>Start for Free</span>
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Button>
          </a>
          <p className="text-sm text-white/80 mt-2">No credit card required</p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
