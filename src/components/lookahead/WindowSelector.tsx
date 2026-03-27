"use client";

import React from "react";
import { CalendarRange, Clock3 } from "lucide-react";
import type { LookaheadWindowSize } from "@/stores/uiIntentStore";

interface Props {
  windowSize: LookaheadWindowSize;
  onSetWindowSize: (size: LookaheadWindowSize) => void;
  lastUpdated: string | null;
}

export const WindowSelector = React.memo(function WindowSelector({
  windowSize,
  onSetWindowSize,
  lastUpdated,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-[var(--teal)]" />
              <p className="text-sm font-bold text-slate-900">
                Planning window
              </p>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Choose how far ahead the heatmap should plan.
            </p>
          </div>
          {lastUpdated && (
            <div className="hidden items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 sm:inline-flex">
              <Clock3 className="h-3.5 w-3.5" />
              {lastUpdated}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
          {(["2W", "4W", "6W"] as LookaheadWindowSize[]).map((window) => (
            <button
              key={window}
              type="button"
              aria-pressed={windowSize === window}
              onClick={() => onSetWindowSize(window)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                windowSize === window
                  ? "bg-[var(--navy)] text-white shadow-md shadow-slate-900/10"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {window === "2W"
                ? "2 Weeks"
                : window === "4W"
                  ? "4 Weeks"
                  : "6 Weeks"}
            </button>
          ))}
        </div>

        {lastUpdated && (
          <p className="inline-flex items-center gap-1 text-[11px] text-slate-500 sm:hidden">
            <Clock3 className="h-3.5 w-3.5" />
            Updated {lastUpdated}
          </p>
        )}
      </div>
    </div>
  );
});
