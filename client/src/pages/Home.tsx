import React, { useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
  // Add detection for mobile browsers and set special metadata
  useEffect(() => {
    // Log environment info for debugging
    console.log('Home page loaded');
    console.log('User agent:', navigator.userAgent);
    
    // Add special metadata for mobile browsers to ensure proper routing
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      console.log('Mobile browser detected in Home page');
      
      // Add a meta tag to help with mobile-specific routing
      const metaTag = document.createElement('meta');
      metaTag.name = 'viewport-extra';
      metaTag.content = 'width=device-width, initial-scale=1, maximum-scale=1, mobile-web-app-capable=yes';
      document.head.appendChild(metaTag);
      
      // Set special class on body for mobile-specific CSS
      document.body.classList.add('mobile-browser');
    }
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow pt-24 md:pt-28">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mb-8">ProbateSwift</h1>
          <p className="text-xl text-center text-gray-600 mb-8">
            Navigate probate with ease—precise, swift support when it matters most
          </p>
          <div className="text-center">
            <a href="/auth" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
