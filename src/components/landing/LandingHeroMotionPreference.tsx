"use client";

import { useEffect } from "react";

import {
  getMotionCapabilities,
  HERO_MOTION_MEDIA_QUERY,
} from "@/lib/device-capabilities";

const REDUCED_HERO_MOTION = "reduced";

export default function LandingHeroMotionPreference() {
  useEffect(() => {
    const mediaQuery = window.matchMedia(HERO_MOTION_MEDIA_QUERY);

    const applyMotionPreference = () => {
      const { prefersReducedMotion, saveData, hasConstrainedCpu } =
        getMotionCapabilities(mediaQuery.matches);
      const shouldReduceMotion =
        prefersReducedMotion || saveData || hasConstrainedCpu;

      if (shouldReduceMotion) {
        document.documentElement.dataset.heroMotion = REDUCED_HERO_MOTION;
      } else {
        delete document.documentElement.dataset.heroMotion;
      }
    };

    applyMotionPreference();
    mediaQuery.addEventListener("change", applyMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", applyMotionPreference);
      delete document.documentElement.dataset.heroMotion;
    };
  }, []);

  return null;
}
