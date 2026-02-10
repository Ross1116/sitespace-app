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
import { CalendarEvent, AssetCalendar } from "@/lib/multicalendarHelpers";
import { CalendarHeader } from "./CalendarHeader";
import { MobileView } from "./MobileView";
import { DesktopView } from "./DesktopView";
import { AssetFilter } from "./AssetFilter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addHours } from "date-fns";
import { ApiAsset, ApiBooking, ApiProject, getApiErrorMessage } from "@/types";

// ===== 1. UPDATED INTERFACES (MATCHING YOUR JSON) =====

const isAbortError = (error: unknown, signal?: AbortSignal) => {
  if (signal?.aborted) return true;
  if (error instanceof Error && error.name === "CanceledError") return true;
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ERR_CANCELED"
  ) {
    return true;
  }
  return false;
};

interface CalendarDayResponse {
  date: string;
  bookings: ApiBooking[];
}

interface AssetListResponse {
  assets: ApiAsset[];
  total: number;
}

// ===== API FUNCTIONS =====
const bookingsApi = {
  getCalendarView: async (
    dateFrom: string,
    dateTo: string,
    projectId?: string,
    signal?: AbortSignal,
  ): Promise<CalendarDayResponse[]> => {
    const response = await api.get<CalendarDayResponse[]>(
      "/bookings/calendar",
      {
        params: {
          date_from: dateFrom,
          date_to: dateTo,
          project_id: projectId,
        },
        signal,
      },
    );
    return response.data;
  },
};

const assetsApi = {
  getProjectAssets: async (
    projectId: string,
    signal?: AbortSignal,
  ): Promise<ApiAsset[]> => {
    try {
      const response = await api.get<AssetListResponse>("/assets/", {
        params: {
          project_id: projectId,
          limit: 100,
          skip: 0,
        },
        signal,
      });
      return response.data.assets.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      if (isAbortError(error, signal)) return [];
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
  const [availableAssets, setAvailableAssets] = useState<ApiAsset[]>([]);

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

  const getStoredProject = (): ApiProject | null => {
    if (!user) return null;
    const projectString = localStorage.getItem(projectStorageKey);
    if (!projectString) return null;
    try {
      return JSON.parse(projectString) as ApiProject;
    } catch {
      return null;
    }
  };

  // ===== 2. HELPER: PROCESS JSON TO EVENT =====
  const processBookingToEvent = (b: ApiBooking): CalendarEvent => {
    const startDate = new Date(`${b.booking_date}T${b.start_time}`);
    const endDate = new Date(`${b.booking_date}T${b.end_time}`);

    const status = b.status?.toLowerCase() || "pending";
    let color: CalendarEvent["color"] = "yellow";
    if (status === "confirmed") color = "green";
    if (status === "completed") color = "blue";
    if (status === "cancelled" || status === "denied") color = "pink";

    let title = "Booking";
    if (b.purpose && b.purpose.trim() !== "") title = b.purpose;
    else if (b.notes && b.notes.trim() !== "") title = b.notes;

    const assetName = b.asset?.name || "Unknown Asset";
    const assetCode = b.asset?.asset_code || "";

    return {
      id: b.id,
      start: startDate,
      end: endDate,
      title: title,
      description: b.notes || "",
      color,

      // Custom fields for Drag/Drop & Details
      bookingKey: b.id,
      bookingStatus: status,
      bookingTitle: title,
      bookingNotes: b.notes || "",

      assetId: b.asset_id,
      assetName: assetName,
      assetCode: assetCode,

      // Pass the Full Original Object so the Details Dialog works!
      _originalData: b,
    } as CalendarEvent;
  };

  // ===== 3. FETCH DATA LOGIC =====
  const fetchData = async (isBackground = false, signal?: AbortSignal) => {
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
      const assets = await assetsApi.getProjectAssets(project.id, signal);
      if (signal?.aborted) return;
      setAvailableAssets(assets);

      const today = new Date();
      const dateFrom = new Date(today);
      dateFrom.setDate(today.getDate() - 45);
      const dateTo = new Date(today);
      dateTo.setDate(today.getDate() + 45);

      const calendarData = await bookingsApi.getCalendarView(
        dateFrom.toISOString().split("T")[0],
        dateTo.toISOString().split("T")[0],
        project.id,
        signal,
      );
      const allBookings: ApiBooking[] = calendarData.flatMap(
        (dayData) => dayData.bookings || [],
      );

      const activeBookings = allBookings.filter(
        (b) =>
          b.status?.toLowerCase() !== "cancelled" &&
          b.status?.toLowerCase() !== "denied",
      );

      if (signal?.aborted) return;
      localStorage.setItem(storageKey, JSON.stringify(activeBookings));

      const transformedBookings: CalendarEvent[] = activeBookings.map(
        processBookingToEvent,
      );

      setBookings(transformedBookings);
      hasFetched.current = true;
    } catch (err: unknown) {
      if (isAbortError(err, signal)) return;
      console.error("❌ Error fetching data:", err);
      if (bookings.length === 0) {
        setError(getApiErrorMessage(err, "Failed to fetch calendar data"));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
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
          // Filter cached data
          const filtered = parsedData.filter(
            (b: ApiBooking) =>
              b.status?.toLowerCase() !== "cancelled" &&
              b.status?.toLowerCase() !== "denied",
          );
          const transformed = filtered.map(processBookingToEvent);
          setBookings(transformed);
          foundCache = true;
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    const controller = new AbortController();
    if (!hasFetched.current) {
      fetchData(foundCache, controller.signal);
    }

    const interval = setInterval(() => fetchData(true), 300000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (hasFetched.current) {
      const controller = new AbortController();
      fetchData(true, controller.signal);
      return () => controller.abort();
    }
    return undefined;
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const handleActionComplete = () => {
    fetchData(true);
  };

  // Keep for potential internal updates from child components
  const handleBookingCreated = (
    newEvents: Partial<CalendarEvent>[] | Partial<CalendarEvent>,
  ) => {
    const arr = Array.isArray(newEvents) ? newEvents : [newEvents];

    // Convert partials to full events using simple defaults,
    // real data comes on next fetch
    const normalized = arr.map((ev, idx) => {
      const event = ev as Partial<CalendarEvent>;
      return {
        ...event,
        id: event.id || `temp-${Date.now()}-${idx}`,
        start: event.start || new Date(),
        end: event.end || addHours(new Date(), 1),
        title: event.title || "New Booking",
        bookingStatus: "pending",
        assetId: event.assetId || "",
        bookedAssets: event.bookedAssets || [],
      } as CalendarEvent;
    });

    setBookings((prev) => [...prev, ...normalized]);
    handleActionComplete(); // Trigger refresh to get real data
  };

  const handleRefresh = () => {
    hasFetched.current = false;
    fetchData(false);
  };

  const assetCalendars: AssetCalendar[] = useMemo(() => {
    if (availableAssets.length === 0 && bookings.length > 0) {
      const groups: Record<string, AssetCalendar> = {};
      bookings.forEach((b) => {
        // Safe access to assetId
        const aId = b.assetId || "unknown";
        if (!groups[aId]) {
          groups[aId] = {
            id: aId,
            name: b.assetName || "Unknown",
            events: [],
            asset:
              typeof b._originalData === "object" && b._originalData !== null
                ? (b._originalData as { asset?: ApiAsset }).asset || {
                    id: aId,
                    name: b.assetName,
                  }
                : {
                    id: aId,
                    name: b.assetName,
                  },
          };
        }
        groups[aId].events.push(b);
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
      <div className="h-screen bg-[var(--page-bg)] flex items-center justify-center p-6">
        <Card className="p-6 max-w-md border-red-200 shadow-md">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-[var(--navy)] text-white rounded hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  const PAGE_BG = "bg-[var(--page-bg)]";

  return (
    <div
      className={`h-full pt-0 px-2 sm:p-6 lg:px-8 grid grid-cols-12 gap-6 ${PAGE_BG}`}
    >
      {/* --- LEFT SIDEBAR WRAPPER --- */}
      <div
        className={`${
          isCollapsed ? "hidden" : "hidden lg:flex col-span-3"
        } flex-col gap-6`}
      >
        {/* Month Calendar Card */}
        <Card className="w-full h-fit overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl transition-all duration-600">
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

        {/* Asset Filter */}
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
            {/* Desktop View with Maintenance Logic built-in */}
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

