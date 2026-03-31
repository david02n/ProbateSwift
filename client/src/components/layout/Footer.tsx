import React from "react";
import { Link } from "wouter";
import { SwiftLogoWithText } from "@/components/ui/SwiftLogo";
import { openCookieSettings } from "@/lib/cookie-consent";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#002B49] py-12 text-white">
      <div className="container mx-auto px-4">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center">
              <SwiftLogoWithText height={35} className="brightness-0 invert" />
            </div>
            <p className="mb-4 text-white">Simplifying probate for families across the UK.</p>
            <p className="text-sm text-white/80">
              02n Ltd
              <br />
              167-169 Great Portland Street
              <br />
              London W1W 5PF
              <br />
              support@02n.ltd
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-white">Features</h4>
            <ul className="space-y-2">
              <li><a href="/#features" className="text-white transition-colors hover:text-[#3AAFA9]">Features</a></li>
              <li><a href="/#how-it-works" className="text-white transition-colors hover:text-[#3AAFA9]">How it works</a></li>
              <li><a href="/#pricing" className="text-white transition-colors hover:text-[#3AAFA9]">Pricing</a></li>
              <li><a href="/#faq" className="text-white transition-colors hover:text-[#3AAFA9]">FAQs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-white">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/auth" className="text-white transition-colors hover:text-[#3AAFA9]">Sign in</Link></li>
              <li><a href="mailto:support@02n.ltd" className="text-white transition-colors hover:text-[#3AAFA9]">Contact support</a></li>
              <li><a href="/#faq" className="text-white transition-colors hover:text-[#3AAFA9]">FAQs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-white">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-white transition-colors hover:text-[#3AAFA9]">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-white transition-colors hover:text-[#3AAFA9]">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="text-white transition-colors hover:text-[#3AAFA9]">Cookie Policy</Link></li>
              <li>
                <button
                  type="button"
                  onClick={openCookieSettings}
                  className="text-white transition-colors hover:text-[#3AAFA9]"
                >
                  Cookie settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-6 text-center text-sm text-white">
          <p>&copy; {currentYear} 02n Ltd. All rights reserved. ProbateSwift is operated from England and Wales.</p>
          <p className="mt-2">Not a substitute for professional legal or financial advice.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
