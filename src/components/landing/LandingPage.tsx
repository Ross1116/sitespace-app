import Image from "next/image";
import type React from "react";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CalendarDays,
  Check,
  Clock3,
  Layers3,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { DashboardHero } from "@/components/landing/DashboardHero";
import {
  DemoModalProvider,
  DemoRequestCTA,
  ScrollAnimations,
} from "@/components/landing/ClientDynamics";
import { ROICalculator } from "@/components/landing/ROICalculator";
import { NavBar } from "@/components/landing/TopBar";
import { cn } from "@/lib/utils";

import "./LandingPage.css";

const FADE =
  "opacity-0 translate-y-10 transition-all duration-700 ease-in-out data-[visible]:opacity-100 data-[visible]:translate-y-0";

const SECTION =
  "relative overflow-hidden px-5 py-20 sm:px-8 lg:py-28";

const WRAP = "relative mx-auto max-w-7xl";

const features = [
  {
    icon: <CalendarDays size={19} />,
    title: "Bookings use the app status model",
    description:
      "Upcoming, pending, confirmed, denied, completed and cancelled bookings all stay in the same review flow.",
  },
  {
    icon: <AlertTriangle size={19} />,
    title: "Competing pending work is visible",
    description:
      "The booking data keeps asset, programme activity and competing pending counts close to the request.",
  },
  {
    icon: <BellRing size={19} />,
    title: "Actions stay attached to history",
    description:
      "Approvals, denials, cancellations, reschedules and history views are part of the booking surface.",
  },
];

const impactStats = [
  {
    value: "18",
    suffix: "h",
    label: "Main action: still needs bookings",
  },
  {
    value: "78",
    suffix: "%",
    label: "Booked coverage in the visible lookahead window",
  },
  {
    value: "82",
    suffix: "h",
    label: "Demand in view across the planning window",
  },
  {
    value: "3",
    suffix: "",
    label: "Asset types tracked in the demand matrix",
  },
];

const workflowSteps = [
  {
    icon: <Upload size={20} />,
    step: "01",
    title: "Program in",
    description:
      "Upload programme context so the lookahead workspace can classify activity and build coverage.",
  },
  {
    icon: <Layers3 size={20} />,
    step: "02",
    title: "Demand mapped",
    description:
      "Activities are grouped into asset types, demand hours, booked hours and unbooked gap hours.",
  },
  {
    icon: <CalendarDays size={20} />,
    step: "03",
    title: "Crews book",
    description:
      "Teams create bookings against real assets, dates, windows, subcontractors and programme context.",
  },
  {
    icon: <ShieldCheck size={20} />,
    step: "04",
    title: "History kept",
    description:
      "Status changes, reschedules and booking history remain available from the booking list.",
  },
];

export default function LandingPage() {
  const year = new Date().getFullYear();

  return (
    <DemoModalProvider>
      <div
        id="landing-root"
        className="min-h-screen overflow-x-hidden bg-[#f8fbfc] text-slate-950"
      >
        <ScrollAnimations />
        <NavBar />
        <DashboardHero />
        <ImpactSection />
        <BookingSection />
        <LookaheadSection />
        <WorkflowSection />
        <AudienceSection />
        <ROICalculator />
        <FinalCTA />
        <Footer year={year} />
      </div>
    </DemoModalProvider>
  );
}

function ImpactSection() {
  return (
    <section className="relative bg-white px-5 py-16 sm:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className={FADE} data-fade-in>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f2a4a]/70">
              What teams see early
            </p>
            <h2 className="mt-3 max-w-2xl text-[clamp(1.9rem,3.7vw,3.4rem)] font-black leading-[1.04] tracking-normal text-slate-950">
              The site stops guessing what everyone needs next.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {impactStats.map((stat, index) => (
              <div
                key={stat.label}
                className={cn(
                  FADE,
                  "rounded-2xl border border-slate-200 bg-slate-50/70 p-5",
                )}
                data-fade-in
                style={{ transitionDelay: `${index * 0.08}s` }}
              >
                <div className="flex items-baseline gap-1 text-4xl font-black leading-none text-slate-950">
                  {stat.value}
                  <span className="font-mono text-sm font-bold text-[#0e7c9b]">
                    {stat.suffix}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BookingSection() {
  return (
    <section id="features" className={cn(SECTION, "bg-[#f8fbfc]")}>
      <div className={WRAP}>
        <SectionHeader
          eyebrow="Bookings"
          title="A cleaner queue for the assets that hold up the job."
          description="This section mirrors the app's booking surface: total and pending counts, search, status tabs, dates, assets, subcontractors and booking status."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.08fr_0.82fr] lg:items-center">
          <div className={cn(FADE, "order-2 lg:order-1")} data-fade-in>
            <BookingsPreview />
          </div>

          <div
            className={cn(FADE, "order-1 space-y-4 lg:order-2")}
            data-fade-in
            style={{ transitionDelay: "0.12s" }}
          >
            {features.map((feature) => (
              <FeaturePoint
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LookaheadSection() {
  return (
    <section id="lookahead" className={cn(SECTION, "bg-[#eef5f7]")}>
      <div className="sitespace-hero-dots absolute inset-0 opacity-30" aria-hidden="true" />
      <div className={WRAP}>
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f2a4a]/70">
            Lookahead AI
          </p>
          <h2 className="mt-4 text-[clamp(2.2rem,5vw,4.8rem)] font-black leading-[1.02] tracking-normal text-slate-950">
            Six weeks of asset pressure, before it hits site.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            Sitespace turns upcoming activity into demand hours, booked hours
            and gap hours by asset type, using the same coverage matrix that
            appears inside the app.
          </p>
        </div>

        <div className={cn(FADE, "mt-12")} data-fade-in>
          <LookaheadPreview />
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className={cn(SECTION, "bg-white")}>
      <div className={WRAP}>
        <SectionHeader
          eyebrow="How it works"
          title="Built around the daily rhythm of an active site."
          description="From programme upload to demand coverage, booking creation and history, each step maps to a real workspace inside Sitespace."
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflowSteps.map((step, index) => (
            <div
              key={step.step}
              className={cn(
                FADE,
                "rounded-2xl border border-slate-200 bg-slate-50/70 p-5",
              )}
              data-fade-in
              style={{ transitionDelay: `${index * 0.08}s` }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0e7c9b] shadow-sm">
                {step.icon}
              </div>
              <p className="mt-5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Step {step.step}
              </p>
              <h3 className="mt-2 text-xl font-black tracking-normal text-slate-950">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AudienceSection() {
  return (
    <section id="benefits" className={cn(SECTION, "bg-[#f8fbfc]")}>
      <div className={WRAP}>
        <SectionHeader
          eyebrow="Benefits"
          title="Different teams, one shared operating picture."
          description="The story stays focused on app surfaces customers can inspect: booking status, demand coverage, capacity pressure and traceable changes."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <AudienceCard
            label="For subcontractors"
            title="Book clean slots and arrive with confidence."
            points={[
              "Reserve shared assets from one booking flow.",
              "Track Upcoming, Pending, Confirmed and Completed status.",
              "See asset names, time windows and booking history in context.",
            ]}
          />
          <AudienceCard
            label="For project managers"
            title="Spot congestion before the plan turns into a scramble."
            points={[
              "Review pending bookings against lookahead gap hours.",
              "Use 2W, 4W and 6W windows to scan demand coverage.",
              "Check capacity-backed utilisation and weeks with gaps.",
            ]}
            dark
          />
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[#f8fbfc] px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_30px_90px_rgba(11,17,32,0.10)] sm:p-12 lg:p-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f2a4a]/70">
          Ready when you are
        </p>
        <h2 className="mx-auto mt-4 max-w-4xl text-[clamp(2.2rem,5vw,5rem)] font-black leading-[1.02] tracking-normal text-slate-950">
          Bring your next program. See the pressure before site does.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
          We will walk through your real booking demand and the lookahead signals
          that usually get buried in meetings, spreadsheets and late messages.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <DemoRequestCTA
            label="Book a Demo"
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-amber-500 px-6 py-3 text-sm font-bold text-black shadow-[0_14px_30px_rgba(245,158,11,0.22)] transition-transform hover:scale-[1.01]"
          />
          <a
            href="#calculator"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Estimate ROI
            <ArrowRight size={15} />
          </a>
        </div>
        <p className="mt-7 text-sm text-slate-500">
          Australian-hosted - Enterprise-ready - Implementation support included
        </p>
      </div>
    </section>
  );
}

function Footer({ year }: { year: number }) {
  return (
    <footer className="border-t border-slate-200 bg-white px-5 py-12 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_repeat(3,0.6fr)]">
        <div>
          <Image
            src="/full-logo.svg"
            alt="Sitespace"
            width={150}
            height={40}
            loading="lazy"
            className="h-9 w-auto"
          />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
            Construction asset booking and lookahead planning for busy sites
            that need fewer surprises.
          </p>
        </div>

        <FooterColumn title="Product">
          <FooterLink href="#features">Bookings</FooterLink>
          <FooterLink href="#lookahead">Lookahead AI</FooterLink>
          <FooterLink href="#calculator">ROI calculator</FooterLink>
        </FooterColumn>
        <FooterColumn title="Company">
          <FooterLink href="#contact">Contact</FooterLink>
          <FooterLink href="https://sitespace.com.au">Sitespace.com.au</FooterLink>
        </FooterColumn>
        <FooterColumn title="Access">
          <FooterLink href="/login">Sign in</FooterLink>
          <FooterLink href="#contact">Book a demo</FooterLink>
        </FooterColumn>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-slate-100 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>&copy; {year} Sitespace. All rights reserved.</span>
        <span>Built for active construction sites.</span>
      </div>
    </footer>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_0.7fr] lg:items-end lg:justify-between">
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

function BookingsPreview() {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_30px_90px_rgba(11,17,32,0.10)] sm:p-5">
      <div className="rounded-[20px] border border-slate-100 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Bookings
            </p>
            <h3 className="mt-1 text-2xl font-black tracking-normal text-slate-950">
              Today - Bay and crane queue
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Riverside Tower - Level 18
            </p>
          </div>
          <div className="flex gap-2">
            <MetricPill value="4" label="Live" />
            <MetricPill value="1" label="Pending" amber />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <BookingPreviewRow
            day="18"
            month="Jun"
            title="Facade panel delivery"
            meta="09:00 - 12:30 - Tower Crane 01 - Northline Facades"
            status="pending"
          />
          <BookingPreviewRow
            day="19"
            month="Jun"
            title="Services riser install"
            meta="13:00 - 15:00 - Hoist 02 - Site Manager"
            status="confirmed"
          />
          <BookingPreviewRow
            day="21"
            month="Jun"
            title="Plant room delivery"
            meta="07:30 - 10:00 - Loading Bay B - Mechanical Services"
            status="confirmed"
          />
        </div>
      </div>
    </div>
  );
}

function BookingPreviewRow({
  day,
  month,
  title,
  meta,
  status,
}: {
  day: string;
  month: string;
  title: string;
  meta: string;
  status: "pending" | "confirmed";
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-[4rem_1fr_auto] sm:items-center">
      <div
        className={cn(
          "flex h-14 w-14 flex-col items-center justify-center rounded-xl border bg-white",
          status === "pending"
            ? "border-amber-100 text-amber-700"
            : "border-slate-200 text-slate-700",
        )}
      >
        <span className="text-[10px] font-bold uppercase">{month}</span>
        <span className="text-xl font-black leading-none">{day}</span>
      </div>
      <div className="min-w-0">
        <h4 className="truncate text-sm font-black text-slate-950">{title}</h4>
        <p className="mt-1 truncate text-xs font-medium text-slate-500">
          {meta}
        </p>
      </div>
      <span
        className={cn(
          "w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]",
          status === "pending"
            ? "bg-amber-50 text-amber-700"
            : "bg-emerald-50 text-emerald-700",
        )}
      >
        {status}
      </span>
    </div>
  );
}

function LookaheadPreview() {
  const rows = [
    {
      asset: "Tower Crane",
      cells: [
        { label: "Covered", need: 16, booked: 16, gap: 0, level: "covered" },
        { label: "High", need: 20, booked: 12, gap: 8, level: "high" },
        { label: "Medium", need: 14, booked: 8, gap: 6, level: "medium" },
      ],
    },
    {
      asset: "Loading Bay",
      cells: [
        { label: "Low", need: 10, booked: 7, gap: 3, level: "low" },
        { label: "Covered", need: 12, booked: 12, gap: 0, level: "covered" },
        { label: "No demand", need: 0, booked: 0, gap: 0, level: "none" },
      ],
    },
    {
      asset: "Hoist",
      cells: [
        { label: "Covered", need: 8, booked: 8, gap: 0, level: "covered" },
        { label: "Medium", need: 10, booked: 6, gap: 4, level: "medium" },
        { label: "Covered", need: 12, booked: 12, gap: 0, level: "covered" },
      ],
    },
  ];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_30px_90px_rgba(11,17,32,0.10)] sm:p-5">
      <div className="rounded-[20px] border border-slate-100 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Lookahead - 4W window - Riverside Tower
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-normal text-slate-950">
              Demand coverage matrix
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Scan each asset type across the planning window, then open the
              weekly cell behind the gap.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Legend</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal" />
              Booked
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="flex gap-0.5">
                <span className="h-2 w-2 rounded-full bg-amber-300" />
                <span className="h-2 w-2 rounded-full bg-orange-400" />
              </span>
              Unbooked gap
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <LookaheadStatCard
            icon={<AlertTriangle size={17} />}
            label="Main action"
            value="18h"
            sub="Still needs bookings"
            tone="amber"
          />
          <LookaheadStatCard
            icon={<CalendarDays size={17} />}
            label="Booked coverage"
            value="78%"
            sub="64h booked of 82h demand"
            tone="slate"
            progress="78%"
          />
          <LookaheadStatCard
            icon={<Clock3 size={17} />}
            label="Demand in view"
            value="82h"
            sub="Across 4 weeks"
            tone="slate"
          />
          <LookaheadStatCard
            icon={<Layers3 size={17} />}
            label="Asset types tracked"
            value="3"
            sub="Tower Crane, Loading Bay, Hoist"
            tone="slate"
          />
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
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
                  <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                    Visible window
                  </p>
                </div>
              ))}
            </div>

            {rows.map((row) => (
              <div
                key={row.asset}
                className="grid grid-cols-[190px_repeat(3,minmax(170px,1fr))] border-b border-slate-100 last:border-b-0"
              >
                <div className="border-r border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm font-bold text-slate-900">
                    {row.asset}
                  </p>
                </div>
                {row.cells.map((cell, index) => (
                  <DemandMatrixCell
                    key={`${row.asset}-${index}`}
                    label={cell.label}
                    need={cell.need}
                    booked={cell.booked}
                    gap={cell.gap}
                    level={cell.level}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <SignalCard
            icon={<AlertTriangle size={16} />}
            title="Crane pressure"
            detail="Facade install and slab pour both need TC-01 in week 16."
            tone="amber"
          />
          <SignalCard
            icon={<Clock3 size={16} />}
            title="Bay throughput tight"
            detail="Two delivery windows are close enough to need review."
            tone="teal"
          />
          <SignalCard
            icon={<Check size={16} />}
            title="Hoist N1 healthy"
            detail="Utilisation remains below the weekly pressure threshold."
            tone="green"
          />
        </div>
      </div>
    </div>
  );
}

function LookaheadStatCard({
  icon,
  label,
  value,
  sub,
  tone,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "amber" | "slate";
  progress?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-slate-200 bg-white text-slate-950",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black leading-none">{value}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-2 text-[#0e7c9b]">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700">{sub}</p>
      {progress ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal"
            style={{ width: progress }}
          />
        </div>
      ) : null}
    </div>
  );
}

function DemandMatrixCell({
  label,
  need,
  booked,
  gap,
  level,
}: {
  label: string;
  need: number;
  booked: number;
  gap: number;
  level: string;
}) {
  if (level === "none") {
    return (
      <div className="border-r border-slate-100 bg-slate-50/50 px-3 py-3 last:border-r-0">
        <div className="flex h-full min-h-24 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-300">
          No demand
        </div>
      </div>
    );
  }

  const bookedShare = need > 0 ? Math.min(100, Math.round((booked / need) * 100)) : 0;
  const badgeClass =
    level === "covered"
      ? "bg-emerald-100 text-emerald-700"
      : level === "high"
        ? "bg-orange-50 text-orange-600"
        : level === "medium"
          ? "bg-amber-50 text-amber-600"
          : "bg-slate-100 text-slate-600";

  return (
    <div className="border-r border-slate-100 bg-white px-3 py-3 last:border-r-0">
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            badgeClass,
          )}
        >
          {label}
        </span>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <DemandNumber label="Need" value={`${need}h`} />
          <DemandNumber label="Booked" value={`${booked}h`} tone="teal" />
          <DemandNumber
            label="Gap"
            value={`${gap}h`}
            tone={gap > 0 ? "red" : "green"}
          />
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="flex h-full overflow-hidden rounded-full">
            {bookedShare > 0 ? (
              <div className="h-full bg-teal" style={{ width: `${bookedShare}%` }} />
            ) : null}
            {bookedShare < 100 ? (
              <div
                className={cn(
                  "h-full",
                  level === "high" ? "bg-orange-400" : "bg-amber-300",
                )}
                style={{ width: `${100 - bookedShare}%` }}
              />
            ) : null}
          </div>
        </div>
      </div>
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

function FeaturePoint({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0e7c9b]/10 text-[#0e7c9b]">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-black tracking-normal text-slate-950">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function AudienceCard({
  label,
  title,
  points,
  dark = false,
}: {
  label: string;
  title: string;
  points: string[];
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        FADE,
        "rounded-[24px] border p-6 shadow-sm md:p-8",
        dark
          ? "border-slate-900 bg-navy text-white"
          : "border-slate-200 bg-white text-slate-950",
      )}
      data-fade-in
    >
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.2em]",
          dark ? "text-white/50" : "text-slate-400",
        )}
      >
        {label}
      </p>
      <h3
        className={cn(
          "mt-3 max-w-xl text-3xl font-black leading-[1.08] tracking-normal",
          dark ? "text-white" : "text-slate-950",
        )}
      >
        {title}
      </h3>
      <div className="mt-8 space-y-4">
        {points.map((point) => (
          <div key={point} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                dark
                  ? "bg-teal/20 text-teal"
                  : "bg-emerald-50 text-emerald-600",
              )}
            >
              <Check size={13} strokeWidth={3} />
            </span>
            <p className={cn("text-sm leading-6", dark ? "text-white/70" : "text-slate-600")}>
              {point}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricPill({
  value,
  label,
  amber = false,
}: {
  value: string;
  label: string;
  amber?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-20 rounded-xl px-4 py-2 text-center text-white shadow-md",
        amber ? "bg-amber-500 shadow-amber-900/10" : "bg-navy shadow-slate-900/10",
      )}
    >
      <div className="text-2xl font-black leading-none">{value}</div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide opacity-80">
        {label}
      </div>
    </div>
  );
}

function SignalCard({
  icon,
  title,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  tone: "amber" | "teal" | "green";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-100 bg-amber-50/70 text-amber-700"
      : tone === "green"
        ? "border-emerald-100 bg-emerald-50/70 text-emerald-700"
        : "border-cyan-100 bg-cyan-50/70 text-[#0e7c9b]";

  return (
    <div className={cn("rounded-2xl border p-4", toneClass)}>
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="text-sm font-black tracking-normal">{title}</h4>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-black text-slate-950">{title}</h3>
      <div className="mt-4 space-y-3 text-sm text-slate-500">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="block transition-colors hover:text-[#0e7c9b]">
      {children}
    </a>
  );
}
