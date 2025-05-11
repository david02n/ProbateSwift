import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Benefits from "@/components/sections/Benefits";
import HowItWorks from "@/components/sections/HowItWorks";
import Features from "@/components/sections/Features";
import AssessmentPreview from "@/components/sections/AssessmentPreview";
import Testimonials from "@/components/sections/Testimonials";
import FAQ from "@/components/sections/FAQ";
import CTA from "@/components/sections/CTA";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow pt-24 md:pt-28">
        <Hero />
        <Benefits />
        <HowItWorks />
        <Features />
        <AssessmentPreview />
        {/* Testimonials temporarily hidden */}
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
