import React from "react";
import { 
  Compass, 
  ClipboardList, 
  Calculator, 
  Receipt, 
  FileCheck, 
  ListChecks, 
  Users, 
  BrainCircuit, 
  LineChart,
  Building,
  CreditCard,
  File,
  Database
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
      title: "Smart Probate Assessment",
      description: "Interactive assessment to determine if probate is required, guiding you to the right process based on your specific situation."
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      title: "Dashboard & Task Management",
      description: "Centralized dashboard with clear progress tracking and personalized task list to guide you through each step of the probate journey."
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Executor Management",
      description: "Tools to add, edit, and manage multiple executors, including role assignment and contact information tracking."
    },
    {
      icon: <FileCheck className="h-5 w-5" />,
      title: "Document & Certificate Storage",
      description: "Secure digital storage for all relevant documents with clear organization by type and purpose."
    },
    {
      icon: <BrainCircuit className="h-5 w-5" />,
      title: "AI-Powered Document Extraction",
      description: "Automatically extract and classify key information from uploaded documents like death certificates, bank statements, and property deeds."
    },
    {
      icon: <Building className="h-5 w-5" />,
      title: "Property & Real Estate Tools",
      description: "Special handling for property assets with address validation, mortgage tracking, and ownership verification."
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Financial Account Management",
      description: "Track and organize all bank accounts, investments, and financial instruments belonging to the estate."
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: "Estate Valuation Engine",
      description: "Real-time calculation of estate value with automatic updates when assets and liabilities are added, modified, or removed."
    },
    {
      icon: <File className="h-5 w-5" />,
      title: "Document Classification",
      description: "Intelligent document tagging system that automatically categorizes uploads as assets, liabilities, or general documents."
    },
    {
      icon: <Receipt className="h-5 w-5" />,
      title: "HMRC & IHT Preparation",
      description: "Tools to calculate inheritance tax thresholds and prepare the required tax forms with data from your existing estate inventory."
    },
    {
      icon: <Calculator className="h-5 w-5" />,
      title: "Estate Net Value Calculator",
      description: "Automatic calculation of the estate's net value by deducting liabilities from assets with clear visual reporting."
    },
    {
      icon: <LineChart className="h-5 w-5" />,
      title: "Progress Monitoring",
      description: "Visual tracking of your probate application progress with completion percentages and next step guidance."
    }
  ];

  return (
    <section id="features" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold font-inter mb-4">Comprehensive Features</h2>
          <p className="text-lg text-charcoal/80 max-w-2xl mx-auto">
            Our intelligent platform simplifies every aspect of the probate process
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
