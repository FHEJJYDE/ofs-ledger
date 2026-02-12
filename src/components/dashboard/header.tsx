import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Bell,
  UserCircle,
  LogOut,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

const Header = ({ isMobileMenuOpen, toggleMobileMenu }: HeaderProps) => {
  const { user, profile, signOut } = useAuth();

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-4 md:px-6 transition-colors duration-200 bg-white border-gray-200 text-gray-900"
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle Menu"
        className="md:hidden"
        onClick={toggleMobileMenu}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img
            src="/images/logo.png"
            alt="OFS Ledger"
            className="h-8 w-8"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo-fallback.png";
            }}
          />
          <span className="font-bold text-xl hidden sm:inline-block">OFS Ledger</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full relative hover:bg-gray-100"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-full hover:bg-gray-100"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                <UserCircle className="h-6 w-6" />
              </div>
              <span className="font-medium hidden md:inline-block">
                {profile?.email || user?.email || "User"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/profile" className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                signOut();
              }}
              className="cursor-pointer text-red-500 focus:text-red-500"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
