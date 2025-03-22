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
  visible: string[];
  onClick?: (e: React.MouseEvent) => void;
}

interface MenuSection {
  items: MenuItem[];
}

// Define a type for the user
interface UserData {
  id: string | null;
  username: string;
  email: string;
  roles: string | string[] | any; // Accept different possible formats
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
          visible: ["admin", "manager", "contractor"],
        },
        {
          icon: Calendar,
          label: "Live calendar view",
          href: "/multicalendar",
          visible: ["admin", "manager"],
        },
        {
          icon: HardHat,
          label: "Subcontractors",
          href: "/subcontractors",
          visible: ["admin", "manager"],
        },
        {
          icon: Construction,
          label: "Assets",
          href: "/assets",
          visible: ["admin", "manager"],
        },
        {
          icon: CalendarRangeIcon,
          label: "Bookings",
          href: "/bookings",
          visible: ["admin", "manager", "contractor"],
        },
        {
          icon: Speaker,
          label: "Announcements",
          href: "#",
          visible: ["admin", "manager", "contractor"],
        },
      ],
    },
    {
      items: [
        {
          icon: User,
          label: "Profile",
          href: "#",
          visible: ["admin", "manager", "contractor"],
        },
        {
          icon: Settings,
          label: "Settings",
          href: "#",
          visible: ["admin", "manager", "contractor"],
        },
        {
          icon: LogOut,
          label: "Logout",
          href: "#",
          visible: ["admin", "manager", "contractor"],
          onClick: handleLogout,
        },
      ],
    },
  ];

  // Function to extract roles as a string array regardless of original format
  const getUserRoles = (user: UserData | null): string[] => {
    if (!user || !user.roles) return [];

    if (typeof user.roles === "string") {
      return user.roles.split(",").map((role) => role.trim().toLowerCase());
    }

    if (Array.isArray(user.roles)) {
      return user.roles.map((role) =>
        typeof role === "string"
          ? role.toLowerCase()
          : String(role).toLowerCase()
      );
    }

    // Fallback for any other format
    return [String(user.roles).toLowerCase()];
  };

  // Function to check if the current user has permission to see a menu item
  const hasPermission = (item: MenuItem): boolean => {
    if (!user || !isAuthenticated) return false;

    const userRoles = getUserRoles(user as UserData);

    // Check if any of the user's roles are in the item's visible array
    return item.visible.some((role) => userRoles.includes(role.toLowerCase()));
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
          className="absolute inset-0"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Mobile Menu Content */}
        <Card className="relative w-64 h-full bg-amber-50 rounded-none">
          <div className="pt-16 overflow-y-auto h-full">
            {menuItems.map((section, sectionIndex) => {
              // Filter items based on user permissions
              const visibleItems = section.items.filter((item) =>
                hasPermission(item)
              );

              // Only render section if it has visible items
              if (visibleItems.length === 0) return null;

              return (
                <div
                  className="flex flex-col gap-2"
                  key={`section-${sectionIndex}`}
                >
                  {visibleItems.map((item, itemIndex) => (
                    <Link
                      href={item.href}
                      key={`item-${sectionIndex}-${itemIndex}-${item.label}`}
                      className="flex items-center px-4 py-3 text-gray-500 rounded-md hover:bg-amber-100 group"
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
          {menuItems.map((section, sectionIndex) => {
            // Filter items based on user permissions
            const visibleItems = section.items.filter((item) =>
              hasPermission(item)
            );

            // Only render section if it has visible items
            if (visibleItems.length === 0) return null;

            return (
              <div
                className="flex flex-col gap-2"
                key={`section-${sectionIndex}`}
              >
                {visibleItems.map((item, itemIndex) => (
                  <Link
                    href={item.href}
                    key={`item-${sectionIndex}-${itemIndex}-${item.label}`}
                    className="flex items-center px-4 py-3 text-gray-500 rounded-md hover:bg-amber-100 group relative"
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
                      <div className="absolute left-16 bg-white px-2 py-1 rounded shadow-md text-xs whitespace-nowrap z-10 opacity-0 group-hover:opacity-100 pointer-events-none">
                        {item.label}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
};

export default SideNav;
