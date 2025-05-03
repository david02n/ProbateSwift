import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SwiftLogo } from "@/assets/SwiftLogo";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header className="bg-white shadow-sm w-full">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 mr-3">
            <SwiftLogo className="w-full h-full" />
          </div>
          <h1 className="text-2xl font-bold font-inter text-primary">ProbateSwift</h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:block">
          <ul className="flex space-x-8">
            {navItems.map((item, index) => (
              <li key={index}>
                <a 
                  href={item.href} 
                  className="font-inter font-medium hover:text-primary transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Link href="/auth">
            <Button 
              variant="outline" 
              className="hidden md:inline-flex border-primary text-primary hover:bg-primary hover:text-white"
            >
              Login
            </Button>
          </Link>
          <Link href="/auth">
            <Button className="bg-primary text-white hover:bg-primary/90">
              Get Started
            </Button>
          </Link>
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="md:hidden"
                aria-label="Menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col gap-6 pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 mr-2">
                    <SwiftLogo className="w-full h-full" />
                  </div>
                  <h2 className="text-xl font-bold text-primary">ProbateSwift</h2>
                </div>
                <nav className="flex flex-col gap-4">
                  {navItems.map((item, index) => (
                    <a 
                      key={index}
                      href={item.href}
                      className="py-2 font-medium hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                  <div className="flex flex-col gap-2 pt-4">
                    <Link href="/auth" className="w-full">
                      <Button 
                        variant="outline" 
                        className="border-primary text-primary hover:bg-primary hover:text-white w-full"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth" className="w-full">
                      <Button className="bg-primary text-white hover:bg-primary/90 w-full">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
