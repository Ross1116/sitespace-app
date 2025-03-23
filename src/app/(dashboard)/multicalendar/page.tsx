"use client";

import {
  Calendar,
  CalendarCurrentDate,
  CalendarDayView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarMonthView,
  type AssetCalendar,
  type CalendarEvent,
} from "@/components/ui/full-calendar/index";
import { monthEventVariants } from "@/components/ui/full-calendar/calendar-utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SetStateAction, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
// import { useAuth } from "@/app/context/AuthContext";
// import { useRouter } from "next/navigation";
import { useEffect } from "react";
// import ProtectedRoute from "@/components/ProtectedRoute";

export type VariantProps<Component extends (...args: any) => any> = Omit<
  OmitUndefined<Parameters<Component>[0]>,
  "class" | "className"
>;
export type OmitUndefined<T> = T extends undefined ? never : T;

// Update the convertBookingToCalendarEvent function with the correct type
function convertBookingToCalendarEvent(booking: any): CalendarEvent {
  // Calculate end time by adding duration in minutes to start time
  const startDate = new Date(booking.bookingTimeDt);
  const endDate = new Date(
    startDate.getTime() + booking.bookingDurationMins * 60000
  );

  // Determine color based on booking type or status
  let color: VariantProps<typeof monthEventVariants>["variant"] = "default";
  if (booking.bookingFor === "Equipment") color = "blue";
  if (booking.bookingStatus === "Pending") color = "yellow";
  if (booking.bookingStatus === "Confirmed") color = "green";
  if (booking.bookingNotes?.includes("Emergency")) color = "pink";

  return {
    id: booking.bookingKey,
    start: startDate,
    end: endDate,
    title: booking.bookingTitle,
    description: booking.bookingDescription,
    color: color,
  };
}

export default function Page() {
  // const { isAuthenticated } = useAuth();
  // const router = useRouter();

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.push("/login");
  //   }
  // }, [isAuthenticated, router]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookings from the API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        // Get current user ID from localStorage or context
        // const userId = localStorage.getItem("userId") || "";
        const userId = "SM001";

        // Get current project ID from localStorage or context
        // const projectId = localStorage.getItem("projectId") || "";
        const projectId = "P001";

        const response = await api.get(
          "/api/auth/slotBooking/getslotBookingList",
          {
            params: {
              userId,
              projectId,
            },
          }
        );

        const bookingsData = response.data?.bookingList || [];
        setBookings(bookingsData);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Group bookings by asset with proper typing
  const assetBookings = Array.isArray(bookings)
    ? bookings.reduce<Record<string, AssetCalendar>>((acc, booking) => {
        // Check if booking.bookedAssets exists and is an array
        if (booking.bookedAssets && Array.isArray(booking.bookedAssets)) {
          booking.bookedAssets.forEach((assetId: string) => {
            // Extract just the asset ID from the string (e.g., "A003 - Crane2" -> "A003")
            const assetIdPart = assetId.split(" - ")[0];

            if (!acc[assetIdPart]) {
              acc[assetIdPart] = {
                id: assetIdPart,
                // Use the full asset string as the name
                name: assetId,
                events: [],
              };
            }
            acc[assetIdPart].events.push(
              convertBookingToCalendarEvent(booking)
            );
          });
        }
        return acc;
      }, {})
    : {};

  // Convert to array for easier use
  const assetCalendars: AssetCalendar[] = Object.values(assetBookings);

  // Get the selected calendar's events
  const selectedCalendar = assetCalendars[selectedAssetIndex] || {
    id: "",
    name: "No asset selected",
    events: [],
  };

  // Function to handle date changes from the month calendar
  const handleMonthDateChange = (date: SetStateAction<Date>) => {
    setCurrentDate(date);
    console.log(date);
  };

  // State to track visible assets
  const [visibleAssets, setVisibleAssets] = useState(
    assetCalendars.map((_, index) => index)
  );

  // Initialize visible assets when assetCalendars changes
  useEffect(() => {
    if (assetCalendars.length > 0 && visibleAssets.length === 0) {
      setVisibleAssets(assetCalendars.map((_, index) => index));
    }
  }, [assetCalendars, visibleAssets.length]);

  // Function to toggle asset visibility
  const toggleAssetVisibility = (assetIndex: number) => {
    setVisibleAssets((prevVisible) => {
      if (prevVisible.includes(assetIndex)) {
        // Remove asset if already visible
        return prevVisible.filter((index) => index !== assetIndex);
      } else {
        // Add asset if not visible
        return [...prevVisible, assetIndex];
      }
    });
  };

  // Mobile view shows only the selected asset
  const mobileView = (
    <div className="flex-1 overflow-hidden">
      <div className="border rounded-md flex flex-col h-full min-h-96 overflow-hidden">
        <div className="p-3 bg-orange-200 font-medium">
          {loading ? <Skeleton className="h-6 w-40" /> : selectedCalendar.name}
        </div>
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Calendar
              key={`mobile-calendar-${selectedAssetIndex}`}
              events={selectedCalendar.events}
              view="day"
              date={currentDate}
            >
              <CalendarDayView />
            </Calendar>
          )}
        </div>
      </div>
    </div>
  );

  // Desktop view shows grid of assets with responsive columns
  const desktopView = (
    <div
      className={`grid ${
        isCollapsed
          ? "grid-cols-2 lg:grid-cols-5 xl:grid-cols-6"
          : "grid-cols-2 lg:grid-cols-4"
      } flex-1 gap-1 overflow-visible`}
    >
      {loading ? (
        // Create multiple skeleton placeholders in a grid
        Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="border rounded-md flex flex-col h-fit overflow-hidden mb-1"
          >
            <div className="p-3 bg-orange-200 font-medium border-b">
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="p-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))
      ) : assetCalendars.length === 0 ? (
        <div className="col-span-full flex items-center justify-center h-64">
          <p>No bookings found</p>
        </div>
      ) : (
        assetCalendars
          .filter((_, index) => visibleAssets.includes(index))
          .map((calendar, index) => (
            <div
              key={calendar.id || index}
              className="border rounded-md flex flex-col h-fit overflow-hidden mb-1"
            >
              <div className="p-3 bg-orange-200 font-medium border-b">
                {calendar.name}
              </div>
              <div className="flex-1 overflow-hidden">
                <Calendar
                  key={`desktop-calendar-${calendar.id || index}`}
                  events={calendar.events}
                  view="day"
                  date={currentDate}
                >
                  <CalendarDayView />
                </Calendar>
              </div>
            </div>
          ))
      )}
    </div>
  );

  return (
    // <ProtectedRoute requiredRoles={["admin", "manager"]}>
    <div className="h-full pt-0 px-6 sm:p-6 pl-1 grid grid-cols-12 grid-rows-12 gap-2">
      {/* month calendar date picker */}
      <Card
        className={`${
          isCollapsed ? "hidden" : "col-span-3 lg:flex"
        } row-span-6 overflow-hidden hidden bg-amber-50 rounded-2xl h-full transition-all duration-600`}
      >
        <Calendar
          view="month"
          date={currentDate}
          onDateChange={handleMonthDateChange}
        >
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
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Collapsible button - only visible on non-mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex items-center justify-center h-8 w-8 mr-2"
            >
              {isCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
              <span className="sr-only">
                {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              </span>
            </Button>
            <div className="flex justify-evenly mx-auto md:justify-end md:mr-0 items-center space-x-4">
              <div className="flex items-center gap-2 md:hidden">
                <Select
                  value={selectedAssetIndex.toString()}
                  onValueChange={(value: string) =>
                    setSelectedAssetIndex(parseInt(value))
                  }
                  disabled={loading || assetCalendars.length === 0}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetCalendars.map((calendar, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {calendar.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <CalendarCurrentDate className="md:text-base text-sm" />
              <div className="flex items-center md:space-x-2 space-x-1">
                <CalendarPrevTrigger className="w-8 md:w-10">
                  <ChevronLeft size={10} />
                  <span className="sr-only">Previous</span>
                </CalendarPrevTrigger>
                <CalendarTodayTrigger className="px-2 md:px-5">
                  Today
                </CalendarTodayTrigger>
                <CalendarNextTrigger className="w-8 md:w-10">
                  <ChevronRight size={10} />
                  <span className="sr-only">Next</span>
                </CalendarNextTrigger>
              </div>
            </div>
          </div>

          {/* Show mobile view on small screens, desktop view on larger screens */}
          <div className="md:hidden">{mobileView}</div>
          <div className="hidden md:block">{desktopView}</div>
        </Calendar>
      </Card>

      {/* filter assets checkbox */}
      <Card
        className={`${
          isCollapsed ? "lg:hidden" : "col-span-3 lg:flex"
        } row-span-3 overflow-hidden hidden bg-amber-50 rounded-2xl transition-all duration-600 px-4`}
      >
        <CardHeader>
          <CardTitle>Assets Filter</CardTitle>
          <CardDescription>
            Choose which assets you would like to view
          </CardDescription>
        </CardHeader>
        <CardContent className="-mt-2 overflow-auto">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : assetCalendars.length === 0 ? (
            <p>No assets available</p>
          ) : (
            <div className="flex flex-col justify-evenly space-y-2">
              {assetCalendars.map((calendar, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`asset-${index}`}
                    checked={visibleAssets.includes(index)}
                    onCheckedChange={() => toggleAssetVisibility(index)}
                    className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                  />
                  <label
                    htmlFor={`asset-${index}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    {calendar.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
    // </ProtectedRoute>
  );
}
