"use client";

import { createContext, useContext, ReactNode } from "react";

type BookingCardActionsContextValue = {
  isDropdownOpen: boolean;
  toggleDropdown: () => void;
  onActionComplete?: () => void;
};

const BookingCardActionsContext =
  createContext<BookingCardActionsContextValue | null>(null);

export function BookingCardActionsProvider({
  value,
  children,
}: {
  value: BookingCardActionsContextValue;
  children: ReactNode;
}) {
  return (
    <BookingCardActionsContext.Provider value={value}>
      {children}
    </BookingCardActionsContext.Provider>
  );
}

export function useBookingCardActions(): BookingCardActionsContextValue {
  const context = useContext(BookingCardActionsContext);
  if (!context) {
    throw new Error(
      "useBookingCardActions must be used within BookingCardActionsProvider",
    );
  }
  return context;
}
