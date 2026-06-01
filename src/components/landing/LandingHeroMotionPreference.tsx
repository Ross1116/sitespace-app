"use client";

import { useEffect } from "react";

type NetworkInformation = {
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation;
};

const REDUCED_HERO_MOTION = "reduced";

export default function LandingHeroMotionPreference() {
  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce), (update: slow)",
    );
    const navigatorWithConnection = navigator as NavigatorWithConnection;
    const hasConstrainedCpu =
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency <= 4;

    const shouldReduceMotion =
      mediaQuery.matches ||
      Boolean(navigatorWithConnection.connection?.saveData) ||
      hasConstrainedCpu;

    if (shouldReduceMotion) {
      document.documentElement.dataset.heroMotion = REDUCED_HERO_MOTION;
    } else {
      delete document.documentElement.dataset.heroMotion;
    }

    return () => {
      delete document.documentElement.dataset.heroMotion;
    };
  }, []);

  return null;
}
