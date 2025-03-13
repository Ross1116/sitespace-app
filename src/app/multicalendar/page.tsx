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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

  
export default function Page() {
    const [currentDate, setCurrentDate] = useState(new Date());

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

  return (
    <div className="h-dvh p-6 flex flex-col">
      <Calendar date={currentDate} onDateChange={setCurrentDate} view="day">
        <div className="mb-4 flex items-center justify-between">
          <CalendarCurrentDate />
          <div className="flex items-center space-x-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 flex-1 gap-1 overflow-hidden">
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
      </Calendar>
    </div>
  );
}
