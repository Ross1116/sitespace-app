"use client";

import { useAuth } from "@/app/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Calendar,
  Construction,
  Users,
  Clock,
  ChevronRight,
  // LogIn,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [greeting, setGreeting] = useState("Good day");

  // Set appropriate greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Quick access cards based on user role
  const getQuickAccessCards = () => {
    // Default cards for all users
    const cards = [
      {
        title: "Live Calendar View",
        icon: Calendar,
        description: "View all your bookings and schedule",
        link: "/multicalendar",
        color: "bg-green-100",
      },
      {
        title: "Manage Bookings",
        icon: Construction,
        description: "View and manage your scheduled bookings",
        link: "/bookings",
        color: "bg-blue-100",
      }      
    ];

    // Add role-specific cards
    if (user?.roles?.includes("admin") || user?.roles?.includes("manager")) {
      cards.push(
        {
          title: "Subcontractors",
          icon: Users,
          description: "View and manage your subcontractors",
          link: "/subcontractors",
          color: "bg-purple-100",
        }
        ,
        {
          title: "Assets",
          icon: Users,
          description: "View and manage your subcontractors",
          link: "/assets",
          color: "bg-amber-100",
        }
      );
    }

    return cards.slice(0, 4); // Limit to 4 cards
  };

  // Get recent activity (this would typically come from an API)
  const recentActivity = [
    {
      title: "New booking created",
      description: "Asset A booked for tomorrow",
      time: "2 hours ago",
    },
    {
      title: "Announcement posted",
      description: "Site closure notification for May 15th",
      time: "Yesterday",
    },
    {
      title: "Asset maintenance completed",
      description: "Excavator #103 is back in service",
      time: "3 days ago",
    },
  ];

  // Dashboard for authenticated users
  return (
    <Card className="px-6 sm:my-8 mx-4 bg-amber-50">
      {/* Header with greeting */}
      {isAuthenticated}
      <div className="p-3 sm:p-6">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
          {greeting}, {user?.username || "there"}!
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          Welcome to your site management dashboard
        </p>
      </div>

      {/* Quick access cards */}
      <div className="p-3 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {getQuickAccessCards().map((card, index) => (
            <Link href={card.link} key={`card-${index}`}>
              <Card
                className={`p-4 h-full hover:shadow-md transition-shadow ${card.color}`}
              >
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-white mr-3">
                    <card.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{card.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="flex flex-col md:flex-row gap-6 p-3 sm:p-6">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Activity
          </h2>
          <Card className="p-0 overflow-hidden">
            <div className="divide-y">
              {recentActivity.map((activity, index) => (
                <div key={`activity-${index}`} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-gray-800">
                      {activity.title}
                    </h3>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock size={12} className="mr-1" /> {activity.time}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 p-3 text-center">
              <Button variant="ghost" className="text-sm text-gray-600">
                View All Activity <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Calendar preview or upcoming events */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Upcoming Bookings
          </h2>
          <Card className="p-4">
            <div className="text-center py-8">
              <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
              <h3 className="font-medium text-gray-800">Your Schedule</h3>
              <p className="text-sm text-gray-600 mt-1">
                View your upcoming bookings and schedule
              </p>
              <Button className="mt-4 bg-amber-500 hover:bg-amber-600">
                <Link href="/multicalendar">View Calendar</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>© 2025 Sitespace. All rights reserved.</p>
      </div>
    </Card>
  );
}
