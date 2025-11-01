"use client";

import Link from "next/link";
import {
  Home,
  Calendar,
  HardHat,
  Construction,
  CalendarRangeIcon,
  Speaker,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Card } from "./ui/card";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

// Define types for menu items
interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  visible: string[]; // Empty array = available to all
  onClick?: (e: React.MouseEvent) => void;
}

interface MenuSection {
  items: MenuItem[];
}

const SideNav = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Handle logout function
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    setIsMobileMenuOpen(false);
    router.push("/login");
  };

  const menuItems: MenuSection[] = [
    {
      items: [
        {
          icon: Home,
          label: "Home",
          href: "/home",
          visible: [], // ✅ Available to everyone
        },
        {
          icon: Calendar,
          label: "Live calendar view",
          href: "/multicalendar",
          visible: [], // ✅ Available to everyone
        },
        {
          icon: HardHat,
          label: "Subcontractors",
          href: "/subcontractors",
          visible: ["admin", "manager"], // 🔒 Restricted
        },
        {
          icon: Construction,
          label: "Assets",
          href: "/assets",
          visible: ["admin", "manager"], // 🔒 Restricted
        },
        {
          icon: CalendarRangeIcon,
          label: "Bookings",
          href: "/bookings",
          visible: [], // ✅ Available to everyone
        },
        {
          icon: Speaker,
          label: "Announcements",
          href: "#",
          visible: [], // ✅ Available to everyone
        },
      ],
    },
    {
      items: [
        {
          icon: User,
          label: "Profile",
          href: "#",
          visible: [], // ✅ Available to everyone
        },
        {
          icon: Settings,
          label: "Settings",
          href: "#",
          visible: [], // ✅ Available to everyone
        },
        {
          icon: LogOut,
          label: "Logout",
          href: "#",
          visible: [], // ✅ Available to everyone
          onClick: handleLogout,
        },
      ],
    },
  ];

  // Function to get user role (single role from AuthContext)
  const getUserRole = (): string | null => {
    if (!user?.role) return null;
    return user.role.toLowerCase().trim();
  };

  // Function to check if the current user has permission to see a menu item
  const hasPermission = (item: MenuItem): boolean => {
    // If not authenticated, hide all items
    if (!user || !isAuthenticated) return false;

    // ✅ Empty visible array = available to all authenticated users
    if (!item.visible || item.visible.length === 0) {
      return true;
    }

    const userRole = getUserRole();
    if (!userRole) return false;

    // Check if user's role is in the item's visible array
    return item.visible.some((role) => role.toLowerCase() === userRole);
  };

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Hamburger Button - Fixed Position */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-amber-100 md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Container - Fixed Full Screen */}
      <div
        className={`fixed inset-0 z-40 flex md:hidden transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Dark Overlay */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Mobile Menu Content */}
        <Card className="relative w-64 h-full bg-amber-50 rounded-none">
          <div className="pt-16 overflow-y-auto h-full">
            {/* User Info Section */}
            {user && (
              <div className="px-4 py-3 mb-4 border-b border-amber-200">
                <p className="text-sm font-medium text-gray-700">
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role || user.user_type || "User"}
                </p>
              </div>
            )}

            {menuItems.map((section, sectionIndex) => {
              // Filter items based on user permissions
              const visibleItems = section.items.filter((item) =>
                hasPermission(item)
              );

              // Only render section if it has visible items
              if (visibleItems.length === 0) return null;

              return (
                <div
                  className="flex flex-col gap-2 px-2 mb-4"
                  key={`section-${sectionIndex}`}
                >
                  {visibleItems.map((item, itemIndex) => (
                    <Link
                      href={item.href}
                      key={`item-${sectionIndex}-${itemIndex}-${item.label}`}
                      className="flex items-center px-4 py-3 text-gray-700 rounded-md hover:bg-amber-100 transition-colors group"
                      onClick={(e) => {
                        if (item.onClick) {
                          item.onClick(e);
                        } else {
                          setIsMobileMenuOpen(false);
                        }
                      }}
                    >
                      <div className="flex items-center justify-center min-w-8">
                        {item.icon && <item.icon size={20} />}
                      </div>
                      <span className="ml-3">{item.label}</span>
                    </Link>
                  ))}

                  {/* Add divider between sections */}
                  {sectionIndex < menuItems.length - 1 && (
                    <div className="h-px bg-amber-200 my-2" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Desktop Sidebar */}
      <Card
        className={`fixed hidden md:block transition-all duration-300 text-sm bg-amber-50 h-full z-30
          rounded-r-2xl rounded-b-2xl rounded-l-none rounded-bl-none
          ${isExpanded ? "w-48" : "w-16"}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="pt-6 overflow-hidden">
          {/* User Info Section (Desktop - Expanded) */}
          {user && isExpanded && (
            <div className="px-4 py-3 mb-4 border-b border-amber-200">
              <p className="text-xs font-medium text-gray-700 truncate">
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user.role || user.user_type || "User"}
              </p>
            </div>
          )}

          {menuItems.map((section, sectionIndex) => {
            // Filter items based on user permissions
            const visibleItems = section.items.filter((item) =>
              hasPermission(item)
            );

            // Only render section if it has visible items
            if (visibleItems.length === 0) return null;

            return (
              <div
                className="flex flex-col gap-2 mb-4"
                key={`section-${sectionIndex}`}
              >
                {visibleItems.map((item, itemIndex) => (
                  <Link
                    href={item.href}
                    key={`item-${sectionIndex}-${itemIndex}-${item.label}`}
                    className="flex items-center px-4 py-3 text-gray-700 rounded-md hover:bg-amber-100 transition-colors group relative"
                    onClick={(e) => item.onClick && item.onClick(e)}
                  >
                    <div className="flex items-center justify-center min-w-8">
                      {item.icon && <item.icon size={20} />}
                    </div>
                    <span
                      className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 
                        ${
                          isExpanded
                            ? "max-w-[150px] opacity-100"
                            : "max-w-0 opacity-0"
                        }`}
                    >
                      {item.label}
                    </span>

                    {/* Tooltip for collapsed state */}
                    {!isExpanded && (
                      <div className="absolute left-16 bg-gray-800 text-white px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                        {item.label}
                      </div>
                    )}
                  </Link>
                ))}

                {/* Add divider between sections (except last) */}
                {sectionIndex < menuItems.length - 1 && isExpanded && (
                  <div className="h-px bg-amber-200 mx-4 my-2" />
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
};

export default SideNav;