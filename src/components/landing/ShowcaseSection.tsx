"use client";

import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  CalendarX,
  HardHat,
  ListChecks,
  MapPin,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const FADE =
  "opacity-0 translate-y-10 transition-all duration-700 ease-in-out data-[visible]:opacity-100 data-[visible]:translate-y-0";

const quickAccess = [
  {
    title: "Calendar",
    count: "42",
    subtitle: "7 events today",
    icon: Calendar,
    className: "bg-navy",
  },
  {
    title: "Assets",
    count: "18",
    subtitle: "Active on site",
    icon: HardHat,
    className: "bg-(--navy-deep)",
  },
  {
    title: "Subcontractor",
    count: "24",
    subtitle: "Active",
    icon: Users,
    className: "bg-(--brand-blue)",
  },
  {
    title: "Bookings",
    count: "42",
    subtitle: "14 pending",
    icon: ListChecks,
    className: "bg-teal",
  },
];

export function ShowcaseSection() {
  return (
    <section
      id="dashboard"
      className="px-6 py-16 md:py-30"
      style={{
        background:
          "linear-gradient(180deg, #000 0%, #08111f 46%, #000 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div
          className={cn(FADE, "mx-auto mb-10 max-w-4xl text-center")}
          data-fade-in
        >
          <div className="mb-6 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur-[10px]">
            Product Dashboard
          </div>
          <h2 className="mb-6 text-[clamp(2rem,6vw,5rem)] font-bold leading-[1.2] tracking-normal">
            The same workspace
            <br />
            <span className="gradient-text">your team opens every day</span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl font-normal text-gray-400">
            The landing preview now mirrors the in-app Home dashboard: quick
            access cards, upcoming bookings, and project notices in the same
            visual system.
          </p>
        </div>

        <div className={cn(FADE, "relative")} data-fade-in>
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-(--page-bg) p-3 text-slate-800 shadow-[0_40px_120px_rgba(0,0,0,0.55)] sm:p-4 lg:p-5">
            <div className="grid min-h-[620px] gap-4 lg:grid-cols-[80px_minmax(0,1fr)]">
              <DashboardRail />

              <div className="min-w-0 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">
                      Barangaroo Tower
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-500">
                      <MapPin size={14} className="text-slate-300" />
                      Sydney, NSW
                    </p>
                  </div>
                  <button
                    type="button"
                    className="h-11 w-fit rounded-lg bg-navy px-5 text-sm font-semibold text-white shadow-md shadow-slate-900/10"
                  >
                    Switch Project
                  </button>
                </div>

                <div className="mt-7">
                  <h4 className="mb-4 text-lg font-bold text-slate-900">
                    Quick Access
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {quickAccess.map((item) => (
                      <QuickAccessCard key={item.title} {...item} />
                    ))}
                  </div>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-12">
                  <div className="lg:col-span-8">
                    <div className="mb-3 flex items-end justify-between">
                      <h4 className="text-xl font-bold text-slate-900">
                        Upcoming Bookings
                      </h4>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        June
                      </span>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div className="space-y-3">
                        <DashboardBookingRow
                          day="18"
                          dayOfWeek="Tue"
                          title="Facade panel delivery"
                          time="09:00 - 12:30"
                          asset="Tower Crane 01"
                          bookedBy="Northline Facades"
                          status="pending"
                        />
                        <DashboardBookingRow
                          day="19"
                          dayOfWeek="Wed"
                          title="Services riser install"
                          time="13:00 - 15:00"
                          asset="Hoist 02"
                          bookedBy="Site Manager"
                          status="confirmed"
                        />
                        <DashboardBookingRow
                          day="21"
                          dayOfWeek="Fri"
                          title="Plant room delivery"
                          time="07:30 - 10:00"
                          asset="Loading Bay B"
                          bookedBy="Mechanical Services"
                          status="confirmed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4">
                    <div className="mb-3 flex items-end justify-between">
                      <h4 className="text-xl font-bold text-slate-900">
                        Upcoming Holidays & RDOs
                      </h4>
                    </div>
                    <div className="flex min-h-80 flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          NSW calendar
                        </span>
                      </div>
                      <div className="space-y-3">
                        <NoticeRow
                          title="Rostered Day Off"
                          detail="Friday, Jun 28"
                        />
                        <NoticeRow
                          title="Public Holiday"
                          detail="Monday, Aug 4"
                        />
                        <NoticeRow
                          title="Site shutdown"
                          detail="Friday, Dec 20"
                        />
                      </div>
                      <div className="mt-auto flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-100 p-4 text-sm text-slate-400">
                        <CalendarX size={20} />
                        No other notices in this window
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardRail() {
  const items = [Calendar, Users, HardHat, ListChecks];

  return (
    <aside className="hidden rounded-2xl border border-white/5 bg-navy py-6 shadow-2xl lg:flex lg:flex-col lg:items-center lg:gap-3">
      <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
        <Image
          src="/icon.svg"
          alt="Sitespace"
          width={28}
          height={28}
          className="h-7 w-7"
        />
      </div>
      {items.map((Icon, index) => (
        <div
          key={index}
          className={cn(
            "flex h-12 w-full items-center justify-center border-l-3",
            index === 0
              ? "border-teal bg-gradient-to-r from-(--teal-gradient-strong) to-transparent text-white"
              : "border-transparent text-gray-400",
          )}
        >
          <Icon size={20} strokeWidth={1.5} />
        </div>
      ))}
    </aside>
  );
}

function QuickAccessCard({
  title,
  count,
  subtitle,
  icon: Icon,
  className,
}: {
  title: string;
  count: string;
  subtitle: string;
  icon: LucideIcon;
  className: string;
}) {
  return (
    <div
      className={cn(
        "flex h-32 flex-col justify-center rounded-lg border-none p-5 text-white shadow-lg shadow-slate-900/10",
        className,
      )}
    >
      <div className="flex h-full items-center justify-between">
        <Icon className="h-10 w-10 opacity-90" strokeWidth={1.5} />
        <div className="flex flex-col items-end justify-center">
          <span className="mb-1 text-sm font-medium opacity-90">{title}</span>
          <span className="mb-1 text-4xl font-bold leading-none">{count}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
}

function DashboardBookingRow({
  day,
  dayOfWeek,
  title,
  time,
  asset,
  bookedBy,
  status,
}: {
  day: string;
  dayOfWeek: string;
  title: string;
  time: string;
  asset: string;
  bookedBy: string;
  status: "pending" | "confirmed";
}) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-transparent bg-(--surface-subtle)">
      <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r border-slate-200 bg-slate-50/50 px-1">
        <div
          className={cn(
            "text-[11px] font-medium uppercase",
            status === "pending" ? "text-yellow-500" : "text-slate-500",
          )}
        >
          {dayOfWeek}
        </div>
        <div
          className={cn(
            "text-3xl font-bold",
            status === "pending" ? "text-yellow-500" : "text-slate-800",
          )}
        >
          {day}
        </div>
      </div>
      <div className="min-w-0 flex-1 p-3.5 pl-4">
        <div className="mb-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
          <h5 className="min-w-0 truncate text-sm font-bold text-slate-900">
            {title}
          </h5>
          <span
            className={cn(
              "w-fit rounded px-2 py-0.5 text-[10px] font-bold capitalize tracking-wide",
              status === "confirmed"
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700",
            )}
          >
            {status}
          </span>
        </div>
        <div className="text-xs font-medium text-slate-500">{time}</div>
        <div className="mt-2 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs">
          <span className="font-semibold text-blue-700">{asset}</span>
          <span className="text-slate-500">Booked by: {bookedBy}</span>
        </div>
      </div>
    </div>
  );
}

function NoticeRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{detail}</div>
    </div>
  );
}
