export type NetworkInformation = {
  saveData?: boolean;
};

export type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation;
};

export type MotionCapabilities = {
  prefersReducedMotion: boolean;
  saveData: boolean;
  hasConstrainedCpu: boolean;
  isCoarsePointer: boolean;
};

export const HERO_MOTION_MEDIA_QUERY =
  "(prefers-reduced-motion: reduce), (update: slow)";

const COARSE_POINTER_MEDIA_QUERY = "(pointer: coarse)";

export function getMotionCapabilities(
  prefersReducedMotion = window.matchMedia(HERO_MOTION_MEDIA_QUERY).matches,
): MotionCapabilities {
  const navigatorWithConnection = navigator as NavigatorWithConnection;
  const hasConstrainedCpu =
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4;

  return {
    prefersReducedMotion,
    saveData: Boolean(navigatorWithConnection.connection?.saveData),
    hasConstrainedCpu,
    isCoarsePointer: window.matchMedia(COARSE_POINTER_MEDIA_QUERY).matches,
  };
}
