import React, { useState } from "react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

interface FAQItemProps {
  question: string;
  answer: string;
  value: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, value }) => {
  return (
    <AccordionItem value={value}>
      <Card className="mb-6 rounded-lg overflow-hidden">
        <AccordionTrigger className="px-5 py-5 bg-white hover:bg-white/90 hover:no-underline">
          <h3 className="text-lg font-medium font-inter text-left">{question}</h3>
        </AccordionTrigger>
        <AccordionContent className="bg-white px-5 pb-5">
          <p className="text-charcoal/80">{answer}</p>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
};

const FAQ: React.FC = () => {
  const faqs = [
    {
      question: "What exactly is probate?",
      answer: "Probate is the legal process that gives you the authority to deal with someone's estate after they die. It confirms the will is valid (if there is one) and that you have the right to access bank accounts, sell property, and distribute assets according to the will or intestacy rules.",
      value: "item-1"
    },
    {
      question: "Do I always need probate?",
      answer: "Not always. You might not need probate if the estate is very small (typically under £5,000), if everything was held jointly and passes automatically to the surviving owner, or for certain types of assets. Our assessment tool will help you determine if probate is required in your specific situation.",
      value: "item-2"
    },
    {
      question: "How long does probate take?",
      answer: "The probate process typically takes 6-12 months to complete, but it can vary based on the estate's complexity. Simple estates might be settled in 3-6 months, while complicated estates with property, businesses, or disputes might take longer. ProbateSwift helps streamline the process and provides estimated timelines based on your specific situation.",
      value: "item-3"
    },
    {
      question: "Can I handle probate myself without a solicitor?",
      answer: "Yes, many people successfully handle probate themselves, especially for straightforward estates. ProbateSwift provides all the guidance, tools, and forms you need to confidently manage the process without expensive solicitor fees. However, we do offer expert support options for more complex situations if needed.",
      value: "item-4"
    },
    {
      question: "What's the difference between probate with and without a will?",
      answer: "With a will, the named executor applies for a 'grant of probate' and follows the will's instructions for distributing assets. Without a will, the closest relative applies for 'letters of administration' and follows legal intestacy rules that determine who inherits. ProbateSwift guides you through either process with clear instructions and appropriate forms.",
      value: "item-5"
    }
  ];

  return (
    <section id="faq" className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold font-inter mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-charcoal/80 max-w-2xl mx-auto">
            Get answers to common questions about probate and how ProbateSwift helps.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible>
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                value={faq.value}
              />
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
