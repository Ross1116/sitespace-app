import Image from "next/image";
import type React from "react";

import { DemoRequestCTA } from "@/components/landing/ClientDynamics";

export function DashboardHero() {
  return (
    <section className="relative isolate h-[100svh] w-full overflow-hidden bg-[#f8fbfc] text-[#0b1120]">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(14,124,155,0.18)_0%,transparent_38%),radial-gradient(ellipse_at_82%_28%,rgba(0,78,137,0.14)_0%,transparent_36%),radial-gradient(ellipse_at_50%_92%,rgba(217,78,9,0.10)_0%,transparent_42%)]"
        aria-hidden="true"
      />

      <div className="relative h-full w-full max-w-full overflow-hidden bg-[linear-gradient(180deg,#f8fbfc_0%,#eef5f7_48%,#f7fafb_100%)]">
        <div className="relative flex h-full w-full max-w-full items-center overflow-hidden px-5 pb-20 pt-20 sm:px-8 sm:pb-24 sm:pt-24 lg:px-14">
          <div className="sitespace-hero-dots absolute inset-0" aria-hidden="true" />
          <div
            className="absolute inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0)_100%)]"
            aria-hidden="true"
          />

          <ProductPeek
            src="/static/images/lookaheadplan.png"
            label="Lookahead planning"
            className="hero-float-a hidden w-[306px] rotate-[-1.8deg] xl:block 2xl:w-[328px]"
            imageClassName="object-[14%_38%]"
            style={{
              left: "clamp(0.75rem, 2.7vw, 2.75rem)",
              top: "26.5%",
            }}
          />

          <ProductPeek
            src="/static/images/livecalendar.png"
            label="Live calendar"
            className="hero-float-b hidden w-[306px] rotate-[1.8deg] xl:block 2xl:w-[328px]"
            imageClassName="object-[57%_36%]"
            style={{
              right: "clamp(0.75rem, 2.7vw, 2.75rem)",
              top: "25%",
            }}
          />

          <ProductPeek
            src="/static/images/bookingspage.png"
            label="Booking demand"
            className="hero-float-c hidden w-[268px] rotate-[2.2deg] xl:block"
            imageClassName="object-[36%_34%]"
            style={{
              left: "clamp(1.5rem, 4.4vw, 4.5rem)",
              bottom: "12.5%",
            }}
          />

          <ProductPeek
            src="/static/images/dashhome.png"
            label="Site dashboard"
            className="hero-float-d hidden w-[268px] rotate-[-2.2deg] xl:block"
            imageClassName="object-[52%_34%]"
            style={{
              right: "clamp(1.5rem, 4.4vw, 4.5rem)",
              bottom: "14%",
            }}
          />

          <div className="hero-copy relative z-10 mx-auto flex w-full min-w-0 max-w-[22rem] flex-col items-center text-center sm:max-w-5xl">
            <div className="flex max-w-xs items-center gap-3 text-center text-xs font-semibold uppercase leading-5 text-[#0f2a4a]/75 sm:max-w-none md:text-sm">
              <span className="hidden h-px w-8 shrink-0 bg-[#0e7c9b]/35 sm:block" />
              Predictive logistics for construction sites
              <span className="hidden h-px w-8 shrink-0 bg-[#0e7c9b]/35 sm:block" />
            </div>

            <h1 className="mt-7 w-full font-sans text-[clamp(2rem,5.25vw,5rem)] font-black leading-[1.03] tracking-normal text-[#0b1120] sm:leading-[1.01]">
              Plan the right
              <br />
              <span className="hidden sm:inline">site move before it</span>
              <span className="sm:hidden">
                site move
                <br />
                before it
              </span>
              <br />
              <span className="sitespace-hero-wordmark">clashes</span>
            </h1>

            <p className="mt-6 w-full max-w-[22rem] px-1 text-base leading-7 text-slate-600 sm:max-w-3xl sm:px-0 sm:text-lg md:text-xl">
              Sitespace turns project activity into clear booking demand, so
              teams can reserve shared assets before the job site gets
              congested.
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

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-500">
              <span>Australian-hosted</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Built for active construction sites</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductPeek({
  src,
  label,
  className,
  imageClassName,
  style,
}: {
  src: string;
  label: string;
  className?: string;
  imageClassName?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`shine hero-window-card !absolute z-10 overflow-hidden rounded-[8px] bg-white/88 text-left shadow-[0_26px_86px_rgba(11,17,32,0.17)] backdrop-blur-md transition-all duration-400 hover:-translate-y-1.5 hover:shadow-[0_34px_100px_rgba(11,17,32,0.23)] ${className ?? ""}`}
      style={style}
    >
      <div className="flex h-8 items-center gap-2 border-b border-slate-200/70 bg-white/88 px-3">
        <span className="h-2 w-2 rounded-full bg-[#0e7c9b]" />
        <span className="h-2 w-2 rounded-full bg-[#004e89]/35" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="hero-window-title ml-1 truncate text-[11px] font-semibold text-slate-500">
          {label}
        </span>
      </div>
      <div className="relative h-[160px] 2xl:h-[172px]">
        <Image
          src={src}
          alt={`${label} preview`}
          width={520}
          height={320}
          sizes="(min-width: 1536px) 328px, 306px"
          quality={70}
          className={`h-full w-full object-cover ${imageClassName ?? ""}`}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_42%,rgba(11,17,32,0.16)_100%)]" />
      </div>
    </div>
  );
}
