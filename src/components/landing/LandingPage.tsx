import Image from "next/image";
import type React from "react";
import {
  AlertTriangle,
  BellRing,
  BrainCircuit,
  CalendarDays,
  Clock3,
  HardHat,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";

import "./LandingPage.css";

import { NavBar } from "@/components/landing/TopBar";
import { DashboardHero } from "@/components/landing/DashboardHero";
// import { WatchVideoButton } from "@/components/landing/WatchVideoButton";
import {
  ScrollAnimations,
  LookaheadDashboard,
  ShowcaseSection,
  DemoRequestCTA,
  DemoModalProvider,
} from "@/components/landing/ClientDynamics";

const FADE =
  "opacity-0 translate-y-10 transition-all duration-700 ease-in-out data-[visible]:opacity-100 data-[visible]:translate-y-0";

const GIANT =
  "text-[clamp(2rem,6vw,7rem)] font-extrabold leading-[1.1] tracking-tight";

const LARGE =
  "text-[clamp(2rem,6vw,5rem)] font-bold leading-[1.2] tracking-tight";

const APPLE =
  "transition-all duration-[400ms] ease-in-out cursor-pointer hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]";

const BADGE =
  "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-white/10 border border-white/20 backdrop-blur-[10px]";

const CHECK_ICON_CLS =
  "w-6 h-6 shrink-0 bg-brand-blue rounded-full flex items-center justify-center";

export default function LandingPage() {
  const year = new Date().getFullYear();

  return (
    <DemoModalProvider>
    <div
      id="landing-root"
      className="scroll-smooth overflow-x-hidden text-[rgb(245,245,247)] min-h-screen relative bg-[linear-gradient(180deg,#000_0%,#0a0a14_20%,#050510_40%,#0a0a14_60%,#000_80%,#000_100%)]"
    >
      {/* Ambient overlay */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(14,124,155,0.10) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(0,78,137,0.10) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(245,158,11,0.10) 0%, transparent 60%)
          `,
        }}
      />

      <ScrollAnimations />

      <NavBar />

      <DashboardHero />

      <ShowcaseSection />

      <section className="px-6 py-16 md:py-30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: "42", label: "Weekly bookings tracked" },
              { value: "2-6", label: "Weeks of forecast visibility" },
              { value: "14", label: "Approvals ready today" },
              { value: "100%", label: "Audit trail coverage" },
            ].map((stat, i) => (
              <div
                key={stat.value}
                className={cn(FADE, "text-center")}
                data-fade-in
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="stat-gradient text-[clamp(2.5rem,5vw,4rem)] font-bold">
                  {stat.value}
                </div>
                <div className="text-gray-500 text-sm md:text-base mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="min-h-screen flex items-center justify-center relative bg-[rgba(10,10,20,0.3)]"
      >
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,124,155,0.04)_0%,transparent_70%)] pointer-events-none"
          aria-hidden="true"
        />
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div className={FADE} data-fade-in>
            <h2 className={cn(LARGE, "mb-6")}>
              Know when to book any asset
              <br />
              <span className="gradient-text">in seconds</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 font-normal leading-relaxed">
              Tower cranes, loading bays, hoists. Subcontractors book instantly.
              Managers approve with one tap. No email chains. No confusion.
            </p>
            <div className="space-y-3">
              <CheckItem>One-click booking requests</CheckItem>
              <CheckItem>Instant approval workflows</CheckItem>
              <CheckItem>Real-time notifications</CheckItem>
            </div>
          </div>
          <div
            className={FADE}
            data-fade-in
            style={{ transitionDelay: "0.2s" }}
          >
            <DesktopFrame className="shine max-w-180 mx-auto">
              <BookingIntelligencePanel />
            </DesktopFrame>
          </div>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center relative bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className={cn(FADE, "order-2 md:order-1")} data-fade-in>
            <DesktopFrame className="shine">
              <ConflictPreventionPanel />
            </DesktopFrame>
          </div>
          <div className={cn(FADE, "order-1 md:order-2")} data-fade-in>
            <h2 className={cn(LARGE, "mb-6")}>
              Eliminate
              <br />
              <span className="gradient-text">double bookings</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 font-normal leading-relaxed">
              Our AI detects scheduling conflicts before they happen. No more
              delivery clashes. No more crane congestion. Just smooth
              operations.
            </p>
            <div className="space-y-3">
              <CheckItem>Intelligent conflict prevention</CheckItem>
              <CheckItem>Real-time availability tracking</CheckItem>
              <CheckItem>Automated clash resolution</CheckItem>
            </div>
          </div>
        </div>
      </section>

      <section
        id="lookahead"
        className="min-h-screen flex items-center justify-center relative"
        style={{
          background: "linear-gradient(180deg, #000 0%, #0a0a14 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className={cn(FADE, "mb-16")} data-fade-in>
            <div className={cn(BADGE, "mb-8")}>Powered by AI</div>
            <h2 className={cn(GIANT, "mb-8")}>
              Lookahead
              <br />
              Planning
            </h2>
            <p className="text-2xl md:text-3xl text-gray-400 max-w-4xl mx-auto font-normal leading-[1.4]">
              Connect your construction program to intelligent forecasting. Get
              alerts 2-6 weeks in advance. Plan smarter, not harder.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-30">
        <div className="max-w-6xl mx-auto">
          <LookaheadDashboard />
        </div>
      </section>

      <section className="relative px-6 pt-24 pb-16 md:pt-40 md:pb-30">
        {/* Faint separator from the dashboard above */}
        <div
          className="absolute top-0 inset-x-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
          }}
          aria-hidden="true"
        />
        <div className="max-w-5xl mx-auto">
          <div className={cn(FADE, "text-center mb-16")} data-fade-in>
            <div className={cn(BADGE, "mb-6")}>How It Works</div>
            <h2 className={cn(LARGE, "mb-4")}>
              Built for the way
              <br />
              <span className="gradient-text">you build</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <FeatureBlurb
              icon={<Upload size={22} className="text-[rgba(14,124,155,1)]" />}
              accent="rgba(14,124,155,1)"
              title="Program Integration"
              delay="0s"
            >
              Upload from Primavera P6, MS Project, or PDF. We analyse upcoming
              milestones and identify asset needs automatically.
            </FeatureBlurb>
            <FeatureBlurb
              icon={<BrainCircuit size={22} className="text-amber-400" />}
              accent="rgba(245,158,11,1)"
              title="Smart Forecasting"
              delay="0.1s"
            >
              AI identifies which activities need cranes, bays, or hoists.
              Predicts congestion weeks in advance, not after it happens.
            </FeatureBlurb>
            <FeatureBlurb
              icon={<BellRing size={22} className="text-[rgba(14,124,155,1)]" />}
              accent="rgba(14,124,155,1)"
              title="Proactive Alerts"
              delay="0.2s"
            >
              Neutral, actionable notifications. Weekly digests keep teams
              informed without overwhelming them.
            </FeatureBlurb>
            <FeatureBlurb
              icon={<ShieldCheck size={22} className="text-amber-400" />}
              accent="rgba(245,158,11,1)"
              title="Zero Risk"
              delay="0.3s"
            >
              Read-only program access. No edits, no overrides. Complete audit
              trail for compliance and claims defense.
            </FeatureBlurb>
          </div>
        </div>
      </section>

      <section
        className="px-6 py-16 md:py-30"
        style={{
          background: "linear-gradient(180deg, #0a0a14 0%, #000 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <div className={FADE} data-fade-in>
            <div className={cn(BADGE, "mb-8")}>Coming Soon</div>
            <h2 className={cn(LARGE, "mb-8")}>
              Live program sync.
              <br />
              <span className="gradient-text">Zero manual updates.</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 font-normal leading-relaxed">
              When the construction program changes, bookings adapt
              automatically. Everyone stays aligned in real-time.
            </p>
            <div className="flex flex-wrap gap-6 justify-center text-gray-400">
              <CompactCheck>Auto-detection</CompactCheck>
              <CompactCheck>Smart resolution</CompactCheck>
              <CompactCheck>Instant sync</CompactCheck>
            </div>
          </div>
        </div>
      </section>

      <section
        id="benefits"
        className="px-6 py-16 md:py-30"
        style={{
          background:
            "linear-gradient(180deg, #000 0%, #0a0a14 50%, #000 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className={cn(FADE, "text-center mb-20")} data-fade-in>
            <h2 className={cn(LARGE, "mb-6")}>
              Built for everyone
              <br />
              <span className="gradient-text">on site</span>
            </h2>
          </div>

          <div className="mx-auto grid w-full max-w-5xl px-2 md:px-6 md:grid-cols-2 gap-16">
            <div className={FADE} data-fade-in>
              <h3 className="text-3xl font-semibold mb-8">
                For Subcontractors
              </h3>
              <div className="space-y-4">
                <BenefitItem
                  title="Book assets in under 60 seconds"
                  description="No complex forms. Just simple, fast bookings."
                />
                <BenefitItem
                  title="Get advance notice"
                  description="Plan 2-4 weeks ahead before demand peaks."
                />
                <BenefitItem
                  title="Avoid delays and conflicts"
                  description="No more delivery clashes or site access issues."
                />
              </div>
            </div>

            <div
              className={FADE}
              data-fade-in
              style={{ transitionDelay: "0.2s" }}
            >
              <h3 className="text-3xl font-semibold mb-8">
                For Project Managers
              </h3>
              <div className="space-y-4">
                <BenefitItem
                  title="Spot congestion early"
                  description="See bottlenecks weeks in advance, not after."
                />
                <BenefitItem
                  title="Complete audit trail"
                  description="Immutable logs for claims defense and compliance."
                />
                <BenefitItem
                  title="Zero legal risk"
                  description="Read-only program access. No edits, no liability."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="min-h-screen flex items-center justify-center relative"
      >
        <div id="demo" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className={FADE} data-fade-in>
            <h2 className={cn(LARGE, "mb-8")}>
              Ready to transform
              <br />
              <span className="gradient-text">your site?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 font-normal">
              Join forward-thinking teams already using AI to plan smarter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <DemoRequestCTA
                label="Schedule a Demo"
                className="cursor-pointer bg-amber-500 text-black rounded-full px-6 py-3 text-[17px] font-semibold hover:scale-[1.02] transition-transform"
              />
              <DemoRequestCTA
                label="Contact Sales"
                className="cursor-pointer bg-transparent text-amber-500 border-2 border-amber-500 rounded-full px-5.5 py-2.5 text-[17px] font-semibold hover:bg-amber-500 hover:text-black transition-colors"
              />
            </div>
            <p className="text-gray-600 text-sm">
              Australian-hosted | Enterprise-ready | Implementation support
              included
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-15 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/full-logo-dark.svg"
                  alt="Sitespace"
                  width={140}
                  height={48}
                  loading="lazy"
                  className="h-9 block"
                  style={{ width: "auto" }}
                />
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                The intelligent asset booking platform designed for the
                complexities of
                <br />
                the modern job site.
              </p>
            </div>

            <FooterCol title="Product">
              <FooterLink href="#features">Features</FooterLink>
              <FooterLink href="#lookahead">Lookahead AI</FooterLink>
            </FooterCol>

            <FooterCol title="Company">
              <FooterLink href="#">About</FooterLink>
              <FooterLink href="#contact">Contact</FooterLink>
              <FooterLink href="#">Support</FooterLink>
            </FooterCol>

            <FooterCol title="Legal">
              <FooterLink href="#">Privacy</FooterLink>
              <FooterLink href="#">Terms</FooterLink>
              <FooterLink href="#">Compliance</FooterLink>
            </FooterCol>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
              <div>&copy; {year} Sitespace. All rights reserved.</div>
              <a
                href="https://sitespace.com.au"
                className="hover:text-white transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                Sitespace.com.au
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </DemoModalProvider>
  );
}

//  Server sub-components
function DesktopFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-[rgb(42,42,42)] rounded-xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)]",
        APPLE,
        className,
      )}
    >
      <div className="bg-[rgb(26,26,26)] px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
      </div>
      {children}
    </div>
  );
}

function MobileFrame({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "relative w-full max-w-93.75 mx-auto bg-[rgb(26,26,26)] rounded-12.5 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.6)]",
        APPLE,
        "shine",
        className,
      )}
      style={style}
    >
      <div
        className="absolute top-2 left-1/2 -translate-x-1/2 w-30 h-6.25 bg-[rgb(26,26,26)] rounded-b-5 z-2"
        aria-hidden="true"
      />
      <div className="rounded-9.5 overflow-hidden">{children}</div>
    </div>
  );
}

function BookingIntelligencePanel() {
  return (
    <div className="bg-(--page-bg) p-4 text-slate-800 md:p-5">
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Bookings
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Manage and track scheduled events
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <BookingCountCard label="Total" value="42" tone="navy" />
            <BookingCountCard label="Pending" value="14" tone="orange" />
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="h-10 w-full rounded-xl bg-slate-50 md:max-w-xs" />
          <div className="flex gap-2 overflow-hidden">
            {["Upcoming", "Pending", "Confirmed", "All"].map((tab, index) => (
              <span
                key={tab}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-bold",
                  index === 0
                    ? "bg-navy text-white shadow-md shadow-slate-900/10"
                    : "bg-slate-50 text-slate-500",
                )}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <BookingPreviewCard
            day="18"
            month="Jun"
            title="Facade panel delivery"
            time="09:00 - 12:30"
            asset="Tower Crane 01"
            person="Northline Facades"
            status="pending"
          />
          <BookingPreviewCard
            day="19"
            month="Jun"
            title="Services riser install"
            time="13:00 - 15:00"
            asset="Hoist 02"
            person="Site Manager"
            status="confirmed"
          />
        </div>
      </div>
    </div>
  );
}

function BookingCountCard({
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

function BookingPreviewCard({
  day,
  month,
  title,
  time,
  asset,
  person,
  status,
}: {
  day: string;
  month: string;
  title: string;
  time: string;
  asset: string;
  person: string;
  status: "pending" | "confirmed";
}) {
  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid items-center gap-5 md:grid-cols-[auto_minmax(180px,280px)_1fr_auto]">
        <div
          className={cn(
            "flex h-14 w-14 flex-col items-center justify-center rounded-xl border",
            status === "pending"
              ? "border-orange-100 bg-orange-50 text-orange-700"
              : "border-slate-100 bg-slate-50 text-slate-600",
          )}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider">
            {month}
          </span>
          <span className="text-xl font-bold leading-none">{day}</span>
        </div>

        <div className="min-w-0 border-slate-100 md:border-r md:pr-5">
          <h4 className="truncate text-base font-bold leading-tight text-slate-900">
            {title}
          </h4>
          <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
            <Clock3 size={13} className="text-slate-400" />
            {time}
          </div>
        </div>

        <div className="min-w-0 text-sm leading-relaxed text-slate-600">
          <span className="font-semibold text-blue-700">{asset}</span>
          <span className="text-slate-400"> | </span>
          <span>{person}</span>
        </div>

        <span
          className={cn(
            "w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            status === "confirmed"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-amber-100 bg-amber-50 text-amber-700",
          )}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function ConflictPreventionPanel() {
  return (
    <div className="bg-(--page-bg) p-4 text-slate-800 md:p-5">
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Lookahead
              </p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                18h still unbooked
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Use the demand coverage matrix to inspect the activity behind
                each weekly gap.
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              {["2W", "4W", "6W"].map((window, index) => (
                <span
                  key={window}
                  className={cn(
                    "rounded-full px-3 py-2 text-xs font-bold",
                    index === 1
                      ? "bg-navy text-white"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {window}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <LookaheadStatCard
            label="Main action"
            value="18h"
            sub="Still needs bookings"
            tone="border-amber-200 bg-amber-50 text-amber-950"
            icon={<AlertTriangle size={18} className="text-amber-600" />}
          />
          <LookaheadStatCard
            label="Booked coverage"
            value="78%"
            sub="64h booked of 82h demand"
            tone="border-slate-200 bg-white text-slate-950"
            icon={<CalendarDays size={18} className="text-navy" />}
            progress="78%"
          />
          <LookaheadStatCard
            label="Asset types tracked"
            value="3"
            sub="Tower crane, hoist, loading bay"
            tone="border-slate-200 bg-white text-slate-950"
            icon={<HardHat size={18} className="text-teal" />}
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="grid min-w-[620px] grid-cols-[190px_repeat(3,minmax(140px,1fr))] border-b border-slate-200 bg-slate-50">
            <div className="border-r border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Asset type
            </div>
            {["Week 1", "Week 2", "Week 3"].map((week) => (
              <div
                key={week}
                className="border-r border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 last:border-r-0"
              >
                {week}
              </div>
            ))}
          </div>
          <DemandPreviewRow
            asset="Tower Crane"
            cells={[
              { label: "Covered", need: "16h", booked: "16h", gap: "0h" },
              { label: "High", need: "20h", booked: "12h", gap: "8h" },
              { label: "Medium", need: "14h", booked: "8h", gap: "6h" },
            ]}
          />
          <DemandPreviewRow
            asset="Loading Bay"
            cells={[
              { label: "Low", need: "10h", booked: "7h", gap: "3h" },
              { label: "Covered", need: "12h", booked: "12h", gap: "0h" },
              { label: "No demand", need: "-", booked: "-", gap: "-" },
            ]}
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
      {progress && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-teal" style={{ width: progress }} />
        </div>
      )}
    </div>
  );
}

function DemandPreviewRow({
  asset,
  cells,
}: {
  asset: string;
  cells: { label: string; need: string; booked: string; gap: string }[];
}) {
  return (
    <div className="grid min-w-[620px] grid-cols-[190px_repeat(3,minmax(140px,1fr))] border-b border-slate-100 last:border-b-0">
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

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <CheckIcon />
      <span className="text-gray-300">{children}</span>
    </div>
  );
}

function CompactCheck({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <CheckIcon />
      <span>{children}</span>
    </div>
  );
}

function CheckIcon() {
  return (
    <div className={CHECK_ICON_CLS}>
      <svg
        className="w-3 h-3 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>
  );
}

function BenefitItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <CheckIcon />
      <div>
        <div className="font-medium mb-1">{title}</div>
        <div className="text-gray-500 text-sm">{description}</div>
      </div>
    </div>
  );
}

function FeatureBlurb({
  icon,
  accent,
  title,
  children,
  delay,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  children: React.ReactNode;
  delay: string;
}) {
  return (
    <div
      className={cn(
        FADE,
        "group relative rounded-2xl border border-white/10 bg-white/3 p-7 md:p-8 overflow-hidden",
        "hover:bg-white/6 hover:border-white/20 transition-all duration-300",
      )}
      data-fade-in
      style={{ transitionDelay: delay }}
    >
      {/* Corner radial accent */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-[0.08] pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.14]"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
        aria-hidden="true"
      />

      {/* Icon pill */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 shrink-0"
        style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)` }}
      >
        {icon}
      </div>

      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{children}</p>
    </div>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-medium mb-4 text-sm">{title}</div>
      <div className="space-y-3 text-sm text-gray-500">{children}</div>
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
    <div>
      <a href={href} className="hover:text-white transition-colors">
        {children}
      </a>
    </div>
  );
}

export { DesktopFrame, MobileFrame, FADE, BADGE, APPLE, GIANT, LARGE };
