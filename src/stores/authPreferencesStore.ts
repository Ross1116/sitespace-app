"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const AUTH_PREFERENCES_STORAGE_KEY = "auth-preferences-v1";
const AUTH_PREFERENCES_STORE_VERSION = 1;

type PersistedAuthPreferencesState = {
  rememberedEmail?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const extractRememberedEmail = (persistedState: unknown): string => {
  if (!isRecord(persistedState)) return "";

  if ("rememberedEmail" in persistedState) {
    const rememberedEmail = (
      persistedState as PersistedAuthPreferencesState
    ).rememberedEmail;
    return typeof rememberedEmail === "string" ? rememberedEmail : "";
  }

  if ("state" in persistedState && isRecord(persistedState.state)) {
    const rememberedEmail = (
      persistedState.state as PersistedAuthPreferencesState
    ).rememberedEmail;
    return typeof rememberedEmail === "string" ? rememberedEmail : "";
  }

  return "";
};

type AuthPreferencesStore = {
  hasHydrated: boolean;
  rememberedEmail: string;
  setHasHydrated: (value: boolean) => void;
  setRememberedEmail: (email: string) => void;
  clearRememberedEmail: () => void;
};

export const useAuthPreferencesStore = create<AuthPreferencesStore>()(
  persist(
    (set) => ({
      hasHydrated: false,
      rememberedEmail: "",
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setRememberedEmail: (email) => set({ rememberedEmail: email.trim() }),
      clearRememberedEmail: () => set({ rememberedEmail: "" }),
    }),
    {
      name: AUTH_PREFERENCES_STORAGE_KEY,
      version: AUTH_PREFERENCES_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ rememberedEmail: state.rememberedEmail }),
      migrate: (persistedState) => ({
        rememberedEmail: extractRememberedEmail(persistedState),
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error(
            "authPreferencesStore: failed to rehydrate persisted state",
            error,
          );
        }
        state?.setHasHydrated(true);
      },
    },
  ),
);
