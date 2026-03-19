"use client";

import React from "react";
import type { LookaheadWindowSize } from "@/stores/uiIntentStore";

type WindowSize = LookaheadWindowSize;

interface Props {
  windowSize: WindowSize;
  onSetWindowSize: (size: WindowSize) => void;
  lastUpdated: string | null;
}

export const WindowSelector = React.memo(function WindowSelector({
  windowSize,
  onSetWindowSize,
  lastUpdated,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-slate-500">Show next:</span>
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
          {(["2W", "4W", "6W"] as WindowSize[]).map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={windowSize === w}
              onClick={() => onSetWindowSize(w)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                windowSize === w
                  ? "bg-[var(--navy)] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {w === "2W" ? "2 Weeks" : w === "4W" ? "4 Weeks" : "6 Weeks"}
            </button>
          ))}
        </div>
      </div>
      {lastUpdated && (
        <p className="text-xs text-slate-400">
          Last updated:{" "}
          <span className="font-semibold text-slate-600">{lastUpdated}</span>
        </p>
      )}
    </div>
  );
});
