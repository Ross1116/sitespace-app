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
  convertBookingToCalendarEvent
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
      // Fetching up to 100 assets for the project to ensure we have the list
      const response = await api.get<AssetListResponse>("/assets/", {
        params: {
          project_id: projectId,
          limit: 100, 
          skip: 0
        }
      });
      // Ensure alphabetical sort by name
      return response.data.assets.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Failed to fetch assets", error);
      return [];
    }
  }
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

  // ✅ SHARED KEYS
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

  // ✅ FETCH DATA (Bookings & Assets)
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
      // 1. Fetch Assets (We fetch this every time to ensure new assets show up)
      // This logic allows us to build empty calendars for assets without bookings
      const assets = await assetsApi.getProjectAssets(project.id);
      setAvailableAssets(assets);

      // 2. Fetch Bookings
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

  // ✅ INITIAL EFFECT
  useEffect(() => {
    if (!user) return;

    let foundCache = false;

    // 1. Instant Load from Cache
    const cachedBookings = localStorage.getItem(storageKey);
    if (cachedBookings) {
      try {
        const parsedData = JSON.parse(cachedBookings);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
            console.log("⚡ Instant Load from Cache (Calendar)");
            const transformed = parsedData.map(convertBookingToCalendarEvent);
            setBookings(transformed);
            // Note: We don't cache assets deeply yet, so we still fetch fresh to get the asset list
            foundCache = true;
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    // 2. Fetch Fresh Data
    // If cache was found, we run in background mode (spinner won't flicker if data exists).
    if (!hasFetched.current) {
        fetchData(foundCache);
    }

    // 3. Background Interval
    const interval = setInterval(() => fetchData(true), 300000);
    return () => clearInterval(interval);
  }, [user]);

  // Refetch when month changes
  useEffect(() => {
    if (hasFetched.current) {
      fetchData(true);
    }
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const handleActionComplete = () => {
    fetchData(true);
  };

  const handleRefresh = () => {
    hasFetched.current = false;
    fetchData(false); 
  };

  // ✅ CONSTRUCT ASSET CALENDARS
  // We map over ALL available assets, not just the ones with bookings.
  const assetCalendars: AssetCalendar[] = useMemo(() => {
    // Fallback: If asset fetch failed but we have bookings, derive from bookings (Old behavior)
    // This prevents white screen if the asset API fails but bookings load
    if (availableAssets.length === 0 && bookings.length > 0) {
        const groups: Record<string, AssetCalendar> = {};
        bookings.forEach(b => {
            if(!groups[b.assetId]) {
                groups[b.assetId] = { 
                    id: b.assetId, 
                    name: b.assetName, 
                    events: [],
                    asset: { id: b.assetId, name: b.assetName } 
                };
            }
            groups[b.assetId].events.push(b);
        });
        return Object.values(groups).sort((a,b) => a.name.localeCompare(b.name));
    }

    // Primary Logic: Create a calendar for every available asset
    return availableAssets.map(asset => {
        // Find events belonging to this asset
        const assetEvents = bookings.filter(b => b.assetId === asset.id);
        
        return {
            id: asset.id,
            name: asset.name,
            asset: asset,
            events: assetEvents
        };
    });
  }, [availableAssets, bookings]);


  // ✅ VISIBILITY LOGIC (New Requirement)
  useEffect(() => {
    // Run this only on initial load or when data first arrives
    if (initialLoad && assetCalendars.length > 0) {
      
      // 1. Identify indices of assets that actually have bookings
      const indicesWithBookings = assetCalendars
        .map((cal, index) => cal.events.length > 0 ? index : -1)
        .filter(index => index !== -1);

      let newVisibleAssets: number[] = [];

      if (indicesWithBookings.length > 0) {
        // Scenario A: There are bookings. Show those assets (Max 6).
        newVisibleAssets = indicesWithBookings.slice(0, 6);
      } else {
        // Scenario B: No bookings anywhere. Show first 6 assets alphabetically.
        // (assetCalendars is already sorted by name from the API fetch)
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

  if (error && !loading && bookings.length === 0 && availableAssets.length === 0) {
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