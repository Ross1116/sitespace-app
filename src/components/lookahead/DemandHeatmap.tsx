"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import type { DemandLevel } from "@/types";
import { formatAssetType, formatWeekRange, formatDate, type PivotResult } from "./utils";

const LEVEL_BAR: Record<DemandLevel, string> = {
  low:      "bg-[var(--teal)]",
  medium:   "bg-amber-400",
  high:     "bg-orange-500",
  critical: "bg-red-500",
};

const LEVEL_TEXT: Record<DemandLevel, string> = {
  low:      "text-[var(--teal)]",
  medium:   "text-amber-600",
  high:     "text-orange-600",
  critical: "text-red-600",
};

const LEVEL_BG: Record<DemandLevel, string> = {
  low:      "bg-teal-50",
  medium:   "bg-amber-50",
  high:     "bg-orange-50",
  critical: "bg-red-50",
};

const LEVEL_LABEL: Record<DemandLevel, string> = {
  low:      "Low",
  medium:   "Medium",
  high:     "High",
  critical: "Critical",
};

interface Props {
  heatmap: PivotResult;
  visibleWeeks: string[];
  maxDemand: number;
  snapshotDate?: string | null;
  timezone?: string | null;
}

export const DemandHeatmap = React.memo(function DemandHeatmap({
  heatmap,
  visibleWeeks,
  maxDemand,
  snapshotDate,
  timezone,
}: Props) {
  return (
    <div className="space-y-4 flex-1">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-[var(--teal)]" />
          <h2 className="text-base font-bold text-slate-900">Weekly Resource Demand</h2>
          {snapshotDate && (
            <span className="text-xs text-slate-400 ml-1">
              Snapshot {formatDate(snapshotDate)}
              {timezone && ` · ${timezone}`}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 ml-6">
          Hours needed per resource type each week, how much is booked, and what&apos;s still unconfirmed
        </p>
      </div>

      <div className="rounded-xl border border-slate-100 overflow-x-auto">
        <div
          className="p-5 sm:p-6 min-w-[480px] grid gap-6"
          style={{ gridTemplateColumns: `repeat(${visibleWeeks.length}, 1fr)` }}
        >
          {visibleWeeks.map((week, wIdx) => (
            <div key={week}>
              <div className="mb-4 pb-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-800">Week {wIdx + 1}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {formatWeekRange(week)}
                </p>
              </div>

              <div className="space-y-4">
                {heatmap.assets.map((asset) => {
                  const row = heatmap.matrix.get(asset)?.get(week);
                  const level: DemandLevel = row?.demand_level ?? "low";
                  const barWidth = row
                    ? Math.round((row.demand_hours / maxDemand) * 100)
                    : 0;

                  return (
                    <div key={asset}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className="text-xs font-medium text-slate-600 truncate"
                          title={formatAssetType(asset)}
                        >
                          {formatAssetType(asset)}
                        </span>
                        {row ? (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${LEVEL_BG[level]} ${LEVEL_TEXT[level]}`}
                          >
                            {LEVEL_LABEL[level]}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 flex-shrink-0">—</span>
                        )}
                      </div>

                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        {row && (
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${LEVEL_BAR[level]}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        )}
                      </div>

                      {row && (
                        <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                          <span className="text-[10px] text-slate-400">
                            {row.demand_hours}h needed
                          </span>
                          {row.booked_hours > 0 && (
                            <span className="text-[10px] text-[var(--teal)] font-medium">
                              {row.booked_hours}h booked
                            </span>
                          )}
                          {row.gap_hours > 0 && (
                            <span className="text-[10px] text-red-500 font-semibold">
                              {row.gap_hours}h unbooked
                            </span>
                          )}
                          {row.gap_hours === 0 && row.booked_hours > 0 && (
                            <span className="text-[10px] text-green-600 font-medium">
                              Fully covered ✓
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-5 flex-wrap">
          {(["low", "medium", "high", "critical"] as DemandLevel[]).map((lvl) => (
            <div key={lvl} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm ${LEVEL_BAR[lvl]}`} />
              <span className="text-xs text-slate-500">{LEVEL_LABEL[lvl]}</span>
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-auto">
            Bar length = relative workload · badge = urgency level · red = still needs booking
          </span>
        </div>
      </div>
    </div>
  );
});
