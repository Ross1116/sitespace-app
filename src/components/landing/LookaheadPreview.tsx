"use client";

import { cn } from "@/lib/utils";

const FADE =
  "opacity-0 translate-y-10 transition-all duration-700 ease-in-out data-[visible]:opacity-100 data-[visible]:translate-y-0";

const BADGE =
  "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border backdrop-blur-[10px]";

export function LookaheadDashboard() {
  return (
    <div
      className={cn(
        FADE,
        "shine bg-[rgba(20,20,30,0.8)] backdrop-blur-2xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-[0_40px_100px_rgba(0,0,0,0.6),0_0_60px_rgba(0,78,137,0.35)]",
        "bg-white/3 transition-all duration-400 ease-in-out cursor-pointer hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]",
      )}
      data-fade-in
      data-progress
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-sm text-gray-500 mb-1">Lookahead Dashboard</div>
          <div className="text-2xl font-semibold">2-Week Forecast</div>
        </div>
        <div
          className={BADGE}
          style={{
            background: "rgba(34,197,94,0.2)",
            borderColor: "rgba(34,197,94,0.3)",
          }}
        >
          <span className="text-green-400">● Live</span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-6 mb-8">
        <ForecastCard
          title="Tower Crane Demand"
          badgeLabel="High"
          badgeBg="rgba(245,158,11,0.18)"
          badgeBorder="rgba(245,158,11,0.35)"
          badgeColor="#f59e0b"
          fillWidth="85%"
          fillGradient="linear-gradient(90deg, #d4a34a 0%, #f59e0b 55%, #b07a08 100%)"
          subtitle="Week of Feb 17-21"
        />
        <ForecastCard
          title="Loading Bay Usage"
          badgeLabel="Normal"
          badgeBg="rgba(34,197,94,0.2)"
          badgeBorder="rgba(34,197,94,0.3)"
          badgeColor="#4ade80"
          fillWidth="45%"
          fillGradient="linear-gradient(90deg, #4ade80 0%, #3b82f6 100%)"
          subtitle="Week of Feb 17-21"
        />
        <ForecastCard
          title="Hoist Bookings"
          badgeLabel="Low"
          badgeBg="rgba(59,130,246,0.2)"
          badgeBorder="rgba(59,130,246,0.3)"
          badgeColor="#60a5fa"
          fillWidth="25%"
          fillGradient="linear-gradient(90deg, #60a5fa 0%, #818cf8 100%)"
          subtitle="Week of Feb 17-21"
        />
      </div>

      {/* Alert */}
      <div className="bg-blue-500/10 p-5 rounded-xl border border-blue-500/20">
        <div className="flex items-start gap-4">
          <svg
            className="w-6 h-6 text-blue-400 shrink-0 mt-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-blue-200">
            <div className="font-medium mb-1">Planning Alert</div>
            <div className="text-sm">
              Facade installation starting in 3 weeks. Consider booking crane
              slots now to avoid congestion.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ForecastCard({
  title,
  badgeLabel,
  badgeBg,
  badgeBorder,
  badgeColor,
  fillWidth,
  fillGradient,
  subtitle,
}: {
  title: string;
  badgeLabel: string;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
  fillWidth: string;
  fillGradient: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="font-medium">{title}</div>
        <div
          className={BADGE}
          style={{
            background: badgeBg,
            borderColor: badgeBorder,
            color: badgeColor,
          }}
        >
          {badgeLabel}
        </div>
      </div>
      <div className="h-2 rounded bg-white/10 overflow-hidden">
        <div
          className="h-full rounded transition-[width] duration-1000 ease-in-out"
          data-progress-fill
          data-width={fillWidth}
          style={{ width: 0, background: fillGradient }}
        />
      </div>
      <div className="text-sm text-gray-500 mt-3">{subtitle}</div>
    </div>
  );
}
