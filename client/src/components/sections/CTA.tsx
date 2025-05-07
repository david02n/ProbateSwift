import React from "react";
import { Button } from "@/components/ui/button";
import { FileUp, BrainCircuit, Calculator } from "lucide-react";

const CTA: React.FC = () => {
  return (
    <section className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold font-inter mb-6">Ready to simplify your probate process?</h2>
        <p className="text-xl max-w-2xl mx-auto mb-8">
          Let our intelligent document processing system do the hard work for you.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
          <div className="bg-white/10 rounded-lg p-5">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <FileUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
            <p className="text-sm text-white/80">
              Securely upload death certificates, bank statements, and property deeds once
            </p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-5">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Extraction</h3>
            <p className="text-sm text-white/80">
              Our system automatically identifies and extracts key data from your documents
            </p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-5">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Calculator className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Estate Calculation</h3>
            <p className="text-sm text-white/80">
              Get real-time estate valuations and inheritance tax estimates
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#assessment">
            <Button variant="secondary" className="bg-white text-primary hover:bg-muted font-medium">
              Take the Assessment
            </Button>
          </a>
          <a href="/auth">
            <Button className="bg-accent text-white hover:bg-accent/90 font-medium">
              Start Free Account
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTA;
