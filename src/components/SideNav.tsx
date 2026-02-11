"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  HardHat,
  CalendarRange,
  Megaphone,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";

// Define types for menu items
interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  visible: string[];
  onClick?: (e: React.MouseEvent) => void;
}

const SideNav = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    await logout();
  };

  const topMenuItems: MenuItem[] = [
    { icon: Home, label: "Home", href: "/home", visible: [] },
    {
      icon: Calendar,
      label: "Live Calendar",
      href: "/multicalendar",
      visible: [],
    },
    {
      icon: Users,
      label: "Subcontractor",
      href: "/subcontractors",
      visible: ["admin", "manager"],
    },
    {
      icon: HardHat,
      label: "Assets",
      href: "/assets",
      visible: ["admin", "manager"],
    },
    { icon: CalendarRange, label: "Bookings", href: "/bookings", visible: [] },
    // { icon: Megaphone, label: "Announcements", href: "/announcements", visible: [] },
  ];

  const bottomMenuItems: MenuItem[] = [
    { icon: Settings, label: "Settings", href: "#", visible: [] },
    {
      icon: LogOut,
      label: "Logout",
      href: "#",
      visible: [],
      onClick: handleLogout,
    },
  ];

  const hasPermission = (item: MenuItem): boolean => {
    if (!user || !isAuthenticated) return false;
    if (!item.visible || item.visible.length === 0) return true;
    const userRole = user.role?.toLowerCase().trim();
    if (!userRole) return false;
    return item.visible.some((role) => role.toLowerCase() === userRole);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderNavItem = (item: MenuItem, isMobile: boolean = false) => {
    const isActive = pathname === item.href;

    // Active Style
    const activeClasses = isActive
      ? "bg-gradient-to-r from-[var(--teal-gradient-strong)] to-transparent text-white border-l-[3px] border-[var(--teal)]"
      : "text-gray-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent";

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={(e) => {
          if (item.onClick) item.onClick(e);
          else if (isMobile) setIsMobileMenuOpen(false);
        }}
        // ANCHORING: Keep padding consistent so icons don't jump
        className={`group flex items-center h-12 mb-1 transition-all duration-200 relative overflow-hidden
          ${activeClasses}
          ${isMobile ? "px-6" : "pl-6"} 
        `}
      >
        <div className="flex items-center justify-center flex-shrink-0">
          <item.icon
            size={20}
            className={`transition-colors duration-200 ${
              isActive ? "text-white" : "text-gray-400 group-hover:text-white"
            }`}
            strokeWidth={1.5}
          />
        </div>

        <span
          className={`ml-4 text-sm font-medium tracking-wide whitespace-nowrap transition-all duration-300 ease-in-out
            ${
              isMobile
                ? "opacity-100 translate-x-0"
                : isExpanded
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-2 pointer-events-none"
            }
          `}
        >
          {item.label}
        </span>

        {!isMobile && !isExpanded && (
          <div className="absolute left-20 z-50 bg-navy-light text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border border-white/10 shadow-xl">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* 
        1. GHOST SPACER (The "Push") 
        This div sits in the normal document flow.
        - w-20: Matches the collapsed sidebar width (80px)
        - ml-4: Matches the sidebar's left position (16px)
        - mr-4: Creates the margin to the right of the nav (16px)
        - flex-shrink-0: Ensures it doesn't get squished
      */}
      <div
        className="hidden md:block w-20 ml-4 flex-shrink-0 h-screen"
        aria-hidden="true"
      />

      {/* 2. MOBILE TOGGLE */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-navy text-white md:hidden shadow-lg border border-white/10"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu" aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 3. MOBILE MENU OVERLAY */}
      <div
        className={`fixed inset-0 z-40 flex md:hidden transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className="relative w-72 h-full bg-navy border-r border-white/10 flex flex-col shadow-2xl">
          <div className="h-24 flex items-center px-6 border-b border-white/5">
            <Image
              src="/full-logo-dark.svg"
              alt="Logo"
              width={140}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <div className="py-6 flex-1 overflow-y-auto">
            {user && (
              <div className="mb-6 px-6 pb-4 border-b border-white/10">
                <p className="text-white font-semibold">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
            )}
            <div className="space-y-1">
              {topMenuItems
                .filter(hasPermission)
                .map((item) => renderNavItem(item, true))}
            </div>
          </div>
          <div className="py-4 border-t border-white/10 bg-navy-light/30">
            {bottomMenuItems
              .filter(hasPermission)
              .map((item) => renderNavItem(item, true))}
          </div>
        </div>
      </div>

      {/* 4. DESKTOP FLOATING SIDEBAR */}
      <aside
        className={`fixed left-4 top-4 bottom-4 hidden md:flex flex-col bg-navy rounded-2xl border border-white/5 shadow-2xl transition-[width] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] z-100 overflow-hidden
          ${isExpanded ? "w-64" : "w-20"}
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onFocus={() => setIsExpanded(true)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsExpanded(false); }}
      >
        {/* LOGO AREA */}
        <div className="h-24 flex items-center flex-shrink-0 pl-6 mb-2">
          <div className="relative w-full h-10 flex items-center">
            {/* Collapsed Icon */}
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 transition-opacity duration-300 ${isExpanded ? "opacity-0" : "opacity-100"}`}
            >
              <Image
                src="/icon.svg"
                alt="Icon"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            {/* Full Logo */}
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 transition-opacity duration-300 ${isExpanded ? "opacity-100 delay-75" : "opacity-0"}`}
            >
              <Image
                src="/full-logo-dark.svg"
                alt="SiteSpace"
                width={140}
                height={40}
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <div className="flex-1 py-2 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col gap-1">
          {topMenuItems
            .filter(hasPermission)
            .map((item) => renderNavItem(item))}
        </div>

        {/* FOOTER */}
        <div className="py-4 border-t border-white/5 bg-navy-light/20 flex-shrink-0">
          {bottomMenuItems
            .filter(hasPermission)
            .map((item) => renderNavItem(item))}
        </div>
      </aside>
    </>
  );
};

export default SideNav;

