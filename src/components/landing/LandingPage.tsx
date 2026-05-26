import Image from "next/image";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  Gauge,
  ScanLine,
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
  "opacity-0 translate-y-7 transition-all duration-700 ease-out data-[visible]:opacity-100 data-[visible]:translate-y-0";

const WRAP = "relative mx-auto max-w-7xl";

const productCurrent = [
  {
    label: "Programme",
    verb: "updates",
    body: "The latest upload becomes the working version.",
  },
  {
    label: "Asset need",
    verb: "appears",
    body: "Cranes, hoists and bays are counted by week.",
  },
  {
    label: "Bookings",
    verb: "resolve",
    body: "Requests move through approval with history.",
  },
  {
    label: "Capacity",
    verb: "holds",
    body: "Confirmed slots are checked against the live pool.",
  },
];

const commitmentThread = [
  {
    icon: <Upload size={20} />,
    title: "Plan changes",
    body: "Upload the latest schedule. Keep version, status and diagnostics visible.",
    signal: "versioned",
  },
  {
    icon: <ScanLine size={20} />,
    title: "Demand appears",
    body: "Activities become demand on shared assets by week and type.",
    signal: "asset demand",
  },
  {
    icon: <CalendarCheck2 size={20} />,
    title: "Slots get booked",
    body: "Requests keep the work, asset and approval context together.",
    signal: "audited",
  },
  {
    icon: <Gauge size={20} />,
    title: "Capacity updates",
    body: "Confirmed bookings refresh the next lookahead review.",
    signal: "live coverage",
  },
];

export default function LandingPage() {
  const year = new Date().getFullYear();

  return (
    <DemoModalProvider>
      <div
        id="landing-root"
        className={cn(
          "landing-font min-h-screen overflow-x-hidden bg-[#f7fbfa] text-[#0b1120]",
        )}
      >
        <ScrollAnimations />
        <NavBar />
        <DashboardHero />
        <SitePulseSection />
        <ProductProofSection />
        <CommitmentThreadSection />
        <ROICalculator />
        <FinalCTA />
        <Footer year={year} />
      </div>
    </DemoModalProvider>
  );
}

function SitePulseSection() {
  return (
    <section id="features" className="relative isolate overflow-hidden bg-[#0b1120] px-5 py-20 text-white sm:px-8 lg:py-28">
      <div className="absolute inset-0 landing-pulse-field" aria-hidden="true" />
      <div className={WRAP}>
        <div className="grid gap-10 lg:grid-cols-[0.72fr_0.9fr] lg:items-center lg:justify-between">
          <div className={FADE} data-fade-in>
            <h2 className="max-w-2xl text-5xl font-black leading-[1.01] text-white md:text-7xl">
              See what the site will need next.
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-white/64">
              Sitespace reads the programme against shared assets, then shows the
              upcoming demand before crews start competing for the same slot.
            </p>
          </div>
          <div className={FADE} data-fade-in>
            <PulseMap />
          </div>
        </div>

        <div className="landing-current-river mt-12 grid gap-8 md:grid-cols-4">
          {productCurrent.map((item, index) => (
            <CurrentPoint
              key={item.label}
              index={index + 1}
              {...item}
              delay={`${index * 0.06}s`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductProofSection() {
  return (
    <section id="lookahead" className="landing-review-section relative isolate overflow-hidden px-5 py-14 text-[#0b1120] sm:px-8 lg:py-16">
      <div className="absolute inset-0 landing-review-field" aria-hidden="true" />
      <div className={WRAP}>
        <div className={FADE} data-fade-in>
          <h2 className="max-w-4xl text-4xl font-black leading-[1.02] text-[#0b1120] md:text-6xl">
            Turn lookahead gaps into booked slots.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Uncovered crane, hoist and loading bay time sits beside the activity
            that needs it, so teams can book before the programme tightens.
          </p>
        </div>

        <div className={cn(FADE, "landing-review-workspace mt-8")} data-fade-in>
          <LookaheadDataRail />

          <div className="landing-review-product-stack">
            <div className="landing-review-product">
              <Image
                src="/static/images/lookaheadplan.png"
                alt="Sitespace lookahead demand coverage matrix"
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 860px, 100vw"
              />
            </div>
            <CoverageTape />
          </div>

          <LookaheadAiRail />
        </div>
      </div>
    </section>
  );
}

function LookaheadDataRail() {
  return (
    <aside className="landing-lookahead-rail landing-lookahead-rail-left">
      <RailMetric
        label="Window"
        value="6 wk"
        detail="selected in the screenshot"
      />
      <RailMetric
        label="Still unbooked"
        value="170.5h"
        detail="shown above the matrix"
        accent
      />
      <RailMetric
        label="Crane / Week 3"
        value="50h gap"
        detail="50h need, 0h booked"
      />
    </aside>
  );
}

function RailMetric({
  accent,
  detail,
  label,
  value,
}: {
  accent?: boolean;
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="landing-rail-metric">
      <span className="landing-mono">{label}</span>
      <strong className={cn(accent && "text-[#d94e09]")}>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

function LookaheadAiRail() {
  return (
    <aside className="landing-lookahead-rail landing-lookahead-rail-right">
      <p className="landing-mono text-[0.64rem] font-semibold uppercase text-[#0e7c9b]">
        Lookahead AI
      </p>
      <h3>Spot gaps faster.</h3>
      <div className="landing-ai-actions">
        <span>Reads the uploaded programme</span>
        <span>Forecasts shared asset demand</span>
        <span>Opens the activity behind each gap</span>
      </div>

      <div className="mt-7 flex flex-col gap-3">
        <DemoRequestCTA
          label="Review your programme"
          className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#0b1120] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_36px_rgba(11,17,32,0.14)] transition hover:-translate-y-0.5"
        />
        <a
          href="#calculator"
          className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-bold text-[#0b1120] transition hover:-translate-y-0.5 hover:text-[#0e7c9b]"
        >
          Price the gap
          <ArrowRight size={15} />
        </a>
      </div>
    </aside>
  );
}

function CoverageTape() {
  return (
    <div
      className="landing-capacity-tape"
      aria-label="Crane demand coverage shown in the lookahead screenshot"
    >
      <div className="landing-tape-key" aria-hidden="true">
        <span>Crane row</span>
        <span>Need</span>
        <span>Booked</span>
        <span>Gap</span>
      </div>
      <div className="landing-tape-grid">
        <TapeWeek label="Week 1" need="33.5h" booked="12h" gap="21.5h" needWidth="67%" bookedWidth="24%" gapWidth="43%" />
        <TapeWeek label="Week 2" need="28.5h" booked="6h" gap="22.5h" needWidth="57%" bookedWidth="12%" gapWidth="45%" />
        <TapeWeek label="Week 3" need="50h" booked="0h" gap="50h" needWidth="100%" bookedWidth="0%" gapWidth="100%" active />
        <TapeWeek label="Week 4" need="33h" booked="0h" gap="33h" needWidth="66%" bookedWidth="0%" gapWidth="66%" />
        <TapeWeek label="Week 5" need="13h" booked="0h" gap="13h" needWidth="26%" bookedWidth="0%" gapWidth="26%" />
        <TapeWeek label="Week 6" need="13h" booked="0h" gap="13h" needWidth="26%" bookedWidth="0%" gapWidth="26%" />
      </div>
    </div>
  );
}

function TapeWeek({
  active,
  booked,
  bookedWidth,
  gap,
  gapWidth,
  label,
  need,
  needWidth,
}: {
  active?: boolean;
  booked: string;
  bookedWidth: string;
  gap: string;
  gapWidth: string;
  label: string;
  need: string;
  needWidth: string;
}) {
  return (
    <div className={cn("landing-tape-week", active && "is-active")}>
      <div className="landing-tape-week-head">
        <span>{label}</span>
        <strong>{gap} gap</strong>
      </div>
      <i
        className="landing-tape-bar landing-tape-need"
        style={{ width: needWidth }}
        aria-label={`${label} need ${need}`}
      />
      <i
        className="landing-tape-bar landing-tape-booked"
        style={{ width: bookedWidth }}
        aria-label={`${label} booked ${booked}`}
      />
      <i
        className="landing-tape-bar landing-tape-gap"
        style={{ width: gapWidth }}
        aria-label={`${label} gap ${gap}`}
      />
    </div>
  );
}

function CommitmentThreadSection() {
  return (
    <section id="commitments" className="relative isolate overflow-hidden bg-white px-5 py-20 sm:px-8 lg:py-24">
      <div className={WRAP}>
        <div className="grid gap-8 lg:grid-cols-[0.82fr_0.72fr] lg:items-start lg:gap-12">
          <div className={FADE} data-fade-in>
            <h2 className="max-w-3xl text-5xl font-black leading-[1.01] text-[#0b1120] md:text-7xl">
              Every booked slot keeps its reason.
            </h2>
          </div>
          <p
            className={cn(
              FADE,
              "max-w-lg text-base leading-7 text-slate-600 lg:justify-self-end",
            )}
            data-fade-in
          >
            Activity, asset, source, status and comments stay attached to the
            commitment.
          </p>
        </div>

        <div className="landing-thread-path mt-10 space-y-8">
          {commitmentThread.map((step, index) => (
            <ThreadStep
              key={step.title}
              {...step}
              index={index + 1}
              delay={`${index * 0.06}s`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="contact" className="relative isolate overflow-hidden bg-[#0b1120] px-5 py-20 text-white sm:px-8 lg:py-24">
      <div className="absolute inset-0 landing-final-current" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.58fr] lg:items-end">
        <div>
          <h2 className="max-w-4xl text-5xl font-black leading-[1.01] text-white md:text-7xl">
            Bring the programme.
          </h2>
        </div>
        <div>
          <p className="text-base leading-7 text-white/66">
            We will map demand, bookings and available capacity from the assets
            your site already shares.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <DemoRequestCTA
              label="Book a Demo"
              className="inline-flex cursor-pointer items-center justify-center bg-[#f8b84e] px-6 py-3 text-sm font-bold text-[#0b1120] shadow-[0_18px_40px_rgba(248,184,78,0.24)] transition hover:-translate-y-0.5"
            />
            <a
              href="#calculator"
              className="inline-flex items-center justify-center gap-2 border border-white/18 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/8"
            >
              Estimate ROI
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function PulseMap() {
  return (
    <div className="landing-pulse-map mx-auto h-[25rem] max-w-[36rem]">
      <div className="landing-pulse-core">
        <span className="landing-mono text-[0.62rem] font-bold uppercase text-[#f8b84e]">
          Lookahead
        </span>
        <strong>asset demand</strong>
      </div>
      <SignalNode className="left-[6%] top-[16%]" label="Programme" value="uploaded" />
      <SignalNode className="right-[4%] top-[22%]" label="Uncovered demand" value="26h" />
      <SignalNode className="bottom-[15%] left-[12%]" label="Slots to book" value="14" />
      <SignalNode className="bottom-[10%] right-[10%]" label="Booked coverage" value="74%" />
      <span className="landing-pulse-path landing-pulse-path-a" />
      <span className="landing-pulse-path landing-pulse-path-b" />
    </div>
  );
}

function SignalNode({
  className,
  label,
  value,
}: {
  className: string;
  label: string;
  value: string;
}) {
  return (
    <div className={cn("landing-signal-node", className)}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CurrentPoint({
  body,
  delay,
  index,
  label,
  verb,
}: {
  body: string;
  delay: string;
  index: number;
  label: string;
  verb: string;
}) {
  return (
    <div
      className={cn(
        FADE,
        "group relative pt-9 transition-transform duration-300 hover:-translate-y-1",
      )}
      data-fade-in
      style={{ transitionDelay: delay }}
    >
      <span className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center bg-[#f8b84e] text-[0.62rem] font-semibold text-[#0b1120] transition-colors duration-300 group-hover:bg-[#0e7c9b] group-hover:text-white">
        {index}
      </span>
      <p className="landing-mono text-[0.68rem] font-semibold uppercase text-white/38 transition-colors duration-300 group-hover:text-white/56">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-white transition-colors duration-300 group-hover:text-[#f8b84e]">{verb}</p>
      <p className="mt-3 text-sm leading-6 text-white/58">{body}</p>
    </div>
  );
}

function ThreadStep({
  body,
  delay,
  icon,
  index,
  signal,
  title,
}: {
  body: string;
  delay: string;
  icon: ReactNode;
  index: number;
  signal: string;
  title: string;
}) {
  return (
    <article
      className={cn(
        FADE,
        "landing-thread-step group grid gap-5 transition-transform duration-300 hover:-translate-y-0.5 md:grid-cols-[4rem_1fr_11rem] md:items-stretch",
      )}
      data-fade-in
      style={{ transitionDelay: delay }}
    >
      <div className="landing-thread-icon flex h-11 w-11 items-center justify-center bg-[#0b1120] text-white transition-colors duration-300 group-hover:bg-[#0e7c9b]">
        {icon}
      </div>
      <div className="landing-thread-copy flex h-full flex-col border-b border-slate-200 pb-7 transition-colors duration-300 group-hover:border-[#0e7c9b]/40">
        <p className="landing-mono text-[0.68rem] font-semibold uppercase text-slate-400">
          {index.toString().padStart(2, "0")}
        </p>
        <h3 className="mt-2 text-3xl font-black leading-tight text-[#0b1120]">
          {title}
        </h3>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          {body}
        </p>
      </div>
      <p className="landing-thread-signal landing-mono flex h-full items-center border-b border-slate-200 pb-7 text-sm font-semibold uppercase text-[#0e7c9b] transition-colors duration-300 group-hover:border-[#0e7c9b]/40 group-hover:text-[#d94e09] md:justify-end md:text-right">
        {signal}
      </p>
    </article>
  );
}

function Footer({ year }: { year: number }) {
  return (
    <footer className="border-t border-slate-200 bg-[#f7fbfa] px-5 py-12 sm:px-8">
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
            Predictive logistics for construction teams managing programme
            demand, shared assets, bookings and available capacity.
          </p>
        </div>

        <FooterColumn title="Product">
          <FooterLink href="#features">Operating layer</FooterLink>
          <FooterLink href="#lookahead">Lookahead</FooterLink>
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
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>&copy; {year} Sitespace. All rights reserved.</span>
        <span>Australian-hosted construction logistics software.</span>
      </div>
    </footer>
  );
}

function FooterColumn({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase text-[#0b1120]">{title}</h3>
      <div className="mt-4 space-y-3 text-sm text-slate-500">{children}</div>
    </div>
  );
}

function FooterLink({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <a href={href} className="block transition-colors hover:text-[#0e7c9b]">
      {children}
    </a>
  );
}
