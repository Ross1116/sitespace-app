import Image from "next/image";
import type React from "react";

import { cn } from "@/lib/utils";

import "./LandingPage.css";

import { NavBar } from "@/components/landing/TopBar";
import { HeroParallax } from "@/components/landing/HeroParallax";
import { WatchVideoButton } from "@/components/landing/WatchVideoButton";
import {
  ScrollAnimations,
  HeroOrbs,
  LookaheadDashboard,
  ShowcaseSection,
} from "@/components/landing/ClientDynamics";

const FADE =
  "opacity-0 translate-y-10 transition-all duration-700 ease-in-out data-[visible]:opacity-100 data-[visible]:translate-y-0";

const GIANT =
  "text-[clamp(2rem,6vw,7rem)] font-extrabold leading-[1.1] tracking-tight";

const LARGE =
  "text-[clamp(2rem,6vw,5rem)] font-bold leading-[1.2] tracking-tight";

const MEDIUM = "text-[clamp(1.5rem,4vw,3rem)] font-semibold leading-[1.3]";

const APPLE =
  "transition-all duration-[400ms] ease-in-out cursor-pointer hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]";

const BADGE =
  "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-white/10 border border-white/20 backdrop-blur-[10px]";

const CHECK_ICON_CLS =
  "w-6 h-6 shrink-0 bg-[var(--brand-blue)] rounded-full flex items-center justify-center";

export default function LandingPage() {
  const year = new Date().getFullYear();

  return (
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

      <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[linear-gradient(rgba(0,0,0,0.85),rgba(0,0,0,0.9))] grid-bg">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          aria-hidden="true"
        >
          <HeroOrbs />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <HeroParallax>
              <div className={cn(BADGE, "mb-6")}>
                <span>🚀 Introducing AI-Powered Lookahead Planning</span>
              </div>
              <h1 className={cn(GIANT, "mb-6")}>
                The future of
                <br />
                construction
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mb-10 font-normal">
                Program driven predictive logistics intelligence tool
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#demo"
                  className="shine bg-amber-500 text-black rounded-full px-6 py-3 text-[17px] font-semibold inline-flex items-center justify-center hover:scale-[1.02] transition-transform"
                >
                  Book a Demo
                </a>
                <WatchVideoButton />
              </div>
            </HeroParallax>

            <div className="animate-fade-in-up [animation-delay:0.2s] [animation-fill-mode:both]">
              <DesktopFrame className="shine md:[transform:perspective(1000px)_rotateY(-5deg)]">
                <Image
                  src="/static/images/Lookaheaddash.jpeg"
                  alt="SiteSpace Lookahead dashboard"
                  width={800}
                  height={500}
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={75}
                  className="block w-full"
                />
              </DesktopFrame>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-[120px]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: "85%", label: "Fewer conflicts" },
              { value: "2-4", label: "Weeks advance notice" },
              { value: "60%", label: "Time saved" },
              { value: "100%", label: "Audit trail" },
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
            <DesktopFrame className="shine max-w-[720px] mx-auto">
              <Image
                src="/static/images/dashtwo.jpeg"
                alt="SiteSpace dashboard showing bookings and assets"
                width={720}
                height={450}
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 720px"
                quality={75}
                className="w-full h-auto object-contain"
              />
            </DesktopFrame>
          </div>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center relative bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className={cn(FADE, "order-2 md:order-1")} data-fade-in>
            <DesktopFrame className="shine">
              <Image
                src="/static/images/cal.jpg"
                alt="SiteSpace subcontractors management dashboard"
                width={720}
                height={450}
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 720px"
                quality={75}
                className="w-full h-auto"
              />
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
            <div className={cn(BADGE, "mb-8")}>✨ Powered by AI</div>
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

      <section className="px-6 py-16 md:py-[120px]">
        <div className="max-w-6xl mx-auto">
          <LookaheadDashboard />
        </div>
      </section>

      <section className="px-6 py-16 md:py-[120px]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <FeatureBlurb
              title={
                <>
                  Program
                  <br />
                  Integration
                </>
              }
              delay="0s"
            >
              Upload from Primavera P6, MS Project, or PDF. We analyze upcoming
              milestones and identify asset needs automatically.
            </FeatureBlurb>
            <FeatureBlurb
              title={
                <>
                  Smart
                  <br />
                  Forecasting
                </>
              }
              delay="0.1s"
            >
              AI identifies which activities need cranes, bays, or hoists.
              Predicts congestion weeks in advance, not after it happens.
            </FeatureBlurb>
            <FeatureBlurb
              title={
                <>
                  Proactive
                  <br />
                  Alerts
                </>
              }
              delay="0.2s"
            >
              Neutral, actionable notifications. Weekly digests keep teams
              informed without overwhelming them.
            </FeatureBlurb>
            <FeatureBlurb
              title={
                <>
                  Zero
                  <br />
                  Risk
                </>
              }
              delay="0.3s"
            >
              Read-only program access. No edits, no overrides. Complete audit
              trail for compliance and claims defense.
            </FeatureBlurb>
          </div>
        </div>
      </section>

      <section
        className="px-6 py-16 md:py-[120px]"
        style={{
          background: "linear-gradient(180deg, #0a0a14 0%, #000 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <div className={FADE} data-fade-in>
            <div className={cn(BADGE, "mb-8")}>🔮 Coming Soon</div>
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
        className="px-6 py-16 md:py-[120px]"
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

      <ShowcaseSection />

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
              <button
                type="button"
                className="bg-amber-500 text-black rounded-full px-6 py-3 text-[17px] font-semibold hover:scale-[1.02] transition-transform"
              >
                Schedule a Demo
              </button>
              <button
                type="button"
                className="bg-transparent text-amber-500 border-2 border-amber-500 rounded-full px-[22px] py-[10px] text-[17px] font-semibold hover:bg-amber-500 hover:text-black transition-colors"
              >
                Contact Sales
              </button>
            </div>
            <p className="text-gray-600 text-sm">
              Australian-hosted · Enterprise-ready · Implementation support
              included
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-[60px] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/full-logo-dark.svg"
                  alt="SiteSpace"
                  width={140}
                  height={48}
                  loading="lazy"
                  className="h-9 w-auto block"
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
              <div>© {year} SiteSpace. All rights reserved.</div>
              <a
                href="https://sitespace.com.au"
                className="hover:text-white transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                sitespace.com.au
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
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
        "relative w-full max-w-[375px] mx-auto bg-[rgb(26,26,26)] rounded-[50px] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.6)]",
        APPLE,
        "shine",
        className,
      )}
      style={style}
    >
      <div
        className="absolute top-2 left-1/2 -translate-x-1/2 w-[120px] h-[25px] bg-[rgb(26,26,26)] rounded-b-[20px] z-[2]"
        aria-hidden="true"
      />
      <div className="rounded-[38px] overflow-hidden">{children}</div>
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
  title,
  children,
  delay,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  delay: string;
}) {
  return (
    <div className={FADE} data-fade-in style={{ transitionDelay: delay }}>
      <h3 className={cn(MEDIUM, "mb-4")}>{title}</h3>
      <p className="text-lg text-gray-400 font-normal leading-relaxed">
        {children}
      </p>
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
