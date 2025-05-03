import React from "react";
import { 
  Compass, 
  Search, 
  Calculator, 
  Receipt, 
  FileText, 
  ListChecks, 
  HandCoins, 
  LifeBuoy, 
  TrendingUp 
} from "lucide-react";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => {
  return (
    <div>
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
          <div className="text-primary">{icon}</div>
        </div>
        <h3 className="text-lg font-semibold font-inter">{title}</h3>
      </div>
      <p className="text-charcoal/80">
        {description}
      </p>
    </div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: <Compass className="h-5 w-5" />,
      title: "Initial Triage & Guidance",
      description: "A friendly Q&A flow that determines if probate is required and guides you to the correct path."
    },
    {
      icon: <Search className="h-5 w-5" />,
      title: "Will Discovery & Verification",
      description: "Tools to help confirm a valid will exists and identify who can legally apply."
    },
    {
      icon: <Calculator className="h-5 w-5" />,
      title: "Estate Valuation Tool",
      description: "Structured data entry for assets and liabilities with a live estate value calculator."
    },
    {
      icon: <Receipt className="h-5 w-5" />,
      title: "Tax Handling Assistant",
      description: "Simplifies the inheritance tax process with automated form generation and guidance."
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Application Pack Generator",
      description: "Creates all required application materials with auto-filled data from earlier steps."
    },
    {
      icon: <ListChecks className="h-5 w-5" />,
      title: "Tracking & Document Hub",
      description: "Central dashboard to track progress and store important documents securely."
    },
    {
      icon: <HandCoins className="h-5 w-5" />,
      title: "Estate Administration Toolkit",
      description: "Tools for post-grant duties including asset release tracking and beneficiary distributions."
    },
    {
      icon: <LifeBuoy className="h-5 w-5" />,
      title: "Edge Case & Help Centre",
      description: "Support for unusual situations with quick guides and expert assistance options."
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Completion Confidence",
      description: "Tracks your progress with a completion score to ensure nothing is missed."
    }
  ];

  return (
    <section id="features" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold font-inter mb-4">Comprehensive Features</h2>
          <p className="text-lg text-charcoal/80 max-w-2xl mx-auto">
            Everything you need to handle probate from start to finish.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
