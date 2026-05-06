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
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 sm:min-w-[20rem]">
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          <CalendarRange className="h-4 w-4 text-teal" />
          Window
        </div>
        {lastUpdated && (
          <div className="inline-flex min-w-0 items-center gap-1 text-[11px] font-medium text-slate-500">
            <Clock3 className="h-3.5 w-3.5" />
            <span className="truncate">Updated {lastUpdated}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-white p-1 shadow-sm">
        {(["2W", "4W", "6W"] as LookaheadWindowSize[]).map((size) => (
          <button
            key={size}
            type="button"
            aria-pressed={windowSize === size}
            onClick={() => onSetWindowSize(size)}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition-all ${
              windowSize === size
                ? "bg-navy text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {size === "2W" ? "2 wk" : size === "4W" ? "4 wk" : "6 wk"}
          </button>
        ))}
      </div>
    </div>
  );
});
