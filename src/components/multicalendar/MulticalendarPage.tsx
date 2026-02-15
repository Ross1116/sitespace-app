"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  CalendarCurrentDate,
  CalendarMonthView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
} from "@/components/ui/full-calendar/index";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/app/context/AuthContext";
import { CalendarEvent, AssetCalendar } from "@/lib/multicalendarHelpers";
import { CalendarHeader } from "./CalendarHeader";
import { MobileView } from "./MobileView";
import { DesktopView } from "./DesktopView";
import { AssetFilter } from "./AssetFilter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ApiAsset, ApiBooking } from "@/types";
import useSWR from "swr";
import { swrFetcher, SWR_CONFIG } from "@/lib/swr";
import { isAssetRetiredOrOutOfService } from "@/lib/assetStatus";

// ===== INTERFACES =====

interface CalendarDayResponse {
  date: string;
  bookings: ApiBooking[];
}

interface AssetListResponse {
  assets: ApiAsset[];
  total: number;
}

// ===== HELPER: PROCESS BOOKING TO EVENT =====
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
    bookingKey: b.id,
    bookingStatus: status,
    bookingTitle: title,
    bookingNotes: b.notes || "",
    assetId: b.asset_id,
    assetName: assetName,
    assetCode: assetCode,
    _originalData: b,
  } as CalendarEvent;
};

export default function MulticalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { user } = useAuth();
  const userId = user?.id;

  // Visibility State
  const [initialLoad, setInitialLoad] = useState(true);
  const [visibleAssets, setVisibleAssets] = useState<number[]>([]);

  // Read project from localStorage
  const projectId = useMemo(() => {
    if (!userId) return null;
    try {
      const raw = localStorage.getItem(`project_${userId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.id ?? parsed?.project_id ?? null;
    } catch {
      return null;
    }
  }, [userId]);

  // Date range: today ± 45 days
  const { dateFrom, dateTo } = useMemo(() => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 45);
    const to = new Date(today);
    to.setDate(today.getDate() + 45);
    return {
      dateFrom: from.toISOString().split("T")[0],
      dateTo: to.toISOString().split("T")[0],
    };
  }, []);

  // --- SWR: Assets ---
  const { data: assetsData, mutate: mutateAssets } = useSWR<AssetListResponse>(
    projectId ? `/assets/?project_id=${projectId}&skip=0&limit=100` : null,
    swrFetcher,
    SWR_CONFIG,
  );

  const availableAssets = useMemo(
    () =>
      (assetsData?.assets || [])
        .filter((asset) => !isAssetRetiredOrOutOfService(asset.status))
        .sort((a: ApiAsset, b: ApiAsset) => a.name.localeCompare(b.name)),
    [assetsData],
  );

  // --- SWR: Calendar bookings ---
  const {
    data: calendarData,
    isLoading: loading,
    error: fetchError,
    mutate,
  } = useSWR<CalendarDayResponse[]>(
    projectId
      ? `/bookings/calendar?date_from=${dateFrom}&date_to=${dateTo}&project_id=${projectId}`
      : null,
    swrFetcher,
    SWR_CONFIG,
  );

  const bookings = useMemo<CalendarEvent[]>(() => {
    if (!calendarData) return [];
    const allBookings = calendarData.flatMap((d) => d.bookings || []);
    return allBookings
      .filter(
        (b) =>
          b.status?.toLowerCase() !== "cancelled" &&
          b.status?.toLowerCase() !== "denied",
      )
      .map(processBookingToEvent);
  }, [calendarData]);

  const error = useMemo(() => {
    if (fetchError) return "Failed to fetch calendar data";
    if (userId && !projectId) return "No project selected";
    return null;
  }, [fetchError, userId, projectId]);

  const handleActionComplete = () => {
    mutate();
    mutateAssets();
  };

  const handleBookingCreated = (
    _newEvents: Partial<CalendarEvent>[] | Partial<CalendarEvent>,
  ) => {
    mutate();
  };

  const handleRefresh = () => {
    mutate();
    mutateAssets();
  };

  const assetCalendars: AssetCalendar[] = useMemo(() => {
    if (availableAssets.length === 0 && bookings.length > 0) {
      const groups: Record<string, AssetCalendar> = {};
      bookings.forEach((b) => {
        const maybeAssetStatus = (
          (b._originalData as { asset?: { status?: string } } | undefined)?.asset
            ?.status
        );
        if (isAssetRetiredOrOutOfService(maybeAssetStatus)) {
          return;
        }

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

