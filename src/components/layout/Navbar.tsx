import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import SignOutButton from "@/components/auth/SignOutButton";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  // Updated menu items: Removed FAQ and Documentation
  const menuItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Connect Wallet", path: "/connect-wallet" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/80 backdrop-blur-md border-b border-slate-100 py-3 shadow-sm"
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo - Minimal Text Only */}
          <Link to="/" className="flex-shrink-0 group">
            <img
              src="/images/logo.png"
              alt="OFS Ledger"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Menu - Clean Text Links */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-sm font-medium transition-colors relative py-1 hover:text-indigo-600",
                  isActive(item.path)
                    ? "text-slate-900"
                    : "text-slate-500"
                )}
              >
                {item.name}
                {isActive(item.path) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full"></span>
                )}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="font-medium text-slate-600 hover:text-indigo-600">My Profile</Button>
                </Link>
                <SignOutButton
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Sign out
                </SignOutButton>
              </div>
            ) : (
              <>
                <Link to="/sign-in">
                  <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium">
                    Log in
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 transition-all duration-300 shadow-md hover:shadow-lg">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-900 hover:bg-slate-50 focus:outline-none transition-colors"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu (Full Screen Overlay Style) */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-[64px] z-40 bg-white md:hidden overflow-y-auto animate-in fade-in zoom-in-95 duration-200 border-t border-slate-100">
          <div className="px-6 py-8 space-y-6">
            <div className="flex flex-col gap-6">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "text-3xl font-bold tracking-tight transition-colors",
                    isActive(item.path)
                      ? "text-indigo-600"
                      : "text-slate-900 hover:text-indigo-600"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="pt-8 mt-4 border-t border-slate-100 flex flex-col gap-4">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button variant="outline" size="lg" className="w-full justify-start text-lg h-12 border-slate-200 text-slate-700">
                      My Profile
                    </Button>
                  </Link>
                  <SignOutButton
                    variant="ghost"
                    className="w-full justify-start text-lg h-12 text-red-600 hover:bg-red-50"
                  />
                </>
              ) : (
                <>
                  <Link
                    to="/sign-in"
                    className="w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button variant="outline" size="lg" className="w-full text-lg h-14 border-slate-200 rounded-xl text-slate-900 hover:bg-slate-50">
                      Log in
                    </Button>
                  </Link>
                  <Link
                    to="/sign-up"
                    className="w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button size="lg" className="w-full text-lg h-14 bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-lg">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
export default Navbar;
