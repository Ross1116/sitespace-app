"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CalendarMode = "day" | "week";

const UI_INTENT_STORAGE_KEY = "ui-intent-v1";
const UI_INTENT_STORE_VERSION = 1;
const DEFAULT_BOOKINGS_TAB = "Upcoming";

type BookingsIntent = {
  activeTab: string;
  searchTerm: string;
};

type MulticalendarIntent = {
  calendarMode: CalendarMode;
  visibleAssetIds: string[];
};

type PersistedUIIntentState = {
  bookingsByScope?: unknown;
  multicalendarByScope?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toBookingsIntentRecord = (
  value: unknown,
): Record<string, BookingsIntent> => {
  if (!isRecord(value)) return {};

  const entries = Object.entries(value)
    .map(([scopeKey, rawIntent]) => {
      if (!isRecord(rawIntent)) return null;

      const activeTab =
        typeof rawIntent.activeTab === "string" && rawIntent.activeTab.trim()
          ? rawIntent.activeTab
          : DEFAULT_BOOKINGS_TAB;
      const searchTerm =
        typeof rawIntent.searchTerm === "string" ? rawIntent.searchTerm : "";

      return [scopeKey, { activeTab, searchTerm }] as const;
    })
    .filter((entry): entry is readonly [string, BookingsIntent] => Boolean(entry));

  return Object.fromEntries(entries);
};

const isCalendarMode = (value: unknown): value is CalendarMode =>
  value === "day" || value === "week";

const toMulticalendarIntentRecord = (
  value: unknown,
): Record<string, MulticalendarIntent> => {
  if (!isRecord(value)) return {};

  const entries = Object.entries(value)
    .map(([scopeKey, rawIntent]) => {
      if (!isRecord(rawIntent)) return null;

      const calendarMode = isCalendarMode(rawIntent.calendarMode)
        ? rawIntent.calendarMode
        : "day";
      const visibleAssetIds = Array.isArray(rawIntent.visibleAssetIds)
        ? rawIntent.visibleAssetIds.filter(
            (assetId): assetId is string =>
              typeof assetId === "string" && assetId.trim().length > 0,
          )
        : [];

      return [scopeKey, { calendarMode, visibleAssetIds }] as const;
    })
    .filter(
      (entry): entry is readonly [string, MulticalendarIntent] =>
        Boolean(entry),
    );

  return Object.fromEntries(entries);
};

const extractPersistedState = (
  persistedState: unknown,
): PersistedUIIntentState => {
  if (!isRecord(persistedState)) return {};
  if ("state" in persistedState && isRecord(persistedState.state)) {
    return persistedState.state as PersistedUIIntentState;
  }
  return persistedState as PersistedUIIntentState;
};

type UIIntentStore = {
  hasHydrated: boolean;
  bookingsByScope: Record<string, BookingsIntent>;
  multicalendarByScope: Record<string, MulticalendarIntent>;
  setHasHydrated: (value: boolean) => void;
  getBookingsIntent: (scopeKey: string) => BookingsIntent | null;
  setBookingsActiveTab: (scopeKey: string, activeTab: string) => void;
  setBookingsSearchTerm: (scopeKey: string, searchTerm: string) => void;
  getMulticalendarIntent: (scopeKey: string) => MulticalendarIntent | null;
  setMulticalendarCalendarMode: (
    scopeKey: string,
    calendarMode: CalendarMode,
  ) => void;
  setMulticalendarVisibleAssetIds: (
    scopeKey: string,
    visibleAssetIds: string[],
  ) => void;
};

export const useUIIntentStore = create<UIIntentStore>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      bookingsByScope: {},
      multicalendarByScope: {},
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
      getBookingsIntent: (scopeKey: string): BookingsIntent | null =>
        get().bookingsByScope[scopeKey] ?? null,
      setBookingsActiveTab: (scopeKey: string, activeTab: string) =>
        set((state) => {
          const previous = state.bookingsByScope[scopeKey] ?? {
            activeTab: DEFAULT_BOOKINGS_TAB,
            searchTerm: "",
          };
          return {
            bookingsByScope: {
              ...state.bookingsByScope,
              [scopeKey]: {
                ...previous,
                activeTab: activeTab.trim() || DEFAULT_BOOKINGS_TAB,
              },
            },
          };
        }),
      setBookingsSearchTerm: (scopeKey: string, searchTerm: string) =>
        set((state) => {
          const previous = state.bookingsByScope[scopeKey] ?? {
            activeTab: DEFAULT_BOOKINGS_TAB,
            searchTerm: "",
          };
          return {
            bookingsByScope: {
              ...state.bookingsByScope,
              [scopeKey]: {
                ...previous,
                searchTerm,
              },
            },
          };
        }),
      getMulticalendarIntent: (scopeKey: string): MulticalendarIntent | null =>
        get().multicalendarByScope[scopeKey] ?? null,
      setMulticalendarCalendarMode: (
        scopeKey: string,
        calendarMode: CalendarMode,
      ) =>
        set((state) => {
          const previous = state.multicalendarByScope[scopeKey] ?? {
            calendarMode: "day",
            visibleAssetIds: [],
          };
          return {
            multicalendarByScope: {
              ...state.multicalendarByScope,
              [scopeKey]: {
                ...previous,
                calendarMode,
              },
            },
          };
        }),
      setMulticalendarVisibleAssetIds: (
        scopeKey: string,
        visibleAssetIds: string[],
      ) =>
        set((state) => {
          const previous = state.multicalendarByScope[scopeKey] ?? {
            calendarMode: "day",
            visibleAssetIds: [],
          };
          const nextVisibleAssetIds = visibleAssetIds.filter(
            (assetId) => typeof assetId === "string" && assetId.trim().length > 0,
          );
          return {
            multicalendarByScope: {
              ...state.multicalendarByScope,
              [scopeKey]: {
                ...previous,
                visibleAssetIds: nextVisibleAssetIds,
              },
            },
          };
        }),
    }),
    {
      name: UI_INTENT_STORAGE_KEY,
      version: UI_INTENT_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        bookingsByScope: state.bookingsByScope,
        multicalendarByScope: state.multicalendarByScope,
      }),
      migrate: (persistedState) => {
        const state = extractPersistedState(persistedState);
        return {
          bookingsByScope: toBookingsIntentRecord(state.bookingsByScope),
          multicalendarByScope: toMulticalendarIntentRecord(
            state.multicalendarByScope,
          ),
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error(
            "uiIntentStore: failed to rehydrate persisted state",
            error,
          );
        }
        state?.setHasHydrated(true);
      },
    },
  ),
);

