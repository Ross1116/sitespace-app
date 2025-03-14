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
  Bell,
  ChevronRight,
  LogIn,
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

  // If not authenticated, show a welcome page with login button
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-orange-50">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Welcome to Sitespace
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Your all-in-one solution for construction site scheduling and asset
            management
          </p>

          <div className="bg-white p-8 rounded-xl shadow-lg mb-10">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Streamline Your Construction Operations
                </h2>
                <ul className="text-gray-600 space-y-2 text-left">
                  <li className="flex items-start">
                    <span className="mr-2 text-amber-500">✓</span>
                    Manage all your construction assets in one place
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-amber-500">✓</span>
                    Coordinate subcontractors efficiently
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-amber-500">✓</span>
                    Track bookings and schedules in real-time
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-amber-500">✓</span>
                    Receive important announcements instantly
                  </li>
                </ul>
              </div>

              <div className="w-full md:w-auto">
                <div className="bg-amber-100 p-4 rounded-lg">
                  {/* Placeholder for an illustration/image */}
                  <div className="h-48 w-48 md:h-64 md:w-64 mx-auto flex items-center justify-center bg-amber-200 rounded-lg">
                    <Construction size={64} className="text-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            <Button
              asChild
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-lg px-4 py-4 h-auto"
            >
              <Link href="/login" className="flex items-center">
                <LogIn className="mr-1" size={24} />
                <span>Log In to Your Account</span>
              </Link>
            </Button>

            <p className="mt-4 text-gray-500">
              Don&apos;t have an account? Contact your manager.
            </p>
          </div>

          <div className="text-gray-500 text-sm">
            © 2025 Sitespace. All rights reserved.
          </div>
        </div>
      </div>
    );
  }

  // Quick access cards based on user role
  const getQuickAccessCards = () => {
    // Default cards for all users
    const cards = [
      {
        title: "Bookings",
        icon: Calendar,
        description: "View and manage your scheduled bookings",
        link: "/bookings",
        color: "bg-blue-100",
      },
      {
        title: "Announcements",
        icon: Bell,
        description: "Check the latest updates and notices",
        link: "#",
        color: "bg-amber-100",
      },
    ];

    // Add role-specific cards
    if (user?.roles?.includes("admin") || user?.roles?.includes("manager")) {
      cards.unshift(
        {
          title: "Assets",
          icon: Construction,
          description: "Manage your construction assets",
          link: "/assets",
          color: "bg-green-100",
        },
        {
          title: "Subcontractors",
          icon: Users,
          description: "View and manage your subcontractors",
          link: "/subcontractors",
          color: "bg-purple-100",
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {greeting}, {user?.username || "there"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome to your site management dashboard
        </p>
      </div>

      {/* Quick access cards */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Access</h2>
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

      {/* Recent activity */}
      <div className="flex flex-col md:flex-row gap-6">
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
                <Link href="/bookings">View Calendar</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>© 2025 Sitespace. All rights reserved.</p>
      </div>
    </div>
  );
}
