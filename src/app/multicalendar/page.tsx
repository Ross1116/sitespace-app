"use client";

import {
  Calendar,
  CalendarCurrentDate,
  CalendarDayView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
} from "@/components/ui/full-calendar";
import { addHours, addDays } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Page() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);

  // Sample calendar data for multiple calendars
  const calendars = [
    {
      name: "Asset A",
      events: [
        {
          id: "a1",
          start: new Date(),
          end: addHours(new Date(), 2),
          title: "Subcontractor A",
          color: "pink" as const,
        },
        {
          id: "a2",
          start: addHours(new Date(), 4),
          end: addHours(new Date(), 5),
          title: "Subcontractor C",
          color: "green" as const,
        },
      ],
    },
    {
      name: "Asset B",
      events: [
        {
          id: "b1",
          start: addHours(new Date(), 1.5),
          end: addHours(new Date(), 3),
          title: "Subcontractor B",
          color: "blue" as const,
        },
        {
          id: "b2",
          start: addHours(addDays(new Date(), 1), 2),
          end: addHours(addDays(new Date(), 1), 4),
          title: "Subcontractor D",
          color: "purple" as const,
        },
      ],
    },
    {
      name: "Asset C",
      events: [
        {
          id: "b1",
          start: addHours(new Date(), 1.5),
          end: addHours(new Date(), 3),
          title: "Subcontractor B",
          color: "blue" as const,
        },
        {
          id: "b2",
          start: addHours(addDays(new Date(), 1), 2),
          end: addHours(addDays(new Date(), 1), 4),
          title: "Subcontractor D",
          color: "purple" as const,
        },
      ],
    },
    {
      name: "Asset D",
      events: [
        {
          id: "b1",
          start: addHours(new Date(), 1.5),
          end: addHours(new Date(), 3),
          title: "Subcontractor B",
          color: "blue" as const,
        },
        {
          id: "b2",
          start: addHours(addDays(new Date(), 1), 2),
          end: addHours(addDays(new Date(), 1), 4),
          title: "Subcontractor D",
          color: "purple" as const,
        },
      ],
    },
  ];

  // Mobile view shows only the selected asset
  const mobileView = (
    <div className="flex-1 overflow-hidden">
      <div className="border rounded-md flex flex-col h-full min-h-96 overflow-hidden">
        <div className="p-3 bg-muted font-medium border-b">
          {calendars[selectedAssetIndex].name}
        </div>
        <div className="flex-1 overflow-hidden">
          <Calendar
            events={calendars[selectedAssetIndex].events}
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
      {calendars.map((calendar, index) => (
        <div
          key={index}
          className="border rounded-md flex flex-col h-full min-h-96 overflow-hidden"
        >
          <div className="p-3 bg-muted font-medium border-b">
            {calendar.name}
          </div>
          <div className="flex-1 overflow-hidden">
            <Calendar events={calendar.events} view="day" date={currentDate}>
              <CalendarDayView />
            </Calendar>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-dvh p-6 flex flex-col">
      <Calendar date={currentDate} onDateChange={setCurrentDate} view="day">
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* <div className="flex items-center gap-2 md:hidden">
            <Select 
              value={selectedAssetIndex.toString()} 
              onValueChange={(value: string) => setSelectedAssetIndex(parseInt(value))}
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
          </div> */}

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
              <CalendarPrevTrigger>
                <ChevronLeft size={20} />
                <span className="sr-only">Previous</span>
              </CalendarPrevTrigger>
              <CalendarTodayTrigger>Today</CalendarTodayTrigger>
              <CalendarNextTrigger>
                <ChevronRight size={20} />
                <span className="sr-only">Next</span>
              </CalendarNextTrigger>
            </div>
          </div>
        </div>

        {/* Show mobile view on small screens, desktop view on larger screens */}
        <div className="md:hidden">{mobileView}</div>
        <div className="hidden md:block">{desktopView}</div>
      </Calendar>
    </div>
  );
}
