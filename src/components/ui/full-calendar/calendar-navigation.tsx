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
    if (view === "day") setDate(addDays(date, 1));
    else if (view === "week") setDate(addWeeks(date, 1));
    else if (view === "month") setDate(addMonths(date, 1));
    else if (view === "year") setDate(addYears(date, 1));
  }, [date, view, setDate]);

  useHotkeys("ArrowRight", () => next(), { enabled: enableHotkeys });

  return (
    <Button
      size="icon"
      variant="ghost"
      ref={ref}
      className={className} // ClassName passed from Header controls the styling entirely
      {...props}
      onClick={(e) => { next(); onClick?.(e); }}
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

  const prev = useCallback(() => {
    if (view === "day") setDate(subDays(date, 1));
    else if (view === "week") setDate(subWeeks(date, 1));
    else if (view === "month") setDate(subMonths(date, 1));
    else if (view === "year") setDate(subYears(date, 1));
  }, [date, view, setDate]);

  useHotkeys("ArrowLeft", () => prev(), { enabled: enableHotkeys });

  return (
    <Button
      size="icon"
      variant="ghost"
      ref={ref}
      className={className}
      {...props}
      onClick={(e) => { prev(); onClick?.(e); }}
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

  useHotkeys("t", () => setDate(today), { enabled: enableHotkeys });

  return (
    <Button
      variant="ghost"
      ref={ref}
      className={className}
      {...props}
      onClick={(e) => { setDate(today); onClick?.(e); }}
    >
      {children}
    </Button>
  );
});
CalendarTodayTrigger.displayName = "CalendarTodayTrigger";

export const CalendarCurrentDate = ({ className = "" }: { className?: string }) => {
  const { date, view } = useCalendar();

  const stableDate = useMemo(() => {
    const validDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : new Date();
    validDate.setHours(0, 0, 0, 0);
    return validDate.toISOString();
  }, [date]);

  const mobileFormat = useMemo(() => 
    format(new Date(stableDate), view === "day" ? "dd MMM yy" : "MMM yyyy"), 
  [stableDate, view]);

  const desktopFormat = useMemo(() => 
    format(new Date(stableDate), view === "day" ? "dd MMMM yyyy" : "MMMM yyyy"), 
  [stableDate, view]);

  return (
    <time dateTime={stableDate} className={`tabular-nums ${className}`}>
      <span className="md:hidden">{mobileFormat}</span>
      <span className="hidden md:inline">{desktopFormat}</span>
    </time>
  );
};