"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  addDays,
  addHours,
  differenceInMinutes,
  format,
  getMonth,
  isSameDay,
  isSameHour,
  isSameMonth,
  isToday,
  setMonth,
  startOfWeek,
} from "date-fns";
import { useState, useMemo } from "react";
import {
  useCalendar,
  dayEventVariants,
  monthEventVariants,
  CalendarEvent,
} from "./calendar-context";
import { getDaysInMonth, generateWeekdays } from "./calendar-helpers";
import { TimeTable } from "./calendar-utils";
import { BookingFromCalendar } from "../../forms/BookingFromCalendar";

export const CalendarDayView = () => {
  const { view, events, date, setEvents, onEventClick } = useCalendar();
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });

  if (view !== "day") return null;

  // Create array with hours from 6am (6) to 8pm (20), ensuring minutes are set to 0
  const hours = [...Array(14)].map((_, i) => {
    const hourDate = new Date(date);
    hourDate.setHours(i + 6, 0, 0, 0); // Set hours with minutes, seconds, ms all at 0
    return hourDate;
  });

  // Handler for clicking on a time slot
  const handleTimeSlotClick = (hour: Date) => {
    const startTime = new Date(hour); // Clone the date to avoid mutations
    const endTime = addHours(startTime, 1); // Default 1 hour duration

    setSelectedTimeSlot({
      start: startTime,
      end: endTime,
    });
    setIsBookingFormOpen(true);

    console.log(
      "Create event at:",
      format(startTime, "h:mm a"),
      "to",
      format(endTime, "h:mm a")
    );
  };

  // Handler for saving a new event
  const handleSaveEvent = (newEvent: Partial<CalendarEvent>) => {
    if (setEvents && events) {
      // Only proceed if we have the minimum required properties
      if (newEvent.start && newEvent.title) {
        // Create a complete event with default values for missing properties
        const completeEvent: CalendarEvent = {
          id: newEvent.id || Math.random().toString(36).substring(2, 11), // Generate ID if missing
          start: newEvent.start,
          end: newEvent.end || addHours(newEvent.start, 1), // Default to 1 hour if end not provided
          title: newEvent.title,
          description: newEvent.description || "",
          color: newEvent.color || "default",
        };

        setEvents([...events, completeEvent]);

        // If there's an event click handler, call it with the new event
        if (onEventClick) {
          onEventClick(completeEvent);
        }
      }
    }
  };

  // Create a map to check if an hour has events
  const hourHasEvents = hours.reduce((acc, hour) => {
    acc[hour.toString()] = (events || []).some(event => 
      isSameHour(event.start, hour)
    );
    return acc;
  }, {} as Record<string, boolean>);

  return (
    <div className="flex relative py-7 overflow-y-auto overflow-x-hidden h-full mr-4">
      <TimeTable />
      <div className="flex-1 relative">
        {/* Combined grid and events in a single layer */}
        <div className="grid grid-rows-[repeat(14,1fr)] w-full h-full">
          {hours.map((hour) => (
            <div 
              key={hour.toString()}
              className="relative border-t last:border-b w-full"
            >
              {/* Clickable background with hover effect */}
              <div
                className="absolute inset-0 w-full h-full cursor-pointer hover:bg-orange-100/60 transition-colors"
                onClick={() => handleTimeSlotClick(hour)}
                style={{ pointerEvents: hourHasEvents[hour.toString()] ? 'none' : 'auto' }}
              />
              
              {/* Events for this hour */}
              <EventGroup hour={hour} events={events || []} />
            </div>
          ))}
        </div>
      </div>

      {/* Booking form dialog */}
      {isBookingFormOpen && (
        <BookingFromCalendar
          isOpen={isBookingFormOpen}
          onClose={() => setIsBookingFormOpen(false)}
          startTime={selectedTimeSlot.start}
          endTime={selectedTimeSlot.end}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
};

export const CalendarWeekView = () => {
  const { view, date, locale, events, setEvents, onEventClick } = useCalendar();
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: Date | null;
    end: Date | null;
    dayIndex?: number;
  }>({
    start: null,
    end: null,
  });

  const weekDates = useMemo(() => {
    const start = startOfWeek(date, { weekStartsOn: 0 });
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i);
      // Create hours with precise time (minutes = 0)
      const hours = [...Array(16)].map((_, hourIndex) => {
        const hourDate = new Date(day);
        hourDate.setHours(hourIndex + 5, 0, 0, 0); // Ensure minutes are 0
        return hourDate;
      });
      weekDates.push(hours);
    }

    return weekDates;
  }, [date]);

  const headerDays = useMemo(() => {
    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
      const result = addDays(startOfWeek(date, { weekStartsOn: 0 }), i);
      daysOfWeek.push(result);
    }
    return daysOfWeek;
  }, [date]);

  // Handler for clicking on a time slot
  const handleTimeSlotClick = (hour: Date) => {
    const startTime = new Date(hour); // Clone to avoid mutations
    const endTime = addHours(startTime, 1); // Default 1 hour duration

    setSelectedTimeSlot({
      start: startTime,
      end: endTime,
    });
    setIsBookingFormOpen(true);

    console.log(
      "Create event at:",
      format(startTime, "h:mm a"),
      "to",
      format(endTime, "h:mm a")
    );
  };

  // Handler for saving a new event
  const handleSaveEvent = (newEvent: Partial<CalendarEvent>) => {
    if (setEvents && events) {
      // Only proceed if we have the minimum required properties
      if (newEvent.start && newEvent.title) {
        // Create a complete event with default values for missing properties
        const completeEvent: CalendarEvent = {
          id: newEvent.id || Math.random().toString(36).substring(2, 11), // Generate ID if missing
          start: newEvent.start,
          end: newEvent.end || addHours(newEvent.start, 1), // Default to 1 hour if end not provided
          title: newEvent.title,
          description: newEvent.description || "",
          color: newEvent.color || "default",
        };

        setEvents([...events, completeEvent]);

        // If there's an event click handler, call it with the new event
        if (onEventClick) {
          onEventClick(completeEvent);
        }
      }
    }
  };

  if (view !== "week") return null;

  return (
    <div className="flex flex-col relative overflow-auto h-full">
      <div className="flex sticky top-0 bg-card z-10 border-b mb-3">
        <div className="w-12"></div>
        {headerDays.map((date, i) => (
          <div
            key={date.toString()}
            className={cn(
              "text-center flex-1 gap-1 pb-2 text-sm text-muted-foreground flex items-center justify-center",
              [0, 6].includes(i) && "text-muted-foreground/50"
            )}
          >
            {format(date, "E", { locale })}
            <span
              className={cn(
                "h-6 grid place-content-center",
                isToday(date) &&
                  "bg-primary text-primary-foreground rounded-full size-6"
              )}
            >
              {format(date, "d")}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-1">
        <div className="w-fit">
          <TimeTable />
        </div>
        <div className="grid grid-cols-7 flex-1 relative pr-4">
          {" "}
          {/* Added right padding */}
          {/* Existing events layer */}
          <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
            {weekDates.map((hours, i) => {
              return (
                <div
                  className={cn(
                    "h-full text-sm text-muted-foreground border-l first:border-l-0",
                    [0, 6].includes(i) && "bg-muted/50"
                  )}
                  key={hours[0].toString()}
                >
                  {hours.map((hour) => (
                    <EventGroup
                      key={hour.toString()}
                      hour={hour}
                      events={events}
                    />
                  ))}
                </div>
              );
            })}
          </div>
          {/* Clickable grid layer */}
          <div className="absolute inset-0 grid grid-cols-7">
            {weekDates.map((hours, dayIndex) => (
              <div
                key={`clickable-${dayIndex}`}
                className={cn(
                  "grid grid-rows-[repeat(16,1fr)] h-full border-l first:border-l-0",
                  [0, 6].includes(dayIndex) && "bg-muted/50"
                )}
              >
                {hours.map((hour) => (
                  <div
                    key={`slot-${hour.toString()}`}
                    className="border-t last:border-b w-full h-full cursor-pointer hover:bg-orange-200 transition-colors"
                    onClick={() => handleTimeSlotClick(hour)}
                  >
                    {/* Time slot is empty - just clickable */}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking form dialog */}
      {isBookingFormOpen && (
        <BookingFromCalendar
          isOpen={isBookingFormOpen}
          onClose={() => setIsBookingFormOpen(false)}
          startTime={selectedTimeSlot.start}
          endTime={selectedTimeSlot.end}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
};

export const CalendarMonthView = () => {
  const { date, view, events, locale, setDate } = useCalendar();

  const monthDates = useMemo(() => getDaysInMonth(date), [date]);
  const weekDays = useMemo(() => generateWeekdays(locale), [locale]);

  if (view !== "month") return null;

  // Handler for clicking on a date
  const handleDateClick = (selectedDate: Date) => {
    setDate(selectedDate);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 gap-px sticky top-0 bg-background border-b">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={cn(
              "mb-2 text-right text-sm text-muted-foreground pr-2",
              [0, 6].includes(i) && "text-muted-foreground/50"
            )}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid overflow-hidden -mt-px flex-1 auto-rows-fr p-px grid-cols-7 gap-px">
        {monthDates.map((_date) => {
          const currentEvents = events.filter((event) =>
            isSameDay(event.start, _date)
          );

          // Check if this date is the currently selected date
          const isSelectedDate = isSameDay(_date, date);

          return (
            <div
              className={cn(
                "ring-1 p-2 text-sm text-muted-foreground ring-border overflow-auto cursor-pointer hover:bg-orange-100/60 transition-colors",
                !isSameMonth(date, _date) && "text-muted-foreground/50"
              )}
              key={_date.toString()}
              onClick={() => handleDateClick(_date)}
            >
              <span
                className={cn(
                  "size-6 grid place-items-center rounded-full mb-1 sticky top-0",
                  isToday(_date) && "bg-primary text-primary-foreground",
                  isSelectedDate &&
                    !isToday(_date) &&
                    "bg-orange-100 text-orange-800 font-medium" // Grey-orange circle for selected date
                )}
              >
                {format(_date, "d")}
              </span>

              {currentEvents.map((event) => {
                return (
                  <div
                    key={event.id}
                    className="px-1 rounded text-sm flex items-center gap-1"
                  >
                    <div
                      className={cn(
                        "shrink-0",
                        monthEventVariants({ variant: event.color })
                      )}
                    ></div>
                    <span className="flex-1 truncate">{event.title}</span>
                    <time className="tabular-nums text-muted-foreground/50 text-xs">
                      {format(event.start, "HH:mm")}
                    </time>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CalendarYearView = () => {
  const { view, date, today, locale } = useCalendar();

  const months = useMemo(() => {
    if (!view) {
      return [];
    }

    return Array.from({ length: 12 }).map((_, i) => {
      return getDaysInMonth(setMonth(date, i));
    });
  }, [date, view]);

  const weekDays = useMemo(() => generateWeekdays(locale), [locale]);

  if (view !== "year") return null;

  return (
    <div className="grid grid-cols-4 gap-10 overflow-auto h-full">
      {months.map((days, i) => (
        <div key={days[0].toString()}>
          <span className="text-xl">{i + 1}</span>

          <div className="grid grid-cols-7 gap-2 my-5">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid gap-x-2 text-center grid-cols-7 text-xs tabular-nums">
            {days.map((_date: string | number | Date) => {
              return (
                <div
                  key={_date.toString()}
                  className={cn(
                    getMonth(_date) !== i && "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "aspect-square grid place-content-center size-full tabular-nums",
                      isSameDay(today, _date) &&
                        getMonth(_date) === i &&
                        "bg-primary text-primary-foreground rounded-full"
                    )}
                  >
                    {format(_date, "d")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// EventGroup component used by both Day and Week views
// make this clickable
export const EventGroup = ({
  events,
  hour,
}: {
  events: CalendarEvent[];
  hour: Date;
}) => {
  const filteredEvents = events.filter((event) => isSameHour(event.start, hour));
  
  if (filteredEvents.length === 0) {
    return null; // Don't render anything if no events
  }
  
  return (
    <div className="absolute inset-0 w-11/12 z-10">
      {filteredEvents.map((event) => {
        const hoursDifference =
          differenceInMinutes(event.end, event.start) / 60;
        const startPosition = event.start.getMinutes() / 60;

        // Format times for the tooltip
        const startTime = format(event.start, "h:mm a");
        const endTime = format(event.end, "h:mm a");

        return (
          <TooltipProvider key={event.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "absolute cursor-pointer", 
                    dayEventVariants({ variant: event.color })
                  )}
                  style={{
                    top: `${startPosition * 100}%`,
                    height: `${hoursDifference * 100}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // Stop event from reaching background
                  }}
                >
                  {event.title}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {startTime} - {endTime}
                  </p>
                  <p>{event.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};