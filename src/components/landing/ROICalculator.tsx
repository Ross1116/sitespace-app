"use client";

import { useId, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Construction,
  Gauge,
} from "lucide-react";

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
      weeks *
      (subcontractors * 0.28 + sharedAssets * 1.1) *
      selectedWindow.factor;
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
      idleSavings,
      paybackMonths,
      percentOfValue: (totalSavings / projectValueDollars) * 100,
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

  const ringRadius = 50;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringPercent = Math.max(0, Math.min(100, estimate.percentOfValue));
  const ringOffset = ringCircumference * (1 - ringPercent / 100);

  return (
    <section
      id="calculator"
      className="relative isolate overflow-hidden bg-[#f7fbfa] px-5 py-16 sm:px-8 lg:py-20"
    >
      <div className="absolute inset-0 landing-soft-survey" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[0.68fr_0.9fr] lg:items-end lg:justify-between">
          <div>
            <p className="landing-mono text-[0.68rem] font-semibold uppercase text-[#d94e09]">
              05 / Commercial case
            </p>
            <h2 className="mt-4 max-w-3xl text-5xl font-black leading-[1.01] text-[#0b1120] md:text-7xl">
              Price the gap.
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm leading-6 text-slate-600 lg:max-w-xl">
            <BreakdownLine
              label="Delay"
              value={`$${formatMoney(estimate.delaySavings)}`}
            />
            <BreakdownLine
              label="Idle"
              value={`$${formatMoney(estimate.idleSavings)}`}
            />
            <BreakdownLine
              label="Coord."
              value={`$${formatMoney(estimate.coordinationSavings)}`}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
          <div className="landing-roi-stage group relative mx-auto flex aspect-square w-full max-w-[28rem] items-center justify-center">
            <svg
              className="landing-roi-gauge absolute inset-[3.5%]"
              viewBox="0 0 120 120"
              aria-label={`${ringPercent.toFixed(2)}% of project value`}
            >
              <defs>
                <linearGradient id="roi-track-gradient" x1="18" y1="18" x2="104" y2="104">
                  <stop offset="0%" stopColor="#f3f8f8" />
                  <stop offset="52%" stopColor="#d8e9eb" />
                  <stop offset="100%" stopColor="#b9d4d9" />
                </linearGradient>
                <linearGradient id="roi-progress-gradient" x1="16" y1="18" x2="102" y2="106">
                  <stop offset="0%" stopColor="#0b5f78" />
                  <stop offset="52%" stopColor="#0e7c9b" />
                  <stop offset="100%" stopColor="#47a8bd" />
                </linearGradient>
              </defs>
              <g transform="rotate(-90 60 60)">
                <circle
                  className="landing-roi-gauge-track"
                  cx="60"
                  cy="60"
                  r={ringRadius}
                  pathLength={ringCircumference}
                />
                <circle
                  className="landing-roi-gauge-fill"
                  cx="60"
                  cy="60"
                  r={ringRadius}
                  pathLength={ringCircumference}
                  style={{
                    strokeDasharray: ringCircumference,
                    strokeDashoffset: ringOffset,
                  }}
                />
              </g>
            </svg>
            <div className="landing-roi-core relative flex h-[67%] w-[67%] flex-col items-center justify-center rounded-full p-7 text-center text-white">
              <p className="landing-mono text-[0.68rem] font-semibold uppercase text-white/42">
                Protected value
              </p>
              <div className="mt-4 flex items-baseline gap-2 text-6xl font-black leading-none md:text-7xl">
                <span className="text-2xl text-white/48">$</span>
                <span>{formatMoney(estimate.totalSavings)}</span>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-[#7ccce0]">
                {estimate.percentOfValue.toFixed(2).replace(/\.?0+$/, "")}% of
                project value
              </p>
            </div>
          </div>

          <div>
            <div className="grid gap-5 sm:grid-cols-4">
              <MetricLine
                icon={<Clock3 size={16} />}
                label="Gap"
                value={formatInt(estimate.visibleGapHours)}
                suffix="hrs"
              />
              <MetricLine
                icon={<CalendarDays size={16} />}
                label="Delay"
                value={estimate.delayDaysAvoided.toFixed(1)}
                suffix="days"
              />
              <MetricLine
                icon={<Gauge size={16} />}
                label="Saved"
                value={formatInt(estimate.coordinationHours)}
                suffix="hrs"
              />
              <MetricLine
                icon={<Construction size={16} />}
                label="Payback"
                value={estimate.paybackMonths.toFixed(1)}
                suffix="mo"
              />
            </div>

            <div className="mt-7 grid gap-x-8 gap-y-5 md:grid-cols-2">
              <RangeField
                label="Project value"
                valueLabel={`$${projectValue}M`}
                minLabel="$5M"
                maxLabel="$500M"
                min={5}
                max={500}
                step={5}
                value={projectValue}
                onChange={setProjectValue}
              />
              <RangeField
                label="Programme"
                valueLabel={`${programmeMonths} mo`}
                minLabel="6"
                maxLabel="60"
                min={6}
                max={60}
                step={1}
                value={programmeMonths}
                onChange={setProgrammeMonths}
              />
              <RangeField
                label="Subcontractors"
                valueLabel={formatInt(subcontractors)}
                minLabel="5"
                maxLabel="200"
                min={5}
                max={200}
                step={1}
                value={subcontractors}
                onChange={setSubcontractors}
              />
              <RangeField
                label="Shared assets"
                valueLabel={formatInt(sharedAssets)}
                minLabel="1"
                maxLabel="40"
                min={1}
                max={40}
                step={1}
                value={sharedAssets}
                onChange={setSharedAssets}
              />
              <div className="md:col-span-2">
                <RangeField
                  label="Unbooked gap per week"
                  valueLabel={`${gapHoursPerWeek}h`}
                  minLabel="0h"
                  maxLabel="80h"
                  min={0}
                  max={80}
                  step={2}
                  value={gapHoursPerWeek}
                  onChange={setGapHoursPerWeek}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Lookahead window
              </p>
              <div className="flex gap-2">
                {windowOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setWindowSize(option.label)}
                    aria-pressed={windowSize === option.label}
                    className={cn(
                      "cursor-pointer border-b-2 px-1 py-2 text-sm font-semibold transition hover:-translate-y-0.5",
                      windowSize === option.label
                        ? "border-[#0e7c9b] text-[#0e7c9b]"
                        : "border-transparent text-slate-500 hover:text-[#0b1120]",
                    )}
                  >
                    {option.weeks} weeks
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <DemoRequestCTA
                label="Book ROI walkthrough"
                className="inline-flex cursor-pointer items-center justify-center bg-[#0b1120] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
              />
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-[#0b1120] transition hover:-translate-y-0.5 hover:border-[#0e7c9b]"
              >
                Talk assumptions
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RangeField({
  label,
  max,
  maxLabel,
  min,
  minLabel,
  onChange,
  step,
  value,
  valueLabel,
}: {
  label: string;
  valueLabel: string;
  minLabel: string;
  maxLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const inputId = useId();
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label htmlFor={inputId} className="text-sm font-semibold text-slate-700">
          {label}
        </label>
        <span className="landing-mono text-xs font-semibold text-[#0e7c9b]">
          {valueLabel}
        </span>
      </div>
      <input
        id={inputId}
        type="range"
        className="roi-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ "--range-pct": `${progress}%` } as CSSProperties}
      />
      <div className="landing-mono mt-1.5 flex justify-between text-[0.68rem] text-slate-400">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function MetricLine({
  icon,
  label,
  suffix,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div className="group border-b border-slate-200 pb-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#0e7c9b]/50">
      <div className="flex items-center justify-between gap-3 text-[#0e7c9b]">
        <p className="landing-mono text-[0.68rem] font-semibold uppercase text-slate-400">
          {label}
        </p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-black leading-none text-[#0b1120]">
        {value}
        <span className="landing-mono ml-1 text-xs font-semibold text-slate-400">
          {suffix}
        </span>
      </p>
    </div>
  );
}

function BreakdownLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="transition duration-300 hover:-translate-y-0.5">
      <span className="landing-mono block text-[0.68rem] font-semibold uppercase text-slate-400">
        {label}
      </span>
      <span className="mt-1 block text-base font-semibold text-[#0b1120]">
        {value}
      </span>
    </p>
  );
}
