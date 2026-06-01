"use client";

import { useEffect, useState } from "react";

import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";

const GRID_CELL_SIZE = 48;

type IdleWindow = Window & {
  cancelIdleCallback?: (handle: number) => void;
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
};

type NetworkInformation = {
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation;
};

const canUseEnhancedGrid = () => {
  const mediaQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce), (update: slow), (pointer: coarse)",
  );
  const navigatorWithConnection = navigator as NavigatorWithConnection;
  const hasConstrainedCpu =
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4;

  return (
    !mediaQuery.matches &&
    !navigatorWithConnection.connection?.saveData &&
    !hasConstrainedCpu
  );
};

export default function LandingHeroGrid() {
  const [showEnhancedGrid, setShowEnhancedGrid] = useState(false);
  const [gridSize, setGridSize] = useState({ rows: 18, cols: 32 });

  useEffect(() => {
    if (!canUseEnhancedGrid()) return;

    const idleWindow = window as IdleWindow;

    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(
        () => {
          setShowEnhancedGrid(true);
        },
        { timeout: 1600 },
      );

      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(() => {
      setShowEnhancedGrid(true);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let frameId = 0;

    const updateGridSize = () => {
      setGridSize({
        rows: Math.ceil(window.innerHeight / GRID_CELL_SIZE) + 2,
        cols: Math.ceil(window.innerWidth / GRID_CELL_SIZE) + 2,
      });
    };

    const onResize = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateGridSize();
      });
    };

    updateGridSize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 opacity-100"
    >
      {showEnhancedGrid ? (
        <BackgroundRippleEffect
          rows={gridSize.rows}
          cols={gridSize.cols}
          cellSize={GRID_CELL_SIZE}
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
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.42),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05)_0%,transparent_34%,rgba(255,255,255,0.14)_100%)]" />
          <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(158,181,220,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(158,181,220,0.18)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(circle_at_center,rgba(0,0,0,1),rgba(0,0,0,0.92)_56%,rgba(0,0,0,0.46)_78%,transparent)]" />
        </>
      )}
    </div>
  );
}
