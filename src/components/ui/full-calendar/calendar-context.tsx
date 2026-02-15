"use client";

import { cva, VariantProps } from "class-variance-authority";
import { Locale } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import {
  ReactNode,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "../button";

// Types
export type View = "day" | "week" | "month" | "year";

export const monthEventVariants = cva("size-2 rounded-full", {
  variants: {
    variant: {
      default: "bg-slate-900", // Previously primary
      blue: "bg-blue-600",
      green: "bg-emerald-600",
      pink: "bg-rose-600",
      purple: "bg-violet-600",
      yellow: "bg-amber-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const dayEventVariants = cva(
  "font-bold border-l-4 rounded p-2 text-xs shadow-sm transition-all hover:brightness-95",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-700 border-slate-400",
        blue: "bg-sky-50 text-sky-800 border-sky-600",
        green: "bg-emerald-50 text-emerald-800 border-emerald-600",
        pink: "bg-rose-50 text-rose-800 border-rose-600",
        purple: "bg-violet-50 text-violet-800 border-violet-600",
        yellow: "bg-amber-50 text-amber-800 border-amber-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type CalendarEvent = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  description?: string;
  color?: VariantProps<typeof monthEventVariants>["variant"];
  // Allow other props to pass through without TS errors
  [key: string]: unknown;
};

export type AssetCalendar = {
  id: string;
  name: string;
  events: CalendarEvent[];
  asset?: unknown;
};

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

export const useCalendar = () => useContext(Context);

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

export const Calendar = ({
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

  const prevDefaultEventsRef = useRef<CalendarEvent[] | null>(null);

  useEffect(() => {
    const incoming = defaultEvents || [];
    const prev = prevDefaultEventsRef.current;

    const isSame = (() => {
      if (!prev) return false;
      if (prev.length !== incoming.length) return false;
      for (let i = 0; i < prev.length; i++) {
        const a = prev[i];
        const b = incoming[i];
        if (a.id !== b.id) return false;
        if (a.start?.getTime() !== b.start?.getTime()) return false;
        if (a.end?.getTime() !== b.end?.getTime()) return false;
        if (a.color !== b.color) return false;
        if (a.title !== b.title) return false;
        if (a.description !== b.description) return false;
        if (a.status !== b.status) return false;
        if (a.bookingStatus !== b.bookingStatus) return false;
      }
      return true;
    })();

    if (!isSame) {
      setEvents(incoming);
      prevDefaultEventsRef.current = incoming;
    }
  }, [defaultEvents]);

  const handleDateChange = useCallback(
    (newDate: Date) => {
      if (isDateControlled) {
        onDateChange?.(newDate);
      } else {
        setInternalDate(newDate);
      }
    },
    [isDateControlled, onDateChange],
  );

  const changeView = (view: View) => {
    setView(view);
    onChangeView?.(view);
  };

  useHotkeys("m", () => changeView("month"), { enabled: enableHotkeys });
  useHotkeys("w", () => changeView("week"), { enabled: enableHotkeys });
  useHotkeys("y", () => changeView("year"), { enabled: enableHotkeys });
  useHotkeys("d", () => changeView("day"), { enabled: enableHotkeys });

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

export const CalendarViewTrigger = forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & {
    view: View;
  }
>(({ children, view, className, ...props }, ref) => {
  const { view: currentView, setView, onChangeView } = useCalendar();

  return (
    <Button
      ref={ref}
      aria-current={currentView === view}
      size="sm"
      variant="ghost"
      className={`
        ${
          currentView === view
            ? "bg-[var(--navy)] text-white hover:bg-[var(--navy-90)]"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }
        ${className}
      `}
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
