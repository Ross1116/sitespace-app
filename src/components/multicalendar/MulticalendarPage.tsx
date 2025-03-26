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

import { groupBookingsByAsset } from "@/lib/multicalendarHelpers";
import { AssetCalendar } from "@/components/ui/full-calendar/index";
import { CalendarHeader } from "./CalendarHeader";
import { MobileView } from "./MobileView";
import { DesktopView } from "./DesktopView";
import { AssetFilter } from "./AssetFilter";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MulticalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const hasFetched = useRef(false);
  const userId = user?.userId;
  const storageKey = `bookings_${userId}`;
  const projectStorageKey = `project_${userId}`;

  // Function to fetch bookings
  const fetchBookings = async (forceRefresh = false) => {
    // Skip if no user
    if (!user) return;

    // Skip if this is not a forced refresh and we've already fetched
    if (hasFetched.current && !forceRefresh) return;

    setLoading(true);

    const projectString = localStorage.getItem(projectStorageKey);

    if (!projectString) {
      console.error("No project found in localStorage");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching bookings...");
      const project = JSON.parse(projectString);

      const response = await api.get(
        "/api/auth/slotBooking/getslotBookingList",
        {
          params: { projectId: project.id, userId: userId },
        }
      );

      const bookingsData = response.data?.bookingList || [];
      console.log("Bookings fetched:", bookingsData.length);
      setBookings(bookingsData);
      localStorage.setItem(storageKey, JSON.stringify(bookingsData));

      // Mark as fetched
      hasFetched.current = true;
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings from the API
  useEffect(() => {
    if (!user) return;

    // Try to load from cache first
    const cachedBookings = localStorage.getItem(storageKey);

    if (cachedBookings) {
      try {
        const parsedBookings = JSON.parse(cachedBookings);
        if (Array.isArray(parsedBookings)) {
          setBookings(parsedBookings);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error parsing cached bookings:", error);
        localStorage.removeItem(storageKey);
      }
    }

    // Fetch from API (will only fetch if not already fetched)
    fetchBookings();

    // Set up interval for periodic refreshes
    const interval = setInterval(() => fetchBookings(true), 300000);

    return () => clearInterval(interval);
  }, [user]);

  const handleActionComplete = () => {
    if (!user) return;
    const userId = user.userId;
    const storageKey = `bookings_${userId}`;

    const cachedBookings = localStorage.getItem(storageKey);

    if (cachedBookings) {
      try {
        const parsedBookings = JSON.parse(cachedBookings);
        if (Array.isArray(parsedBookings)) {
          setBookings(parsedBookings);
        }
      } catch (error) {
        console.error("Error parsing cached bookings:", error);
        localStorage.removeItem(storageKey);
      }
    }
    fetchBookings(true);
  };

  const assetBookings = groupBookingsByAsset(bookings);
  const assetCalendars: AssetCalendar[] = Object.values(assetBookings);
  const [initialLoad, setInitialLoad] = useState(true);
  const [visibleAssets, setVisibleAssets] = useState(
    assetCalendars.map((_, index) => index)
  );

  useEffect(() => {
    // Only set all assets visible on initial load or when new assets are added
    if (initialLoad && assetCalendars.length > 0) {
      setVisibleAssets(assetCalendars.map((_, index) => index));
      setInitialLoad(false);
    }
  }, [assetCalendars, initialLoad]);

  // Get the selected calendar's events
  const selectedCalendar = assetCalendars[selectedAssetIndex] || {
    id: "",
    name: "No asset selected",
    events: [],
  };

  return (
    <div className="h-full pt-0 px-6 sm:p-6 pl-1 grid grid-cols-12 grid-rows-12 gap-2">
      {/* month calendar date picker */}
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

      {/* full calendar day wise */}
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
          />

          {/* Show mobile view on small screens, desktop view on larger screens */}
          <div className="md:hidden">
            <MobileView
              loading={loading}
              selectedCalendar={selectedCalendar}
              currentDate={currentDate}
              onActionComplete={handleActionComplete}
            />
          </div>
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

      {/* Announcements tab
        <div
          className={`${
            isCollapsed ? "hidden" : "col-span-3 lg:flex"
          } row-span-5 hidden bg-amber-50 rounded-2xl transition-all duration-600`}
        >
          <Card className="h-full w-full bg-transparent px-4">
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>
                Find all your announcements here
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 -mt-3">
              <div>
                {announcements.map((announcement, index) => (
                  <div
                    key={index}
                    className="mb-0 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
                  >
                    <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {announcement.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {announcement.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div> */}
    </div>
  );
}
