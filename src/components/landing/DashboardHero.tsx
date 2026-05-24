"use client";

import type React from "react";
import { useMemo, useState } from "react";
import {
  Calculator,
  Calendar,
  Clock,
  HardHat,
  MapPin,
  Search,
} from "lucide-react";

import { DemoRequestCTA } from "@/components/landing/ClientDynamics";
import { cn } from "@/lib/utils";

type HeroTab = "Upcoming" | "Pending" | "Confirmed" | "All";
type HeroStatus = "pending" | "confirmed" | "completed";

type HeroBooking = {
  asset: string;
  bookedBy: string;
  bookingKey: string;
  day: string;
  month: string;
  status: HeroStatus;
  time: string;
  title: string;
};

const heroTabs: HeroTab[] = ["Upcoming", "Pending", "Confirmed", "All"];

const heroBookings: HeroBooking[] = [
  {
    bookingKey: "facade-panel-delivery",
    day: "18",
    month: "Jun",
    title: "Facade panel delivery",
    time: "09:00 - 12:30",
    asset: "Tower Crane 01",
    bookedBy: "Northline Facades",
    status: "pending",
  },
  {
    bookingKey: "services-riser-install",
    day: "19",
    month: "Jun",
    title: "Services riser install",
    time: "13:00 - 15:00",
    asset: "Hoist 02",
    bookedBy: "Site Manager",
    status: "confirmed",
  },
  {
    bookingKey: "plant-room-delivery",
    day: "21",
    month: "Jun",
    title: "Plant room delivery",
    time: "07:30 - 10:00",
    asset: "Loading Bay B",
    bookedBy: "Mechanical Services",
    status: "confirmed",
  },
  {
    bookingKey: "lift-core-inspection",
    day: "25",
    month: "Jun",
    title: "Lift core inspection",
    time: "15:00 - 16:30",
    asset: "Tower Crane 01",
    bookedBy: "Vertical Access Team",
    status: "completed",
  },
];

export function DashboardHero() {
  return (
    <section className="relative isolate min-h-[96svh] w-full overflow-hidden bg-[#f8fbfc] text-[#0b1120]">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(14,124,155,0.14)_0%,transparent_38%),radial-gradient(ellipse_at_82%_28%,rgba(0,78,137,0.10)_0%,transparent_36%),radial-gradient(ellipse_at_50%_92%,rgba(217,78,9,0.08)_0%,transparent_42%)]"
        aria-hidden="true"
      />

      <div className="relative min-h-[96svh] w-full max-w-full overflow-hidden bg-[linear-gradient(180deg,#f8fbfc_0%,#eef5f7_48%,#f7fafb_100%)]">
        <div className="sitespace-hero-dots absolute inset-0" aria-hidden="true" />
        <div
          className="absolute inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0)_100%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto flex min-h-[96svh] w-full max-w-[104rem] flex-col items-center justify-center px-5 pb-12 pt-24 text-center sm:px-8 sm:pb-16 sm:pt-28">
          <HeroIntroComposition />

          <div className="mt-10 w-full max-w-[58rem] md:mt-12 2xl:max-w-[60rem]">
            <HeroProductCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroIntroComposition() {
  return (
    <div className="mx-auto grid w-full max-w-[102rem] items-center gap-6 xl:grid-cols-[12.75rem_minmax(0,60rem)_12.75rem] xl:gap-[3.75rem] 2xl:max-w-[108rem] 2xl:grid-cols-[13.5rem_minmax(0,62rem)_13.5rem] 2xl:gap-[6rem]">
      <div className="hidden self-center text-left xl:flex xl:flex-col xl:gap-16 2xl:gap-20">
        <HeroBookingsSignalCard className="hero-window-card hero-float-a shine w-full -rotate-[1.2deg] xl:-translate-x-7 2xl:-translate-x-12" />
        <HeroLiveCalendarCard className="hero-window-card hero-float-c shine w-full rotate-[1deg] xl:translate-x-4 2xl:translate-x-7" />
      </div>

      <div className="flex min-w-0 flex-col items-center text-center">
        <div className="flex max-w-xs items-center gap-3 text-xs font-semibold uppercase leading-5 text-[#0f2a4a]/75 sm:max-w-none md:text-sm">
          <span className="hidden h-px w-8 shrink-0 bg-[#0e7c9b]/35 sm:block" />
          Predictive logistics for construction sites
          <span className="hidden h-px w-8 shrink-0 bg-[#0e7c9b]/35 sm:block" />
        </div>

        <h1 className="mt-7 w-full max-w-5xl font-sans text-[clamp(2.25rem,5.4vw,5.25rem)] font-black leading-[1.03] tracking-normal text-[#0b1120] sm:leading-[1.01]">
          Plan the right
          <br />
          site move before it
          <br />
          <span className="sitespace-hero-wordmark">clashes</span>
        </h1>

        <p className="mt-6 w-full max-w-3xl px-1 text-base leading-7 text-slate-600 sm:px-0 sm:text-lg md:text-xl">
          Sitespace turns project activity into clear booking demand, so teams
          can reserve shared assets before the job site gets congested.
        </p>

        <div className="hero-email-shell mx-auto mt-8 flex w-full max-w-[22rem] flex-col rounded-[28px] border border-slate-200 bg-white p-1.5 shadow-[0_14px_45px_rgba(11,17,32,0.08)] sm:max-w-xl sm:flex-row sm:rounded-full">
          <input
            aria-label="Work email"
            placeholder="Enter your work email"
            className="min-h-12 min-w-0 flex-1 rounded-full bg-transparent px-5 text-sm text-[#0b1120] outline-none placeholder:text-slate-400"
          />
          <DemoRequestCTA
            label="Book a Demo"
            className="hero-demo-button inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-amber-500 px-6 text-sm font-semibold text-black shadow-[0_10px_22px_rgba(245,158,11,0.24)] transition-transform hover:scale-[1.01] sm:w-auto"
          />
        </div>

        <a
          href="#calculator"
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/84 px-5 text-sm font-bold text-slate-700 shadow-[0_10px_28px_rgba(11,17,32,0.055)] backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7c9b]/25"
        >
          <Calculator size={16} />
          Estimate ROI
        </a>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-500">
          <span>Australian-hosted</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>Built for active construction sites</span>
        </div>
      </div>

      <div className="hidden self-center text-left xl:flex xl:flex-col xl:gap-16 2xl:gap-20">
        <HeroLookaheadSignalCard className="hero-window-card hero-float-b shine w-full rotate-[1.1deg] xl:translate-x-7 2xl:translate-x-12" />
        <HeroCapacitySignalCard className="hero-window-card hero-float-d shine w-full -rotate-[0.9deg] xl:-translate-x-4 2xl:-translate-x-7" />
      </div>
    </div>
  );
}

function HeroProductCard() {
  const [activeTab, setActiveTab] = useState<HeroTab>("Upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBookingKey, setSelectedBookingKey] = useState(
    heroBookings[0].bookingKey,
  );

  const totalCount = heroBookings.length;
  const pendingCount = heroBookings.filter(
    (booking) => booking.status === "pending",
  ).length;

  const visibleBookings = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return heroBookings.filter((booking) => {
      const matchesTab =
        activeTab === "All"
          ? true
          : activeTab === "Upcoming"
            ? booking.status !== "completed"
            : booking.status === activeTab.toLowerCase();

      const matchesSearch =
        normalizedQuery.length === 0
          ? true
          : [booking.title, booking.asset, booking.bookedBy].some((value) =>
              value.toLowerCase().includes(normalizedQuery),
            );

      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchTerm]);

  const activeBookingKey = visibleBookings.some(
    (booking) => booking.bookingKey === selectedBookingKey,
  )
    ? selectedBookingKey
    : visibleBookings[0]?.bookingKey ?? null;

  return (
    <div className="rounded-[24px] border border-slate-200/85 bg-white/92 p-3 text-left shadow-[0_30px_90px_rgba(11,17,32,0.12)] backdrop-blur-md sm:p-4">
      <div className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Bookings
            </p>
            <h2 className="hero-window-title mt-1 text-xl font-extrabold text-slate-900">
              Manage and track scheduled events
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <HeroCountCard label="Total" value={String(totalCount)} tone="navy" />
            <HeroCountCard
              label="Pending"
              value={String(pendingCount)}
              tone="orange"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative w-full lg:max-w-xs">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Search bookings"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search bookings..."
              className="h-10 w-full cursor-text rounded-xl border border-transparent bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:bg-white"
            />
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {heroTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "shrink-0 cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7c9b]/25",
                  activeTab === tab
                    ? "bg-navy text-white shadow-md shadow-slate-900/10"
                    : "bg-slate-50 text-slate-500 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {visibleBookings.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/70 px-4 py-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                <Calendar size={18} />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">
                No matching bookings
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Try another tab or search term.
              </p>
            </div>
          ) : (
            visibleBookings.map((booking) => (
              <button
                key={booking.bookingKey}
                type="button"
                aria-pressed={activeBookingKey === booking.bookingKey}
                onClick={() => setSelectedBookingKey(booking.bookingKey)}
                className="block w-full cursor-pointer rounded-xl text-left transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7c9b]/25 focus-visible:ring-offset-2"
              >
                <HeroBookingRow
                  {...booking}
                  isSelected={activeBookingKey === booking.bookingKey}
                />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function HeroCountCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "navy" | "orange";
}) {
  return (
    <div
      className={cn(
        "flex min-w-24 flex-col items-center justify-center rounded-xl px-4 py-2.5 text-white shadow-md",
        tone === "navy"
          ? "bg-navy shadow-slate-900/10"
          : "bg-(--brand-orange) shadow-orange-900/10",
      )}
    >
      <span className="text-2xl font-bold leading-none">{value}</span>
      <span className="text-[10px] font-medium uppercase tracking-wide opacity-85">
        {label}
      </span>
    </div>
  );
}

function HeroFloatingPanel({
  ariaLabel,
  children,
  className,
}: React.PropsWithChildren<{ ariaLabel: string; className?: string }>) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "cursor-default rounded-[16px] border border-slate-200/70 bg-white/90 p-3 text-left shadow-[0_12px_30px_rgba(11,17,32,0.045)] backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

function HeroBookingsSignalCard({ className }: { className?: string }) {
  return (
    <HeroFloatingPanel
      ariaLabel="Bookings review prevents competing asset requests"
      className={className}
    >
      <HeroFloatingHeader label="Bookings" signal="1 conflict" tone="amber" />

      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/75 p-2.5">
        <div className="h-2 w-20 rounded-full bg-amber-200/45" />
        <div className="mt-2 h-2 w-28 rounded-full bg-slate-200/80" />
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/80">
          <div className="h-full w-[58%] rounded-full bg-amber-300/45" />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-slate-50 p-2">
          <div className="mx-auto h-1.5 w-8 rounded-full bg-[#0e7c9b]/32" />
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <div className="mx-auto h-1.5 w-8 rounded-full bg-slate-300" />
        </div>
      </div>
    </HeroFloatingPanel>
  );
}

function HeroLiveCalendarCard({ className }: { className?: string }) {
  return (
    <HeroFloatingPanel
      ariaLabel="Live calendar shows asset usage before crews arrive"
      className={className}
    >
      <HeroFloatingHeader label="Live Calendar" signal="asset lanes" />

      <div className="mt-3 space-y-2.5">
        <HeroVisualLane barClassName="ml-[10%] w-[58%] bg-[#0e7c9b]/34" />
        <HeroVisualLane barClassName="ml-[40%] w-[42%] bg-slate-400/55" />
      </div>
    </HeroFloatingPanel>
  );
}

function HeroLookaheadSignalCard({ className }: { className?: string }) {
  return (
    <HeroFloatingPanel
      ariaLabel="Lookahead highlights forecast demand gaps early"
      className={className}
    >
      <HeroFloatingHeader label="Lookahead" signal="18h gap" tone="amber" />

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {[
          "bg-[#0e7c9b]/34",
          "bg-[#0e7c9b]/34",
          "bg-amber-200/45",
          "bg-slate-100",
          "bg-[#0e7c9b]/34",
          "bg-amber-100",
          "bg-amber-200/45",
          "bg-slate-200",
        ].map((cellClassName, index) => (
          <div
            key={index}
            className={cn("h-6 rounded-md border border-white/80", cellClassName)}
          />
        ))}
      </div>
    </HeroFloatingPanel>
  );
}

function HeroCapacitySignalCard({ className }: { className?: string }) {
  return (
    <HeroFloatingPanel
      ariaLabel="Capacity planning shows demand pressure before bottlenecks"
      className={className}
    >
      <HeroFloatingHeader label="Capacity" signal="pressure" tone="amber" />

      <div className="mt-3 space-y-3">
        <HeroPressureBar
          fillClassName="w-[88%] bg-amber-200/50"
          markerClassName="left-[74%]"
        />
        <HeroPressureBar
          fillClassName="w-[64%] bg-[#0e7c9b]/34"
          markerClassName="left-[74%]"
        />
        <HeroPressureBar
          fillClassName="w-[76%] bg-slate-400/45"
          markerClassName="left-[74%]"
        />
      </div>
    </HeroFloatingPanel>
  );
}

function HeroFloatingHeader({
  label,
  signal,
  tone = "neutral",
}: {
  label: string;
  signal: string;
  tone?: "amber" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
          tone === "amber"
            ? "bg-amber-50/55 text-amber-700/70"
            : "bg-slate-50 text-slate-500/85",
        )}
      >
        {signal}
      </span>
    </div>
  );
}

function HeroVisualLane({ barClassName }: { barClassName: string }) {
  return (
    <div className="rounded-xl bg-slate-50/85 px-2.5 py-2">
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div className={cn("h-full rounded-full", barClassName)} />
      </div>
    </div>
  );
}

function HeroPressureBar({
  fillClassName,
  markerClassName,
}: {
  fillClassName: string;
  markerClassName: string;
}) {
  return (
    <div className="relative h-2.5 rounded-full bg-slate-100">
      <div className={cn("h-full rounded-full", fillClassName)} />
      <div
        className={cn(
          "absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-slate-900/25",
          markerClassName,
        )}
      />
    </div>
  );
}

function HeroBookingRow({
  asset,
  bookedBy,
  day,
  isSelected = false,
  month,
  status,
  time,
  title,
}: HeroBooking & { isSelected?: boolean }) {
  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-xl border bg-(--surface-subtle) transition-all duration-200",
        isSelected
          ? "border-blue-200 shadow-[0_12px_32px_rgba(14,124,155,0.12)] ring-2 ring-blue-100"
          : "border-slate-100 hover:border-slate-200",
      )}
    >
      <div className="flex w-16 shrink-0 flex-col items-center justify-center border-r border-slate-200 bg-slate-50/70 px-1 sm:w-20">
        <span
          className={cn(
            "text-[11px] font-bold uppercase",
            status === "pending" ? "text-orange-500" : "text-slate-500",
          )}
        >
          {month}
        </span>
        <span
          className={cn(
            "text-2xl font-bold leading-none",
            status === "pending" ? "text-orange-600" : "text-slate-800",
          )}
        >
          {day}
        </span>
      </div>
      <div className="min-w-0 flex-1 p-3">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="min-w-0 truncate text-sm font-bold text-slate-900">
            {title}
          </h3>
          <span
            className={cn(
              "w-fit rounded px-2 py-0.5 text-[10px] font-bold capitalize tracking-wide",
              status === "confirmed"
                ? "bg-green-100 text-green-700"
                : status === "completed"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-orange-100 text-orange-700",
            )}
          >
            {status}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} className="text-slate-400" />
            {time}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin size={13} className="text-blue-500" />
            <span className="truncate font-semibold text-blue-700">{asset}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <HardHat size={13} className="text-slate-400" />
            <span className="truncate text-slate-600">{bookedBy}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
