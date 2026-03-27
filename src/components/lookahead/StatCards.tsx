"use client";

import React from "react";
import { Calendar, Layers3, TrendingUp, TriangleAlert } from "lucide-react";
import { formatAssetType, type PivotResult } from "./utils";

interface Stats {
  totalDemandHours: number;
  totalBookedHours: number;
  totalGapHours: number;
  assetsTracked: number;
}

interface Props {
  stats: Stats;
  visibleWeeksCount: number;
  heatmap: PivotResult | null;
}

export const StatCards = React.memo(function StatCards({
  stats,
  visibleWeeksCount,
  heatmap,
}: Props) {
  const coveragePct =
    stats.totalDemandHours > 0
      ? Math.round((stats.totalBookedHours / stats.totalDemandHours) * 100)
      : 0;

  const cards = [
    {
      icon: TriangleAlert,
      label: "Main action",
      value: `${stats.totalGapHours}h`,
      sub:
        stats.totalGapHours > 0
          ? "Still needs bookings"
          : "Everything currently covered",
      detail:
        stats.totalGapHours > 0
          ? "Start with the hottest cells in the heatmap below."
          : "Use the heatmap below to confirm activity coverage.",
      tone:
        stats.totalGapHours > 0
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-emerald-200 bg-emerald-50 text-emerald-950",
      accent:
        stats.totalGapHours > 0 ? "text-amber-600" : "text-emerald-600",
      extra: null as React.ReactNode,
    },
    {
      icon: Calendar,
      label: "Booked coverage",
      value: `${coveragePct}%`,
      sub:
        stats.totalDemandHours > 0
          ? `${stats.totalBookedHours}h booked of ${stats.totalDemandHours}h demand`
          : "No forecast demand in the selected window",
      detail:
        stats.totalDemandHours > 0
          ? "Coverage across the currently visible planning window."
          : "Upload a programme to start building demand coverage.",
      tone: "border-slate-200 bg-white text-slate-950",
      accent: "text-[var(--navy)]",
      extra:
        stats.totalDemandHours > 0 ? (
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
            title="Demand coverage"
          >
            <div
              className="h-full rounded-full bg-[var(--teal)] transition-all duration-500"
              style={{ width: `${Math.min(100, coveragePct)}%` }}
            />
          </div>
        ) : null,
    },
    {
      icon: TrendingUp,
      label: "Demand in view",
      value: `${stats.totalDemandHours}h`,
      sub: `Across ${visibleWeeksCount} week${visibleWeeksCount !== 1 ? "s" : ""}`,
      detail: "Total forecast demand currently shown in the workspace.",
      tone: "border-slate-200 bg-white text-slate-950",
      accent: "text-[var(--brand-blue)]",
      extra: null,
    },
    {
      icon: Layers3,
      label: "Asset types tracked",
      value: `${stats.assetsTracked}`,
      sub:
        heatmap && heatmap.assets.length > 0
          ? heatmap.assets.slice(0, 3).map(formatAssetType).join(", ") +
            (heatmap.assets.length > 3 ? "..." : "")
          : "No assets",
      detail: "Coverage is grouped by asset type before you drill into activity.",
      tone: "border-slate-200 bg-white text-slate-950",
      accent: "text-[var(--teal)]",
      extra: null,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ icon: Icon, label, value, sub, detail, tone, accent, extra }) => (
        <div
          key={label}
          className={`rounded-2xl border p-4 shadow-sm ${tone}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-3xl font-black leading-none">{value}</p>
            </div>
            <div className="rounded-xl bg-white/70 p-2">
              <Icon size={18} className={accent} strokeWidth={1.9} />
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-700">{sub}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
          {extra}
        </div>
      ))}
    </div>
  );
});
