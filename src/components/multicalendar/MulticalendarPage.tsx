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
import { MulticalendarActionsProvider } from "./MulticalendarActionsContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ApiAsset, ApiBooking } from "@/types";
import { isAssetRetiredOrOutOfService } from "@/lib/assetStatus";
import ComponentErrorBoundary from "@/components/ui/ComponentErrorBoundary";
import { useResolvedProjectSelection } from "@/hooks/useResolvedProjectSelection";
import { useProjectAssets } from "@/hooks/useProjectAssets";
import { useCalendarBookingsQuery } from "@/hooks/bookings/useBookingsData";
import { useUIIntentStore } from "@/stores/uiIntentStore";

// ===== HELPER: PROCESS BOOKING TO EVENT =====
const processBookingToEvent = (
  b: ApiBooking,
  userId?: string,
): CalendarEvent => {
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
  const createdById = b.created_by_id || b.created_by?.id;
  const assignedUserId = b.subcontractor_id || b.manager_id;
  const isBookedByMe = Boolean(userId && createdById === userId);
  const isAssignedToMe = Boolean(userId && assignedUserId === userId);

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
    isBookedByMe,
    isAssignedToMe,
    _originalData: b,
  } as CalendarEvent;
};

export default function MulticalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id;
  const {
    projectId,
    projectsUrl,
    projectsError,
    projectsLoading,
    mutateProjects,
  } = useResolvedProjectSelection({
    userId,
    role: user?.role,
  });
  const uiScopeKey = useMemo(() => {
    if (!userId || !projectId) return null;
    return `${userId}:${projectId}`;
  }, [userId, projectId]);
  const hasUIIntentHydrated = useUIIntentStore((state) => state.hasHydrated);
  const getMulticalendarIntent = useUIIntentStore(
    (state) => state.getMulticalendarIntent,
  );
  const setMulticalendarVisibleAssetIds = useUIIntentStore(
    (state) => state.setMulticalendarVisibleAssetIds,
  );

  // Visibility State
  const [initialLoad, setInitialLoad] = useState(true);
  const [visibleAssets, setVisibleAssets] = useState<number[]>([]);

  // Date range: currently viewed date ± 45 days
  const { dateFrom, dateTo } = useMemo(() => {
    const center = new Date(currentDate);
    const from = new Date(center);
    from.setDate(center.getDate() - 45);
    const to = new Date(center);
    to.setDate(center.getDate() + 45);
    return {
      dateFrom: from.toISOString().split("T")[0],
      dateTo: to.toISOString().split("T")[0],
    };
  }, [currentDate]);

  // --- Assets ---
  const {
    assets,
    error: assetsError,
    isLoading: assetsLoading,
    mutate: mutateAssets,
  } = useProjectAssets(projectId);

  const availableAssets = useMemo(
    () =>
      assets
        .filter((asset) => !isAssetRetiredOrOutOfService(asset.status))
        .sort((a: ApiAsset, b: ApiAsset) => a.name.localeCompare(b.name)),
    [assets],
  );

  const {
    calendarData,
    isLoading: loading,
    error: fetchError,
    mutate,
  } = useCalendarBookingsQuery({
    projectId,
    enabled: Boolean(projectId),
    dateFrom,
    dateTo,
    refreshInterval: 30_000,
  });

  const bookings = useMemo<CalendarEvent[]>(() => {
    if (!calendarData) return [];
    const allBookings = calendarData.flatMap((d) => d.bookings || []);
    return allBookings
      .filter(
        (b) =>
          b.status?.toLowerCase() !== "cancelled" &&
          b.status?.toLowerCase() !== "denied",
      )
      .map((booking) => processBookingToEvent(booking, userId));
  }, [calendarData, userId]);

  const isPageLoading = loading || authLoading || projectsLoading;
  const isAssetPanelLoading = isPageLoading || assetsLoading;

  const error = useMemo(() => {
    if (fetchError) return "Failed to fetch calendar data";
    if (projectsError) return "Failed to fetch projects";
    if (assetsError) return "Failed to fetch assets";
    // Don't show "No project selected" while projects are still loading
    if (projectsUrl && projectsLoading) return null;
    if (userId && !projectId) return "No project selected";
    return null;
  }, [
    fetchError,
    projectsError,
    assetsError,
    projectsUrl,
    projectsLoading,
    userId,
    projectId,
  ]);

  const handleActionComplete = () => {
    mutate();
    mutateAssets();
  };

  const handleBookingCreated = (
    _newEvents: Partial<CalendarEvent>[] | Partial<CalendarEvent>,
  ) => {
    mutate();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.allSettled([mutateProjects(), mutate(), mutateAssets()]);
    setIsRefreshing(false);
  };

  const assetCalendars: AssetCalendar[] = useMemo(() => {
    if (availableAssets.length === 0 && bookings.length > 0) {
      const groups: Record<string, AssetCalendar> = {};
      bookings.forEach((b) => {
        const maybeAssetStatus = (
          b._originalData as { asset?: { status?: string } } | undefined
        )?.asset?.status;
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
    setInitialLoad(true);
    setVisibleAssets([]);
    setSelectedAssetIndex(0);
  }, [uiScopeKey]);

  useEffect(() => {
    if (initialLoad && assetCalendars.length > 0) {
      if (uiScopeKey && !hasUIIntentHydrated) {
        return;
      }

      const persistedVisibleAssetIds =
        uiScopeKey && hasUIIntentHydrated
          ? (getMulticalendarIntent(uiScopeKey)?.visibleAssetIds ?? [])
          : [];
      const persistedVisibleIndices = persistedVisibleAssetIds
        .map((assetId) =>
          assetCalendars.findIndex((calendar) => calendar.id === assetId),
        )
        .filter((index) => index >= 0);

      const indicesWithBookings = assetCalendars
        .map((cal, index) => (cal.events.length > 0 ? index : -1))
        .filter((index) => index !== -1);

      let newVisibleAssets: number[] = [];
      if (persistedVisibleIndices.length > 0) {
        newVisibleAssets = Array.from(new Set(persistedVisibleIndices));
      } else if (indicesWithBookings.length > 0) {
        newVisibleAssets = indicesWithBookings.slice(0, 6);
      } else {
        newVisibleAssets = assetCalendars.map((_, i) => i).slice(0, 6);
      }

      setVisibleAssets(newVisibleAssets);
      setSelectedAssetIndex((currentIndex) =>
        newVisibleAssets.includes(currentIndex)
          ? currentIndex
          : (newVisibleAssets[0] ?? 0),
      );
      setInitialLoad(false);
    }
  }, [
    assetCalendars,
    initialLoad,
    hasUIIntentHydrated,
    uiScopeKey,
    getMulticalendarIntent,
  ]);

  useEffect(() => {
    if (initialLoad || !uiScopeKey) return;
    const visibleAssetIds = visibleAssets
      .map((index) => assetCalendars[index]?.id)
      .filter(
        (assetId): assetId is string =>
          typeof assetId === "string" && assetId.trim().length > 0,
      );
    setMulticalendarVisibleAssetIds(uiScopeKey, visibleAssetIds);
  }, [
    initialLoad,
    uiScopeKey,
    visibleAssets,
    assetCalendars,
    setMulticalendarVisibleAssetIds,
  ]);

  const selectedCalendar = assetCalendars[selectedAssetIndex] || {
    id: "",
    name: "No asset selected",
    events: [],
  };

  if (
    error &&
    !isPageLoading &&
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
      {assetsLoading && !isPageLoading && (
        <div
          className="col-span-12 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
          role="status"
          aria-live="polite"
        >
          Loading assets...
        </div>
      )}
      {Boolean(assetsError) && (
        <div
          className="col-span-12 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800"
          role="alert"
        >
          Failed to load assets. Some asset calendars may be unavailable.
        </div>
      )}
      {/* --- LEFT SIDEBAR WRAPPER --- */}
      <div
        className={`${
          isCollapsed ? "hidden" : "hidden xl:flex col-span-3"
        } flex-col gap-6`}
      >
        {/* Month Calendar Card */}
        <Card className="w-full h-fit overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl transition-all duration-600">
          <Calendar
            view="month"
            date={currentDate}
            onDateChange={setCurrentDate}
          >
            <div className="p-3 w-full flex flex-col">
              <div className="flex items-center mb-3 justify-between border-b border-slate-100 pb-2">
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
              <div className="overflow-x-auto">
                <div className="min-w-[280px]">
                  <CalendarMonthView />
                </div>
              </div>
            </div>
          </Calendar>
        </Card>

        {/* Asset Filter */}
        <AssetFilter
          isCollapsed={isCollapsed}
          loading={isAssetPanelLoading}
          assetCalendars={assetCalendars}
          visibleAssets={visibleAssets}
          setVisibleAssets={setVisibleAssets}
        />
      </div>

      {/* --- MAIN CONTENT (Right Side) --- */}
      <Card
        className={`px-6 mb-2 ${
          isCollapsed ? "col-span-12" : "col-span-12 xl:col-span-9"
        } h-full flex flex-col bg-slate-50 border border-slate-200 shadow-sm rounded-2xl transition-all duration-600`}
      >
        <Calendar
          date={currentDate}
          onDateChange={setCurrentDate}
          view="day"
        >
          <CalendarHeader
            isCollapsed={isCollapsed}
            loading={isPageLoading}
            isRefreshing={isRefreshing}
            assetCalendars={assetCalendars}
            visibleAssets={visibleAssets}
            setVisibleAssets={setVisibleAssets}
            setIsCollapsed={setIsCollapsed}
            selectedAssetIndex={selectedAssetIndex}
            setSelectedAssetIndex={setSelectedAssetIndex}
            onRefresh={handleRefresh}
            error={error}
          />
          <ComponentErrorBoundary
            context="MulticalendarPage: interactive calendar surface render failed"
            title="Calendar section unavailable"
            message="The calendar section hit an issue. Retry this section to continue."
            className="m-2 rounded-xl border border-red-200 bg-red-50 p-5 text-center"
          >
            <div className="-mt-10 px-1 overflow-x-auto">
              <div className="flex items-center gap-2 whitespace-nowrap min-w-max">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Legend
                </span>

                <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 shrink-0">
                  <span className="h-2 w-2 rounded-full bg-slate-700" />
                  <span className="text-[11px] font-medium text-slate-700">
                    Your booking
                  </span>
                </div>

                <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 shrink-0">
                  <span className="h-2 w-2 rounded-full border border-slate-400 bg-white" />
                  <span className="text-[11px] font-medium text-slate-600">
                    Other bookings
                  </span>
                </div>

                <div className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 shrink-0">
                  Confirmed
                </div>
                <div className="rounded-full border border-amber-100 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 shrink-0">
                  Pending
                </div>
                <div className="rounded-full border border-sky-100 bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700 shrink-0">
                  Completed
                </div>
              </div>
            </div>
            <MulticalendarActionsProvider
              value={{
                onActionComplete: handleActionComplete,
                onBookingCreated: handleBookingCreated,
              }}
            >
              <div className="md:hidden">
                <MobileView
                  loading={isPageLoading}
                  selectedCalendar={selectedCalendar}
                  currentDate={currentDate}
                />
              </div>
              <div className="hidden md:block flex-1 overflow-hidden">
                <DesktopView
                  loading={isPageLoading}
                  isCollapsed={isCollapsed}
                  assetCalendars={assetCalendars}
                  visibleAssets={visibleAssets}
                  currentDate={currentDate}
                />
              </div>
            </MulticalendarActionsProvider>
          </ComponentErrorBoundary>
        </Calendar>
      </Card>
    </div>
  );
}
