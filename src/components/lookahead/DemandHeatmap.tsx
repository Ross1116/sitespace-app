"use client";

import React from "react";
import { BarChart3, ChevronRight } from "lucide-react";
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
  const gridTemplateColumns = `minmax(180px, 220px) repeat(${visibleWeeks.length}, minmax(170px, 1fr))`;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-100 p-2">
            <BarChart3 size={18} className="text-teal" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Demand coverage matrix
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Scan each asset type across the planning window. Open any demand
              cell to inspect the programme activity behind the hours.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {snapshotDate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Updated {formatDate(snapshotDate)}
            </span>
          )}
          {timezone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {timezone}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-700">Legend</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-teal" />
          Booked
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="flex gap-0.5">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="h-2 w-2 rounded-full bg-red-500" />
          </span>
          Unbooked gap
        </span>
        {onCellSelect && (
          <span className="text-slate-400">
            Click a cell to drill into activity and book from context.
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <div className="min-w-[760px]">
          <div
            className="grid border-b border-slate-200 bg-slate-50"
            style={{ gridTemplateColumns }}
          >
            <div className="border-r border-slate-200 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Asset type
              </p>
            </div>
            {visibleWeeks.map((week, weekIndex) => (
              <div
                key={week}
                className="border-r border-slate-200 px-4 py-3 last:border-r-0"
              >
                <p className="text-sm font-bold text-slate-900">
                  Week {weekIndex + 1}
                </p>
                <p className="mt-0.5 text-[10px] font-mono text-slate-400">
                  {formatWeekRange(week)}
                </p>
              </div>
            ))}
          </div>

          {heatmap.assets.map((asset) => (
            <div
              key={asset}
              className="grid border-b border-slate-100 last:border-b-0"
              style={{ gridTemplateColumns }}
            >
              <div className="border-r border-slate-200 bg-white px-4 py-3">
                <p
                  className="text-sm font-bold text-slate-900"
                  title={formatAssetType(asset)}
                >
                  {formatAssetType(asset)}
                </p>
              </div>

              {visibleWeeks.map((week) => {
                const row = heatmap.matrix.get(asset)?.get(week);

                if (!row || (row.demand_hours === 0 && row.booked_hours === 0)) {
                  return (
                    <div
                      key={`${asset}-${week}`}
                      className="border-r border-slate-100 bg-slate-50/50 px-3 py-3 last:border-r-0"
                    >
                      <div className="flex h-full min-h-23 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-300">
                        No demand
                      </div>
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
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                      {isInteractive && (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Need
                        </p>
                        <p className="mt-0.5 text-sm font-black text-slate-900">
                          {row.demand_hours}h
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Booked
                        </p>
                        <p className="mt-0.5 text-sm font-black text-teal">
                          {row.booked_hours}h
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Gap
                        </p>
                        <p
                          className={`mt-0.5 text-sm font-black ${
                            row.gap_hours > 0
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {row.gap_hours}h
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
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

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusText row={row} />
                    </div>
                  </>
                );

                return (
                  <div
                    key={`${asset}-${week}`}
                    className="border-r border-slate-100 bg-white px-3 py-3 last:border-r-0"
                  >
                    {isInteractive ? (
                      <button
                        type="button"
                        onClick={() => onCellSelect?.(row)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                        aria-label={`Open ${formatAssetType(asset)} activity details for week starting ${week}`}
                      >
                        {content}
                      </button>
                    ) : (
                      <div className="rounded-xl border border-transparent px-3 py-3">
                        {content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
