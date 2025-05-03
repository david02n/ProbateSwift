import React from "react";
import { 
  Compass, 
  Coins, 
  FileSignature, 
  Calculator, 
  ListChecks,
  Lightbulb
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BenefitProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
}

const Benefit: React.FC<BenefitProps> = ({ icon, title, description, bgColor, iconColor }) => {
  return (
    <Card className="bg-white p-6 rounded-xl shadow-sm border border-lavender/20 hover:shadow-md transition">
      <CardContent className="p-0">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
          <div className={`${iconColor} text-xl`}>{icon}</div>
        </div>
        <h3 className="text-xl font-semibold font-inter mb-2">{title}</h3>
        <p className="text-charcoal/80">{description}</p>
      </CardContent>
    </Card>
  );
};

const Benefits: React.FC = () => {
  const benefits = [
    {
      icon: <Compass className="h-6 w-6" />,
      title: "Clear Guidance",
      description: "Step-by-step instructions that simplify the complex probate process into manageable tasks.",
      bgColor: "bg-primary/10",
      iconColor: "text-primary"
    },
    {
      icon: <Coins className="h-6 w-6" />,
      title: "Save on Legal Fees",
      description: "Reduce or eliminate solicitor costs by handling the probate application yourself with our support.",
      bgColor: "bg-accent/10",
      iconColor: "text-accent"
    },
    {
      icon: <FileSignature className="h-6 w-6" />,
      title: "Auto-Generated Forms",
      description: "Our system pre-fills complex probate forms using information you provide, reducing errors.",
      bgColor: "bg-lavender/20",
      iconColor: "text-lavender"
    },
    {
      icon: <Calculator className="h-6 w-6" />,
      title: "Estate Valuation",
      description: "Easily track assets and debts with our valuation tool to get an accurate estate total.",
      bgColor: "bg-primary/10",
      iconColor: "text-primary"
    },
    {
      icon: <ListChecks className="h-6 w-6" />,
      title: "Progress Tracking",
      description: "Keep track of your probate journey with our dashboard showing completed steps and next actions.",
      bgColor: "bg-accent/10",
      iconColor: "text-accent"
    },
    {
      icon: <Lightbulb className="h-6 w-6" />,
      title: "Expert Support",
      description: "Access resources and guidance for handling complex situations with confidence.",
      bgColor: "bg-lavender/20",
      iconColor: "text-lavender"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold font-inter mb-4">How ProbateSwift Helps You</h2>
          <p className="text-lg text-charcoal/80 max-w-2xl mx-auto">
            Navigate the probate process with confidence using our guided tools and expert resources.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Benefit
              key={index}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
              bgColor={benefit.bgColor}
              iconColor={benefit.iconColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
