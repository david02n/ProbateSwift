import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SwiftLogo, SwiftLogoWithText } from "@/components/ui/SwiftLogo";
import { Menu, User, LogOut, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

const Header: React.FC = () => {
  const { user: currentUser, logoutMutation } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll events for transparent/solid header transition
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Define navigation items based on authentication state
  const publicNavItems = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
  ];

  const authenticatedNavItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Documents", href: "/dashboard?tab=documents" },
    { label: "Tasks", href: "/dashboard?tab=tasks" },
  ];

  const navItems = currentUser ? authenticatedNavItems : publicNavItems;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
      scrolled ? "bg-white shadow-sm py-3" : "bg-transparent py-5"
    }`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link href={currentUser ? "/dashboard" : "/"}>
            <div className="flex items-center cursor-pointer">
              <SwiftLogoWithText height={36} />
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:block">
          <ul className="flex space-x-8">
            {navItems.map((item, index) => (
              <li key={index}>
                {item.href.startsWith('/') ? (
                  <Link 
                    href={item.href} 
                    className="font-medium text-charcoal/90 hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a 
                    href={item.href} 
                    className="font-medium text-charcoal/90 hover:text-primary transition-colors"
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="flex items-center space-x-4">
          {currentUser ? (
            /* Authenticated user actions */
            <>
              <div className="hidden md:flex items-center">
                <div className="mr-6 text-sm text-charcoal/70 hidden lg:block">
                  Hello, {currentUser.firstName || currentUser.email.split('@')[0]}
                </div>
                <Button 
                  variant="ghost" 
                  className="hidden md:inline-flex text-charcoal/90 hover:text-primary hover:bg-transparent"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
              <Link href="/dashboard">
                <Button className="bg-primary text-white hover:bg-primary/90 rounded-full shadow-sm">
                  <User className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </>
          ) : (
            /* Public user actions */
            <>
              <Link href="/auth">
                <Button 
                  variant="ghost" 
                  className="hidden md:inline-flex text-charcoal/90 hover:text-primary hover:bg-transparent"
                >
                  Log In
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-primary text-white hover:bg-primary/90 rounded-full shadow-sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
          
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
            <SheetContent className="w-[280px] sm:w-[320px]">
              <div className="flex flex-col gap-8 pt-8">
                <div className="flex items-center">
                  <SwiftLogoWithText height={32} />
                </div>
                <nav className="flex flex-col gap-4">
                  {navItems.map((item, index) => (
                    item.href.startsWith('/') ? (
                      <Link 
                        key={index}
                        href={item.href}
                        className="py-2 font-medium hover:text-primary transition-colors text-lg"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a 
                        key={index}
                        href={item.href}
                        className="py-2 font-medium hover:text-primary transition-colors text-lg"
                      >
                        {item.label}
                      </a>
                    )
                  ))}
                  <div className="flex flex-col gap-3 pt-6 mt-2 border-t border-gray-100">
                    {currentUser ? (
                      /* Authenticated mobile actions */
                      <>
                        <div className="text-sm text-charcoal/60 mb-2">
                          Signed in as {currentUser.firstName || currentUser.email.split('@')[0]}
                        </div>
                        <Link href="/dashboard" className="w-full">
                          <Button className="bg-primary text-white hover:bg-primary/90 w-full rounded-full">
                            Dashboard
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          className="border-gray-200 text-charcoal hover:bg-gray-50 w-full rounded-full"
                          onClick={handleLogout}
                        >
                          Logout
                        </Button>
                      </>
                    ) : (
                      /* Public mobile actions */
                      <>
                        <Link href="/auth" className="w-full">
                          <Button className="bg-primary text-white hover:bg-primary/90 w-full rounded-full">
                            Get Started
                          </Button>
                        </Link>
                        <Link href="/auth" className="w-full">
                          <Button 
                            variant="outline" 
                            className="border-gray-200 text-charcoal hover:bg-gray-50 w-full rounded-full"
                          >
                            Log In
                          </Button>
                        </Link>
                      </>
                    )}
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
