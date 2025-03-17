"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";
import {
  Locale,
  addDays,
  addHours,
  addMonths,
  addWeeks,
  addYears,
  differenceInMinutes,
  format,
  getMonth,
  isSameDay,
  isSameHour,
  isSameMonth,
  isToday,
  setMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import {
  ReactNode,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { BookingFromCalendar } from "../forms/BookingFromCalendar";

export const monthEventVariants = cva("size-2 rounded-full", {
  variants: {
    variant: {
      default: "bg-primary",
      blue: "bg-blue-500",
      green: "bg-green-500",
      pink: "bg-pink-500",
      purple: "bg-purple-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const dayEventVariants = cva("font-bold border-l-4 rounded p-2 text-xs", {
  variants: {
    variant: {
      default: "bg-muted/30 text-muted-foreground border-muted",
      blue: "bg-blue-500/30 text-blue-600 border-blue-500",
      green: "bg-green-500/30 text-green-600 border-green-500",
      pink: "bg-pink-500/30 text-pink-600 border-pink-500",
      purple: "bg-purple-500/30 text-purple-600 border-purple-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type View = "day" | "week" | "month" | "year";

type ContextType = {
  view: View;
  setView: (view: View) => void;
  date: Date;
  setDate: (date: Date) => void;
  events: CalendarEvent[];
  locale: Locale;
  setEvents: (date: CalendarEvent[]) => void;
  onChangeView?: (view: View) => void;
  onEventClick?: (event: CalendarEvent) => void;
  enableHotkeys?: boolean;
  today: Date;
};

const Context = createContext<ContextType>({} as ContextType);

export type CalendarEvent = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  description?: string;
  color?: VariantProps<typeof monthEventVariants>["variant"];
};

export type AssetCalendar = {
  id: string;
  name: string;
  events: CalendarEvent[];
};

type CalendarProps = {
  children: ReactNode;
  defaultDate?: Date;
  date?: Date;
  onDateChange?: (date: Date) => void;
  events?: CalendarEvent[];
  view?: View;
  locale?: Locale;
  enableHotkeys?: boolean;
  onChangeView?: (view: View) => void;
  onEventClick?: (event: CalendarEvent) => void;
};

const Calendar = ({
  children,
  defaultDate = new Date(),
  date: controlledDate,
  onDateChange,
  locale = enUS,
  enableHotkeys = true,
  view: _defaultMode = "month",
  onEventClick,
  events: defaultEvents = [],
  onChangeView,
}: CalendarProps) => {
  const [view, setView] = useState<View>(_defaultMode);
  const [internalDate, setInternalDate] = useState(defaultDate);
  const [events, setEvents] = useState<CalendarEvent[]>(defaultEvents);

  // Determine if date is controlled externally
  const isDateControlled = controlledDate !== undefined;
  const currentDate = isDateControlled ? controlledDate : internalDate;

  // Handle date changes
  const handleDateChange = useCallback(
    (newDate: Date) => {
      if (isDateControlled) {
        // If controlled, call the external handler
        onDateChange?.(newDate);
      } else {
        // If uncontrolled, update internal state
        setInternalDate(newDate);
      }
    },
    [isDateControlled, onDateChange]
  );

  const changeView = (view: View) => {
    setView(view);
    onChangeView?.(view);
  };

  useHotkeys("m", () => changeView("month"), {
    enabled: enableHotkeys,
  });

  useHotkeys("w", () => changeView("week"), {
    enabled: enableHotkeys,
  });

  useHotkeys("y", () => changeView("year"), {
    enabled: enableHotkeys,
  });

  useHotkeys("d", () => changeView("day"), {
    enabled: enableHotkeys,
  });

  // Update context value with the appropriate date and setter
  return (
    <Context.Provider
      value={{
        view,
        setView,
        date: currentDate,
        setDate: handleDateChange,
        events,
        setEvents,
        locale,
        enableHotkeys,
        onEventClick,
        onChangeView,
        today: new Date(),
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useCalendar = () => useContext(Context);

const CalendarViewTrigger = forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & {
    view: View;
  }
>(({ children, view, ...props }) => {
  const { view: currentView, setView, onChangeView } = useCalendar();

  return (
    <Button
      aria-current={currentView === view}
      size="sm"
      variant="ghost"
      {...props}
      onClick={() => {
        setView(view);
        onChangeView?.(view);
      }}
    >
      {children}
    </Button>
  );
});
CalendarViewTrigger.displayName = "CalendarViewTrigger";

const EventGroup = ({
  events,
  hour,
}: {
  events: CalendarEvent[];
  hour: Date;
}) => {
  return (
    <div className="h-12 border-t last:border-b w-11/12">
      {events
        .filter((event) => isSameHour(event.start, hour))
        .map((event) => {
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
                      "relative cursor-pointer",
                      dayEventVariants({ variant: event.color })
                    )}
                    style={{
                      top: `${startPosition * 100}%`,
                      height: `${hoursDifference * 100}%`,
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

const CalendarDayView = () => {
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

  return (
    <div className="flex relative py-7 overflow-y-auto overflow-x-hidden h-full mr-4">
      <TimeTable />
      <div className="flex-1 relative">
        {" "}
        {/* Added right padding */}
        {/* Existing events layer */}
        <div className="absolute inset-0 pointer-events-none">
          {hours.map((hour) => (
            <EventGroup key={hour.toString()} hour={hour} events={events} />
          ))}
        </div>
        {/* Clickable grid layer */}
        <div className="absolute inset-0 grid grid-rows-[repeat(14,1fr)]">
          {hours.map((hour) => (
            <div
              key={`slot-${hour.toString()}`}
              className="border-t last:border-b w-full h-full cursor-pointer hover:bg-orange-100/60 transition-colors"
              onClick={() => handleTimeSlotClick(hour)}
            >
              {/* Time slot is empty - just clickable */}
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

const CalendarWeekView = () => {
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
                    className="border-t last:border-b w-full h-full cursor-pointer hover:bg-muted/30 transition-colors"
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

const CalendarMonthView = () => {
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

const CalendarYearView = () => {
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
            {days.map((_date) => {
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

const CalendarNextTrigger = forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & { className?: string }
>(({ children, onClick, className = "", ...props }, ref) => {
  const { date, setDate, view, enableHotkeys } = useCalendar();

  const next = useCallback(() => {
    if (view === "day") {
      setDate(addDays(date, 1));
    } else if (view === "week") {
      setDate(addWeeks(date, 1));
    } else if (view === "month") {
      setDate(addMonths(date, 1));
    } else if (view === "year") {
      setDate(addYears(date, 1));
    }
  }, [date, view, setDate]);

  useHotkeys("ArrowRight", () => next(), {
    enabled: enableHotkeys,
  });

  return (
    <Button
      size="icon"
      variant="outline"
      ref={ref}
      className={className}
      {...props}
      onClick={(e) => {
        next();
        onClick?.(e);
      }}
    >
      {children}
    </Button>
  );
});
CalendarNextTrigger.displayName = "CalendarNextTrigger";

const CalendarPrevTrigger = forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & { className?: string }
>(({ children, onClick, className = "", ...props }, ref) => {
  const { date, setDate, view, enableHotkeys } = useCalendar();

  useHotkeys("ArrowLeft", () => prev(), {
    enabled: enableHotkeys,
  });

  const prev = useCallback(() => {
    if (view === "day") {
      setDate(subDays(date, 1));
    } else if (view === "week") {
      setDate(subWeeks(date, 1));
    } else if (view === "month") {
      setDate(subMonths(date, 1));
    } else if (view === "year") {
      setDate(subYears(date, 1));
    }
  }, [date, view, setDate]);

  return (
    <Button
      size="icon"
      variant="outline"
      ref={ref}
      className={className}
      {...props}
      onClick={(e) => {
        prev();
        onClick?.(e);
      }}
    >
      {children}
    </Button>
  );
});
CalendarPrevTrigger.displayName = "CalendarPrevTrigger";

const CalendarTodayTrigger = forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & { className?: string }
>(({ children, onClick, className = "", ...props }, ref) => {
  const { setDate, enableHotkeys, today } = useCalendar();

  useHotkeys("t", () => jumpToToday(), {
    enabled: enableHotkeys,
  });

  const jumpToToday = useCallback(() => {
    setDate(today);
  }, [today, setDate]);

  return (
    <Button
      variant="outline"
      ref={ref}
      className={className}
      {...props}
      onClick={(e) => {
        jumpToToday();
        onClick?.(e);
      }}
    >
      {children}
    </Button>
  );
});
CalendarTodayTrigger.displayName = "CalendarTodayTrigger";

const CalendarCurrentDate = ({ className = "" }: { className?: string }) => {
  const { date, view } = useCalendar();

  // Ensure date is valid; fallback to current date if necessary
  const stableDate = useMemo(() => {
    const validDate =
      date && !isNaN(new Date(date).getTime()) ? new Date(date) : new Date();
    validDate.setHours(0, 0, 0, 0);
    return validDate.toISOString();
  }, [date]);

  // Format for mobile (default)
  const mobileFormattedDate = useMemo(() => {
    const validDate = new Date(stableDate);
    return format(validDate, view === "day" ? "dd MMM yy" : "MMMM yyyy");
  }, [stableDate, view]);

  // Format for desktop
  const desktopFormattedDate = useMemo(() => {
    const validDate = new Date(stableDate);
    return format(validDate, view === "day" ? "dd MMMM yyyy" : "MMMM yyyy");
  }, [stableDate, view]);

  return (
    <time dateTime={stableDate} className={`tabular-nums ${className}`}>
      <span className="md:hidden">{mobileFormattedDate}</span>
      <span className="hidden md:inline">{desktopFormattedDate}</span>
    </time>
  );
};

const TimeTable = () => {
  const now = new Date();

  return (
    <div className="pr-2 w-12 ">
      {Array.from(Array(15)).map((_, index) => {
        const hour = index + 6;
        return (
          <div
            className="text-right relative text-xs text-gray-800 h-12 last:h-0"
            key={hour}
          >
            {now.getHours() === hour && (
              <div
                className="absolute left-full translate-x-2 w-dvw h-[2px] bg-red-500"
                style={{
                  top: `${(now.getMinutes() / 60) * 100}%`,
                }}
              >
                <div className="size-2 rounded-full bg-red-500 absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            )}
            <p className="top-0 -translate-y-1/2">{hour}:00</p>
          </div>
        );
      })}
    </div>
  );
};

const getDaysInMonth = (date: Date) => {
  const startOfMonthDate = startOfMonth(date);
  const startOfWeekForMonth = startOfWeek(startOfMonthDate, {
    weekStartsOn: 0,
  });

  let currentDate = startOfWeekForMonth;
  const calendar = [];

  while (calendar.length < 42) {
    calendar.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return calendar;
};

const generateWeekdays = (locale: Locale) => {
  const daysOfWeek = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), i);
    daysOfWeek.push(format(date, "EEEEEE", { locale }));
  }
  return daysOfWeek;
};

export {
  Calendar,
  CalendarCurrentDate,
  CalendarDayView,
  CalendarMonthView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarViewTrigger,
  CalendarWeekView,
  CalendarYearView,
};
