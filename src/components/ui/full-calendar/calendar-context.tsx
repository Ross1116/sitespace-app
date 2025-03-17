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
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "../button";

// Types
export type View = "day" | "week" | "month" | "year";

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

export const dayEventVariants = cva(
  "font-bold border-l-4 rounded p-2 text-xs",
  {
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
  }
);

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

export const CalendarViewTrigger = forwardRef<
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