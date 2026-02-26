"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const PROJECT_SELECTION_STORAGE_KEY = "project-selection-v1";

type ProjectSelectionStore = {
  selectedProjectIds: Record<string, string>;
  setSelectedProjectId: (userId: string, projectId: string) => void;
  clearSelectedProjectId: (userId: string) => void;
};

export const useProjectSelectionStore = create<ProjectSelectionStore>()(
  persist(
    (set) => ({
      selectedProjectIds: {},
      setSelectedProjectId: (userId, projectId) =>
        set((state) => ({
          selectedProjectIds: {
            ...state.selectedProjectIds,
            [userId]: projectId,
          },
        })),
      clearSelectedProjectId: (userId) =>
        set((state) => {
          const next = { ...state.selectedProjectIds };
          delete next[userId];
          return { selectedProjectIds: next };
        }),
    }),
    {
      name: PROJECT_SELECTION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedProjectIds: state.selectedProjectIds }),
    },
  ),
);
