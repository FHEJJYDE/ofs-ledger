import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wallet,
  ArrowDownToLine,
  Shield,
  User,
  LayoutDashboard,
  Users,
  LogOut,
  KeyRound,
  Settings,
  FileCheck,
  CreditCard
} from "lucide-react";

interface SidebarProps {
  isMobileMenuOpen: boolean;
  closeMobileMenu: () => void;
}

const Sidebar = ({ isMobileMenuOpen, closeMobileMenu }: SidebarProps) => {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  // Check if user is admin based on profile role or URL path
  const isAdmin = profile?.role === "admin" || location.pathname.startsWith("/admin");

  // Define navigation items for users
  const userNavItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Connect Wallet",
      path: "/dashboard/connect-wallet",
      icon: <KeyRound className="h-5 w-5" />,
    },
    {
      name: "Withdrawals",
      path: "/dashboard/withdrawals",
      icon: <ArrowDownToLine className="h-5 w-5" />,
    },
    {
      name: "KYC Center",
      path: "/dashboard/kyc",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      name: "Profile",
      path: "/dashboard/profile",
      icon: <User className="h-5 w-5" />,
    },
  ];

  // Define navigation items for admins
  const adminNavItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "KYC Verification",
      path: "/admin/kyc",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      name: "Withdrawals",
      path: "/admin/withdrawals",
      icon: <ArrowDownToLine className="h-5 w-5" />,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  // Select the appropriate navigation items based on user role
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:z-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          "bg-white border-r border-gray-200"
        )}
      >
        <div className="flex h-16 items-center border-b px-6 gap-2">
          <img
            src="/images/logo.png"
            alt="OFS Ledger"
            className="h-8 w-8"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo-fallback.png";
            }}
          />
          <span className="font-bold text-xl text-gray-900">
            OFS Ledger
          </span>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="px-3 py-4">
            <div className="mb-4">
              <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500">
                {isAdmin ? "Admin Navigation" : "Navigation"}
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )
                    }
                    end={item.path === "/dashboard" || item.path === "/admin"}
                  >
                    {item.icon}
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="mt-auto">
              <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500">
                Account
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-gray-100 hover:text-red-700"
                onClick={(e) => {
                  e.preventDefault();
                  signOut();
                }}
              >
                <LogOut className="h-5 w-5" />
                Log Out
              </Button>
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};

export default Sidebar;
