"use client";

import { memo, useMemo } from "react";
import useSWR from "swr";
import {
  addMonths,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";
import { CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProjectNonWorkingDays } from "@/hooks/projects/api";
import { SWR_CONFIG } from "@/lib/swr";
import type { ProjectNonWorkingDay } from "@/types";

interface UpcomingHolidaysSectionProps {
  projectId: string;
  regionCode?: string | null;
}

const HOLIDAY_LIMIT = 8;
const DEFAULT_RDO_ANCHOR = "2026-01-26";
const RDO_ANCHORS: Record<string, string> = {
  QLD: "2026-01-19",
};

function formatHolidayDate(value: string): string {
  try {
    return format(parseISO(value), "EEE, d MMM");
  } catch {
    return value;
  }
}

function getRelativeDay(value: string, today: Date): string {
  try {
    const daysAway = differenceInCalendarDays(parseISO(value), today);
    if (daysAway === 0) return "Today";
    if (daysAway === 1) return "Tomorrow";
    return `In ${daysAway} days`;
  } catch {
    return "Upcoming";
  }
}

function formatSource(source: string): string {
  const normalizedSource = source.trim().toLowerCase();
  if (normalizedSource === "regional") return "Regional";
  if (normalizedSource === "regional_public_holiday") return "Regional";
  if (normalizedSource === "regional_rdo") return "Regional RDO";
  if (normalizedSource === "manual") return "Manual";
  if (!normalizedSource) return "Calendar";
  return `${normalizedSource.charAt(0).toUpperCase()}${normalizedSource.slice(1)}`;
}

function formatKind(kind: string): string {
  return kind.trim().toLowerCase() === "rdo" ? "RDO" : "Holiday";
}

function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function nextWorkingDate(date: Date, blockedDates: Set<string>): Date {
  const candidate = new Date(date);
  while (isWeekend(candidate) || blockedDates.has(toDateKey(candidate))) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}

function buildFallbackRdoDays(params: {
  regionCode?: string | null;
  dateFrom: string;
  dateTo: string;
  blockedDates: Set<string>;
}): ProjectNonWorkingDay[] {
  const region = params.regionCode?.trim().toUpperCase() || "SA";
  const anchor = parseISO(RDO_ANCHORS[region] ?? DEFAULT_RDO_ANCHOR);
  const from = parseISO(params.dateFrom);
  const to = parseISO(params.dateTo);
  const generated: ProjectNonWorkingDay[] = [];
  const cursor = new Date(anchor);

  while (cursor.getTime() + 28 * 24 * 60 * 60 * 1000 < from.getTime()) {
    cursor.setDate(cursor.getDate() + 28);
  }

  while (cursor <= to) {
    const adjusted = nextWorkingDate(cursor, params.blockedDates);
    const key = toDateKey(adjusted);
    if (key >= params.dateFrom && key <= params.dateTo) {
      generated.push({
        id: null,
        project_id: "",
        calendar_date: key,
        label: "Rostered Day Off (RDO)",
        kind: "rdo",
        source: "regional_rdo",
      });
    }
    cursor.setDate(cursor.getDate() + 28);
  }

  return generated;
}

const CalendarDayCard = memo(function CalendarDayCard({
  day,
  today,
}: {
  day: ProjectNonWorkingDay;
  today: Date;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-(--surface-subtle) px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {day.label}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {formatHolidayDate(day.calendar_date)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal shadow-sm ring-1 ring-teal-100">
            {getRelativeDay(day.calendar_date, today)}
          </span>
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {formatKind(day.kind)}
          </span>
        </div>
      </div>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {formatSource(day.source)}
      </p>
    </div>
  );
});

export function UpcomingHolidaysSection({
  projectId,
  regionCode,
}: UpcomingHolidaysSectionProps) {
  const normalizedRegionCode = regionCode?.trim().toUpperCase();
  const dateRange = useMemo(() => {
    const today = new Date();
    return {
      from: format(today, "yyyy-MM-dd"),
      to: format(addMonths(today, 12), "yyyy-MM-dd"),
      today,
    };
  }, []);

  const { data, isLoading, error } = useSWR<ProjectNonWorkingDay[]>(
    projectId
      ? [
          "project-non-working-days",
          projectId,
          dateRange.from,
          dateRange.to,
          "include-regional",
          "include-rdo",
          normalizedRegionCode ?? "region-auto",
        ]
      : null,
    () =>
      fetchProjectNonWorkingDays({
        projectId,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        includeRegional: true,
        includeRdo: true,
      }),
    SWR_CONFIG,
  );

  const calendarDays = useMemo(
    () => {
      const apiDays = data ?? [];
      const blockedDates = new Set(
        apiDays
          .filter((day) => day.kind.toLowerCase() === "holiday")
          .map((day) => day.calendar_date),
      );
      const hasApiRdos = apiDays.some(
        (day) => day.kind.toLowerCase() === "rdo",
      );
      const fallbackRdos = hasApiRdos
        ? []
        : buildFallbackRdoDays({
            regionCode: normalizedRegionCode,
            dateFrom: dateRange.from,
            dateTo: dateRange.to,
            blockedDates,
          });
      const byDateAndKind = new Map<string, ProjectNonWorkingDay>();

      for (const day of [...apiDays, ...fallbackRdos]) {
        byDateAndKind.set(`${day.kind.toLowerCase()}:${day.calendar_date}`, day);
      }

      return Array.from(byDateAndKind.values())
        .filter((day) => day.calendar_date >= dateRange.from)
        .filter((day) => ["holiday", "rdo"].includes(day.kind.toLowerCase()))
        .sort((a, b) => a.calendar_date.localeCompare(b.calendar_date))
        .slice(0, HOLIDAY_LIMIT);
    },
    [data, dateRange.from, dateRange.to, normalizedRegionCode],
  );

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">
          Upcoming Holidays & RDOs
        </h2>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal">
          <CalendarDays className="h-4 w-4" />
        </div>
      </div>

      <div className="flex min-h-100 flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Next 12 months
          </span>
          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 shadow-sm ring-1 ring-slate-200">
            {normalizedRegionCode ? `AU ${normalizedRegionCode}` : "AU holidays"}
          </span>
        </div>

        {error ? (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
            role="alert"
          >
            Failed to load holidays. Please try again later.
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-17 w-full rounded-xl" />
            ))}
          </div>
        ) : calendarDays.length > 0 ? (
          <div className="space-y-3">
            {calendarDays.map((day) => (
              <CalendarDayCard
                key={`${day.source}-${day.calendar_date}-${day.label}`}
                day={day}
                today={dateRange.today}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-100 px-6 py-12 text-center">
            <p className="text-sm text-slate-400">
              No upcoming holidays or RDOs returned for this project.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
