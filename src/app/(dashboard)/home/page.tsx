"use client";

import { useAuth } from "@/app/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Calendar,
  HardHat,
  Users,
  ListChecks,
  Search,
  Bell,
  ChevronDown,
  CalendarX,
  Clock,
  Plus,
  Check,
  MapPin,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---
interface Booking {
  id: string;
  project_id?: string;
  manager_id: string;
  subcontractor_id?: string;
  asset_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status:
    | "pending"
    | "confirmed"
    | "cancelled"
    | "completed"
    | "denied"
    | string;
  notes?: string;
  purpose?: string;
  title?: string;
  created_at: string;
  updated_at: string;
  project?: { id: string; name: string };
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
  };
  subcontractor?: {
    id: string;
    company_name?: string;
    first_name: string;
    last_name: string;
  };
  asset?: { id: string; name: string };
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
  trade_specialty: string | null;
  phone: string | null;
  is_active: boolean;
  role: string;
  user_type: string;
}

// --- Color Palette ---
const PALETTE = {
  bg: "bg-[hsl(20,60%,99%)]",
  darkNavy: "bg-[#0B1120]",
  navy: "bg-[#0f2a4a]",
  blue: "bg-[#004e89]",
  teal: "bg-[#0e7c9b]",
};

// --- Helpers ---
const combineDateAndTime = (dateStr: string, timeStr: string): Date => {
  try {
    if (!dateStr) return new Date();
    const cleanDate = dateStr.split("T")[0];
    const cleanTime = timeStr ? timeStr.split("T").pop() : "00:00:00";
    return new Date(`${cleanDate}T${cleanTime}`);
  } catch {
    return new Date();
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const dayOfWeek = date.toLocaleString("default", { weekday: "short" });
  return { day, month, dayOfWeek, date };
};

const formatTimeRange = (start: Date, end: Date) => {
  const format = (d: Date) =>
    d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  return `${format(start)} - ${format(end)}`;
};

const isToday = (date: Date) => {
  const currentDate = new Date();
  return (
    date.getDate() === currentDate.getDate() &&
    date.getMonth() === currentDate.getMonth() &&
    date.getFullYear() === currentDate.getFullYear()
  );
};

// Grouping Logic
const groupBookingsByMonth = (bookings: Booking[]) => {
  const groups: Record<string, Booking[]> = {};
  bookings.forEach((b) => {
    const date = new Date(`${b.booking_date}T00:00:00`);
    const month = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    if (!groups[month]) groups[month] = [];
    groups[month].push(b);
  });
  return groups;
};

export default function HomePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  // Data States
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);

  // Dashboard Counters
  const [assetCount, setAssetCount] = useState<number>(0);
  const [subcontractorCount, setSubcontractorCount] = useState<number>(0);

  // Loading & UI States
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [showProjectSelector, setShowProjectSelector] = useState(false);

  const hasInitialized = useRef(false);
  const userId = user?.id;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cache keys
  const currentProjId =
    selectedProject?.id || selectedProject?.project_id || "all";
  const bookingsCacheKey = `home_bookings_${userId}_${currentProjId}`;
  const projectsListCacheKey = `home_projects_list_${userId}`;
  
  // ✅ NEW: Keys for CreateBookingForm consumption
  const assetsCacheKey = `assets_${userId}`; 
  const subcontractorsCacheKey = `subcontractors_${userId}`;

  // --- API Calls ---

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    try {
      let projectData: any[] = [];
      if (user?.role === "subcontractor") {
        const resp = await api.get(`/subcontractors/${userId}/projects`);
        projectData = resp.data.map((p: any) => ({
          id: p.project_id,
          name: p.project_name,
          location: p.project_location,
          status: p.is_active ? "active" : "inactive",
          ...p,
        }));
      } else {
        const resp = await api.get("/projects/", {
          params: { my_projects: true, limit: 100, skip: 0 },
        });
        projectData = resp.data?.projects || [];
      }
      setProjects(projectData);
      localStorage.setItem(projectsListCacheKey, JSON.stringify(projectData));

      const stored = localStorage.getItem(`project_${userId}`);
      if (!stored && projectData.length > 0) {
        const defaultProj = projectData[0];
        localStorage.setItem(`project_${userId}`, JSON.stringify(defaultProj));
        setSelectedProject(defaultProj);
      } else if (stored) {
        setSelectedProject(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  }, [userId, user?.role, projectsListCacheKey]);

  // ✅ UPDATED: Fetch Assets and save to localStorage for CreateBookingForm
  const fetchAssets = useCallback(async () => {
    if (!userId || !selectedProject) return;
    try {
      const projectId = selectedProject.id || selectedProject.project_id;
      const response = await api.get("/assets/", {
        params: { project_id: projectId, limit: 100 },
      });
      const assetData = response.data?.assets || [];
      setAssetCount(response.data?.total || assetData.length);
      
      // Save to localStorage so CreateBookingForm can read it
      localStorage.setItem(assetsCacheKey, JSON.stringify(assetData));
    } catch (error) {
      console.error("Error fetching assets", error);
      setAssetCount(0);
      // Optional: Clear cache on error to prevent stale data usage
      // localStorage.removeItem(assetsCacheKey); 
    }
  }, [selectedProject, userId, assetsCacheKey]);

  // ✅ UPDATED: Fetch Subcontractors and save to localStorage for fallback in CreateBookingForm
  const fetchSubcontractors = useCallback(async () => {
    if (!userId || !selectedProject) return;
    if (user?.role === "subcontractor") {
      setSubcontractorCount(0);
      return;
    }
    try {
      const projectId = selectedProject.id || selectedProject.project_id;
      const isAdmin = user?.role === "admin";
      const endpoint = isAdmin
        ? "/subcontractors/"
        : "/subcontractors/my-subcontractors";

      const response = await api.get(endpoint, {
        params: { project_id: projectId, limit: 100, is_active: true },
      });

      // Normalize response handling for count and data
      let subData = [];
      let total = 0;

      if (Array.isArray(response.data)) {
        subData = response.data;
        total = subData.length;
      } else if (response.data?.subcontractors) {
        subData = response.data.subcontractors;
        total = response.data.total || subData.length;
      } else if (response.data?.data) {
        subData = response.data.data;
        total = subData.length;
      } else {
        // Fallback for paginated/nested responses
         const values = Object.values(response.data || {});
         const arr = values.find((v) => Array.isArray(v));
         if (arr && Array.isArray(arr)) {
           subData = arr;
           total = arr.length;
         }
      }

      setSubcontractorCount(total);
      
      // Save to localStorage so CreateBookingForm can use it as cache
      localStorage.setItem(subcontractorsCacheKey, JSON.stringify(subData));

    } catch (error) {
      console.error("Error fetching subcontractors", error);
      setSubcontractorCount(0);
    }
  }, [selectedProject, userId, user?.role, subcontractorsCacheKey]);

  const fetchBookings = useCallback(
    async (isBackground = false) => {
      if (!userId || !selectedProject) return;
      try {
        if (!isBackground) setLoadingBookings(true);

        const projectId = selectedProject.id || selectedProject.project_id;
        const resp = await api.get("/bookings/my/upcoming", {
          params: { limit: 50, project_id: projectId },
        });

        let bookingsData: Booking[] = resp.data || [];
        bookingsData = bookingsData.filter((b) => {
          const bProjId = b.project?.id || b.project_id;
          return bProjId === projectId;
        });

        setUpcomingBookings(bookingsData);
        localStorage.setItem(bookingsCacheKey, JSON.stringify(bookingsData));
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoadingBookings(false);
      }
    },
    [selectedProject, userId, bookingsCacheKey]
  );

  // --- Effects ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get<UserProfile>("/auth/me");
        setProfile(response.data);
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!user || hasInitialized.current) return;
    fetchProjects();
    hasInitialized.current = true;
  }, [user, fetchProjects]);

  // When selectedProject changes, fetch related data and update localStorage
  useEffect(() => {
    if (!selectedProject) return;
    fetchAssets();
    fetchSubcontractors();
    fetchBookings(false);
  }, [selectedProject, fetchAssets, fetchSubcontractors, fetchBookings]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowProjectSelector(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProjectSelect = (proj: any) => {
    if (!proj || !proj.id) return;
    setShowProjectSelector(false);
    localStorage.setItem(`project_${userId}`, JSON.stringify(proj));
    setSelectedProject(proj);
    // Reload to ensure all child components and hooks (like CreateBookingForm) re-read the fresh localStorage
    window.location.reload();
  };

  // --- Derived Data ---
  const isBookingEndInFutureOrNow = (b: Booking) =>
    combineDateAndTime(b.booking_date, b.end_time) >= new Date();

  const filteredSortedBookings = upcomingBookings
    .filter(isBookingEndInFutureOrNow)
    .sort(
      (a, b) =>
        combineDateAndTime(a.booking_date, a.start_time).getTime() -
        combineDateAndTime(b.booking_date, b.start_time).getTime()
    )
    .slice(0, 5);

  const groupedBookings = groupBookingsByMonth(filteredSortedBookings);

  const eventsTodayCount = upcomingBookings.filter((b) => {
    const d = combineDateAndTime(b.booking_date, b.start_time);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const pendingBookingsCount = upcomingBookings.filter(
    (b) => b.status === "pending"
  ).length;

  return (
    <div
      className={`min-h-screen ${PALETTE.bg} p-2 sm:p-4 lg:p-6 space-y-4 font-sans text-slate-800`}
    >
      {/* --- HEADER --- */}
      <div className="w-full max-w-screen mx-auto flex items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        {/* Accent + Welcome */}
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-slate-200 to-slate-50" />
          <div className="flex flex-col">
            <p className="text-sm text-slate-500">Welcome back,</p>

            <p className="text-lg md:text-xl font-semibold text-slate-900 capitalize">
              {profile?.first_name
                ? `${profile.first_name} 👋`
                : user?.first_name
                ? `${user.first_name} 👋`
                : "User 👋"}
            </p>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                {profile?.role || user?.role || "Member"}
              </span>

              {profile?.company_name && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="text-xs text-slate-500 font-medium truncate max-w-[150px] sm:max-w-xs">
                    {profile.company_name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile (compact card) */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200 shadow-sm text-sm">
            {profile?.first_name?.charAt(0) || user?.email?.charAt(0) || "U"}
          </div>

          <div className="hidden sm:flex flex-col leading-tight max-w-xs">
            <p className="text-sm font-bold text-slate-900 truncate">
              {profile?.first_name
                ? `${profile.first_name} ${profile.last_name}`
                : "Loading..."}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {profile?.email || user?.email}
            </p>
          </div>
        </div>
      </div>
      {/* --- MAIN CARD --- */}
      <div className="w-full max-w-screen mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
        {/* --- PROJECT TITLE & SWITCHER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-20">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {selectedProject ? selectedProject.name : "Select a Project"}
            </h1>
            <p className="text-slate-500 mt-1 font-medium flex items-center gap-1">
              {selectedProject && selectedProject.location ? (
                <>
                  <MapPin size={14} className="text-slate-200" />
                  {selectedProject.location}
                </>
              ) : (
                "Welcome to your site management dashboard"
              )}
            </p>
          </div>

          {/* Dropdown Container */}
          <div className="relative" ref={dropdownRef}>
            <Button
              onClick={() => setShowProjectSelector(!showProjectSelector)}
              className={`${PALETTE.darkNavy} text-white hover:opacity-90 flex items-center gap-2 px-6 rounded-lg font-semibold shadow-md transition-all active:scale-95`}
            >
              {showProjectSelector ? "Close" : "Switch Project"}
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  showProjectSelector ? "rotate-180" : ""
                }`}
              />
            </Button>

            {showProjectSelector && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Available Projects
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                    {projects.length}
                  </span>
                </div>

                <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {projects.length === 0 ? (
                    <div className="text-center py-4 text-sm text-slate-400">
                      No projects found
                    </div>
                  ) : (
                    projects.map((proj) => {
                      const isActive = selectedProject?.id === proj.id;
                      return (
                        <button
                          key={proj.id}
                          onClick={() => handleProjectSelect(proj)}
                          className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between group cursor-pointer
                                      ${
                                        isActive
                                          ? "bg-[#0B1120] text-white shadow-md shadow-slate-900/10"
                                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                      }`}
                        >
                          <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                            <span className="truncate w-full font-bold">
                              {proj.name}
                            </span>
                            <span
                              className={`text-[11px] truncate w-full ${
                                isActive ? "text-slate-300" : "text-slate-400"
                              }`}
                            >
                              {proj.location || "No location"}
                            </span>
                          </div>
                          {isActive && (
                            <Check
                              size={16}
                              className="text-white flex-shrink-0 ml-2"
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- QUICK ACCESS CARDS --- */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Quick Access
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAccessCard
              title="Calendar"
              count={upcomingBookings.length}
              subtitle={`${eventsTodayCount} events today`}
              icon={Calendar}
              bgColor={PALETTE.darkNavy}
              href="/multicalendar"
            />
            <QuickAccessCard
              title="Assets"
              count={assetCount}
              subtitle={`${
                assetCount > 0 ? "Active on site" : "No assets active"
              }`}
              icon={HardHat}
              bgColor={PALETTE.navy}
              href="/assets"
            />
            <QuickAccessCard
              title="Subcontractor"
              count={subcontractorCount}
              subtitle={`${subcontractorCount} Active`}
              icon={Users}
              bgColor={PALETTE.blue}
              href="/subcontractors"
            />
            <QuickAccessCard
              title="Bookings"
              count={upcomingBookings.length}
              subtitle={`${pendingBookingsCount} Pending`}
              icon={ListChecks}
              bgColor={PALETTE.teal}
              href="/bookings"
            />
          </div>
        </div>

        {/* --- DASHBOARD GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COL: Upcoming Bookings */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="flex justify-between items-end mb-2">
              <h2 className="text-xl font-bold text-slate-900">
                Upcoming Bookings
              </h2>
              <div className="flex bg-slate-200 rounded-lg p-1 gap-1">
                <Link href="/bookings">
                  <span className="text-xs font-bold px-4 py-1.5 bg-white rounded-md shadow-sm text-slate-900 inline-block cursor-pointer">
                    Bookings
                  </span>
                </Link>
                <Link href="/multicalendar">
                  <span className="text-xs font-bold px-4 py-1.5 text-slate-500 inline-block cursor-pointer hover:text-slate-900">
                    Calendar
                  </span>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 min-h-[400px] border border-slate-100 flex flex-col">
              {loadingBookings ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredSortedBookings.length > 0 ? (
                <div className="space-y-6">
                  {Object.keys(groupedBookings).map((month) => (
                    <div key={month} className="space-y-2">
                      {/* Month Header */}
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1 border-b border-slate-100 pb-1">
                        {month}
                      </h3>

                      {groupedBookings[month].map((booking) => {
                        const startObj = combineDateAndTime(
                          booking.booking_date,
                          booking.start_time
                        );
                        const endObj = combineDateAndTime(
                          booking.booking_date,
                          booking.end_time
                        );
                        const timeRange = formatTimeRange(startObj, endObj);

                        const { day, dayOfWeek } = formatDate(
                          booking.booking_date
                        );
                        const isBookingToday = isToday(startObj);
                        const status = booking.status.toLowerCase();

                        // --- LOGIC FROM BOOKINGS PAGE ---
                        // 1. Manager Name
                        const managerName = booking.manager
                          ? `${booking.manager.first_name} ${booking.manager.last_name}`.trim()
                          : "Unknown Manager";

                        // 2. Subcontractor Name
                        const subName =
                          booking.subcontractor?.company_name ||
                          (booking.subcontractor
                            ? `${booking.subcontractor.first_name} ${booking.subcontractor.last_name}`.trim()
                            : "");

                        // 3. Assignee logic: If sub exists, it's for them. Else manager.
                        const assignee = booking.subcontractor_id
                          ? subName || "Unknown Subcontractor"
                          : managerName;

                        // 4. Icon Logic
                        const isSubcontractor = !!booking.subcontractor_id;
                        const RoleIcon = isSubcontractor ? HardHat : Briefcase;
                        const iconColor = isSubcontractor
                          ? "text-orange-600"
                          : "text-blue-600";

                        // Title Logic
                        let displayTitle = "";
                        if (booking.purpose && booking.purpose.trim() !== "") {
                          displayTitle = booking.purpose;
                        } else if (
                          booking.notes &&
                          booking.notes.trim() !== ""
                        ) {
                          displayTitle = booking.notes;
                        } else {
                          displayTitle = `Booking for ${assignee}`;
                        }

                        return (
                          <div
                            key={booking.id}
                            className="bg-[#F8F9FB] rounded-xl flex overflow-hidden border border-transparent hover:border-slate-200 hover:shadow-sm transition-all group"
                          >
                            {/* --- LEFT: DATE COLUMN --- */}
                            <div className="w-20 sm:w-24 flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-200 bg-slate-50/50">
                              <div
                                className={`text-sm font-medium uppercase ${
                                  isBookingToday
                                    ? "text-orange-500"
                                    : status === "pending"
                                    ? "text-yellow-500"
                                    : "text-slate-500"
                                }`}
                              >
                                {dayOfWeek}
                              </div>
                              <div
                                className={`text-2xl sm:text-3xl font-bold ${
                                  isBookingToday
                                    ? "text-orange-600"
                                    : status === "pending"
                                    ? "text-yellow-500"
                                    : "text-slate-800"
                                }`}
                              >
                                {String(day).padStart(2, "0")}
                              </div>
                            </div>

                            {/* --- RIGHT: DETAILS --- */}
                            <div className="flex-1 p-3 pl-4 flex flex-col justify-center">
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                                  {displayTitle}
                                </h3>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ml-2 capitalize tracking-wide flex-shrink-0 ${
                                    status === "confirmed"
                                      ? "bg-green-100 text-green-700"
                                      : status === "pending"
                                      ? "bg-orange-100 text-orange-700"
                                      : status === "denied" ||
                                        status === "cancelled"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {booking.status}
                                </span>
                              </div>

                              <div className="flex items-center text-xs text-slate-500 font-medium mb-1.5">
                                <Clock
                                  size={13}
                                  className="mr-1.5 text-slate-400"
                                />
                                <span>{timeRange}</span>
                                {status === "pending" && (
                                  <AlertCircle
                                    size={13}
                                    className="ml-2 text-yellow-500"
                                  />
                                )}
                              </div>

                              <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
                                <RoleIcon size={13} className={iconColor} />
                                <span>Assigned to</span>
                                <span className="text-slate-600 truncate max-w-[180px]">
                                  {assignee}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyBookingsState />
              )}
            </div>
          </div>

          {/* RIGHT COL: Today's Schedule */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-slate-900">
                Today&apos;s Schedule
              </h2>
              <Button size="sm" className={`${PALETTE.darkNavy} h-8 text-xs`}>
                <Plus className="h-3 w-3 mr-1" /> Add Task
              </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 min-h-[400px] border border-slate-100">
              <SimpleCalendar />
              <div className="mt-6 space-y-4 relative pl-4 border-l-2 border-slate-100">
                <div className="absolute top-0 left-[-5px] h-2.5 w-2.5 rounded-full bg-slate-300 border-2 border-white"></div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-400 font-bold mb-1">
                    08:00 AM
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    Site Opening
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-400 font-bold mb-1">
                    10:30 AM
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    Material Delivery
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Drywall panels - Bay 4
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>{" "}
      {/* end MAIN CARD */}
    </div>
  );
}

// --- Sub-Components ---
const QuickAccessCard = ({
  title,
  count,
  subtitle,
  icon: Icon,
  bgColor,
  href,
}: any) => {
  return (
    <Link href={href} className="block group">
      <Card
        className={`${bgColor} text-white p-5 border-none shadow-lg shadow-slate-900/10 h-32 flex flex-col justify-center hover:translate-y-[-2px] transition-transform cursor-pointer rounded-lg relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center justify-center pl-2">
            <Icon className="h-10 w-10 opacity-90 stroke-[1.5]" />
          </div>
          <div className="flex flex-col items-end justify-center pr-1">
            <span className="text-sm font-medium opacity-90 block mb-1">
              {title}
            </span>
            <span className="text-4xl font-bold leading-none block mb-1">
              {count}
            </span>
            <span className="text-[10px] font-medium opacity-70 tracking-wide uppercase">
              {subtitle}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

const EmptyBookingsState = () => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center h-full border-2 border-dashed border-slate-100 rounded-xl">
    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
      <CalendarX size={32} className="text-slate-400" />
    </div>
    <h3 className="text-base font-bold text-slate-900 mb-1">
      No Upcoming Bookings
    </h3>
    <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
      Your schedule is clear. Use the button below to create a new booking.
    </p>
    <Link href="/bookings">
      <Button
        className={`${PALETTE.teal} hover:opacity-90 text-white font-medium px-6`}
      >
        Create Booking
      </Button>
    </Link>
  </div>
);

const SimpleCalendar = () => {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date().getDate();
  const startDay = Math.max(1, today - 3);
  const displayDates = Array.from({ length: 7 }, (_, i) => startDay + i);

  return (
    <div className="text-xs w-full">
      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
        <span className="font-bold text-slate-800 text-sm">
          {new Date().toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2 text-slate-400 font-medium">
        {days.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {displayDates.map((d) => (
          <div
            key={d}
            className={`h-8 w-8 mx-auto flex items-center justify-center rounded-lg font-medium transition-colors
                            ${
                              d === today
                                ? `${PALETTE.darkNavy} text-white shadow-md`
                                : "text-slate-600 hover:bg-slate-100 cursor-pointer"
                            }`}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
};