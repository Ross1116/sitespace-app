import type { CapacityStatus } from "@/types";

type StatusStyle = {
  cell: string;
  badge: string;
  label: string;
};

export const STATUS_STYLES: Record<CapacityStatus, StatusStyle> = {
  idle: {
    cell: "bg-slate-50 text-slate-400",
    badge: "bg-slate-100 text-slate-500",
    label: "Idle",
  },
  under_utilised: {
    cell: "bg-sky-50 text-sky-700",
    badge: "bg-sky-100 text-sky-700",
    label: "Under-utilised",
  },
  balanced: {
    cell: "bg-emerald-50 text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Balanced",
  },
  tight: {
    cell: "bg-amber-50 text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    label: "Tight",
  },
  over_capacity: {
    cell: "bg-red-50 text-red-700",
    badge: "bg-red-100 text-red-700",
    label: "Over",
  },
  no_capacity: {
    cell: "bg-slate-100 text-slate-400",
    badge: "bg-slate-200 text-slate-500",
    label: "No capacity",
  },
  review_needed: {
    cell: "bg-orange-50 text-orange-700",
    badge: "bg-orange-100 text-orange-700",
    label: "Review",
  },
};

const VALID_CAPACITY_STATUSES = new Set<CapacityStatus>(
  Object.keys(STATUS_STYLES) as CapacityStatus[],
);

export function resolveCapacityStatus(status: string | null | undefined): CapacityStatus {
  return status && VALID_CAPACITY_STATUSES.has(status as CapacityStatus)
    ? (status as CapacityStatus)
    : "review_needed";
}

export function formatUtilPct(value: number): string {
  return `${Math.round(Number.isFinite(value) ? value : 0)}%`;
}

export function isCompact(weekCount: number): boolean {
  return weekCount > 10;
}
