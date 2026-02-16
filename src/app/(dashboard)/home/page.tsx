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
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  combineDateAndTime,
  formatDateLong as formatDate,
  formatTimeRange,
  isToday,
  groupBookingsByMonth,
} from "@/lib/bookingHelpers";
import type { ApiBooking, ApiProject } from "@/types";
import type { LucideIcon } from "lucide-react";
import useSWR from "swr";
import { swrFetcher, SWR_CONFIG } from "@/lib/swr";

// --- Types ---
type Booking = ApiBooking;

interface SubcontractorProjectApi {
  project_id: string;
  project_name: string;
  project_location?: string;
  is_active?: boolean;
  [key: string]: unknown;
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
  bg: "bg-[var(--page-bg)]",
  darkNavy: "bg-[var(--navy)]",
  navy: "bg-[var(--navy-deep)]",
  blue: "bg-[var(--brand-blue)]",
  teal: "bg-[var(--teal)]",
};

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const isSubcontractorUser = user?.role === "subcontractor";

  const [selectedProject, setSelectedProject] = useState<ApiProject | null>(
    null,
  );
  const [showProjectSelector, setShowProjectSelector] = useState(false);

  const userId = user?.id;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- SWR: Profile ---
  const { data: profile } = useSWR<UserProfile>(
    userId ? "/auth/me" : null,
    swrFetcher,
    SWR_CONFIG,
  );

  // --- SWR: Projects list ---
  const projectsUrl = useMemo(() => {
    if (!userId) return null;
    if (user?.role === "subcontractor")
      return `/subcontractors/${userId}/projects`;
    return "/projects/?my_projects=true&limit=100&skip=0";
  }, [userId, user?.role]);

  const { data: projectsRaw } = useSWR(projectsUrl, swrFetcher, SWR_CONFIG);

  const projects = useMemo<ApiProject[]>(() => {
    if (!projectsRaw) return [];
    if (user?.role === "subcontractor") {
      return (projectsRaw as SubcontractorProjectApi[]).map((p) => ({
        ...p,
        id: p.project_id,
        name: p.project_name,
        location: p.project_location,
        status: p.is_active ? "active" : "inactive",
      }));
    }
    return (projectsRaw as { projects?: ApiProject[] }).projects || [];
  }, [projectsRaw, user?.role]);

  // Set initial project once projects load
  useEffect(() => {
    if (projects.length === 0 || selectedProject) return;
    const stored = localStorage.getItem(`project_${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ApiProject;
        if (projects.some((p) => p.id === parsed.id)) {
          setSelectedProject(parsed);
          return;
        }
      } catch {
        /* invalid JSON */
      }
    }
    localStorage.setItem(`project_${userId}`, JSON.stringify(projects[0]));
    setSelectedProject(projects[0]);
  }, [projects, selectedProject, userId]);

  const projectId = selectedProject?.id || selectedProject?.project_id || null;

  // --- SWR: Assets count ---
  const { data: assetsData } = useSWR(
    projectId ? `/assets/?project_id=${projectId}&limit=100` : null,
    swrFetcher,
    SWR_CONFIG,
  );
  const assetCount =
    (assetsData as { total?: number; assets?: unknown[] })?.total ||
    (assetsData as { assets?: unknown[] })?.assets?.length ||
    0;

  // --- SWR: Subcontractors count ---
  const subsUrl = useMemo(() => {
    if (!user || user.role === "subcontractor" || !projectId) return null;
    const endpoint =
      user.role === "admin"
        ? "/subcontractors/"
        : "/subcontractors/my-subcontractors";
    return `${endpoint}?project_id=${projectId}&limit=100&is_active=true`;
  }, [user, projectId]);

  const { data: subsData } = useSWR(subsUrl, swrFetcher, SWR_CONFIG);
  const subcontractorCount = useMemo(() => {
    if (!subsData) return 0;
    if (Array.isArray(subsData)) return subsData.length;
    const d = subsData as { subcontractors?: unknown[]; total?: number };
    if (d.total) return d.total;
    if (Array.isArray(d.subcontractors)) return d.subcontractors.length;
    return 0;
  }, [subsData]);

  // --- SWR: Bookings ---
  const {
    data: bookingsRaw,
    isLoading: loadingBookings,
    error: fetchError,
  } = useSWR<Booking[]>(
    projectId ? `/bookings/my/upcoming?limit=50&project_id=${projectId}` : null,
    swrFetcher,
    SWR_CONFIG,
  );

  const upcomingBookings = useMemo(() => {
    if (!bookingsRaw || !Array.isArray(bookingsRaw)) return [];
    return bookingsRaw.filter((b) => {
      const bProjId = b.project?.id || b.project_id;
      const status = (b.status || "").toLowerCase();
      return bProjId === projectId && status !== "denied";
    });
  }, [bookingsRaw, projectId]);

  // --- Navigate to bookings page ---
  const handleBookingClick = (bookingId: string) => {
    router.push(`/bookings?highlight=${bookingId}`);
  };

  // Close dropdown on outside click
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

  const handleProjectSelect = (proj: ApiProject) => {
    if (!proj || !proj.id) return;
    setShowProjectSelector(false);
    localStorage.setItem(`project_${userId}`, JSON.stringify(proj));
    setSelectedProject(proj);
  };

  // --- Derived Data ---
  const isBookingEndInFutureOrNow = (b: Booking) =>
    combineDateAndTime(b.booking_date, b.end_time) >= new Date();

  const filteredSortedBookings = upcomingBookings
    .filter(isBookingEndInFutureOrNow)
    .sort(
      (a, b) =>
        combineDateAndTime(a.booking_date, a.start_time).getTime() -
        combineDateAndTime(b.booking_date, b.start_time).getTime(),
    )
    .slice(0, 5);

  const groupedBookings = groupBookingsByMonth(filteredSortedBookings);

  const eventsTodayCount = upcomingBookings.filter((b) => {
    const d = combineDateAndTime(b.booking_date, b.start_time);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const pendingBookingsCount = upcomingBookings.filter(
    (b) => b.status?.toLowerCase() === "pending",
  ).length;

  return (
    <div
      className={`min-h-screen ${PALETTE.bg} p-2 sm:p-4 lg:p-6 space-y-4 font-sans text-slate-800`}
    >
      {/* --- HEADER --- */}
      <div className="w-full max-w-screen mx-auto flex items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
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
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[calc(100vw-40px)] sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200 max-w-[320px]">
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
                                ? "bg-[var(--navy)] text-white shadow-md shadow-slate-900/10"
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
          <div
            className={`grid grid-cols-1 md:grid-cols-2 ${
              isSubcontractorUser ? "lg:grid-cols-2" : "lg:grid-cols-4"
            } gap-4`}
          >
            <QuickAccessCard
              title="Calendar"
              count={upcomingBookings.length}
              subtitle={`${eventsTodayCount} events today`}
              icon={Calendar}
              bgColor={PALETTE.darkNavy}
              href="/multicalendar"
            />
            {!isSubcontractorUser && (
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
            )}
            {!isSubcontractorUser && (
              <QuickAccessCard
                title="Subcontractor"
                count={subcontractorCount}
                subtitle={`${subcontractorCount} Active`}
                icon={Users}
                bgColor={PALETTE.blue}
                href="/subcontractors"
              />
            )}
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
              <div className="flex p-1 gap-1"></div>
            </div>

            {fetchError && (
              <div
                className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-sm"
                role="alert"
              >
                Failed to load bookings. Please try again later.
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 min-h-[400px] border border-slate-100 flex flex-col">
              {loadingBookings ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredSortedBookings.length > 0 ? (
                <div className="space-y-5 sm:space-y-6">
                  {Object.keys(groupedBookings).map((month) => (
                    <div key={month} className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1 border-b border-slate-100 pb-1">
                        {month}
                      </h3>

                      {groupedBookings[month].map((booking) => {
                        const startObj = combineDateAndTime(
                          booking.booking_date,
                          booking.start_time,
                        );
                        const endObj = combineDateAndTime(
                          booking.booking_date,
                          booking.end_time,
                        );
                        const timeRange = formatTimeRange(startObj, endObj);

                        const { day, dayOfWeek } = formatDate(
                          booking.booking_date,
                        );
                        const isBookingToday = isToday(startObj);
                        const status = booking.status.toLowerCase();

                        const managerName = booking.manager
                          ? `${booking.manager.first_name} ${booking.manager.last_name}`.trim()
                          : "Unknown Manager";

                        const assetName = booking.asset?.name?.trim();
                        const assetCode = booking.asset?.asset_code?.trim();
                        const assetLabel =
                          assetName || booking.asset_id || "Unspecified asset";
                        const assetCodeSuffix =
                          assetName && assetCode ? `(${assetCode})` : "";

                        const subName = booking.subcontractor
                          ? [
                              booking.subcontractor?.first_name || "",
                              booking.subcontractor?.last_name || "",
                            ]
                              .filter(Boolean)
                              .join(" ")
                              .trim()
                          : "";

                        const assignee = booking.subcontractor_id
                          ? subName || "Unknown Subcontractor"
                          : managerName;

                        const isSubcontractor = !!booking.subcontractor_id;
                        const RoleIcon = isSubcontractor ? HardHat : Briefcase;

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
                            onClick={() => handleBookingClick(booking.id)}
                            className="bg-[var(--surface-subtle)] rounded-xl flex overflow-hidden border border-transparent hover:border-slate-200 hover:shadow-md transition-all group cursor-pointer active:scale-[0.99]"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleBookingClick(booking.id);
                              }
                            }}
                          >
                            {/* --- LEFT: DATE COLUMN --- */}
                            <div className="w-16 sm:w-24 flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-200 bg-slate-50/50 px-1">
                              <div
                                className={`text-[11px] sm:text-sm font-medium uppercase ${
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
                                className={`text-xl sm:text-3xl font-bold ${
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
                            <div className="min-w-0 flex-1 p-3 sm:p-3.5 sm:pl-4 flex flex-col justify-center">
                              <div className="mb-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                                <h3 className="min-w-0 font-bold text-slate-900 text-sm line-clamp-2 sm:line-clamp-1 group-hover:text-blue-900 transition-colors">
                                  {displayTitle}
                                </h3>
                                <span
                                  className={`w-fit text-[10px] font-bold px-2 py-0.5 rounded capitalize tracking-wide flex-shrink-0 ${
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
                                  {status}
                                </span>
                              </div>

                              <div className="mb-2 flex flex-wrap items-center gap-y-1 text-xs font-medium text-slate-500">
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

                              <div className="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs">
                                <MapPin size={13} className="text-blue-500" />
                                <span className="shrink-0 text-[10px] uppercase tracking-wide font-bold text-slate-500">
                                  Asset:
                                </span>
                                <span className="min-w-0 flex-1 text-blue-700 font-semibold truncate">
                                  {assetLabel}
                                </span>
                                {assetCodeSuffix && (
                                  <span className="hidden text-[10px] text-slate-400 font-medium lg:inline">
                                    {assetCodeSuffix}
                                  </span>
                                )}
                              </div>

                              <div className="flex min-w-0 items-center gap-1 text-xs font-medium text-slate-400">
                                <RoleIcon
                                  size={13}
                                  className="text-slate-400"
                                />
                                <span className="shrink-0 text-[10px] uppercase tracking-wide font-bold text-slate-500">
                                  Booked by:
                                </span>
                                <span className="min-w-0 flex-1 text-slate-600 truncate">
                                  {assignee}
                                </span>
                              </div>
                            </div>

                            {/* Arrow indicator on hover */}
                            <div className="hidden sm:flex items-center pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChevronDown
                                size={16}
                                className="text-slate-400 -rotate-90"
                              />
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
      </div>
    </div>
  );
}

// --- Sub-Components ---
interface QuickAccessCardProps {
  title: string;
  count: number;
  subtitle: string;
  icon: LucideIcon;
  bgColor: string;
  href: string;
}

const QuickAccessCard = ({
  title,
  count,
  subtitle,
  icon: Icon,
  bgColor,
  href,
}: QuickAccessCardProps) => {
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
            className={`h-8 w-8 mx-auto flex items-center justify-center rounded-lg font-medium transition-colors ${
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
