"use client";

import React from "react";
import { BarChart3, ChevronRight, Sparkles } from "lucide-react";
import type { DemandLevel, LookaheadRow } from "@/types";
import {
  formatAssetType,
  formatDate,
  formatWeekRange,
  type PivotResult,
} from "./utils";

type DisplayLevel = "covered" | "no-demand" | DemandLevel;

function getDisplayLevel(row: LookaheadRow): DisplayLevel {
  if (row.demand_hours === 0) return "no-demand";
  if (row.gap_hours <= 0) return "covered";
  return row.demand_level;
}

const BADGE: Record<DisplayLevel, { bg: string; text: string; label: string }> = {
  covered: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Covered" },
  "no-demand": {
    bg: "bg-slate-100",
    text: "text-slate-500",
    label: "No demand",
  },
  low: { bg: "bg-teal-50", text: "text-teal", label: "Low" },
  medium: { bg: "bg-amber-50", text: "text-amber-600", label: "Medium" },
  high: { bg: "bg-orange-50", text: "text-orange-600", label: "High" },
  critical: { bg: "bg-red-50", text: "text-red-600", label: "Critical" },
};

const GAP_BAR_COLOR: Record<DemandLevel, string> = {
  low: "bg-amber-300",
  medium: "bg-amber-400",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

function StatusText({ row }: { row: LookaheadRow }) {
  if (row.demand_hours === 0) {
    return row.booked_hours > 0 ? (
      <span className="text-[10px] text-slate-400">
        {row.booked_hours}h booked - no forecast demand
      </span>
    ) : (
      <span className="text-[10px] text-slate-300">No activity forecast</span>
    );
  }

  return (
    <>
      <span className="text-[10px] text-slate-400">{row.demand_hours}h needed</span>
      {row.booked_hours > 0 && (
        <span className="text-[10px] font-medium text-teal">
          {row.booked_hours}h booked
        </span>
      )}
      {row.gap_hours > 0 ? (
        <span className="text-[10px] font-semibold text-red-500">
          {row.gap_hours}h unbooked
        </span>
      ) : (
        <span className="text-[10px] font-medium text-emerald-600">
          All booked
        </span>
      )}
    </>
  );
}

interface Props {
  heatmap: PivotResult;
  visibleWeeks: string[];
  maxDemand: number;
  snapshotDate?: string | null;
  timezone?: string | null;
  onCellSelect?: (row: LookaheadRow) => void;
}

export const DemandHeatmap = React.memo(function DemandHeatmap({
  heatmap,
  visibleWeeks,
  maxDemand,
  snapshotDate,
  timezone,
  onCellSelect,
}: Props) {
  return (
    <section className="space-y-5 rounded-7 border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-slate-100 p-2">
              <BarChart3 size={18} className="text-teal" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">
                Plan bookings by week
              </h2>
              <p className="text-sm text-slate-500">
                Start with red and orange cells, inspect the activity behind
                the demand, then book directly from context.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {snapshotDate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Snapshot {formatDate(snapshotDate)}
            </span>
          )}
          {timezone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {timezone}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-gradient px-3 py-1 text-xs font-semibold text-navy">
            <Sparkles className="h-3.5 w-3.5" />
            Click any demand cell to drill into activity
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-teal" />
          <span>Booked coverage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            <div className="h-2 w-2 rounded-full bg-amber-300" />
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <div className="h-2 w-2 rounded-full bg-red-500" />
          </div>
          <span>Unbooked gap by urgency</span>
        </div>
        <span className="text-slate-400">
          Each column is a week. Each row shows one asset type.
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <div
          className="grid min-w-180 gap-6 p-5 sm:p-6"
          style={{ gridTemplateColumns: `repeat(${visibleWeeks.length}, 1fr)` }}
        >
          {visibleWeeks.map((week, weekIndex) => (
            <div key={week}>
              <div className="mb-4 border-b border-slate-100 pb-3">
                <p className="text-sm font-bold text-slate-800">
                  Week {weekIndex + 1}
                </p>
                <p className="mt-0.5 text-[10px] font-mono text-slate-400">
                  {formatWeekRange(week)}
                </p>
              </div>

              <div className="space-y-3">
                {heatmap.assets.map((asset) => {
                  const row = heatmap.matrix.get(asset)?.get(week);

                  if (!row || (row.demand_hours === 0 && row.booked_hours === 0)) {
                    return (
                      <div
                        key={`${asset}-${week}`}
                        className="rounded-xl border border-transparent px-3 py-2"
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span
                            className="truncate text-xs font-medium text-slate-600"
                            title={formatAssetType(asset)}
                          >
                            {formatAssetType(asset)}
                          </span>
                          <span className="shrink-0 text-xs text-slate-300">-</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100" />
                      </div>
                    );
                  }

                  const displayLevel = getDisplayLevel(row);
                  const badge = BADGE[displayLevel];
                  const isInteractive = row.demand_hours > 0 && Boolean(onCellSelect);
                  const totalBarPct =
                    row.demand_hours > 0 && maxDemand
                      ? Math.round((row.demand_hours / maxDemand) * 100)
                      : 0;
                  const bookedSharePct =
                    row.demand_hours > 0
                      ? Math.min(
                          100,
                          Math.round((row.booked_hours / row.demand_hours) * 100),
                        )
                      : 0;

                  const content = (
                    <>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span
                          className="truncate text-xs font-semibold text-slate-700"
                          title={formatAssetType(asset)}
                        >
                          {formatAssetType(asset)}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                          {isInteractive && (
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="flex h-full overflow-hidden rounded-full transition-all duration-700"
                          style={{ width: `${totalBarPct}%` }}
                        >
                          {bookedSharePct > 0 && (
                            <div
                              className="h-full bg-teal"
                              style={{ width: `${bookedSharePct}%` }}
                            />
                          )}
                          {bookedSharePct < 100 && row.demand_hours > 0 && (
                            <div
                              className={`h-full ${GAP_BAR_COLOR[row.demand_level]}`}
                              style={{ width: `${100 - bookedSharePct}%` }}
                            />
                          )}
                        </div>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2.5">
                        <StatusText row={row} />
                      </div>
                    </>
                  );

                  if (!isInteractive) {
                    return (
                      <div
                        key={`${asset}-${week}`}
                        className="rounded-xl border border-transparent px-3 py-2"
                      >
                        {content}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={`${asset}-${week}`}
                      type="button"
                      onClick={() => onCellSelect?.(row)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                      aria-label={`Open ${formatAssetType(asset)} activity details for week starting ${week}`}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
