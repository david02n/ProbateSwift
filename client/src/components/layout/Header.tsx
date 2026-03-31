import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SwiftLogoWithText } from "@/components/ui/SwiftLogo";
import { Menu, User, LogOut, Smartphone } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface NavItem {
  label: string;
  href: string;
  onClick?: () => void;
}

const Header: React.FC = () => {
  const { user: currentUser, logoutMutation } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };

    checkMobile();
  }, []);

  const publicNavItems: NavItem[] = [
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Assessment", href: "#", onClick: () => window.dispatchEvent(new CustomEvent("open-assessment")) },
    { label: "FAQ", href: "/#faq" },
  ];

  const authenticatedNavItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Documents", href: "/dashboard?tab=documents" },
    { label: "Tasks", href: "/dashboard?tab=tasks" },
  ];

  const navItems = currentUser ? authenticatedNavItems : publicNavItems;

  const handleLogout = () => {
    toast({
      title: "Logging out...",
      description: "Please wait while we sign you out",
    });

    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logout successful",
          description: "You have been signed out",
        });

        if (isMobile) {
          window.location.href = "/";
        }
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Logout failed",
          description: "There was a problem signing you out. Please try again.",
        });
      },
    });
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-white py-3 shadow-sm" : "bg-white py-5"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6">
        <div className="flex items-center">
          <Link href={currentUser ? "/dashboard" : "/"}>
            <div className="flex cursor-pointer items-center">
              <SwiftLogoWithText height={36} />
            </div>
          </Link>
        </div>

        <nav className="hidden md:block">
          <ul className="flex space-x-8">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.href.startsWith("/") ? (
                  <Link href={item.href} className="font-medium text-charcoal/90 transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                ) : item.onClick ? (
                  <button
                    onClick={item.onClick}
                    className="cursor-pointer border-none bg-transparent p-0 font-medium text-charcoal/90 transition-colors hover:text-primary"
                  >
                    {item.label}
                  </button>
                ) : (
                  <a href={item.href} className="font-medium text-charcoal/90 transition-colors hover:text-primary">
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center space-x-4">
          {currentUser ? (
            <>
              <div className="hidden items-center md:flex">
                <div className="mr-6 hidden text-sm text-charcoal/70 lg:block">
                  Hello, {currentUser.firstName || currentUser.email.split("@")[0]}
                </div>
                <Button
                  variant="ghost"
                  className="hidden text-charcoal/90 hover:bg-transparent hover:text-primary md:inline-flex"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
              <Link href="/dashboard">
                <Button className="min-w-[120px] justify-center rounded-full bg-primary px-6 py-2 text-white shadow-sm hover:bg-primary/90">
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth">
                <Button variant="ghost" className="hidden text-charcoal/90 hover:bg-transparent hover:text-primary md:inline-flex">
                  {isMobile ? (
                    <span className="flex items-center">
                      <Smartphone className="mr-1 h-3 w-3" />
                      Mobile Login
                    </span>
                  ) : (
                    "Log In"
                  )}
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="min-w-[120px] justify-center rounded-full bg-primary px-6 py-2 text-white shadow-sm hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[280px] sm:w-[320px]">
              <div className="flex flex-col gap-8 pt-8">
                <div className="flex items-center">
                  <SwiftLogoWithText height={32} />
                </div>
                <nav className="flex flex-col gap-4">
                  {navItems.map((item) =>
                    item.href.startsWith("/") ? (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="py-2 text-lg font-medium transition-colors hover:text-primary"
                      >
                        {item.label}
                      </Link>
                    ) : item.onClick ? (
                      <button
                        key={item.label}
                        onClick={item.onClick}
                        className="w-full cursor-pointer border-none bg-transparent py-2 text-left text-lg font-medium transition-colors hover:text-primary"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <a
                        key={item.label}
                        href={item.href}
                        className="py-2 text-lg font-medium transition-colors hover:text-primary"
                      >
                        {item.label}
                      </a>
                    ),
                  )}
                  <div className="mt-2 flex flex-col gap-3 border-t border-gray-100 pt-6">
                    {currentUser ? (
                      <>
                        <div className="mb-2 text-sm text-charcoal/60">
                          Signed in as {currentUser.firstName || currentUser.email.split("@")[0]}
                        </div>
                        <Link href="/dashboard" className="w-full">
                          <Button className="w-full justify-center rounded-full bg-primary py-2 text-white hover:bg-primary/90">
                            Dashboard
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="w-full justify-center rounded-full border-gray-200 py-2 text-charcoal hover:bg-gray-50"
                          onClick={(e) => {
                            e.preventDefault();
                            handleLogout();
                          }}
                        >
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth" className="w-full">
                          <Button className="w-full justify-center rounded-full bg-primary py-2 text-white hover:bg-primary/90">
                            Get Started
                          </Button>
                        </Link>
                        <Link href="/auth" className="w-full">
                          <Button
                            variant="outline"
                            className="w-full justify-center rounded-full border-gray-200 py-2 text-charcoal hover:bg-gray-50"
                          >
                            {isMobile ? (
                              <span className="flex items-center justify-center">
                                <Smartphone className="mr-2 h-4 w-4" />
                                Mobile Login
                              </span>
                            ) : (
                              "Log In"
                            )}
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
