"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  AssetCalendar,
  convertBookingToCalendarEvent,
} from "@/lib/multicalendarHelpers";
import { CalendarHeader } from "./CalendarHeader";
import { MobileView } from "./MobileView";
import { DesktopView } from "./DesktopView";
import { AssetFilter } from "./AssetFilter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addHours } from "date-fns";

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
  status: string;
  notes?: string;
  asset?: {
    id: string;
    name: string;
    asset_code: string;
  };
  [key: string]: any;
}

interface Asset {
  id: string;
  name: string;
  asset_code?: string;
  status?: string;
}

interface AssetListResponse {
  assets: Asset[];
  total: number;
}

interface CalendarDayView {
  date: string;
  bookings: BookingDetail[];
  booking_count?: number;
}

// ===== API FUNCTIONS =====
const bookingsApi = {
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

const assetsApi = {
  getProjectAssets: async (projectId: string): Promise<Asset[]> => {
    try {
      const response = await api.get<AssetListResponse>("/assets/", {
        params: {
          project_id: projectId,
          limit: 100,
          skip: 0,
        },
      });
      return response.data.assets.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Failed to fetch assets", error);
      return [];
    }
  },
};

export default function MulticalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Data States
  const [bookings, setBookings] = useState<CalendarEvent[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const hasFetched = useRef(false);
  const userId = user?.id;

  // Visibility State
  const [initialLoad, setInitialLoad] = useState(true);
  const [visibleAssets, setVisibleAssets] = useState<number[]>([]);

  // Keys
  const storageKey = `bookings_v5_${userId}`;
  const projectStorageKey = `project_${userId}`;

  const getStoredProject = () => {
    if (!user) return null;
    const projectString = localStorage.getItem(projectStorageKey);
    if (!projectString) return null;
    try {
      return JSON.parse(projectString);
    } catch {
      return null;
    }
  };

  const fetchData = async (isBackground = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isBackground) setLoading(true);
    setError(null);

    const project = getStoredProject();
    if (!project) {
      setError("No project selected");
      setLoading(false);
      return;
    }

    try {
      const assets = await assetsApi.getProjectAssets(project.id);
      setAvailableAssets(assets);

      const today = new Date();
      const dateFrom = new Date(today);
      dateFrom.setDate(today.getDate() - 45);
      const dateTo = new Date(today);
      dateTo.setDate(today.getDate() + 45);

      const calendarData = await bookingsApi.getCalendarView(
        dateFrom.toISOString().split("T")[0],
        dateTo.toISOString().split("T")[0],
        project.id
      );

      const allBookings: BookingDetail[] = calendarData.flatMap(
        (dayData) => dayData.bookings || []
      );

      localStorage.setItem(storageKey, JSON.stringify(allBookings));

      const transformedBookings: CalendarEvent[] = allBookings.map(
        convertBookingToCalendarEvent
      );

      setBookings(transformedBookings);
      hasFetched.current = true;
    } catch (err: any) {
      console.error("❌ Error fetching data:", err);
      if (bookings.length === 0) {
        setError(err.message || "Failed to fetch calendar data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    let foundCache = false;
    const cachedBookings = localStorage.getItem(storageKey);
    if (cachedBookings) {
      try {
        const parsedData = JSON.parse(cachedBookings);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          const transformed = parsedData.map(convertBookingToCalendarEvent);
          setBookings(transformed);
          foundCache = true;
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    if (!hasFetched.current) {
      fetchData(foundCache);
    }

    const interval = setInterval(() => fetchData(true), 300000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (hasFetched.current) {
      fetchData(true);
    }
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const handleActionComplete = () => {
    fetchData(true);
  };

  function parseDatesafe(original: any) {
    if (!original) return {};
    try {
      const start =
        original.booking_date && original.start_time
          ? new Date(`${original.booking_date}T${original.start_time}`)
          : original.start || null;
      const end =
        original.booking_date && original.end_time
          ? new Date(`${original.booking_date}T${original.end_time}`)
          : original.end || null;
      return { start, end };
    } catch {
      return {};
    }
  }

  const handleBookingCreated = (
    newEvents: Partial<CalendarEvent>[] | Partial<CalendarEvent>
  ) => {
    const arr = Array.isArray(newEvents) ? newEvents : [newEvents];

    const normalized = arr.map((e, idx) => {
      const ev = e as any;
      const original = ev._originalData || ev.bookingData || ev;

      // 1. Asset Logic
      const assetId = String(
        ev.assetId || ev.asset_id || original?.asset_id || ""
      ).trim();
      const assetName =
        ev.assetName ||
        ev.asset_name ||
        original?.asset?.name ||
        original?.asset_name ||
        (assetId ? `Asset ${String(assetId).slice(0, 6)}` : "Unknown Asset");

      // 2. Title / Description Logic (Consistent with Helpers)
      const rawPurpose = original?.purpose || ev.purpose || "";
      const rawNotes = original?.notes || ev.notes || ev.description || "";

      let baseTitle = "Booking";
      let baseDescription = "No description provided";

      if (rawPurpose && rawPurpose.trim() !== "") {
        baseTitle = rawPurpose;
      } else if (rawNotes && rawNotes.trim() !== "") {
        baseTitle = rawNotes;
      }

      if (rawNotes && rawNotes.trim() !== "") {
        if (baseTitle !== rawNotes) baseDescription = rawNotes;
        else baseDescription = "No additional details";
      }

      // 3. Construct Event
      return {
        id:
          ev.id ||
          `${Math.random().toString(36).slice(2, 9)}-${Date.now()}-${idx}`,
        start:
          ev.start ||
          (original && parseDatesafe(original)?.start) ||
          new Date(),
        end:
          ev.end ||
          (original && parseDatesafe(original)?.end) ||
          addHours(ev.start || new Date(), 1),

        // UI Properties
        title: `${baseTitle} - ${assetName}`,
        description: baseDescription,
        color:
          ev.color || (original?.status === "confirmed" ? "green" : "yellow"),

        // Data Properties
        bookingTitle: baseTitle,
        bookingDescription: baseDescription,
        bookingNotes: rawNotes,
        bookingStatus: ev.bookingStatus || original?.status || "pending",

        assetId,
        assetName,
        bookedAssets: ev.bookedAssets || (assetName ? [assetName] : []),
        _originalData: original,
        ...ev,
      } as CalendarEvent;
    });

    setBookings((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const toAdd = normalized.filter((n) => !existingIds.has(n.id));
      const next = [...prev, ...toAdd];
      return next;
    });

    try {
      const firstAssetId = normalized.find((n) => n.assetId)?.assetId;
      if (firstAssetId) {
        const idx = assetCalendars.findIndex(
          (ac) => String(ac.id) === String(firstAssetId)
        );
        if (idx !== -1 && !visibleAssets.includes(idx)) {
          setVisibleAssets((prev) => {
            const copy = Array.from(prev);
            copy.unshift(idx);
            return copy.slice(0, 6);
          });
        }
      }
    } catch (e) {}
  };
  const handleRefresh = () => {
    hasFetched.current = false;
    fetchData(false);
  };

  const assetCalendars: AssetCalendar[] = useMemo(() => {
    if (availableAssets.length === 0 && bookings.length > 0) {
      const groups: Record<string, AssetCalendar> = {};
      bookings.forEach((b) => {
        if (!groups[b.assetId]) {
          groups[b.assetId] = {
            id: b.assetId,
            name: b.assetName,
            events: [],
            asset: { id: b.assetId, name: b.assetName },
          };
        }
        groups[b.assetId].events.push(b);
      });
      return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    }

    return availableAssets.map((asset) => {
      const assetEvents = bookings.filter((b) => b.assetId === asset.id);
      return {
        id: asset.id,
        name: asset.name,
        asset: asset,
        events: assetEvents,
      };
    });
  }, [availableAssets, bookings]);

  useEffect(() => {
    if (initialLoad && assetCalendars.length > 0) {
      const indicesWithBookings = assetCalendars
        .map((cal, index) => (cal.events.length > 0 ? index : -1))
        .filter((index) => index !== -1);

      let newVisibleAssets: number[] = [];
      if (indicesWithBookings.length > 0) {
        newVisibleAssets = indicesWithBookings.slice(0, 6);
      } else {
        newVisibleAssets = assetCalendars.map((_, i) => i).slice(0, 6);
      }
      setVisibleAssets(newVisibleAssets);
      setInitialLoad(false);
    }
  }, [assetCalendars, initialLoad]);

  const selectedCalendar = assetCalendars[selectedAssetIndex] || {
    id: "",
    name: "No asset selected",
    events: [],
  };

  if (
    error &&
    !loading &&
    bookings.length === 0 &&
    availableAssets.length === 0
  ) {
    return (
      <div className="h-screen bg-[hsl(20,60%,99%)] flex items-center justify-center p-6">
        <Card className="p-6 max-w-md border-red-200 shadow-md">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-[#0B1120] text-white rounded hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  // --- Background color from the Home Palette ---
  const PAGE_BG = "bg-[hsl(20,60%,99%)]";

  return (
    <div
      className={`h-full pt-0 px-2 sm:p-6 lg:px-8 grid grid-cols-12 gap-6 ${PAGE_BG}`}
    >
      {/* --- LEFT SIDEBAR WRAPPER --- */}
      {/* This div groups the Calendar and Filter so they stack naturally without stretching */}
      <div
        className={`${
          isCollapsed ? "hidden" : "hidden lg:flex col-span-3"
        } flex-col gap-6`}
      >
        {/* Month Calendar Card */}
        <Card
          className="w-full h-fit overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl transition-all duration-600"
        >
          <Calendar
            view="month"
            date={currentDate}
            onDateChange={setCurrentDate}
          >
            <div className="p-4 py-7 w-full flex flex-col">
              <div className="flex px-4 items-center mb-6 justify-between border-b border-slate-100 pb-4">
                <CalendarCurrentDate className="text-lg font-bold text-slate-900" />
                <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
                  <CalendarPrevTrigger className="p-1 hover:bg-white rounded-md text-slate-500 hover:text-slate-900">
                    <ChevronLeft size={16} />
                  </CalendarPrevTrigger>
                  <CalendarNextTrigger className="p-1 hover:bg-white rounded-md text-slate-500 hover:text-slate-900">
                    <ChevronRight size={16} />
                  </CalendarNextTrigger>
                </div>
              </div>
              <div className="px-2">
                <CalendarMonthView />
              </div>
            </div>
          </Calendar>
        </Card>

        {/* Asset Filter (Moved inside wrapper) */}
        {/* We pass a specific className to override the component's internal grid styles */}
        <AssetFilter
          isCollapsed={isCollapsed}
          loading={loading}
          assetCalendars={assetCalendars}
          visibleAssets={visibleAssets}
          setVisibleAssets={setVisibleAssets}
        />
      </div>

      {/* --- MAIN CONTENT (Right Side) --- */}
      <Card
        className={`p-6 mb-4 ${
          isCollapsed ? "col-span-12" : "col-span-12 lg:col-span-9"
        } h-full flex flex-col bg-slate-50 border border-slate-200 shadow-sm rounded-2xl transition-all duration-600`}
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
          <div className="md:hidden">
            <MobileView
              loading={loading}
              selectedCalendar={selectedCalendar}
              currentDate={currentDate}
              onActionComplete={handleActionComplete}
              onBookingCreated={handleBookingCreated}
            />
          </div>
          <div className="hidden md:block flex-1 overflow-hidden">
            {/* Ensure DesktopView takes remaining height */}
            <DesktopView
              loading={loading}
              isCollapsed={isCollapsed}
              assetCalendars={assetCalendars}
              visibleAssets={visibleAssets}
              currentDate={currentDate}
              onActionComplete={handleActionComplete}
              onBookingCreated={handleBookingCreated}
            />
          </div>
        </Calendar>
      </Card>
    </div>
  );
}
