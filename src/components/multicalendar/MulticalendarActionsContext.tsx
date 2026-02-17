"use client";

import { createContext, ReactNode, useContext } from "react";
import { CalendarEvent } from "@/lib/multicalendarHelpers";

type MulticalendarActionsContextValue = {
  onActionComplete?: () => void;
  onBookingCreated?: (
    events: Partial<CalendarEvent>[] | Partial<CalendarEvent>,
  ) => void;
};

const MulticalendarActionsContext =
  createContext<MulticalendarActionsContextValue | null>(null);

export function MulticalendarActionsProvider({
  value,
  children,
}: {
  value: MulticalendarActionsContextValue;
  children: ReactNode;
}) {
  return (
    <MulticalendarActionsContext.Provider value={value}>
      {children}
    </MulticalendarActionsContext.Provider>
  );
}

export function useMulticalendarActions() {
  return useContext(MulticalendarActionsContext);
}
