"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getPendingNetworkActivityCount,
  subscribeToNetworkActivity,
} from "@/lib/networkActivity";

export default function GlobalNetworkLoadingBar() {
  const pendingCount = useSyncExternalStore(
    subscribeToNetworkActivity,
    getPendingNetworkActivityCount,
    () => 0,
  );
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (pendingCount > 0) {
      const timeout = window.setTimeout(() => {
        setIsVisible(true);
      }, 120);

      return () => {
        window.clearTimeout(timeout);
      };
    }

    setIsVisible(false);
    return undefined;
  }, [pendingCount]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-[100] h-1 w-full overflow-hidden transition-opacity duration-150 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="h-full w-full origin-left animate-pulse bg-[var(--teal)]" />
    </div>
  );
}
