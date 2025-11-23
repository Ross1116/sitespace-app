"use client";

import { useAuth } from "@/app/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Calendar, Construction, Users, Clock, CalendarX } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/api";
import ProjectSelector from "@/components/home/RadioToggle";

interface Booking {
  id: string;
  project_id?: string;
  manager_id: string;
  subcontractor_id?: string;
  asset_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | string;
  notes?: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
  };
  manager?: {
    id: string;
    full_name: string;
  };
  subcontractor?: {
    id: string;
    company_name: string;
  };
  asset?: {
    id: string;
    name: string;
  };
}

// ✅ HELPER: Fixes Timezone/Midnight offset issue
const combineDateAndTime = (dateStr: string, timeStr: string): Date => {
  try {
    if (!dateStr) return new Date();
    const cleanDate = dateStr.split('T')[0]; 
    const cleanTime = timeStr ? timeStr.split('T').pop() : "00:00:00"; 
    return new Date(`${cleanDate}T${cleanTime}`);
  } catch {
    return new Date();
  }
};

const formatTimeFromDate = (date: Date): string => {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function HomePage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Good day");
  const [project, setProject] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const hasFetched = useRef(false);
  const userId = user?.id;

  // ✅ CACHE KEYS
  const bookingsCacheKey = `home_upcoming_v1_${userId}`;
  const projectsListCacheKey = `home_projects_list_v1_${userId}`;

  const fetchAssets = useCallback(async () => {
    try {
      if (!user || !userId || project.length === 0) return;

      const storedProjectString = localStorage.getItem(`project_${userId}`);
      
      if (!storedProjectString) {
          if (project.length > 0) {
            const defaultProject = project[0];
            localStorage.setItem(`project_${userId}`, JSON.stringify(defaultProject));
            fetchAssets(); 
          }
          return;
      }

      const storedProject = JSON.parse(storedProjectString);
      const projectId = storedProject.id || storedProject.project_id;

      // Validation logic...
      const isProjectValid = project.some((p: any) => 
        (p.id === projectId) || (p.project_id === projectId)
      );

      if (!isProjectValid) {
         localStorage.removeItem(`project_${userId}`);
         if (project.length > 0) fetchAssets(); 
         return; 
      }

      const response = await api.get("/assets/", {
        params: { project_id: projectId, limit: 100 },
      });

      const assetData = response.data?.assets || [];
      localStorage.setItem(`assets_${userId}`, JSON.stringify(assetData));
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  }, [project, userId, user]);

  useEffect(() => {
    // Set Greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    if (!user || !userId) return;

    // 1. LOAD CACHE INSTANTLY
    let hasProjectCache = false;
    let hasBookingCache = false;

    // Projects Cache
    const cachedProjects = localStorage.getItem(projectsListCacheKey);
    if (cachedProjects) {
        try {
            const parsed = JSON.parse(cachedProjects);
            if (Array.isArray(parsed) && parsed.length > 0) {
                setProject(parsed);
                hasProjectCache = true;
            }
        } catch { localStorage.removeItem(projectsListCacheKey); }
    }

    // Bookings Cache
    const cachedBookings = localStorage.getItem(bookingsCacheKey);
    if (cachedBookings) {
        try {
            const parsed = JSON.parse(cachedBookings);
            if (Array.isArray(parsed)) {
                setUpcomingBookings(parsed);
                setLoadingBookings(false); // Hide spinner immediately
                hasBookingCache = true;
            }
        } catch { localStorage.removeItem(bookingsCacheKey); }
    }

    // 2. FETCH FRESH DATA (Background)
    const fetchProjects = async () => {
      if (hasFetched.current && hasProjectCache) return; // Prevent double fetch if cache exists

      try {
        let projectData = [];
        if (user.role === "subcontractor") {
          const response = await api.get(`/subcontractors/${userId}/projects`);
          projectData = response.data.map((p: any) => ({
            id: p.project_id,
            name: p.project_name,
            location: p.project_location,
            status: p.is_active ? "active" : "inactive",
            ...p 
          }));
        } else {
          const response = await api.get("/projects/", {
            params: { my_projects: true, limit: 100, skip: 0 },
          });
          projectData = response.data?.projects || [];
        }

        setProject(projectData);
        // ✅ Save to cache
        localStorage.setItem(projectsListCacheKey, JSON.stringify(projectData));

      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    const fetchBookings = async (isBackground = false) => {
      try {
        // Only show spinner if we don't have data
        if (!isBackground && upcomingBookings.length === 0) {
            setLoadingBookings(true);
        }

        const response = await api.get("/bookings/my/upcoming", {
          params: { limit: 3 },
        });
        const bookingsData = response.data || [];
        
        setUpcomingBookings(bookingsData);
        // ✅ Save to cache
        localStorage.setItem(bookingsCacheKey, JSON.stringify(bookingsData));
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchProjects();
    // If we found cache, fetch quietly in background. If not, fetch normally.
    fetchBookings(hasBookingCache);
    
    hasFetched.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user]); 

  useEffect(() => {
    if (project.length > 0) {
      fetchAssets();
    }
  }, [project, fetchAssets]);

  // ... rest of helper functions (getQuickAccessCards, etc) ...
  const getQuickAccessCards = () => {
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

    if (user?.role?.includes("admin") || user?.role?.includes("manager")) {
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

    return cards.slice(0, 4);
  };

  const handleOnChange = () => {
    fetchAssets();
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="px-6 sm:my-8 mx-4 bg-amber-50">
      <div className="p-3 sm:p-6">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
          {greeting}, {user?.first_name || "there"}!
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          Welcome to your site management dashboard
        </p>
      </div>

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

        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Upcoming Bookings
          </h2>
          <Card className="bg-stone-100 px-2 py-2">
            {loadingBookings ? (
              <>
                <SkeletonBookingCard />
                <SkeletonBookingCard />
                <SkeletonBookingCard />
              </>
            ) : upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => {
                
                // ✅ Date Logic
                const startObj = combineDateAndTime(booking.booking_date, booking.start_time);
                const endObj = combineDateAndTime(booking.booking_date, booking.end_time);

                const day = startObj.getDate();
                const dayOfWeek = startObj.toLocaleDateString("en-US", {
                  weekday: "short",
                });
                const timeRange = `${formatTimeFromDate(startObj)} - ${formatTimeFromDate(endObj)}`;
                const today = new Date().toDateString() === startObj.toDateString();
                const assetName = booking.asset?.name || "Asset";

                return (
                  <Link href="/bookings" key={booking.id}>
                    <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 mb-2 cursor-pointer">
                      <div className="flex w-full">
                        <div className="w-16 flex-shrink-0 flex flex-col items-center justify-center py-2 border-r border-gray-200">
                          <div className={`text-xs font-medium uppercase ${today ? "text-orange-500" : "text-gray-500"}`}>
                            {dayOfWeek}
                          </div>
                          <div className={`text-xl font-bold ${today ? "text-orange-600" : "text-gray-800"}`}>
                            {String(day).padStart(2, "0")}
                          </div>
                        </div>
                        <div className="flex-1 px-6 flex flex-col justify-center">
                          <div className="flex justify-between items-center">
                            <div className="flex-1 pr-2">
                              <h4 className="font-semibold text-gray-900 line-clamp-1 text-sm">
                                {booking.project?.name || "Booking"}
                              </h4>
                              <div className="flex items-center text-gray-500 text-xs mt-0.5">
                                <Clock size={12} className="mr-1" />
                                <span>{timeRange}</span>
                              </div>
                            </div>
                            <div className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap capitalize ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </div>
                          </div>
                          {booking.asset && (
                            <div className="flex flex-wrap gap-1 mt-1 overflow-hidden max-h-5">
                              <span className="px-1.5 py-0 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                                {assetName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })
            ) : (
              <EmptyBookingsState />
            )}
          </Card>
        </div>
      </div>

      <div className="mt-8 text-center text-gray-500 text-sm pb-6">
        <p>© 2025 Sitespace. All rights reserved.</p>
      </div>
    </Card>
  );
}

// ... Skeletons and Empty States (same as before)
const SkeletonBookingCard = () => (
  <Card className="overflow-hidden border border-gray-200 shadow-sm mb-2">
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

const EmptyBookingsState = () => (
  <Card className="overflow-hidden border border-gray-200 bg-white">
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <CalendarX size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No Upcoming Bookings
      </h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">
        You don&apos;t have any upcoming bookings scheduled. Create a new booking to
        get started!
      </p>
      <Link href="/bookings">
        <button className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium">
          Create Booking
        </button>
      </Link>
    </div>
  </Card>
);