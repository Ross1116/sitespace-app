"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { isRecord } from "@/lib/typeGuards";

export type CalendarMode = "day" | "week";

export type LookaheadWindowSize = "2W" | "4W" | "6W";
const DEFAULT_LOOKAHEAD_WINDOW: LookaheadWindowSize = "4W";

export type LookaheadIntent = {
  windowSize: LookaheadWindowSize;
};

const UI_INTENT_STORAGE_KEY = "ui-intent-v1";
const UI_INTENT_STORE_VERSION = 1;
const DEFAULT_BOOKINGS_TAB = "Upcoming";
const MAX_SCOPES = 50;

export type BookingsIntent = {
  activeTab: string;
  searchTerm: string;
};

export type MulticalendarIntent = {
  calendarMode: CalendarMode;
  visibleAssetIds: string[];
};

type PersistedUIIntentState = {
  bookingsByScope?: unknown;
  multicalendarByScope?: unknown;
  lookaheadByScope?: unknown;
  bookingsScopeAccess?: unknown;
  multicalendarScopeAccess?: unknown;
  lookaheadScopeAccess?: unknown;
};

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

const toNumberRecord = (value: unknown): Record<string, number> => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] => typeof entry[1] === "number",
    ),
  );
};

const toLookaheadIntentRecord = (
  value: unknown,
): Record<string, LookaheadIntent> => {
  if (!isRecord(value)) return {};

  const entries = Object.entries(value)
    .map(([scopeKey, rawIntent]) => {
      if (!isRecord(rawIntent)) return null;
      const isValidWindow = (v: unknown): v is LookaheadWindowSize =>
        v === "2W" || v === "4W" || v === "6W";
      const windowSize = isValidWindow(rawIntent.windowSize)
        ? rawIntent.windowSize
        : DEFAULT_LOOKAHEAD_WINDOW;
      return [scopeKey, { windowSize }] as const;
    })
    .filter(
      (entry): entry is readonly [string, LookaheadIntent] => Boolean(entry),
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

/** Evict the least-recently-used entries when the map exceeds MAX_SCOPES. */
function pruneOldScopes<T>(
  map: Record<string, T>,
  access: Record<string, number>,
): { map: Record<string, T>; access: Record<string, number> } {
  const keys = Object.keys(map);
  if (keys.length <= MAX_SCOPES) return { map, access };

  const sorted = [...keys].sort((a, b) => (access[a] ?? 0) - (access[b] ?? 0));
  const toRemove = new Set(sorted.slice(0, keys.length - MAX_SCOPES));

  const nextMap: Record<string, T> = {};
  const nextAccess: Record<string, number> = {};
  for (const key of keys) {
    if (!toRemove.has(key)) {
      nextMap[key] = map[key]!;
      nextAccess[key] = access[key] ?? 0;
    }
  }
  return { map: nextMap, access: nextAccess };
}

type UIIntentStore = {
  hasHydrated: boolean;
  bookingsByScope: Record<string, BookingsIntent>;
  multicalendarByScope: Record<string, MulticalendarIntent>;
  lookaheadByScope: Record<string, LookaheadIntent>;
  bookingsScopeAccess: Record<string, number>;
  multicalendarScopeAccess: Record<string, number>;
  lookaheadScopeAccess: Record<string, number>;
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
  getLookaheadIntent: (scopeKey: string) => LookaheadIntent | null;
  setLookaheadWindowSize: (
    scopeKey: string,
    windowSize: LookaheadWindowSize,
  ) => void;
};

export const useUIIntentStore = create<UIIntentStore>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      bookingsByScope: {},
      multicalendarByScope: {},
      lookaheadByScope: {},
      bookingsScopeAccess: {},
      multicalendarScopeAccess: {},
      lookaheadScopeAccess: {},
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
      getBookingsIntent: (scopeKey: string): BookingsIntent | null =>
        get().bookingsByScope[scopeKey] ?? null,
      setBookingsActiveTab: (scopeKey: string, activeTab: string) =>
        set((state) => {
          const previous = state.bookingsByScope[scopeKey] ?? {
            activeTab: DEFAULT_BOOKINGS_TAB,
            searchTerm: "",
          };
          const updatedMap = {
            ...state.bookingsByScope,
            [scopeKey]: {
              ...previous,
              activeTab: activeTab.trim() || DEFAULT_BOOKINGS_TAB,
            },
          };
          const updatedAccess = {
            ...state.bookingsScopeAccess,
            [scopeKey]: Date.now(),
          };
          const pruned = pruneOldScopes(updatedMap, updatedAccess);
          return { bookingsByScope: pruned.map, bookingsScopeAccess: pruned.access };
        }),
      setBookingsSearchTerm: (scopeKey: string, searchTerm: string) =>
        set((state) => {
          const previous = state.bookingsByScope[scopeKey] ?? {
            activeTab: DEFAULT_BOOKINGS_TAB,
            searchTerm: "",
          };
          const updatedMap = {
            ...state.bookingsByScope,
            [scopeKey]: { ...previous, searchTerm },
          };
          const updatedAccess = {
            ...state.bookingsScopeAccess,
            [scopeKey]: Date.now(),
          };
          const pruned = pruneOldScopes(updatedMap, updatedAccess);
          return { bookingsByScope: pruned.map, bookingsScopeAccess: pruned.access };
        }),
      getLookaheadIntent: (scopeKey: string): LookaheadIntent | null =>
        get().lookaheadByScope[scopeKey] ?? null,
      setLookaheadWindowSize: (scopeKey: string, windowSize: LookaheadWindowSize) =>
        set((state) => {
          const previous = state.lookaheadByScope[scopeKey] ?? {
            windowSize: DEFAULT_LOOKAHEAD_WINDOW,
          };
          const updatedMap = {
            ...state.lookaheadByScope,
            [scopeKey]: { ...previous, windowSize },
          };
          const updatedAccess = {
            ...state.lookaheadScopeAccess,
            [scopeKey]: Date.now(),
          };
          const pruned = pruneOldScopes(updatedMap, updatedAccess);
          return { lookaheadByScope: pruned.map, lookaheadScopeAccess: pruned.access };
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
          const updatedMap = {
            ...state.multicalendarByScope,
            [scopeKey]: { ...previous, calendarMode },
          };
          const updatedAccess = {
            ...state.multicalendarScopeAccess,
            [scopeKey]: Date.now(),
          };
          const pruned = pruneOldScopes(updatedMap, updatedAccess);
          return {
            multicalendarByScope: pruned.map,
            multicalendarScopeAccess: pruned.access,
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
          const updatedMap = {
            ...state.multicalendarByScope,
            [scopeKey]: { ...previous, visibleAssetIds: nextVisibleAssetIds },
          };
          const updatedAccess = {
            ...state.multicalendarScopeAccess,
            [scopeKey]: Date.now(),
          };
          const pruned = pruneOldScopes(updatedMap, updatedAccess);
          return {
            multicalendarByScope: pruned.map,
            multicalendarScopeAccess: pruned.access,
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
        lookaheadByScope: state.lookaheadByScope,
        bookingsScopeAccess: state.bookingsScopeAccess,
        multicalendarScopeAccess: state.multicalendarScopeAccess,
        lookaheadScopeAccess: state.lookaheadScopeAccess,
      }),
      migrate: (persistedState) => {
        const state = extractPersistedState(persistedState);
        return {
          bookingsByScope: toBookingsIntentRecord(state.bookingsByScope),
          multicalendarByScope: toMulticalendarIntentRecord(
            state.multicalendarByScope,
          ),
          lookaheadByScope: toLookaheadIntentRecord(state.lookaheadByScope),
          bookingsScopeAccess: toNumberRecord(state.bookingsScopeAccess),
          multicalendarScopeAccess: toNumberRecord(state.multicalendarScopeAccess),
          lookaheadScopeAccess: toNumberRecord(state.lookaheadScopeAccess),
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error(
            "uiIntentStore: failed to rehydrate persisted state",
            error,
          );
        }
        // Always mark hydration complete, even if state is undefined on error.
        (state ?? useUIIntentStore.getState()).setHasHydrated(true);
      },
    },
  ),
);
