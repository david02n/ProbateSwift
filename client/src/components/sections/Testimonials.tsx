import React from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TestimonialProps {
  rating: number;
  quote: string;
  initials: string;
  name: string;
  location: string;
  bgColor: string;
}

const Testimonial: React.FC<TestimonialProps> = ({ rating, quote, initials, name, location, bgColor }) => {
  return (
    <Card className="bg-muted p-6 rounded-xl">
      <CardContent className="p-0">
        <div className="flex items-center mb-4">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`h-4 w-4 ${i < rating ? "fill-amber text-amber" : "fill-amber/20 text-amber/20"}`} 
            />
          ))}
        </div>
        <p className="italic mb-4">{quote}</p>
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full ${bgColor} text-white flex items-center justify-center font-medium`}>
            {initials}
          </div>
          <div className="ml-3">
            <p className="font-medium">{name}</p>
            <p className="text-sm text-mid-grey">{location}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      rating: 5,
      quote: "\"ProbateSwift guided me through every step. I was dreading the probate process after my mother passed, but this tool made it manageable and saved me thousands in solicitor fees.\"",
      initials: "SB",
      name: "Sarah B.",
      location: "London",
      bgColor: "bg-primary"
    },
    {
      rating: 5,
      quote: "\"The estate valuation tool was a lifesaver. It organized all the assets and debts clearly, and the tax helper ensured we paid the right amount with no surprises.\"",
      initials: "JT",
      name: "James T.",
      location: "Manchester",
      bgColor: "bg-accent"
    },
    {
      rating: 4.5,
      quote: "\"As a first-time executor with no legal background, I was worried about making mistakes. ProbateSwift's clear instructions and document generation made me feel confident throughout.\"",
      initials: "RP",
      name: "Rachel P.",
      location: "Birmingham",
      bgColor: "bg-lavender"
    }
  ];

  return (
    <section id="testimonials" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold font-inter mb-4">What Our Users Say</h2>
          <p className="text-lg text-charcoal/80 max-w-2xl mx-auto">
            Real feedback from people who have used ProbateSwift to handle probate themselves.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              rating={testimonial.rating}
              quote={testimonial.quote}
              initials={testimonial.initials}
              name={testimonial.name}
              location={testimonial.location}
              bgColor={testimonial.bgColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
