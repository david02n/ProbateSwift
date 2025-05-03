import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SwiftLogo } from "@/assets/SwiftLogo";
import { Menu, User, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

const Header: React.FC = () => {
  const { user: currentUser, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Define navigation items based on authentication state
  const publicNavItems = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Testimonials", href: "#testimonials" },
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
    <header className="bg-white shadow-sm w-full">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href={currentUser ? "/dashboard" : "/"}>
            <div className="flex items-center cursor-pointer">
              <div className="w-10 h-10 mr-3">
                <SwiftLogo className="w-full h-full" />
              </div>
              <h1 className="text-2xl font-bold font-inter text-primary">ProbateSwift</h1>
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
                    className="font-inter font-medium hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a 
                    href={item.href} 
                    className="font-inter font-medium hover:text-primary transition-colors"
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
                <div className="mr-4 text-sm text-charcoal/70">
                  Hello, {currentUser.firstName || currentUser.email.split('@')[0]}
                </div>
                <Button 
                  variant="outline" 
                  className="hidden md:inline-flex border-primary text-primary hover:bg-primary hover:text-white"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
              <Link href="/dashboard">
                <Button className="bg-primary text-white hover:bg-primary/90">
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
                    item.href.startsWith('/') ? (
                      <Link 
                        key={index}
                        href={item.href}
                        className="py-2 font-medium hover:text-primary transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a 
                        key={index}
                        href={item.href}
                        className="py-2 font-medium hover:text-primary transition-colors"
                      >
                        {item.label}
                      </a>
                    )
                  ))}
                  <div className="flex flex-col gap-2 pt-4">
                    {currentUser ? (
                      /* Authenticated mobile actions */
                      <>
                        <Link href="/dashboard" className="w-full">
                          <Button className="bg-primary text-white hover:bg-primary/90 w-full">
                            Dashboard
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          className="border-primary text-primary hover:bg-primary hover:text-white w-full"
                          onClick={handleLogout}
                        >
                          Logout
                        </Button>
                      </>
                    ) : (
                      /* Public mobile actions */
                      <>
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
