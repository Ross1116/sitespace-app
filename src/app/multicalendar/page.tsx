"use client";

import {
  Calendar,
  CalendarCurrentDate,
  CalendarDayView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarMonthView,
} from "@/components/ui/full-calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SetStateAction, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calendars } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { announcements } from "@/lib/data";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get the selected calendar's events
  const selectedCalendar = calendars[selectedAssetIndex];

  // Function to handle date changes from the month calendar
  const handleMonthDateChange = (date: SetStateAction<Date>) => {
    setCurrentDate(date);
    console.log(date);
  };

  // State to track visible assets
  const [visibleAssets, setVisibleAssets] = useState(
    calendars.map((_, index) => index)
  );

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
        <div className="p-3 bg-muted font-medium border-b">
          {selectedCalendar.name}
        </div>
        <div className="flex-1 overflow-hidden">
          {/* Key is important here to force re-render when selectedAssetIndex changes */}
          <Calendar
            key={`mobile-calendar-${selectedAssetIndex}`}
            events={selectedCalendar.events}
            view="day"
            date={currentDate}
          >
            <CalendarDayView />
          </Calendar>
        </div>
      </div>
    </div>
  );

  // Desktop view shows grid of assets
  const desktopView = (
    <div className="grid grid-cols-2 lg:grid-cols-4 flex-1 gap-1 overflow-visible">
      {calendars
        .filter((_, index) => visibleAssets.includes(index))
        .map((calendar) => (
          <div
            key={calendar.name} // Using calendar name as key instead of index since filtered array changes
            className="border rounded-md flex flex-col h-full min-h-96 overflow-hidden"
          >
            <div className="p-3 bg-muted font-medium border-b">
              {calendar.name}
            </div>
            <div className="flex-1 overflow-hidden">
              <Calendar
                key={`desktop-calendar-${calendar.name}`}
                events={calendar.events}
                view="day"
                date={currentDate}
              >
                <CalendarDayView />
              </Calendar>
            </div>
          </div>
        ))}
    </div>
  );

  return (
    <div className="h-full p-6 grid grid-cols-12 grid-rows-12 gap-2">
      {/* month calendar date picker */}
      <Card
        className={`${
          isCollapsed ? "hidden" : "col-span-3 lg:flex"
        } row-span-6 overflow-hidden bg-amber-50 rounded-2xl h-full transition-all duration-600`}
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
        className={`p-6 ${
          isCollapsed ? "col-span-12" : "col-span-12 lg:col-span-9"
        } row-span-12 flex flex-col bg-gradient-to-tr from-amber-100 to-emerald-50-50 rounded-2xl -mb-4 transition-all duration-600`}
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
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.map((calendar, index) => (
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
        } row-span-3 overflow-hidden hidden bg-amber-50 rounded-2xl transition-all duration-600`}
      >
        <CardHeader>
          <CardTitle>Assets Filter</CardTitle>
          <CardDescription>
            Choose which assets you would like to view
          </CardDescription>
        </CardHeader>
        <CardContent className="-mt-2">
          <div className="flex flex-col justify-evenly space-y-2">
            {calendars.map((calendar, index) => (
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
        </CardContent>
      </Card>

      {/* Announcements tab */}
      <div
        className={`${
          isCollapsed ? "hidden" : "col-span-3 lg:flex"
        } row-span-5 hidden bg-amber-50 rounded-2xl transition-all duration-600`}
      >
        <Card className="h-full w-full bg-transparent px-4">
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>Find all your announcements here</CardDescription>
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
      </div>
    </div>
  );
}
