"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AuthPreferencesStore = {
  rememberedEmail: string;
  setRememberedEmail: (email: string) => void;
  clearRememberedEmail: () => void;
};

export const useAuthPreferencesStore = create<AuthPreferencesStore>()(
  persist(
    (set) => ({
      rememberedEmail: "",
      setRememberedEmail: (email) => set({ rememberedEmail: email.trim() }),
      clearRememberedEmail: () => set({ rememberedEmail: "" }),
    }),
    {
      name: "auth-preferences-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ rememberedEmail: state.rememberedEmail }),
    },
  ),
);
