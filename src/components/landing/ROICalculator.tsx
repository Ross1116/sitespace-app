"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { AlertTriangle, CalendarDays, Clock3, Layers3 } from "lucide-react";

import { DemoRequestCTA } from "@/components/landing/ContactModal";
import { cn } from "@/lib/utils";

type WindowSize = "2W" | "4W" | "6W";

const windowOptions: { label: WindowSize; weeks: number; factor: number }[] = [
  { label: "2W", weeks: 2, factor: 0.42 },
  { label: "4W", weeks: 4, factor: 0.58 },
  { label: "6W", weeks: 6, factor: 0.7 },
];

function formatMoney(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "")}B`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }

  return Math.round(value).toString();
}

function formatInt(value: number) {
  return Math.round(value).toLocaleString("en-AU");
}

export function ROICalculator() {
  const [projectValue, setProjectValue] = useState(80);
  const [programmeMonths, setProgrammeMonths] = useState(24);
  const [subcontractors, setSubcontractors] = useState(40);
  const [sharedAssets, setSharedAssets] = useState(8);
  const [gapHoursPerWeek, setGapHoursPerWeek] = useState(18);
  const [windowSize, setWindowSize] = useState<WindowSize>("4W");

  const estimate = useMemo(() => {
    const selectedWindow =
      windowOptions.find((option) => option.label === windowSize) ??
      windowOptions[1];
    const projectValueDollars = projectValue * 1_000_000;
    const weeks = programmeMonths * 4.33;
    const dailyOverhead = Math.max(
      4_000,
      Math.min(45_000, projectValueDollars * 0.00008),
    );
    const totalGapHours = gapHoursPerWeek * weeks;
    const visibleGapHours = gapHoursPerWeek * selectedWindow.weeks;
    const assetPressure = Math.min(1.45, 0.8 + sharedAssets / 22);
    const recoveredGapHours = totalGapHours * selectedWindow.factor;
    const delayDaysAvoided = (recoveredGapHours / 8) * 0.22 * assetPressure;
    const delaySavings = delayDaysAvoided * dailyOverhead;
    const idleHoursRecovered =
      recoveredGapHours * Math.min(subcontractors, 60) * 0.06;
    const idleSavings = idleHoursRecovered * 85;
    const coordinationHours =
      weeks * (subcontractors * 0.28 + sharedAssets * 1.1) * selectedWindow.factor;
    const coordinationSavings = coordinationHours * 140;
    const totalSavings = delaySavings + idleSavings + coordinationSavings;
    const monthlyFee = 8_000 + projectValue * 80 + sharedAssets * 250;
    const paybackMonths =
      totalSavings > 0 ? monthlyFee / (totalSavings / programmeMonths) : 0;

    return {
      coordinationHours,
      coordinationSavings,
      delayDaysAvoided,
      delaySavings,
      idleHoursRecovered,
      idleSavings,
      paybackMonths,
      percentOfValue: (totalSavings / projectValueDollars) * 100,
      selectedWindow,
      totalSavings,
      visibleGapHours,
    };
  }, [
    gapHoursPerWeek,
    programmeMonths,
    projectValue,
    sharedAssets,
    subcontractors,
    windowSize,
  ]);

  return (
    <section
      id="calculator"
      className="relative overflow-hidden bg-[#eef5f7] px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="sitespace-hero-dots absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="ROI calculator"
          title="Model the cost of uncovered demand."
          description="The calculator now follows the same app language as Lookahead and Capacity Planning: gap hours, visible window, shared assets and active subcontractors."
        />

        <div className="mt-10 grid overflow-hidden rounded-[24px] border border-slate-200/85 bg-white/92 shadow-[0_30px_90px_rgba(11,17,32,0.10)] backdrop-blur md:grid-cols-[1.04fr_0.96fr]">
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Inputs from the workspace
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-normal text-slate-950">
                Tune the same levers the app exposes
              </h3>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <InputSnapshot
                icon={<AlertTriangle size={16} />}
                label="Main action"
                value={`${gapHoursPerWeek}h`}
                detail="Still needs bookings"
                tone="amber"
              />
              <InputSnapshot
                icon={<CalendarDays size={16} />}
                label="Lookahead window"
                value={windowSize}
                detail={`${estimate.selectedWindow.weeks} weeks visible`}
                tone="teal"
              />
              <InputSnapshot
                icon={<Clock3 size={16} />}
                label="Booked coverage"
                value="78%"
                detail="64h booked of 82h demand"
                tone="slate"
              />
              <InputSnapshot
                icon={<Layers3 size={16} />}
                label="Asset types"
                value="3"
                detail="Tower Crane, Bay, Hoist"
                tone="slate"
              />
            </div>

            <div className="mt-8 space-y-7">
              <RangeField
                label="Project value"
                valueLabel={`$${projectValue}M`}
                minLabel="$5M"
                midLabel="$250M"
                maxLabel="$500M"
                min={5}
                max={500}
                step={5}
                value={projectValue}
                onChange={setProjectValue}
              />
              <RangeField
                label="Programme duration"
                valueLabel={`${programmeMonths} months`}
                minLabel="6 mo"
                midLabel="33 mo"
                maxLabel="60 mo"
                min={6}
                max={60}
                step={1}
                value={programmeMonths}
                onChange={setProgrammeMonths}
              />
              <RangeField
                label="Active subcontractors"
                valueLabel={formatInt(subcontractors)}
                minLabel="5"
                midLabel="100"
                maxLabel="200"
                min={5}
                max={200}
                step={1}
                value={subcontractors}
                onChange={setSubcontractors}
              />
              <RangeField
                label="Shared assets on site"
                valueLabel={formatInt(sharedAssets)}
                minLabel="1"
                midLabel="20"
                maxLabel="40"
                min={1}
                max={40}
                step={1}
                value={sharedAssets}
                onChange={setSharedAssets}
              />
              <RangeField
                label="Unbooked gap hours per week"
                valueLabel={`${gapHoursPerWeek}h`}
                minLabel="0h"
                midLabel="40h"
                maxLabel="80h"
                min={0}
                max={80}
                step={2}
                value={gapHoursPerWeek}
                onChange={setGapHoursPerWeek}
              />

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-700">
                    Lookahead window
                  </span>
                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
                    {windowSize}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
                  {windowOptions.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setWindowSize(option.label)}
                      className={cn(
                        "cursor-pointer rounded-lg px-3 py-2 text-sm font-bold transition",
                        windowSize === option.label
                          ? "bg-white text-slate-950 shadow-sm"
                          : "text-slate-500 hover:text-slate-900",
                      )}
                    >
                      {option.label === "2W"
                        ? "2 wk"
                        : option.label === "4W"
                          ? "4 wk"
                          : "6 wk"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-navy p-5 text-white sm:p-8 lg:p-10">
            <div
              className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-teal/20 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-28 left-10 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                Estimated opportunity
              </p>
              <h3 className="mt-2 text-xl font-extrabold text-white">
                If gap hours are surfaced early
              </h3>

              <div className="my-7 border-y border-white/10 py-7">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                  Protected value
                </p>
                <div className="mt-3 flex items-baseline gap-1 text-[clamp(3rem,7vw,5.25rem)] font-black leading-none tracking-normal text-white">
                  <span className="text-[0.42em] text-white/70">$</span>
                  {formatMoney(estimate.totalSavings)}
                </div>
                <p className="mt-3 text-sm font-semibold text-emerald-300">
                  {estimate.percentOfValue.toFixed(2).replace(/\.?0+$/, "")}% of
                  project value
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <OutputTile
                  label="Gap surfaced"
                  value={formatInt(estimate.visibleGapHours)}
                  suffix="hrs"
                />
                <OutputTile
                  label="Delay avoided"
                  value={estimate.delayDaysAvoided.toFixed(1)}
                  suffix="days"
                />
                <OutputTile
                  label="Coord. hours saved"
                  value={formatInt(estimate.coordinationHours)}
                  suffix="hrs"
                />
                <OutputTile
                  label="Payback period"
                  value={estimate.paybackMonths.toFixed(1)}
                  suffix="months"
                />
              </div>

              <div className="mt-7 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white/70">
                <BreakdownLine
                  label="Delay exposure reduced"
                  value={`$${formatMoney(estimate.delaySavings)}`}
                />
                <BreakdownLine
                  label="Idle-time recovered"
                  value={`$${formatMoney(estimate.idleSavings)}`}
                />
                <BreakdownLine
                  label="Coordination reduced"
                  value={`$${formatMoney(estimate.coordinationSavings)}`}
                />
                <BreakdownLine
                  label="Lookahead window"
                  value={`${estimate.selectedWindow.weeks} weeks`}
                />
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <DemoRequestCTA
                  label="Book a tailored ROI session"
                  className="inline-flex cursor-pointer items-center justify-center rounded-full bg-amber-500 px-5 py-3 text-sm font-bold text-black shadow-[0_14px_30px_rgba(245,158,11,0.22)] transition-transform hover:scale-[1.01]"
                />
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white/85 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Talk through assumptions
                </a>
              </div>

              <p className="mt-6 font-mono text-[10px] uppercase leading-5 tracking-[0.08em] text-white/38">
                Indicative estimate only. Uses app-facing planning inputs:
                gap hours, lookahead window, active subcontractors and shared
                asset count.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InputSnapshot({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "amber" | "teal" | "slate";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-100 bg-amber-50/70 text-amber-700"
      : tone === "teal"
        ? "border-cyan-100 bg-cyan-50/70 text-[#0e7c9b]"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={cn("rounded-2xl border p-4", toneClass)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-current">{icon}</span>
        <span className="font-mono text-2xl font-black leading-none">
          {value}
        </span>
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{detail}</p>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.86fr_0.74fr] lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f2a4a]/70">
          {eyebrow}
        </p>
        <h2 className="mt-3 max-w-3xl text-[clamp(2rem,4.8vw,4.5rem)] font-black leading-[1.02] tracking-normal text-slate-950">
          {title}
        </h2>
      </div>
      <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
        {description}
      </p>
    </div>
  );
}

function RangeField({
  label,
  valueLabel,
  minLabel,
  midLabel,
  maxLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  valueLabel: string;
  minLabel: string;
  midLabel: string;
  maxLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
          {valueLabel}
        </span>
      </div>
      <input
        type="range"
        className="roi-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-400">
        <span>{minLabel}</span>
        <span>{midLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function OutputTile({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/48">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black leading-none tracking-normal text-white">
        {value}
        <span className="ml-1 font-mono text-xs font-semibold text-white/50">
          {suffix}
        </span>
      </p>
    </div>
  );
}

function BreakdownLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span>{label}</span>
      <span className="font-mono font-bold text-white">{value}</span>
    </div>
  );
}
