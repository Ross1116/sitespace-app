"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type View = "desktop" | "mobile" | "combined";

const FADE =
  "opacity-0 translate-y-10 transition-all duration-700 ease-in-out data-[visible]:opacity-100 data-[visible]:translate-y-0";

const APPLE =
  "transition-all duration-[400ms] ease-in-out cursor-pointer hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]";

const INTERACTIVE =
  "relative overflow-hidden rounded-3xl after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(135deg,rgba(14,124,155,0.1),rgba(0,78,137,0.12))] after:opacity-0 after:transition-opacity after:duration-300 hover:after:opacity-100 after:pointer-events-none";

export function ShowcaseSection() {
  const [view, setView] = useState<View>("desktop");

  const tabs: { key: View; label: string }[] = [
    { key: "desktop", label: "🖥️ Desktop Dashboard" },
    { key: "mobile", label: "📱 Mobile App" },
    { key: "combined", label: "🔄 Multi-Device View" },
  ];

  return (
    <section
      className="px-6 py-16 md:py-30"
      style={{
        background: "linear-gradient(180deg, #000 0%, #0a0a14 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={cn(FADE, "text-center mb-16")} data-fade-in>
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-white/10 border border-white/20 backdrop-blur-[10px] mb-6">
            💼 Full Platform Overview
          </div>
          <h2 className="text-[clamp(2rem,6vw,5rem)] font-bold leading-[1.2] tracking-tight mb-6">
            Explore SiteSpace
            <br />
            <span className="gradient-text">in action</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto font-normal">
            See how teams manage construction projects across desktop and mobile
          </p>
        </div>

        {/* Tabs */}
        <div
          className={cn(FADE, "flex gap-3 mb-8 justify-center flex-wrap")}
          data-fade-in
          style={{ transitionDelay: "0.2s" }}
          role="tablist"
          aria-label="Product showcase"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={cn(
                "px-6 py-3 rounded-full text-sm font-semibold border transition-all duration-300 cursor-pointer",
                view === tab.key
                  ? "bg-brand-blue border-brand-blue text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/[0.08] hover:border-white/20 hover:text-[rgb(245,245,247)]",
              )}
              onClick={() => setView(tab.key)}
              role="tab"
              aria-selected={view === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Desktop ── */}
        {view === "desktop" && (
          <div className="animate-showcase-fade" role="tabpanel">
            <div
              className={cn(
                "bg-[rgb(42,42,42)] rounded-xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)]",
                APPLE,
                INTERACTIVE,
                "shine",
              )}
            >
              <FrameHeader />
              <Image
                src="/static/images/desk.png"
                alt="SiteSpace desktop dashboard interface"
                width={1200}
                height={750}
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 1200px"
                quality={75}
                className="w-full h-auto block"
              />
            </div>
            <div className="text-center mt-8">
              <h3 className="text-2xl font-semibold mb-3">
                Powerful Desktop Experience
              </h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Comprehensive project overview, calendar management, and
                real-time booking updates all in one place
              </p>
            </div>
          </div>
        )}

        {/* ── Mobile ── */}
        {view === "mobile" && (
          <div className="animate-showcase-fade" role="tabpanel">
            <div className="max-w-md mx-auto">
              <div
                className={cn(
                  "relative w-full max-w-95 mx-auto bg-[rgb(26,26,26)] rounded-12.5 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.6)]",
                  APPLE,
                  INTERACTIVE,
                  "shine",
                )}
              >
                <div
                  className="absolute top-2 left-1/2 -translate-x-1/2 w-30 h-6.25 bg-[rgb(26,26,26)] rounded-b-5 z-2"
                  aria-hidden="true"
                />
                <div className="rounded-9.5 overflow-hidden">
                  <Image
                    src="/static/images/mobile.png"
                    alt="SiteSpace mobile app interface"
                    width={380}
                    height={780}
                    loading="lazy"
                    sizes="380px"
                    quality={75}
                    className="w-full block"
                  />
                </div>
              </div>
              <div className="text-center mt-8">
                <h3 className="text-2xl font-semibold mb-3">
                  Work from Anywhere
                </h3>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Full functionality on the go — book assets, check schedules,
                  and manage subcontractors from your phone
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Combined ── */}
        {view === "combined" && (
          <div className="animate-showcase-fade" role="tabpanel">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div
                className={cn(
                  "bg-[rgb(42,42,42)] rounded-xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)]",
                  APPLE,
                  INTERACTIVE,
                  "shine",
                )}
              >
                <FrameHeader />
                <Image
                  src="/static/images/desk.png"
                  alt="SiteSpace desktop interface"
                  width={1200}
                  height={750}
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  quality={75}
                  className="w-full h-auto block"
                />
              </div>
              <div
                className={cn(
                  "relative w-full max-w-85 mx-auto bg-[rgb(26,26,26)] rounded-12.5 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.6)]",
                  APPLE,
                  INTERACTIVE,
                  "shine",
                )}
              >
                <div
                  className="absolute top-2 left-1/2 -translate-x-1/2 w-30 h-6.25 bg-[rgb(26,26,26)] rounded-b-5 z-2"
                  aria-hidden="true"
                />
                <div className="rounded-9.5 overflow-hidden">
                  <Image
                    src="/static/images/mobile.png"
                    alt="SiteSpace mobile interface"
                    width={340}
                    height={700}
                    loading="lazy"
                    sizes="340px"
                    quality={75}
                    className="w-full block"
                  />
                </div>
              </div>
            </div>
            <div className="text-center mt-12">
              <h3 className="text-2xl font-semibold mb-3">
                Seamless Cross-Platform Sync
              </h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Changes made on desktop instantly appear on mobile. Your team
                stays in sync, no matter which device they use
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FrameHeader() {
  return (
    <div className="bg-[rgb(26,26,26)] px-4 py-3 flex items-center gap-2">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
      </div>
    </div>
  );
}
