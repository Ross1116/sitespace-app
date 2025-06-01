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
import { AssetCalendar } from "./calendar-context";
import { CreateBookingForm } from "@/components/forms/CreateBookingForm";

export const CalendarDayView = ({
  assetCalendar,
  onActionComplete,
}: {
  assetCalendar?: AssetCalendar;
  onActionComplete?: () => void;
}) => {
  const { view, events, date, setEvents, onEventClick } = useCalendar();
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: Date | null;
    end: Date | null;
    assetName?: string;
  }>({
    start: null,
    end: null,
    assetName: assetCalendar?.name,
  });

  if (view !== "day") return null;

  const hours = [...Array(14)].map((_, i) => {
    const hourDate = new Date(date);
    hourDate.setHours(i + 6, 0, 0, 0);
    return hourDate;
  });

  const handleTimeSlotClick = (hour: Date) => {
    const startTime = new Date(hour);
    const endTime = addHours(startTime, 1);

    setSelectedTimeSlot({
      start: startTime,
      end: endTime,
      assetName: assetCalendar?.name,
    });
    setIsBookingFormOpen(true);
  }

  const handleSaveEvent = (
    newEvent: Partial<CalendarEvent> | Partial<CalendarEvent>[]
  ) => {
    console.log("Save event worked");
    if (!setEvents || !events) return;

    if (Array.isArray(newEvent)) {
      const completeEvents = newEvent
        .filter((event) => event.start && event.title)
        .map((event, index) => {
          const start = event.start as Date;

          return {
            id: event.id || `${Math.random().toString(36).substring(2, 11)}-${Date.now()}-${index}`,
            start,
            end: event.end || addHours(start, 1),
            title: event.title as string,
            description: event.description || "",
            color: event.color || "yellow",
          } as CalendarEvent;
        });

      setEvents([...events, ...completeEvents]);

      if (onEventClick && completeEvents.length > 0) {
        onEventClick(completeEvents[completeEvents.length - 1]);
      }
    } else {
      if (newEvent.start && newEvent.title) {
        const completeEvent: CalendarEvent = {
          id: newEvent.id || `${Math.random().toString(36).substring(2, 11)}-${Date.now()}`,
          start: newEvent.start,
          end: newEvent.end || addHours(newEvent.start, 1),
          title: newEvent.title,
          description: newEvent.description || "",
          color: newEvent.color || "yellow",
        };

        setEvents([...events, completeEvent]);

        if (onEventClick) {
          onEventClick(completeEvent);
        }
      }
    }

    onActionComplete?.();
  };

  const hourHasEvents = hours.reduce((acc, hour) => {
    acc[hour.toString()] = (events || []).some((event) =>
      isSameHour(event.start, hour)
    );
    return acc;
  }, {} as Record<string, boolean>);

  const currentHour = new Date().getHours();
  const isCurrentDay = isSameDay(date, new Date());

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden">
      {}
      <div className="flex flex-1 relative overflow-y-auto overflow-x-hidden">
        {}
        <div className="w-14 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col">
          {hours.map((hour) => (
            <div
              key={hour.toString()}
              className="h-12 flex-none flex items-start justify-end pr-2 pt-0.5 text-xs text-gray-500 font-medium border-t border-gray-200"
            >
              {format(hour, "h a")}
            </div>
          ))}
        </div>

        {}
        <div className="flex-1 relative">
          {}
          {isCurrentDay && currentHour >= 6 && currentHour < 20 && (
            <div
              className="absolute w-full border-t-2 border-red-500 z-20"
              style={{
                top: `${(currentHour - 6) * 48}px`,
              }}
            >
              <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500"></div>
            </div>
          )}

          {}
          <div className="flex flex-col w-full h-full">
            {hours.map((hour, index) => (
              <div
                key={hour.toString()}
                className={`relative border-t h-12 flex-none ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  } ${isCurrentDay && hour.getHours() === currentHour ? 'bg-blue-50/50' : ''
                  }`}
              >
                {}
                <div
                  className="absolute inset-0 w-full h-full cursor-pointer hover:bg-blue-100/40 transition-colors"
                  onClick={() => handleTimeSlotClick(hour)}
                  style={{
                    pointerEvents: hourHasEvents[hour.toString()]
                      ? "none"
                      : "auto",
                  }}
                />

                {}
                <div className="absolute w-full border-t border-gray-200 border-dashed top-1/2"></div>

                {}
                <EventGroupSideBySide
                  hour={hour}
                  events={events || []}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      {isBookingFormOpen && (
        <CreateBookingForm
          isOpen={isBookingFormOpen}
          onClose={() => setIsBookingFormOpen(false)}
          startTime={selectedTimeSlot.start}
          endTime={selectedTimeSlot.end}
          defaultAsset={assetCalendar?.id}
          defaultAssetName={assetCalendar?.name}
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
      const hours = [...Array(16)].map((_, hourIndex) => {
        const hourDate = new Date(day);
        hourDate.setHours(hourIndex + 5, 0, 0, 0);
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

  const handleTimeSlotClick = (hour: Date) => {
    const startTime = new Date(hour);
    const endTime = addHours(startTime, 1);

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

  const handleSaveEvent = (
    newEvent: Partial<CalendarEvent> | Partial<CalendarEvent>[]
  ) => {
    if (!setEvents || !events) return;

    if (Array.isArray(newEvent)) {
      const completeEvents = newEvent
        .filter((event) => event.start && event.title)
        .map((event) => {
          const start = event.start as Date;

          return {
            id: event.id || Math.random().toString(36).substring(2, 11),
            start,
            end: event.end || addHours(start, 1),
            title: event.title as string,
            description: event.description || "",
            color: event.color || "yellow",
          } as CalendarEvent;
        });

      setEvents([...events, ...completeEvents]);

      if (onEventClick && completeEvents.length > 0) {
        onEventClick(completeEvents[completeEvents.length - 1]);
      }
    } else {
      if (newEvent.start && newEvent.title) {
        const completeEvent: CalendarEvent = {
          id: newEvent.id || Math.random().toString(36).substring(2, 11),
          start: newEvent.start,
          end: newEvent.end || addHours(newEvent.start, 1),
          title: newEvent.title,
          description: newEvent.description || "",
          color: newEvent.color || "default",
        };

        setEvents([...events, completeEvent]);

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
          {}
          {}
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
          {}
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
                    {}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      {isBookingFormOpen && (
        <CreateBookingForm
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
                  "bg-orange-100 text-orange-800 font-medium"
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

export const EventGroup = ({
  events,
  hour,
}: {
  events: CalendarEvent[];
  hour: Date;
}) => {
  const filteredEvents = events.filter((event) =>
    isSameHour(event.start, hour)
  );

  if (filteredEvents.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 w-11/12 z-10">
      {filteredEvents.map((event, index) => {
        const hoursDifference =
          differenceInMinutes(event.end, event.start) / 60;
        const startPosition = event.start.getMinutes() / 60;

        const startTime = format(event.start, "h:mm a");
        const endTime = format(event.end, "h:mm a");

        return (
          <TooltipProvider key={`${event.id}-${index}`}>
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
                    e.stopPropagation();
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

type EventGroupSideBySideProps = {
  hour: Date;
  events: CalendarEvent[];
};

const EventGroupSideBySide = ({ hour, events }: EventGroupSideBySideProps) => {
  const { onEventClick } = useCalendar();
  const eventsInHour = events.filter((event) => isSameHour(event.start, hour));

  if (eventsInHour.length === 0) return null;

  const eventCount = eventsInHour.length;
  const widthPercent = Math.max(25, 100 / eventCount);

  return (
    <div className="absolute inset-0 flex w-full h-full">
      {eventsInHour.map((event) => {
        const minutesOffset = event.start.getMinutes();

        const durationMinutes = differenceInMinutes(event.end, event.start);

        const hoursSpan = Math.ceil(durationMinutes / 60);

        const topPercent = (minutesOffset / 60) * 100;

        const heightPercent = Math.min((durationMinutes / 60) * 100, 100);

        const zIndex = Math.floor(durationMinutes / 15);

        return (
          <TooltipProvider key={event.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    dayEventVariants({ variant: event.color }),
                    "absolute cursor-pointer overflow-hidden text-xs min-h-[24px]"
                  )}
                  style={{
                    top: `${topPercent}%`,
                    height: hoursSpan > 1
                      ? `${(100 - topPercent) + ((hoursSpan - 1) * 100)}%`
                      : `${Math.max(heightPercent, 10)}%`,
                    width: `${widthPercent}%`,
                    left: `${eventsInHour.indexOf(event) * widthPercent}%`,
                    zIndex: zIndex,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                >
                  <div className="font-medium truncate">{event.title}</div>
                  {durationMinutes >= 20 && (
                    <div className="text-xs opacity-70">
                      {format(event.start, "h:mm a")} -{" "}
                      {format(event.end, "h:mm a")}
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div>
                  <div className="font-bold">{event.title}</div>
                  <div className="text-xs">
                    {format(event.start, "h:mm a")} -{" "}
                    {format(event.end, "h:mm a")}
                  </div>
                  {event.description && (
                    <div className="mt-1 text-xs max-w-[300px]">
                      {event.description}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};
