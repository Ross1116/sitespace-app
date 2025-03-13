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
} from "lucide-react";
import { Card } from "./ui/card";
import { useState } from "react";


const menuItems = [
  {
    items: [
      {
        icon: Home,
        label: "Home",
        href: "/",
        visible: ["admin", "manager", "subcontractor"],
      },
      {
        icon: Calendar,
        label: "Live asset view",
        href: "/multicalendar",
        visible: ["admin", "manager"],
      },
      {
        icon: HardHat,
        label: "Subcontractors",
        href: "/list/subcontractors",
        visible: ["admin", "manager"],
      },
      {
        icon: Construction,
        label: "Assets",
        href: "/list/projects",
        visible: ["admin", "manager"],
      },
      {
        icon: CalendarRangeIcon,
        label: "Bookings",
        href: "/list/events",
        visible: ["admin", "manager", "subcontractor"],
      },
      {
        icon: Speaker,
        label: "Announcements",
        href: "/list/announcements",
        visible: ["admin", "manager", "subcontractor"],
      },
    ],
  },
  {
    items: [
      {
        icon: User,
        label: "Profile",
        href: "/profile",
        visible: ["admin", "manager", "subcontractor"],
      },
      {
        icon: Settings,
        label: "Settings",
        href: "/settings",
        visible: ["admin", "manager", "subcontractor"],
      },
      {
        icon: LogOut,
        label: "Logout",
        href: "/logout",
        visible: ["admin", "manager", "subcontractor"],
      },
    ],
  },
];


const SideNav = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
      <Card 
        className={`transition-all duration-300 text-sm bg-amber-50 h-full rounded-r-2xl rounded-b-2xl rounded-l-none rounded-bl-none ${isExpanded ? 'w-48' : 'w-16'}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="pt-6 overflow-hidden">
          {menuItems.map((section, sectionIndex) => (
            <div className="flex flex-col gap-2" key={`section-${sectionIndex}`}>
              {section.items.map((item, itemIndex) => (
                <Link
                  href={item.href}
                  key={`item-${sectionIndex}-${itemIndex}-${item.label}`}
                  className="flex items-center px-4 py-3 text-gray-500 rounded-md hover:bg-amber-100 group relative"
                >
                  <div className="flex items-center justify-center min-w-8">
                    {item.icon && <item.icon size={20} />}
                  </div>
                  <span 
                    className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${
                      isExpanded ? 'max-w-[150px] opacity-100' : 'max-w-0 opacity-0'
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
          ))}
        </div>
      </Card>
    );
  };
  
  export default SideNav;