"use client";

import { useEffect, useState } from "react";

import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";

type IdleWindow = Window & {
  cancelIdleCallback?: (handle: number) => void;
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
};

export default function LandingHeroGrid() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const idleWindow = window as IdleWindow;

    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(() => {
        setIsReady(true);
      });

      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(() => {
      setIsReady(true);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-0">
      <BackgroundRippleEffect
        rows={13}
        cols={30}
        cellSize={50}
        fillContainer
        className="opacity-100"
        style={
          {
            "--cell-border-color": "rgba(158, 181, 220, 0.18)",
            "--cell-fill-color": "rgba(232, 243, 255, 0.078)",
            "--cell-ripple-color": "rgba(186, 212, 248, 0.34)",
            "--cell-shadow-color": "rgba(192, 214, 246, 0.26)",
          } as React.CSSProperties
        }
      />
    </div>
  );
}
