"use client";

import type React from "react";
import { Calendar, Layers3, TrendingUp, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

const FADE =
  "opacity-0 translate-y-10 transition-all duration-700 ease-in-out data-[visible]:opacity-100 data-[visible]:translate-y-0";

export function LookaheadDashboard() {
  return (
    <div
      className={cn(
        FADE,
        "rounded-3xl border border-slate-100 bg-(--page-bg) p-3 text-slate-800 shadow-[0_40px_100px_rgba(0,0,0,0.45)] sm:p-4",
      )}
      data-fade-in
      data-progress
    >
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Lookahead
            </p>
            <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Lookahead Planning
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Forecast demand, inspect activity, and book directly from one
              workspace.
            </p>
          </div>
          <div className="flex gap-2">
            {["2W", "4W", "6W"].map((window, index) => (
              <span
                key={window}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold",
                  index === 1
                    ? "bg-navy text-white shadow-md shadow-slate-900/10"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {window}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<TriangleAlert size={18} className="text-amber-600" />}
            label="Main action"
            value="18h"
            sub="Still needs bookings"
            detail="Start with the hottest cells in the heatmap below."
            tone="border-amber-200 bg-amber-50 text-amber-950"
          />
          <StatCard
            icon={<Calendar size={18} className="text-navy" />}
            label="Booked coverage"
            value="78%"
            sub="64h booked of 82h demand"
            detail="Coverage across the visible planning window."
            tone="border-slate-200 bg-white text-slate-950"
            progress="78%"
          />
          <StatCard
            icon={<TrendingUp size={18} className="text-brand-blue" />}
            label="Demand in view"
            value="82h"
            sub="Across 4 weeks"
            detail="Total forecast demand currently shown."
            tone="border-slate-200 bg-white text-slate-950"
          />
          <StatCard
            icon={<Layers3 size={18} className="text-teal" />}
            label="Asset types tracked"
            value="3"
            sub="Tower crane, hoist, loading bay"
            detail="Coverage is grouped before drill-down."
            tone="border-slate-200 bg-white text-slate-950"
          />
        </div>

        <DemandMatrixPreview />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  detail,
  tone,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  detail: string;
  tone: string;
  progress?: string;
}) {
  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm", tone)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black leading-none">{value}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-2">{icon}</div>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700">{sub}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
      {progress && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal transition-all duration-500"
            data-progress-fill
            data-width={progress}
            style={{ width: 0 }}
          />
        </div>
      )}
    </div>
  );
}

function DemandMatrixPreview() {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-950">
            Demand coverage matrix
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Scan each asset type across the planning window.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Updated Jun 12
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[190px_repeat(3,minmax(170px,1fr))] border-b border-slate-200 bg-slate-50">
            <div className="border-r border-slate-200 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Asset type
              </p>
            </div>
            {["Week 1", "Week 2", "Week 3"].map((week) => (
              <div
                key={week}
                className="border-r border-slate-200 px-4 py-3 last:border-r-0"
              >
                <p className="text-sm font-bold text-slate-900">{week}</p>
                <p className="mt-0.5 text-[10px] font-mono text-slate-400">
                  Jun 17-23
                </p>
              </div>
            ))}
          </div>
          <DemandRow
            asset="Tower Crane"
            cells={[
              { label: "Covered", need: "16h", booked: "16h", gap: "0h" },
              { label: "High", need: "20h", booked: "12h", gap: "8h" },
              { label: "Medium", need: "14h", booked: "8h", gap: "6h" },
            ]}
          />
          <DemandRow
            asset="Loading Bay"
            cells={[
              { label: "Low", need: "10h", booked: "7h", gap: "3h" },
              { label: "Covered", need: "12h", booked: "12h", gap: "0h" },
              { label: "No demand", need: "-", booked: "-", gap: "-" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function DemandRow({
  asset,
  cells,
}: {
  asset: string;
  cells: { label: string; need: string; booked: string; gap: string }[];
}) {
  return (
    <div className="grid grid-cols-[190px_repeat(3,minmax(170px,1fr))] border-b border-slate-100 last:border-b-0">
      <div className="border-r border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-bold text-slate-900">{asset}</p>
      </div>
      {cells.map((cell, index) => (
        <div
          key={`${asset}-${index}`}
          className="border-r border-slate-100 bg-white px-3 py-3 last:border-r-0"
        >
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                cell.label === "Covered"
                  ? "bg-emerald-100 text-emerald-700"
                  : cell.label === "No demand"
                    ? "bg-slate-100 text-slate-500"
                    : cell.label === "High"
                      ? "bg-orange-50 text-orange-600"
                      : "bg-amber-50 text-amber-600",
              )}
            >
              {cell.label}
            </span>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <DemandNumber label="Need" value={cell.need} />
              <DemandNumber label="Booked" value={cell.booked} tone="teal" />
              <DemandNumber
                label="Gap"
                value={cell.gap}
                tone={cell.gap === "0h" || cell.gap === "-" ? "green" : "red"}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DemandNumber({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "teal" | "green" | "red";
}) {
  const toneClass =
    tone === "teal"
      ? "text-teal"
      : tone === "green"
        ? "text-emerald-600"
        : tone === "red"
          ? "text-red-600"
          : "text-slate-900";

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={cn("mt-0.5 text-sm font-black", toneClass)}>{value}</p>
    </div>
  );
}
