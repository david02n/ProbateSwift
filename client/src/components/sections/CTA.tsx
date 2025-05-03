import React from "react";
import { Button } from "@/components/ui/button";

const CTA: React.FC = () => {
  return (
    <section className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold font-inter mb-6">Ready to start your probate journey?</h2>
        <p className="text-xl max-w-2xl mx-auto mb-8">
          Join thousands of families who have saved time, money, and stress by using ProbateSwift.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="secondary" className="bg-white text-primary hover:bg-muted font-medium">
            Take the Assessment
          </Button>
          <Button className="bg-accent text-white hover:bg-accent/90 font-medium">
            Create Free Account
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
