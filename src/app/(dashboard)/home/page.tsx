"use client";

import { useAuth } from "@/app/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Calendar, Construction, Users, Clock } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import ProjectSelector from "@/components/home/RadioToggle";

interface Booking {
  bookingKey: string;
  bookingTitle: string;
  bookingDescription?: string;
  bookingNotes?: string;
  bookingTimeDt: string;
  bookingStatus: "Confirmed" | "Pending" | "Denied" | string;
  bookingFor: string;
  bookedAssets: string[];
}

export default function HomePage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Good day");
  const [project, setProject] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const hasFetched = useRef(false);
  const userId = user?.userId;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const fetchProjects = async () => {
      try {
        if (!user || hasFetched.current) {
          console.log("No user ID available, skipping project fetch");
          return;
        }

        const response = await api.get("/api/siteProject/getProjectList", {
          params: { currentUserId: userId },
        });

        const projectData = response.data?.projectlist || [];
        setProject(projectData);

        console.log(projectData);

        if (projectData.length > 0) {
          console.log(projectData);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
      hasFetched.current = true;
    };

    const fetchBookings = async () => {
      if (!user) return;
      const projectStorageKey = `project_${userId}`;
      const projectString = localStorage.getItem(projectStorageKey);

      if (!projectString) {
        console.error("No project found in localStorage");
        return;
      }

      try {
        const project = JSON.parse(projectString);

        const response = await api.get(
          "/api/auth/slotBooking/getslotBookingList",
          {
            params: { projectId: project.id, userId: userId },
          }
        );

        const bookingsData = response.data?.bookingList || [];

        // Filter upcoming bookings
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filtered = bookingsData
          .filter((booking: { bookingTimeDt: string | number | Date }) => {
            const bookingDate = new Date(booking.bookingTimeDt);
            return bookingDate >= today;
          })
          .sort(
            (
              a: { bookingTimeDt: string | number | Date },
              b: { bookingTimeDt: string | number | Date }
            ) => {
              // Sort by date (ascending)
              return (
                new Date(a.bookingTimeDt).getTime() -
                new Date(b.bookingTimeDt).getTime()
              );
            }
          )
          .slice(0, 3); // Get only the first 3

        setUpcomingBookings(filtered);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    fetchProjects();
    fetchBookings();
  }, [userId]);

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
      },
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
        },
        {
          title: "Assets",
          icon: Users,
          description: "View and manage your assets",
          link: "/assets",
          color: "bg-amber-100",
        }
      );
    }

    return cards.slice(0, 4); // Limit to 4 cards
  };

  const handleOnChange = () => {
    const fetchAssets = async () => {
      try {
        if (!user || hasFetched.current) {
          console.log("No user ID available, skipping project fetch");
          return;
        }

        const response = await api.get("/api/auth/Asset/getAssetList", {
          params: { currentUserId: userId },
        });

        const assetData = response.data?.assetlist || [];
        console.log(assetData);

        if (assetData.length > 0) {
          console.log(assetData);
        }
        localStorage.setItem(`assets_${userId}`, JSON.stringify(assetData));
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
      hasFetched.current = true;
    };

    fetchAssets();
  };

  // Dashboard for authenticated users
  return (
    <Card className="px-6 sm:my-8 mx-4 bg-amber-50">
      {/* Header with greeting */}
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
            Your Projects
          </h2>
          <Card className="p-0">
            {project.length > 0 ? (
              <ProjectSelector
                projects={project}
                userId={userId}
                onChange={handleOnChange}
              />
            ) : (
              <div className="p-4 space-y-1">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            )}
          </Card>
        </div>

        {/* Calendar preview or upcoming events */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Upcoming Bookings
          </h2>
          <Link href={"/bookings"}>
            <Card className="bg-stone-100 px-2 py-2">
              {upcomingBookings.length > 0 ? (
                upcomingBookings.map((booking) => {
                  const bookingDate = new Date(booking.bookingTimeDt);
                  const day = bookingDate.getDate();
                  const dayOfWeek = bookingDate.toLocaleDateString("en-US", {
                    weekday: "short",
                  });
                  const timeRange = bookingDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  // Determine if booking is today
                  const today =
                    new Date().toDateString() === bookingDate.toDateString();

                  return (
                    <Card
                      key={booking.bookingKey}
                      className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      {/* Card content (unchanged) */}
                      <div className="flex w-full">
                        <div className="w-16 flex-shrink-0 flex flex-col items-center justify-center py-2 border-r border-gray-200">
                          <div
                            className={`text-xs font-medium uppercase ${today ? "text-orange-500" : "text-gray-500"
                              }`}
                          >
                            {dayOfWeek}
                          </div>
                          <div
                            className={`text-xl font-bold ${today ? "text-orange-600" : "text-gray-800"
                              }`}
                          >
                            {" "}
                            {String(day).padStart(2, "0")}
                          </div>
                        </div>
                        <div className="flex-1 px-6 flex flex-col justify-center">
                          <div className="flex justify-between items-center">
                            <div className="flex-1 pr-2">
                              <h4 className="font-semibold text-gray-900 line-clamp-1 text-sm">
                                {booking.bookingTitle}
                              </h4>

                              <div className="flex items-center text-gray-500 text-xs mt-0.5">
                                <Clock size={12} className="mr-1" />
                                <span>{timeRange}</span>
                              </div>
                            </div>

                            <div
                              className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap
                        ${booking.bookingStatus === "Confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : booking.bookingStatus === "Pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : booking.bookingStatus === "Denied"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {booking.bookingStatus}
                            </div>
                          </div>

                          {booking.bookedAssets &&
                            booking.bookedAssets.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 overflow-hidden max-h-5">
                                {booking.bookedAssets
                                  .slice(0, 2)
                                  .map((asset: string) => (
                                    <span
                                      key={asset}
                                      className="px-1.5 py-0 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-100"
                                    >
                                      {asset}
                                    </span>
                                  ))}
                                {booking.bookedAssets.length > 2 && (
                                  <span className="px-1.5 py-0 text-xs bg-gray-50 text-gray-600 rounded-full border border-gray-100">
                                    +{booking.bookedAssets.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <>
                  <SkeletonBookingCard />
                  <SkeletonBookingCard />
                  <SkeletonBookingCard />
                </>
              )}
            </Card>
          </Link>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>© 2025 Sitespace. All rights reserved.</p>
      </div>
    </Card>
  );
}

const SkeletonBookingCard = () => (
  <Card className="overflow-hidden border border-gray-200 shadow-sm mb-0">
    <div className="flex w-full">
      <div className="w-16 flex-shrink-0 flex flex-col items-center justify-center py-2 border-r border-gray-200">
        <Skeleton className="h-3 w-8 mb-1" />
        <Skeleton className="h-6 w-8" />
      </div>
      <div className="flex-1 px-6 flex flex-col justify-center py-3">
        <div className="flex justify-between items-center">
          <div className="flex-1 pr-2">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex gap-1 mt-1">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
      </div>
    </div>
  </Card>
);
