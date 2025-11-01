"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  CalendarCurrentDate,
  CalendarMonthView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
} from "@/components/ui/full-calendar/index";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/app/context/AuthContext";
import api from "@/lib/api";
import {
  CalendarEvent,
  groupBookingsByAsset,
  AssetCalendar,
  convertBookingToCalendarEvent  // ✅ Import the conversion function
} from "@/lib/multicalendarHelpers";
import { CalendarHeader } from "./CalendarHeader";
import { MobileView } from "./MobileView";
import { DesktopView } from "./DesktopView";
import { AssetFilter } from "./AssetFilter";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ===== TYPE DEFINITIONS =====
interface BookingDetail {
  id: string;
  project_id?: string;
  manager_id: string;
  subcontractor_id?: string;
  asset_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "in_progress";
  purpose?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
    location?: string;
    status?: string;
  };
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role?: string;
  };
  subcontractor?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    company_name?: string;
    trade_specialty?: string;
  };
  asset?: {
    id: string;
    name: string;
    asset_code: string;
    asset_type?: string;
    type?: string;
    status?: string;
  };
}

interface BookingListResponse {
  bookings: BookingDetail[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

interface CalendarDayView {
  date: string;
  bookings: BookingDetail[];
  booking_count?: number;  // ✅ Made optional
}

// ===== API FUNCTIONS =====
const bookingsApi = {
  getBookings: async (params: {
    project_id?: string;
    skip?: number;
    limit?: number;
  }): Promise<BookingListResponse> => {
    const response = await api.get<BookingListResponse>("/bookings/", {
      params: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 1000,
        ...params,
      },
    });
    return response.data;
  },

  getCalendarView: async (
    dateFrom: string,
    dateTo: string,
    projectId?: string
  ): Promise<CalendarDayView[]> => {
    const response = await api.get<CalendarDayView[]>("/bookings/calendar", {
      params: {
        date_from: dateFrom,
        date_to: dateTo,
        project_id: projectId,
      },
    });
    return response.data;
  },
};

// ❌ REMOVE THESE LINES - They're in the wrong place (lines 175-176)
// const assetBookings = groupBookingsByAsset(bookings);
// const assetCalendars: AssetCalendar[] = Object.values(assetBookings);

// ===== HELPER FUNCTIONS =====
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// ❌ REMOVE this function - use the one from multicalendarHelpers instead
// const parseTimeToDate = (dateStr: string, timeStr: string): Date => { ... }
// const transformBookingToEvent = (booking: BookingDetail) => { ... }

// ===== MAIN COMPONENT =====
export default function MulticalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [bookings, setBookings] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const hasFetched = useRef(false);
  const userId = user?.id;
  const storageKey = `bookings_${userId}`;
  const projectStorageKey = `project_${userId}`;

  // Get stored project
  const getStoredProject = () => {
    if (!user) return null;
    const projectString = localStorage.getItem(projectStorageKey);
    if (!projectString) {
      console.error("No project found in localStorage");
      return null;
    }
    try {
      return JSON.parse(projectString);
    } catch (error) {
      console.error("Error parsing project:", error);
      return null;
    }
  };

  // Fetch bookings using calendar view (OPTIMIZED)
  const fetchBookings = async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (hasFetched.current && !forceRefresh) {
      return;
    }

    setLoading(true);
    setError(null);

    const project = getStoredProject();
    if (!project) {
      setError("No project selected");
      setLoading(false);
      return;
    }

    try {
      console.log("📅 Fetching bookings for project:", project.id);

      // Calculate date range: 45 days before and 45 days after current date (90 days total)
      const today = new Date();
      const dateFrom = new Date(today);
      dateFrom.setDate(today.getDate() - 45);

      const dateTo = new Date(today);
      dateTo.setDate(today.getDate() + 45);

      console.log(
        "📅 Date range:",
        formatDate(dateFrom),
        "to",
        formatDate(dateTo)
      );

      // Use calendar view endpoint for better performance
      const calendarData = await bookingsApi.getCalendarView(
        formatDate(dateFrom),
        formatDate(dateTo),
        project.id
      );

      console.log("📅 Calendar data fetched:", calendarData.length, "days");

      // Flatten bookings from all days
      const allBookings: BookingDetail[] = calendarData.flatMap(
        (dayData) => dayData.bookings || []
      );

      console.log("📦 Total raw bookings:", allBookings.length);

      // ✅ Use the imported conversion function
      const transformedBookings: CalendarEvent[] = allBookings.map(
        convertBookingToCalendarEvent
      );

      console.log("✅ Total transformed bookings:", transformedBookings.length);
      setBookings(transformedBookings);

      // Cache the data
      localStorage.setItem(storageKey, JSON.stringify(transformedBookings));
      hasFetched.current = true;
    } catch (err: any) {
      console.error("❌ Error fetching bookings:", err);
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch bookings";
      setError(errorMessage);

      // Try to use cached data on error
      const cachedBookings = localStorage.getItem(storageKey);
      if (cachedBookings) {
        try {
          const parsedBookings = JSON.parse(cachedBookings);
          console.log("📦 Using cached bookings:", parsedBookings.length);
          setBookings(parsedBookings);
        } catch (e) {
          console.error("Error parsing cached bookings:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Load cached data on mount, then fetch fresh
  useEffect(() => {
    if (!user) return;

    // Try to load from cache first for instant display
    const cachedBookings = localStorage.getItem(storageKey);
    if (cachedBookings) {
      try {
        const parsedBookings = JSON.parse(cachedBookings);
        if (Array.isArray(parsedBookings)) {
          console.log("📦 Loaded cached bookings:", parsedBookings.length);
          setBookings(parsedBookings);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error parsing cached bookings:", error);
        localStorage.removeItem(storageKey);
      }
    }

    // Fetch fresh data
    fetchBookings();

    // Set up periodic refresh (every 5 minutes)
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing bookings...");
      fetchBookings(true);
    }, 300000);

    return () => clearInterval(interval);
  }, [user]);

  // Refetch when month changes
  useEffect(() => {
    if (hasFetched.current) {
      console.log("📅 Month/Year changed, refetching...");
      fetchBookings(true);
    }
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  // Handle booking actions (create/update/delete)
  const handleActionComplete = () => {
    console.log("✅ Action completed, refreshing bookings...");
    fetchBookings(true);
  };

  // Manual refresh
  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    hasFetched.current = false;
    fetchBookings(true);
  };

  // ✅ Group bookings by asset (THIS IS THE CORRECT LOCATION)
  const assetBookings = groupBookingsByAsset(bookings);
  const assetCalendars: AssetCalendar[] = Object.values(assetBookings);

  // ✅ Debug logging
  useEffect(() => {
    console.log("📊 Debug Info:");
    console.log("  Total bookings:", bookings.length);
    console.log("  Asset calendars:", assetCalendars.length);

    assetCalendars.forEach((calendar, index) => {
      console.log(`  Calendar ${index}:`, {
        id: calendar.id.slice(0, 8) + "...",
        name: calendar.name,
        eventCount: calendar.events?.length || 0,
      });
    });

    // Check current date bookings
    const currentDateStr = formatDate(currentDate);
    const todaysBookings = bookings.filter(
      (b) => b.bookingTimeDt === currentDateStr
    );
    console.log(`  Bookings for ${currentDateStr}:`, todaysBookings.length);
  }, [bookings, assetCalendars, currentDate]);

  // Visible assets state
  const [initialLoad, setInitialLoad] = useState(true);
  const [visibleAssets, setVisibleAssets] = useState<number[]>([]);

  useEffect(() => {
    if (initialLoad && assetCalendars.length > 0) {
      setVisibleAssets(assetCalendars.map((_, index) => index));
      setInitialLoad(false);
      console.log("✅ Initialized visible assets:", assetCalendars.length);
    }
  }, [assetCalendars, initialLoad]);

  // Get selected calendar for mobile view
  const selectedCalendar = assetCalendars[selectedAssetIndex] || {
    id: "",
    name: "No asset selected",
    events: [],
  };

  // Error state UI
  if (error && !loading && bookings.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full pt-0 px-6 sm:p-6 pl-1 grid grid-cols-12 grid-rows-12 gap-2">
      {/* Month calendar date picker */}
      <Card
        className={`${
          isCollapsed ? "hidden" : "col-span-3 lg:flex"
        } row-span-6 overflow-hidden hidden bg-amber-50 rounded-2xl h-full transition-all duration-600`}
      >
        <Calendar view="month" date={currentDate} onDateChange={setCurrentDate}>
          <div className="p-4 py-7 w-full flex flex-col">
            <div className="flex px-6 items-center mb-4 justify-between">
              <CalendarCurrentDate />

              <div className="flex gap-2">
                <CalendarPrevTrigger>
                  <ChevronLeft size={20} />
                  <span className="sr-only">Previous</span>
                </CalendarPrevTrigger>

                <CalendarNextTrigger>
                  <ChevronRight size={20} />
                  <span className="sr-only">Next</span>
                </CalendarNextTrigger>
              </div>
            </div>

            <div className="flex-1 px-6 overflow-hidden">
              <CalendarMonthView />
            </div>
          </div>
        </Calendar>
      </Card>

      {/* Full calendar day view */}
      <Card
        className={`p-6 ml-4 md:ml-0 h-fit mb-4 ${
          isCollapsed ? "col-span-12" : "col-span-12 lg:col-span-9"
        } row-span-12 flex flex-col bg-gradient-to-tr from-amber-50 to-orange-50 rounded-2xl transition-all duration-600`}
      >
        <Calendar date={currentDate} onDateChange={setCurrentDate} view="day">
          <CalendarHeader
            isCollapsed={isCollapsed}
            loading={loading}
            assetCalendars={assetCalendars}
            setIsCollapsed={setIsCollapsed}
            selectedAssetIndex={selectedAssetIndex}
            setSelectedAssetIndex={setSelectedAssetIndex}
            onRefresh={handleRefresh}
            error={error}
          />

          {/* Mobile view */}
          <div className="md:hidden">
            <MobileView
              loading={loading}
              selectedCalendar={selectedCalendar}
              currentDate={currentDate}
              onActionComplete={handleActionComplete}
            />
          </div>

          {/* Desktop view */}
          <div className="hidden md:block">
            <DesktopView
              loading={loading}
              isCollapsed={isCollapsed}
              assetCalendars={assetCalendars}
              visibleAssets={visibleAssets}
              currentDate={currentDate}
              onActionComplete={handleActionComplete}
            />
          </div>
        </Calendar>
      </Card>

      {/* Asset Filter */}
      <AssetFilter
        isCollapsed={isCollapsed}
        loading={loading}
        assetCalendars={assetCalendars}
        visibleAssets={visibleAssets}
        setVisibleAssets={setVisibleAssets}
      />
    </div>
  );
}