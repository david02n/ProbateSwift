import React, { useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieConsentBanner from "@/components/legal/CookieConsentBanner";
import Hero from "@/components/sections/Hero";
import KeyFeatures from "@/components/sections/KeyFeatures";
import Benefits from "@/components/sections/Benefits";
import HowItWorks from "@/components/sections/HowItWorks";
import Features from "@/components/sections/Features";
import AssessmentPreview from "@/components/sections/AssessmentPreview";
import Testimonials from "@/components/sections/Testimonials";
import Pricing from "@/components/sections/Pricing";
import FAQ from "@/components/sections/FAQ";
import CTA from "@/components/sections/CTA";

const Home: React.FC = () => {
  useEffect(() => {
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const metaTag = document.createElement('meta');
      metaTag.name = 'viewport-extra';
      metaTag.content = 'width=device-width, initial-scale=1, maximum-scale=1, mobile-web-app-capable=yes';
      document.head.appendChild(metaTag);
      document.body.classList.add('mobile-browser');

      return () => {
        document.body.classList.remove('mobile-browser');
        metaTag.remove();
      };
    }
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow pt-24 md:pt-28">
        <Hero />
        <KeyFeatures />
        <Pricing />
        <Benefits />
        <HowItWorks />
        <Features />
        <AssessmentPreview />
        {/* Testimonials temporarily hidden */}
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <CookieConsentBanner />
    </div>
  );
};

export default Home;
