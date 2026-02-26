"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { isRecord } from "@/lib/typeGuards";

export const PROJECT_SELECTION_STORAGE_KEY = "project-selection-v1";
const PROJECT_SELECTION_STORE_VERSION = 1;

type PersistedProjectSelectionState = {
  selectedProjectIds?: Record<string, unknown>;
};

const toStringRecord = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) return {};
  const entries = Object.entries(value)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .filter(([, projectId]) => projectId.trim().length > 0);
  return Object.fromEntries(entries);
};

const extractSelectedProjectIds = (
  persistedState: unknown,
): Record<string, string> => {
  if (!isRecord(persistedState)) return {};
  if ("selectedProjectIds" in persistedState) {
    return toStringRecord(
      (persistedState as PersistedProjectSelectionState).selectedProjectIds,
    );
  }
  if ("state" in persistedState && isRecord(persistedState.state)) {
    return toStringRecord(
      (persistedState.state as PersistedProjectSelectionState).selectedProjectIds,
    );
  }
  return {};
};

type ProjectSelectionStore = {
  hasHydrated: boolean;
  selectedProjectIds: Record<string, string>;
  setHasHydrated: (value: boolean) => void;
  getSelectedProjectId: (userId: string) => string | null;
  setSelectedProjectId: (userId: string, projectId: string) => void;
  clearSelectedProjectId: (userId: string) => void;
};

export const useProjectSelectionStore = create<ProjectSelectionStore>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      selectedProjectIds: {},
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
      getSelectedProjectId: (userId: string): string | null =>
        get().selectedProjectIds[userId] ?? null,
      setSelectedProjectId: (userId: string, projectId: string) =>
        set((state) => ({
          selectedProjectIds: {
            ...state.selectedProjectIds,
            [userId]: projectId,
          },
        })),
      clearSelectedProjectId: (userId: string) =>
        set((state) => {
          const next = { ...state.selectedProjectIds };
          delete next[userId];
          return { selectedProjectIds: next };
        }),
    }),
    {
      name: PROJECT_SELECTION_STORAGE_KEY,
      version: PROJECT_SELECTION_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedProjectIds: state.selectedProjectIds }),
      migrate: (persistedState) => ({
        selectedProjectIds: extractSelectedProjectIds(persistedState),
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // Keep app usable even with malformed persisted payloads.
          console.error(
            "projectSelectionStore: failed to rehydrate persisted state",
            error,
          );
        }
        // Always mark hydration complete, even if state is undefined on error.
        (state ?? useProjectSelectionStore.getState()).setHasHydrated(true);
      },
    },
  ),
);
