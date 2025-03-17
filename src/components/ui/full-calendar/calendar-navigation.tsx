"use client";

import { Button } from "@/components/ui/button";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { forwardRef, useCallback, useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useCalendar } from "./calendar-context";

export const CalendarNextTrigger = forwardRef<
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

export const CalendarPrevTrigger = forwardRef<
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

export const CalendarTodayTrigger = forwardRef<
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

export const CalendarCurrentDate = ({
  className = "",
}: {
  className?: string;
}) => {
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
