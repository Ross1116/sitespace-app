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
import { useAuth } from "@/app/context/AuthContext";

export const CalendarDayView = ({
  assetCalendar,
  onActionComplete,
  onBookingCreated,
}: {
  assetCalendar?: AssetCalendar;
  onActionComplete?: () => void;
  onBookingCreated?: (
    events: Partial<CalendarEvent>[] | Partial<CalendarEvent>
  ) => void;
}) => {
  const { user } = useAuth();
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
  };

  const handleSaveEvent = (
    newEvent: Partial<CalendarEvent> | Partial<CalendarEvent>[]
  ) => {
    console.log("Save event worked");
    if (!setEvents || !events) return;

    // Helper to convert incoming partial event -> full CalendarEvent keeping booking meta
    const toCompleteEvent = (
      evt: Partial<CalendarEvent>,
      idx = 0
    ): CalendarEvent => {
      const start = (evt.start || new Date()) as Date;
      const end = (evt.end as Date) || addHours(start, 1);

      // attempt to preserve booking metadata if provided
      const bookingData =
        (evt as any).bookingData || (evt as any).booking || null;
      const bookingStatus =
        (evt as any).bookingStatus ||
        bookingData?.status ||
        (evt as any).status ||
        "pending";
      const bookingKey =
        (evt as any).bookingKey ||
        bookingData?.id ||
        evt.id ||
        `${Math.random().toString(36).substring(2, 11)}-${Date.now()}-${idx}`;

      const assetId =
        (evt as any).assetId ||
        bookingData?.asset_id ||
        (evt as any).asset_id ||
        assetCalendar?.id ||
        "unknown";
      const assetName =
        (evt as any).assetName ||
        bookingData?.asset_name ||
        (evt as any).asset_name ||
        assetCalendar?.name ||
        `Asset ${String(assetId).slice(0, 6)}...`;

      return {
        id: evt.id || bookingKey,
        start,
        end,
        title:
          (evt.title as string) ||
          `${(evt as any).bookingTitle || "Booking"} - ${assetName}`,
        description:
          (evt.description as string) || (evt as any).bookingDescription || "",
        color:
          (evt as any).color ||
          (bookingStatus === "confirmed" ? "green" : "yellow"),
        // booking-specific fields
        bookingKey: bookingKey,
        bookingTitle:
          (evt as any).bookingTitle || (evt.title as string) || "Booking",
        bookingDescription:
          (evt as any).bookingDescription || (evt as any).description || "",
        bookingNotes: (evt as any).bookingNotes || bookingData?.notes || "",
        bookingTimeDt:
          (evt as any).bookingTimeDt || bookingData?.booking_date || "",
        bookingStartTime:
          (evt as any).bookingStartTime || bookingData?.start_time || "",
        bookingEndTime:
          (evt as any).bookingEndTime || bookingData?.end_time || "",
        bookingStatus: bookingStatus,
        bookingFor: (evt as any).bookingFor || bookingData?.manager || "",
        assetId,
        assetName,
        assetCode: (evt as any).assetCode || bookingData?.asset_code || "",
        assetType: (evt as any).assetType || bookingData?.asset_type || "",
        bookedAssets:
          (evt as any).bookedAssets || (assetName ? [assetName] : []),
        status: bookingStatus,
        managerId: bookingData?.manager_id || (evt as any).managerId,
        managerName:
          bookingData?.manager?.first_name || (evt as any).managerName,
        subcontractorId:
          bookingData?.subcontractor_id || (evt as any).subcontractorId,
        subcontractorName:
          bookingData?.subcontractor?.company_name ||
          (evt as any).subcontractorName,
        projectId: bookingData?.project_id || (evt as any).projectId,
        projectName: bookingData?.project?.name || (evt as any).projectName,
        projectLocation:
          bookingData?.project?.location || (evt as any).projectLocation,
        _originalData: bookingData || (evt as any)._originalData || null,
      } as CalendarEvent;
    };

    const incomingArray = Array.isArray(newEvent) ? newEvent : [newEvent];

    const completeEvents = incomingArray
      .filter((ev) => ev.start && ev.title)
      .map((ev, idx) => {
        const e = ev as any;

        const start = e.start as Date;
        const original = e._originalData || e.bookingData || null;

        // === asset resolution (most important) ===
        const assetId = String(
          e.assetId ||
            e.asset_id ||
            original?.asset_id ||
            assetCalendar?.id ||
            ""
        ).trim();
        const assetName =
          e.assetName ||
          e.asset_name ||
          original?.asset?.name ||
          original?.asset_name ||
          assetCalendar?.name ||
          "";

        // === status/color ===
        let bookingStatus = (
          e.bookingStatus ||
          e.booking_status ||
          original?.status ||
          original?.booking_status ||
          "pending"
        )
          .toString()
          .toLowerCase();
        if (!bookingStatus || bookingStatus === "pending") {
          if (user?.role === "manager" || user?.role === "admin") {
            bookingStatus = "confirmed";
          }
        }

        const color =
          e.color || (bookingStatus === "confirmed" ? "green" : "yellow");

        return {
          id:
            e.id ||
            e.bookingKey ||
            original?.id ||
            `${Math.random().toString(36).slice(2, 9)}-${Date.now()}-${idx}`,
          start,
          end: e.end || addHours(start, 1),
          title: e.title as string,
          description: e.description || e.bookingDescription || "",
          color,
          // preserved booking fields (safe access)
          bookingKey: e.bookingKey || original?.id || null,
          bookingTitle: e.bookingTitle || e.title || original?.title || "",
          bookingDescription:
            e.bookingDescription || e.description || original?.notes || "",
          bookingNotes: e.bookingNotes || original?.notes || "",
          bookingTimeDt: e.bookingTimeDt || original?.booking_date || "",
          bookingStartTime: e.bookingStartTime || original?.start_time || "",
          bookingEndTime: e.bookingEndTime || original?.end_time || "",
          bookingStatus,
          assetId,
          assetName,
          assetCode:
            e.assetCode ||
            original?.asset?.asset_code ||
            original?.asset_code ||
            "",
          assetType: e.assetType || original?.assetType || "",
          bookedAssets:
            e.bookedAssets ||
            (assetName ? [assetName] : []) ||
            (original?.asset
              ? [
                  original.asset.name ||
                    original.asset.asset_code ||
                    original.asset.id,
                ]
              : []),
          status: e.status || bookingStatus,
          managerId: e.managerId || original?.manager_id || null,
          subcontractorId:
            e.subcontractorId || original?.subcontractor_id || null,
          projectId: e.projectId || original?.project_id || null,
          projectName:
            e.projectName ||
            original?.project?.name ||
            original?.project_name ||
            "",
          _originalData: original,
        } as CalendarEvent;
      });

    setEvents([...events, ...completeEvents]);

    // notify parent page so it can update global bookings + localStorage / assetCalendars
    onBookingCreated?.(completeEvents);

    if (onEventClick && completeEvents.length > 0) {
      onEventClick(completeEvents[completeEvents.length - 1]);
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
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden border border-slate-100">
      <div className="flex flex-1 relative overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Sidebar Hours */}
        <div className="w-14 flex-shrink-0 border-r border-slate-100 bg-slate-50 flex flex-col">
          {hours.map((hour) => (
            <div
              key={hour.toString()}
              className="h-12 flex-none flex items-start justify-end pr-2 pt-0.5 text-xs text-slate-400 font-medium border-t border-slate-100"
            >
              {format(hour, "h a")}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 relative">
          {/* Current Time Indicator - Changed from Red to Navy */}
          {isCurrentDay && currentHour >= 6 && currentHour < 20 && (
            <div
              className="absolute w-full border-t-2 border-[#0B1120] z-20"
              style={{
                top: `${(currentHour - 6) * 48}px`,
              }}
            >
              <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-[#0B1120]"></div>
            </div>
          )}

          <div className="flex flex-col w-full h-full">
            {hours.map((hour, index) => (
              <div
                key={hour.toString()}
                className={`relative border-t border-slate-100 h-12 flex-none ${
                  index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                } ${
                  isCurrentDay && hour.getHours() === currentHour
                    ? "bg-blue-50/5"
                    : ""
                }`}
              >
                {/* Clickable Area - changed hover from blue to slate */}
                <div
                  className="absolute inset-0 w-full h-full cursor-pointer hover:bg-slate-100/60 transition-colors"
                  onClick={() => handleTimeSlotClick(hour)}
                  style={{
                    pointerEvents: hourHasEvents[hour.toString()]
                      ? "none"
                      : "auto",
                  }}
                />

                {/* Half hour marker */}
                <div className="absolute w-full border-t border-slate-100 border-dashed top-1/2 pointer-events-none"></div>

                <EventGroupSideBySide hour={hour} events={events || []} />
              </div>
            ))}
          </div>
        </div>
      </div>

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
    <div className="flex flex-col relative overflow-auto h-full bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="flex sticky top-0 bg-white z-10 border-b border-slate-100 mb-3 pt-3">
        <div className="w-12"></div>
        {headerDays.map((date, i) => (
          <div
            key={date.toString()}
            className={cn(
              "text-center flex-1 gap-1 pb-2 text-sm text-slate-500 font-medium flex items-center justify-center",
              [0, 6].includes(i) && "text-slate-400"
            )}
          >
            {format(date, "E", { locale })}
            <span
              className={cn(
                "h-6 w-6 ml-1 grid place-content-center rounded-full text-xs font-bold",
                isToday(date)
                  ? "bg-[#0B1120] text-white"
                  : "text-slate-900"
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
          <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
            {weekDates.map((hours, i) => {
              return (
                <div
                  className={cn(
                    "h-full text-sm text-slate-500 border-l border-slate-100 first:border-l-0",
                    [0, 6].includes(i) && "bg-slate-50/50"
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
          <div className="absolute inset-0 grid grid-cols-7">
            {weekDates.map((hours, dayIndex) => (
              <div
                key={`clickable-${dayIndex}`}
                className={cn(
                  "grid grid-rows-[repeat(16,1fr)] h-full border-l border-slate-100 first:border-l-0",
                  [0, 6].includes(dayIndex) && "bg-slate-50/30"
                )}
              >
                {hours.map((hour) => (
                  <div
                    key={`slot-${hour.toString()}`}
                    className="border-t border-slate-100 last:border-b w-full h-full cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleTimeSlotClick(hour)}
                  >
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

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
    <div className="h-full flex flex-col bg-white">
      <div className="grid grid-cols-7 gap-px sticky top-0 bg-white border-b border-slate-100 pb-2">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={cn(
              "text-center text-xs font-bold uppercase tracking-wider text-slate-400",
              [0, 6].includes(i) && "text-slate-300"
            )}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid overflow-hidden -mt-px flex-1 auto-rows-fr p-px grid-cols-7 gap-px bg-slate-100">
        {monthDates.map((_date) => {
          const currentEvents = events.filter((event) =>
            isSameDay(event.start, _date)
          );

          const isSelectedDate = isSameDay(_date, date);
          const isCurrentMonth = isSameMonth(date, _date);

          return (
            <div
              className={cn(
                "bg-white relative p-2 text-sm ring-1 ring-slate-100 overflow-hidden hover:bg-slate-50 transition-colors cursor-pointer flex flex-col gap-1",
                !isCurrentMonth && "bg-slate-50/50 text-slate-300"
              )}
              key={_date.toString()}
              onClick={() => handleDateClick(_date)}
            >
              <span
                className={cn(
                  "size-7 grid place-items-center rounded-full text-xs font-medium mb-1",
                  isToday(_date)
                    ? "bg-[#0B1120] text-white font-bold"
                    : isSelectedDate && !isToday(_date)
                    ? "bg-slate-200 text-slate-900"
                    : "text-slate-700"
                )}
              >
                {format(_date, "d")}
              </span>

              {currentEvents.map((event) => {
                return (
                  <div
                    key={event.id}
                    className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium flex items-center gap-1 truncate border border-slate-100 bg-slate-50 text-slate-600"
                  >
                    <div
                      className={cn(
                        "shrink-0",
                        monthEventVariants({ variant: event.color })
                      )}
                    ></div>
                    <span className="flex-1 truncate">{event.title}</span>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-auto h-full p-4">
      {months.map((days, i) => (
        <div 
          key={days[0].toString()} 
          className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"
        >
          <span className="text-lg font-bold text-slate-900 mb-4 block px-2">
            {format(setMonth(date, i), "MMMM")}
          </span>

          <div className="grid grid-cols-7 gap-2 my-3">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] uppercase font-bold text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid gap-x-2 gap-y-1 text-center grid-cols-7 text-xs tabular-nums">
            {days.map((_date: string | number | Date) => {
              const isCurrentMonth = getMonth(_date) === i;
              return (
                <div
                  key={_date.toString()}
                  className={cn(
                    !isCurrentMonth && "text-slate-200",
                    isCurrentMonth && "text-slate-600"
                  )}
                >
                  <div
                    className={cn(
                      "aspect-square grid place-content-center size-full rounded-md",
                      isSameDay(today, _date) &&
                        isCurrentMonth &&
                        "bg-[#0B1120] text-white font-bold"
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
                    "absolute cursor-pointer shadow-sm hover:shadow-md transition-shadow",
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
              <TooltipContent className="bg-[#0B1120] text-white border-slate-700">
                <div className="flex flex-col gap-1">
                  <p className="font-bold">{event.title}</p>
                  <p className="text-xs text-slate-300">
                    {startTime} - {endTime}
                  </p>
                  <p className="text-xs text-slate-400">{event.description}</p>
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
                    "absolute cursor-pointer overflow-hidden text-xs min-h-[24px] shadow-sm hover:z-50 hover:shadow-md transition-all hover:scale-[1.02]"
                  )}
                  style={{
                    top: `${topPercent}%`,
                    height:
                      hoursSpan > 1
                        ? `${100 - topPercent + (hoursSpan - 1) * 100}%`
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
                  <div className="font-bold truncate">{event.title}</div>
                  {durationMinutes >= 20 && (
                    <div className="text-[10px] opacity-80 mt-0.5 font-medium">
                      {format(event.start, "h:mm a")} -{" "}
                      {format(event.end, "h:mm a")}
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-[#0B1120] text-white border-slate-700">
                <div>
                  <div className="font-bold">{event.title}</div>
                  <div className="text-xs text-slate-300">
                    {format(event.start, "h:mm a")} -{" "}
                    {format(event.end, "h:mm a")}
                  </div>
                  {event.description && (
                    <div className="mt-1 text-xs text-slate-400 max-w-[300px]">
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