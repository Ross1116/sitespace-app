"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import type { DemandLevel, LookaheadRow } from "@/types";
import { formatAssetType, formatWeekRange, formatDate, type PivotResult } from "./utils";

// ── Display level: what the user needs to ACT on, not raw demand intensity ───
type DisplayLevel = "covered" | "no-demand" | DemandLevel;

function getDisplayLevel(row: LookaheadRow): DisplayLevel {
  if (row.demand_hours === 0) return "no-demand";
  if (row.gap_hours <= 0) return "covered";
  return row.demand_level;
}

const BADGE: Record<DisplayLevel, { bg: string; text: string; label: string }> = {
  covered:     { bg: "bg-green-100",  text: "text-green-700",     label: "Covered" },
  "no-demand": { bg: "bg-slate-100",  text: "text-slate-500",     label: "No demand" },
  low:         { bg: "bg-teal-50",    text: "text-teal", label: "Low" },
  medium:      { bg: "bg-amber-50",   text: "text-amber-600",     label: "Medium" },
  high:        { bg: "bg-orange-50",  text: "text-orange-600",    label: "High" },
  critical:    { bg: "bg-red-50",     text: "text-red-600",       label: "Critical" },
};

const GAP_BAR_COLOR: Record<DemandLevel, string> = {
  low:      "bg-amber-300",
  medium:   "bg-amber-400",
  high:     "bg-orange-500",
  critical: "bg-red-500",
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
          <BarChart3 size={18} className="text-teal" />
          <h2 className="text-base font-bold text-slate-900">Weekly Resource Demand</h2>
          {snapshotDate && (
            <span className="text-xs text-slate-400 ml-1">
              Snapshot {formatDate(snapshotDate)}
              {timezone && ` · ${timezone}`}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 ml-6">
          How many hours each resource type needs per week and whether bookings are in place
        </p>
      </div>

      <div className="rounded-xl border border-slate-100 overflow-x-auto">
        <div
          className="p-5 sm:p-6 min-w-120 grid gap-6"
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

                  // No row at all, or row with zero demand AND zero bookings → show "—"
                  if (!row || (row.demand_hours === 0 && row.booked_hours === 0)) {
                    return (
                      <div key={asset}>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span
                            className="text-xs font-medium text-slate-600 truncate"
                            title={formatAssetType(asset)}
                          >
                            {formatAssetType(asset)}
                          </span>
                          <span className="text-xs text-slate-300 shrink-0">—</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full" />
                      </div>
                    );
                  }

                  const displayLevel = getDisplayLevel(row);
                  const badge = BADGE[displayLevel];

                  // Bar: total width is demand proportion, split teal (booked) / coloured (gap).
                  // No-demand rows get no bar — the text already says "Xh booked · No forecast demand".
                  const hasDemand = row.demand_hours > 0;
                  const totalBarPct = hasDemand && maxDemand
                    ? Math.round((row.demand_hours / maxDemand) * 100)
                    : 0;
                  const bookedSharePct = hasDemand
                    ? Math.min(100, Math.round((row.booked_hours / row.demand_hours) * 100))
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
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Split bar: teal = booked, coloured = unbooked gap */}
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full flex overflow-hidden transition-all duration-700"
                          style={{ width: `${totalBarPct}%` }}
                        >
                          {bookedSharePct > 0 && (
                            <div
                              className="h-full bg-teal"
                              style={{ width: `${bookedSharePct}%` }}
                            />
                          )}
                          {bookedSharePct < 100 && (
                            <div
                              className={`h-full ${GAP_BAR_COLOR[row.demand_level]}`}
                              style={{ width: `${100 - bookedSharePct}%` }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Status text */}
                      <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                        {row.demand_hours === 0 ? (
                          row.booked_hours > 0 ? (
                            <span className="text-[10px] text-slate-400">
                              {row.booked_hours}h booked · No forecast demand
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300">
                              No activity forecast
                            </span>
                          )
                        ) : (
                          <>
                            <span className="text-[10px] text-slate-400">
                              {row.demand_hours}h needed
                            </span>
                            {row.booked_hours > 0 && (
                              <span className="text-[10px] text-teal font-medium">
                                {row.booked_hours}h booked
                              </span>
                            )}
                            {row.gap_hours > 0 ? (
                              <span className="text-[10px] text-red-500 font-semibold">
                                {row.gap_hours}h unbooked
                              </span>
                            ) : row.booked_hours > 0 ? (
                              <span className="text-[10px] text-green-600 font-medium">
                                All booked ✓
                              </span>
                            ) : (
                              <span className="text-[10px] text-red-400">
                                Nothing booked yet
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-teal" />
            <span className="text-[11px] text-slate-500">Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-red-500" />
            <span className="text-[11px] text-slate-500">Unbooked</span>
          </div>
          <span className="text-slate-200">|</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${BADGE.covered.bg} ${BADGE.covered.text}`}>
            Covered
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${BADGE.low.bg} ${BADGE.low.text}`}>
            Low
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${BADGE.medium.bg} ${BADGE.medium.text}`}>
            Medium
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${BADGE.high.bg} ${BADGE.high.text}`}>
            High
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${BADGE.critical.bg} ${BADGE.critical.text}`}>
            Critical
          </span>
          <span className="text-[11px] text-slate-400 ml-auto">
            Badge = action needed · Bar = booked vs unbooked
          </span>
        </div>
      </div>
    </div>
  );
});
