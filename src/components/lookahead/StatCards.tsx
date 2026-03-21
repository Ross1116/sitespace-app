"use client";

import React from "react";
import { TrendingUp, Calendar, CalendarRange, MapPin } from "lucide-react";
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

export const StatCards = React.memo(function StatCards({ stats, visibleWeeksCount, heatmap }: Props) {
  const coveragePct =
    stats.totalDemandHours > 0
      ? Math.round((stats.totalBookedHours / stats.totalDemandHours) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        {
          icon: TrendingUp,
          value: `${stats.totalDemandHours}h`,
          label: "Total Hours Needed",
          sub: `Predicted across ${visibleWeeksCount} week${visibleWeeksCount !== 1 ? "s" : ""}`,
          valueClass: "text-slate-900",
          extra: null as React.ReactNode,
        },
        {
          icon: Calendar,
          value: `${stats.totalBookedHours}h`,
          label: "Hours Booked",
          sub:
            stats.totalDemandHours > 0
              ? `${coveragePct}% of demand covered`
              : "No demand data",
          valueClass: "text-slate-900",
          extra:
            stats.totalDemandHours > 0 ? (
              <div
                className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden"
                title="Booking coverage"
              >
                <div
                  className="h-full bg-teal rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, coveragePct)}%` }}
                />
              </div>
            ) : null,
        },
        {
          icon: CalendarRange,
          value: `${stats.totalGapHours}h`,
          label: "Still Unbooked",
          sub:
            stats.totalGapHours === 0 && heatmap
              ? "All demand is covered ✓"
              : "Hours that still need a booking",
          valueClass: stats.totalGapHours > 0 ? "text-orange-500" : "text-green-600",
          extra: null,
        },
        {
          icon: MapPin,
          value: stats.assetsTracked,
          label: "Asset Types Tracked",
          sub: heatmap && heatmap.assets.length > 0
            ? heatmap.assets.slice(0, 3).map(formatAssetType).join(", ") +
              (heatmap.assets.length > 3 ? "…" : "")
            : "No assets",
          valueClass: "text-slate-900",
          extra: null,
        },
      ].map(({ icon: Icon, value, label, sub, valueClass, extra }) => (
        <div
          key={label}
          className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 hover:border-slate-200 transition-colors"
        >
          <Icon size={18} className="text-teal mb-3" strokeWidth={1.75} />
          <p className={`text-3xl font-extrabold leading-none mb-1 ${valueClass}`}>{value}</p>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide leading-tight">
            {label}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">{sub}</p>
          {extra}
        </div>
      ))}
    </div>
  );
});
