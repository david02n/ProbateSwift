import React from "react";
import { SwiftLogo, SwiftLogoWithText } from "@/components/ui/SwiftLogo";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-12 bg-charcoal text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center mb-4">
              <SwiftLogoWithText height={35} className="brightness-0 invert" />
            </div>
            <p className="mb-4">Simplifying probate for families across the UK.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-accent transition-colors">
                <svg
                  className="w-5 h-5"
                  stroke="currentColor"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#" className="text-white hover:text-accent transition-colors">
                <svg
                  className="w-5 h-5"
                  stroke="currentColor"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
              <a href="#" className="text-white hover:text-accent transition-colors">
                <svg
                  className="w-5 h-5"
                  stroke="currentColor"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold font-inter mb-4">Features</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Initial Assessment</a></li>
              <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Will Verification</a></li>
              <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Estate Valuation</a></li>
              <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Tax Handling</a></li>
              <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Document Generator</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold font-inter mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Help Centre</a></li>
              <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Probate Guides</a></li>
              <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Blog</a></li>
              <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Contact Support</a></li>
              <li><a href="#" className="text-white/80 hover:text-accent transition-colors">FAQs</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold font-inter mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Data Processing</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-6 border-t border-white/20 text-center text-white/60 text-sm">
          <p>&copy; {currentYear} ProbateSwift Ltd. All rights reserved. Registered in England and Wales.</p>
          <p className="mt-2">Not a substitute for professional legal or financial advice.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
