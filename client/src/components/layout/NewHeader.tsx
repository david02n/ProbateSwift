import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { SwiftLogoWithText } from "@/components/ui/SwiftLogo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { User, Settings, LogOut, Bell, HelpCircle } from "lucide-react";

interface HeaderProps {
  className?: string;
}

export const NewHeader: React.FC<HeaderProps> = ({ className = "" }) => {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isAuthenticated = !!user;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Navigation links - only shown when authenticated
  const navLinks = [
    { name: "Dashboard", path: "/", active: location === "/" },
    { name: "Executors", path: "/executors", active: location === "/executors" },
    { name: "Estate", path: "/estate", active: location === "/estate" },
    { name: "Documents", path: "/documents", active: location === "/documents" },
  ];

  return (
    <header className={`border-b border-gray-200 bg-white ${className}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="cursor-pointer">
              <SwiftLogoWithText height={35} />
            </Link>

            {/* Navigation Links - Show only when authenticated */}
            {isAuthenticated && (
              <nav className="hidden md:flex ml-8 space-x-1">
                {navLinks.map((link) => (
                  <Link key={link.path} href={link.path}>
                    <Button
                      variant={link.active ? "default" : "ghost"}
                      className={`rounded-full text-sm font-medium ${
                        link.active 
                          ? "bg-[#002B49] hover:bg-[#002B49]/90 text-white" 
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {link.name}
                    </Button>
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Profile Section - Show when authenticated */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-full w-10 h-10 p-0"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center p-2">
                    <div className="ml-2 space-y-1">
                      <p className="text-sm font-medium">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.email}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help & Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="outline">Log In</Button>
              </Link>
              <Link href="/auth?tab=register">
                <Button>Register</Button>
              </Link>
            </div>
          )}
          
          {/* Mobile menu button - show when authenticated */}
          {isAuthenticated && (
            <div className="md:hidden">
              <Button
                variant="ghost"
                className="p-2"
                onClick={() => setIsOpen(!isOpen)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {isAuthenticated && isOpen && (
          <nav className="md:hidden mt-2 pt-2 border-t">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <div key={link.path} onClick={() => window.location.href = link.path}>
                  <Button
                    variant={link.active ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      link.active ? "bg-primary text-white" : ""
                    }`}
                  >
                    {link.name}
                  </Button>
                </div>
              ))}
              <Button onClick={handleLogout} variant="ghost" className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default NewHeader;