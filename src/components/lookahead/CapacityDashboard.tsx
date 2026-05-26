"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  Layers3,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useResolvedProjectSelection } from "@/hooks/useResolvedProjectSelection";
import { useProjectAssets } from "@/hooks/useProjectAssets";
import { fetchProject } from "@/hooks/projects/api";
import {
  useCapacityDashboard,
  useLookaheadSnapshot,
} from "@/hooks/lookahead/useLookaheadQueries";
import {
  type CapacityCell,
  type CapacityDashboardResponse,
  type CapacityStatus,
  type CapacityWeekSummary,
  type ApiProject,
  getApiErrorMessage,
} from "@/types";
import {
  type CapacityWindowSize,
  useUIIntentStore,
} from "@/stores/uiIntentStore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatAssetType,
  formatWeekRange,
  pivotRows,
} from "./utils";
import {
  STATUS_STYLES,
  formatUtilPct,
  isCompact,
  resolveCapacityStatus,
} from "./capacityUtils";
import { formatProjectLocalAssetName } from "@/lib/assetDisplay";

const WINDOW_WEEKS: Record<CapacityWindowSize, number> = {
  "2W": 2,
  "4W": 4,
  "52W": 52,
};

function isCapacityWindowSize(value: unknown): value is CapacityWindowSize {
  return typeof value === "string" && Object.hasOwn(WINDOW_WEEKS, value);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMonthLabel(value: string): string {
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return value;
  }

  return parsed.toLocaleDateString("en-AU", {
    month: "short",
  });
}

function formatHours(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

function currentMondayISO(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);
  return monday.toLocaleDateString("en-CA");
}

function normalizeToMondayISO(value: string | null | undefined): string | null {
  if (!value) return null;

  const normalizedValue = value.slice(0, 10);
  const match = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, yearRaw, monthRaw, dayRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  const dayOfWeek = date.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setDate(date.getDate() + daysToMonday);
  return date.toLocaleDateString("en-CA");
}

function shiftMondayISO(value: string, weekDelta: number): string {
  const normalized = normalizeToMondayISO(value) ?? currentMondayISO();
  const [yearRaw, monthRaw, dayRaw] = normalized.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + weekDelta * 7);
  return date.toLocaleDateString("en-CA");
}

function getDisplayDemandUtilizationPct(cell: CapacityCell): number | null {
  if (cell.capacity_hours <= 0) {
    return cell.demand_hours > 0 ? null : 0;
  }

  return (cell.demand_hours / cell.capacity_hours) * 100;
}

function stripTrailingNumber(value: string): string {
  return value.replace(/\s+\d+$/, "").trim();
}

function normalizeAssetTypeKey(value: string | null | undefined): string {
  return stripTrailingNumber(formatProjectLocalAssetName(value ?? ""))
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatCapacityAssetType(value: string): string {
  return formatAssetType(
    stripTrailingNumber(formatProjectLocalAssetName(value)),
  );
}

type UtilizationTone = {
  surface: string;
  badge: string;
  value: string;
  meta: string;
};

const UTILIZATION_TONES: Record<"healthy" | "watch" | "critical", UtilizationTone> =
  {
    healthy: {
      surface:
        "border-[#b7e4cf] bg-[#ecfdf5] text-[#14532d] shadow-[0_12px_28px_-24px_rgba(20,83,45,0.28)]",
      badge: "bg-[#dff7eb] text-[#166534]",
      value: "text-[#14532d]",
      meta: "text-[#166534]/75",
    },
    watch: {
      surface:
        "border-[#fed7aa] bg-[#fff7ed] text-[#9a3412] shadow-[0_12px_28px_-24px_rgba(154,52,18,0.24)]",
      badge: "bg-[#ffedd5] text-[#9a3412]",
      value: "text-[#9a3412]",
      meta: "text-[#9a3412]/75",
    },
    critical: {
      surface:
        "border-[#fecaca] bg-[#fef2f2] text-[#991b1b] shadow-[0_12px_28px_-24px_rgba(153,27,27,0.24)]",
      badge: "bg-[#fee2e2] text-[#991b1b]",
      value: "text-[#991b1b]",
      meta: "text-[#991b1b]/75",
    },
  };

function getUtilizationTone(value: number | null | undefined): UtilizationTone | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (value <= 0) return null;
  if (value >= 100) return UTILIZATION_TONES.critical;
  if (value >= 90) return UTILIZATION_TONES.watch;
  if (value < 90) return UTILIZATION_TONES.healthy;
  return null;
}

function getFallbackMetaTone(status: CapacityStatus): string {
  switch (status) {
    case "no_capacity":
      return "text-slate-500";
    case "review_needed":
      return "text-orange-700/80";
    case "idle":
      return "text-slate-400";
    default:
      return "text-slate-500";
  }
}

function MinimalYearSummary({
  data,
  projectStartDate,
  gapWeekCount,
}: {
  data: CapacityDashboardResponse;
  projectStartDate: string | null;
  gapWeekCount: number;
}) {
  return (
    <section className="grid gap-2 md:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Avg utilization
        </p>
        <p className="mt-1 text-lg font-black tabular-nums text-slate-950">
          {Math.round(data.headline_summary.avg_utilization_pct)}%
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Weeks with gaps
        </p>
        <p className="mt-1 text-lg font-black tabular-nums text-slate-950">
          {gapWeekCount}
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Uncovered demand
        </p>
        <p className="mt-1 text-lg font-black tabular-nums text-slate-950">
          {formatHours(data.headline_summary.demand_without_capacity_hours)}h
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Start point
        </p>
        <p className="mt-1 text-sm font-bold text-slate-950">
          {projectStartDate ? "Project start" : "First programme week"}
        </p>
      </div>
    </section>
  );
}

function CapacityStatCards({ data }: { data: CapacityDashboardResponse }) {
  const summary = data.headline_summary;

  const cards: Array<{
    label: string;
    value: string;
    cardClass: string;
    tone: string;
    detail: string | null;
    detailTone?: string;
  }> = [
    {
      label: "Total demand hours",
      value: `${formatHours(summary.total_demand_hours)}h`,
      cardClass:
        "border-slate-200/80 bg-linear-to-br from-white via-white to-slate-50",
      tone: "text-slate-950",
      detail: null,
    },
    {
      label: "Total capacity hours",
      value: `${formatHours(summary.total_capacity_hours)}h`,
      cardClass:
        "border-slate-200/80 bg-linear-to-br from-white via-white to-slate-50",
      tone: "text-slate-950",
      detail: null,
    },
    {
      label: "Capacity-backed utilization",
      value: `${Math.round(summary.avg_utilization_pct)}%`,
      cardClass:
        "border-slate-200/80 bg-linear-to-br from-white via-white to-slate-50",
      tone: "text-slate-950",
      detail:
        summary.demand_without_capacity_hours > 0
          ? `${formatHours(summary.demand_without_capacity_hours)}h has no capacity`
          : null,
      detailTone: "text-slate-500",
    },
    {
      label: "Weeks with gaps",
      value: String(summary.weeks_with_gaps),
      cardClass:
        "border-slate-200/80 bg-linear-to-br from-white via-white to-slate-50",
      tone: "text-slate-950",
      detail: null,
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-[24px] border p-4 shadow-[0_20px_44px_-40px_rgba(15,23,42,0.28)] ${card.cardClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {card.label}
          </p>
          <p className={`mt-2.5 text-[1.7rem] font-black tracking-tight ${card.tone}`}>
            {card.value}
          </p>
          {card.detail ? (
            <p
              className={`mt-1.5 text-xs font-medium ${
                card.detailTone ?? "text-slate-500"
              }`}
            >
              {card.detail}
            </p>
          ) : null}
        </div>
      ))}
    </section>
  );
}

function CapacityCellCard({
  cell,
  compact,
}: {
  cell: CapacityCell | undefined;
  compact: boolean;
}) {
  if (!cell) {
    return (
      <div className="flex h-full min-h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-300">
        No demand
      </div>
    );
  }
  const styles = STATUS_STYLES[cell.status];
  const displayUtilizationPct = getDisplayDemandUtilizationPct(cell);
  const tone = getUtilizationTone(displayUtilizationPct);
  const metaTone = tone ? tone.meta : getFallbackMetaTone(cell.status);

  return (
    <div
      className={`relative flex min-h-20 flex-col justify-between rounded-lg border px-3 py-2.5 ${
        tone
          ? tone.surface
          : `${styles.cell} border-slate-200/80`
      } ${compact ? "min-h-20" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${metaTone}`}
        >
          Demand
        </span>
        <span className="text-[10px] font-medium text-slate-300">
          {compact ? "Util" : "Utilization"}
        </span>
      </div>

      <div className="flex-1 pt-1.5">
        <p
          className={`font-black tabular-nums tracking-tight ${
            tone ? tone.value : ""
          } ${compact ? "text-base leading-none" : "text-[1.55rem] leading-none"}`}
        >
          {displayUtilizationPct === null
            ? "—"
            : formatUtilPct(displayUtilizationPct)}
        </p>
      </div>

      <div className="flex items-end justify-between gap-2">
        {!compact ? (
          <span className={`text-[10px] font-medium ${metaTone}`}>
            {formatHours(cell.demand_hours)}h / {formatHours(cell.capacity_hours)}h
          </span>
        ) : (
          <span className={`text-[10px] font-medium ${metaTone}`}>
            {formatHours(cell.uncovered_demand_hours)}h gap
          </span>
        )}
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold ${
            tone ? tone.badge : styles.badge
          }`}
        >
          {styles.label}
        </span>
      </div>
    </div>
  );
}

function CapacityWeekSummaryCell({
  summary,
}: {
  summary: CapacityWeekSummary;
}) {
  const status = resolveCapacityStatus(summary.worst_status);
  const styles = STATUS_STYLES[status];

  return (
    <div className="flex min-h-20 flex-col justify-between rounded-lg border border-slate-200/80 bg-white px-3 py-2.5 text-slate-700">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold ${styles.badge}`}
        >
          {STATUS_STYLES[status].label}
        </span>
        <span className="text-sm font-black tabular-nums tracking-tight text-slate-700">
          {formatUtilPct(summary.overall_demand_utilization_pct)}
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Demand / Capacity
          </p>
          <p className="text-sm font-bold tabular-nums text-slate-900">
            {formatHours(summary.total_demand_hours)}h /{" "}
            {formatHours(summary.total_capacity_hours)}h
          </p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Booked
          </p>
          <p className="text-sm font-bold tabular-nums text-slate-700">
            {formatHours(summary.total_booked_hours)}h
          </p>
        </div>
      </div>
    </div>
  );
}

function MinimalCapacityCell({ cell }: { cell: CapacityCell | undefined }) {
  if (!cell) {
    return (
      <div className="flex h-11 items-center justify-center rounded-md bg-slate-50">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
      </div>
    );
  }

  const displayUtilizationPct = getDisplayDemandUtilizationPct(cell);
  const tone = getUtilizationTone(displayUtilizationPct);
  const surfaceClassName =
    tone?.surface ??
    "border border-slate-200 bg-slate-50 text-slate-500 shadow-none";

  return (
    <div
      title={`${displayUtilizationPct === null ? "-" : formatUtilPct(displayUtilizationPct)} utilization | ${formatHours(cell.demand_hours)}h demand | ${formatHours(cell.capacity_hours)}h capacity`}
      className={`flex h-11 items-center justify-center rounded-md border px-1 ${surfaceClassName}`}
    >
      <span
        className={`text-[11px] font-bold tabular-nums ${tone?.value ?? "text-slate-500"}`}
      >
        {displayUtilizationPct === null ? "-" : formatUtilPct(displayUtilizationPct)}
      </span>
    </div>
  );
}

function MinimalCapacityWeekSummaryCell({
  summary,
}: {
  summary: CapacityWeekSummary;
}) {
  const status = resolveCapacityStatus(summary.worst_status);
  const styles = STATUS_STYLES[status];

  return (
    <div
      title={`${formatUtilPct(summary.overall_demand_utilization_pct)} utilization | ${formatHours(summary.total_demand_hours)}h demand | ${formatHours(summary.total_capacity_hours)}h capacity`}
      className="flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white"
    >
      <span
        className={`rounded-full px-2 py-1 text-[10px] font-bold tabular-nums ${styles.badge}`}
      >
        {formatUtilPct(summary.overall_demand_utilization_pct)}
      </span>
    </div>
  );
}

function CapacityLoadingState() {
  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2.5 h-8 w-24" />
          </div>
        ))}
      </section>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    </div>
  );
}

function EmptyCapacityState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
        <Layers3 className="h-8 w-8 text-slate-300" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">{message}</p>
      {actionLabel && onAction ? (
        <Button type="button" onClick={onAction} className="mt-5">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function CapacityDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const userId = user?.id;
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [windowSize, setWindowSizeLocal] = useState<CapacityWindowSize>("4W");
  const [manualStartWeek, setManualStartWeek] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasUIIntentHydrated = useUIIntentStore((state) => state.hasHydrated);
  const setCapacityWindowSize = useUIIntentStore(
    (state) => state.setCapacityWindowSize,
  );
  const {
    projects,
    projectId,
    selectedProject,
    projectBootstrapLoading,
    setProjectId,
  } = useResolvedProjectSelection({ userId });
  const { assets: projectAssets } = useProjectAssets(projectId);
  const { data: projectDetail } = useSWR(
    projectId ? `/projects/${projectId}` : null,
    projectId ? () => fetchProject(projectId) : null,
  );

  useEffect(() => {
    if (user?.role === "subcontractor") {
      router.replace("/home");
    }
  }, [router, user?.role]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProjectSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const uiScopeKey = useMemo(
    () => (userId && projectId ? `${userId}:${projectId}` : null),
    [projectId, userId],
  );

  useEffect(() => {
    if (!hasUIIntentHydrated || !uiScopeKey) return;
    const persisted = useUIIntentStore.getState().getCapacityIntent(uiScopeKey);
    setWindowSizeLocal(
      isCapacityWindowSize(persisted?.windowSize) ? persisted.windowSize : "4W",
    );
  }, [hasUIIntentHydrated, uiScopeKey]);

  const requestedWeeks = WINDOW_WEEKS[windowSize];
  const enabled =
    Boolean(projectId) && hasUIIntentHydrated && user?.role !== "subcontractor";
  const { snapshot } = useLookaheadSnapshot({ projectId, enabled });
  const projectStartDate =
    projectDetail?.start_date ?? selectedProject?.start_date ?? null;
  const heatmap = useMemo(
    () => (snapshot?.rows?.length ? pivotRows(snapshot.rows) : null),
    [snapshot],
  );
  const defaultStartWeek = useMemo(() => {
    if (windowSize === "52W") {
      return (
        normalizeToMondayISO(projectStartDate) ??
        heatmap?.weeks[0] ??
        currentMondayISO()
      );
    }

    if (!heatmap) return currentMondayISO();

    const weeks = heatmap.weeks;
    const count = WINDOW_WEEKS[windowSize];
    const currentWeek = currentMondayISO();
    let startIndex = weeks.findIndex((week) => week >= currentWeek);

    if (startIndex === -1) {
      startIndex = Math.max(0, weeks.length - count);
    }

    return weeks[startIndex] ?? currentWeek;
  }, [heatmap, projectStartDate, windowSize]);

  const startWeek =
    windowSize === "52W" ? defaultStartWeek : manualStartWeek ?? defaultStartWeek;

  useEffect(() => {
    setManualStartWeek(null);
  }, [projectId, windowSize]);
  const {
    capacityData,
    isLoading: capacityLoading,
    error: capacityError,
    mutate,
  } = useCapacityDashboard({
    projectId,
    startWeek,
    weeks: requestedWeeks,
    enabled,
  });

  const weeks = capacityData?.weeks ?? [];
  const compactMode = isCompact(weeks.length);
  const visibleAssetTypes = useMemo(
    () => capacityData?.asset_types ?? [],
    [capacityData?.asset_types],
  );
  const assetTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();

    projectAssets.forEach((asset) => {
      const key = [
        asset.canonical_type,
        asset.type,
        stripTrailingNumber(
          formatProjectLocalAssetName(asset.name, asset.asset_code, asset.id),
        ),
      ]
        .map(normalizeAssetTypeKey)
        .find(Boolean);

      if (key) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    });

    return counts;
  }, [projectAssets]);

  const assetTypeMetadata = useMemo(() => {
    return new Map(
      visibleAssetTypes.map((assetType) => {
        const typeKey = normalizeAssetTypeKey(assetType);
        const rowAvailableAssets = Math.max(
          0,
          ...Object.values(capacityData?.rows[assetType] ?? {}).map(
            (cell) => cell.available_assets,
          ),
        );

        return [
          assetType,
          {
            count: assetTypeCounts.get(typeKey) ?? rowAvailableAssets,
            displayName: formatCapacityAssetType(assetType),
          },
        ];
      }),
    );
  }, [assetTypeCounts, capacityData?.rows, visibleAssetTypes]);

  const updateWindowSize = (next: CapacityWindowSize) => {
    setWindowSizeLocal(next);
    setManualStartWeek(null);
    if (uiScopeKey) {
      setCapacityWindowSize(uiScopeKey, next);
    }
  };

  const handleProjectSelect = (project: ApiProject) => {
    if (!project?.id) return;
    setShowProjectSelector(false);
    setProjectId(project.id);
  };
  const isYearView = windowSize === "52W";
  const canNavigateWeeks = !isYearView && Boolean(projectId);
  const visibleRangeLabel =
    weeks.length > 0
      ? `${formatWeekRange(weeks[0] ?? startWeek)} to ${formatWeekRange(weeks[weeks.length - 1] ?? startWeek)}`
      : formatWeekRange(startWeek);

  const shiftVisibleWindow = (weekDelta: number) => {
    if (!canNavigateWeeks) return;
    setManualStartWeek((current) =>
      shiftMondayISO(current ?? defaultStartWeek, weekDelta),
    );
  };

  const gridTemplateColumns = useMemo(
    () =>
      isYearView
        ? `160px repeat(${Math.max(weeks.length, 1)}, minmax(76px, 1fr))`
        : `180px repeat(${Math.max(weeks.length, 1)}, minmax(0, 1fr))`,
    [isYearView, weeks.length],
  );

  const isLoading = authLoading || projectBootstrapLoading;
  const noProject = !projectId && !isLoading;
  const noData =
    Boolean(capacityData) &&
    visibleAssetTypes.length === 0 &&
    !capacityError &&
    !capacityLoading;
  const gapWeekCount = capacityData?.headline_summary.weeks_with_gaps ?? 0;
  const focusHeadline = !projectId
    ? "Start by selecting a project"
    : capacityError
      ? "Capacity snapshot temporarily unavailable"
      : noData
        ? "Capacity inputs need more setup"
        : gapWeekCount > 0
          ? `${gapWeekCount} week${gapWeekCount === 1 ? "" : "s"} need attention`
          : (capacityData?.headline_summary.avg_utilization_pct ?? 0) >= 90
            ? "Capacity is running tight across this window"
            : "Capacity is balanced across this window";
  const focusDescription = !projectId
    ? "Choose a project to compare weekly demand against available hours and surfaced gaps."
    : capacityError
      ? "The latest capacity snapshot could not be loaded right now. Try a refresh to pull the current planning view."
      : noData
        ? "Planning-ready assets, configured capacity, and an uploaded programme are all needed before the dashboard can map capacity constraints."
        : isYearView
          ? "The annual view strips the matrix back to utilization only so long-range patterns stay readable."
          : "Use the grid below to spot capacity risk by asset type, then rebalance before those gaps spill into delivery.";
  const snapshotTimestamp =
    capacityData?.diagnostics?.snapshot_refreshed_at ??
    capacityData?.diagnostics?.capacity_computed_at ??
    null;

  return (
    <div className="min-h-screen bg-(--page-bg) p-4 font-sans sm:p-5 lg:p-6">
      <div className="mx-auto max-w-screen-2xl space-y-4">
        <div className="min-h-[85vh] overflow-hidden rounded-3xl border border-slate-100 bg-white p-1 shadow-sm">
          <div className="flex flex-1 flex-col space-y-5 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Capacity Planning
                </p>
                <h1 className="mt-1.5 text-[1.9rem] font-black tracking-tight text-slate-950">
                  Balance capacity against forecast demand
                </h1>
                <p className="mt-1.5 flex items-center gap-1 text-sm font-medium text-slate-500">
                  {selectedProject?.location ? (
                    <>
                      <MapPin size={13} className="text-slate-300" />
                      {selectedProject.location}
                    </>
                  ) : (
                    "See where weekly demand is balanced, tight, or over capacity."
                  )}
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto">
                <div className="relative" ref={dropdownRef}>
                  <Button
                    onClick={() =>
                      setShowProjectSelector((current) => !current)
                    }
                    className="h-auto w-full rounded-lg bg-navy px-5 py-3 text-sm font-bold text-white shadow-md shadow-slate-900/10 hover:bg-(--navy-hover) sm:w-auto"
                  >
                    <span className="flex items-center gap-2">
                      {isLoading
                        ? "Loading..."
                        : (selectedProject?.name ?? "Select Project")}
                      <ChevronDown
                        size={15}
                        className={`transition-transform duration-200 ${
                          showProjectSelector ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </Button>

                  {showProjectSelector ? (
                    <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl ring-1 ring-black/5">
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Available Projects
                        </span>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {projects.length}
                        </span>
                      </div>
                      <div className="max-h-75 space-y-1 overflow-y-auto p-2">
                        {projects.map((project) => {
                          const isActive = selectedProject?.id === project.id;
                          return (
                            <button
                              key={project.id}
                              type="button"
                              onClick={() => handleProjectSelect(project)}
                              className={`w-full rounded-lg px-3 py-3 text-left text-sm font-medium transition-all ${
                                isActive
                                  ? "bg-navy text-white"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate font-bold">
                                    {project.name}
                                  </div>
                                  <div
                                    className={`truncate text-[11px] ${
                                      isActive
                                        ? "text-slate-300"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {project.location || "No location"}
                                  </div>
                                </div>
                                {isActive ? (
                                  <Check size={14} className="shrink-0" />
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

              </div>
            </div>

            <section className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 max-w-3xl">
                    <h2 className="text-lg font-black tracking-tight text-slate-950">
                      {focusHeadline}
                    </h2>
                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      {focusDescription}
                    </p>
                    {capacityData ? (
                      <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] font-semibold">
                        <span
                          className="rounded-full bg-slate-100 px-3 py-1 text-slate-600"
                        >
                          Avg {Math.round(
                            capacityData.headline_summary.avg_utilization_pct,
                          )}
                          % utilized
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                          {gapWeekCount} week{gapWeekCount === 1 ? "" : "s"} with gaps
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                          {formatHours(
                            capacityData.headline_summary
                              .demand_without_capacity_hours,
                          )}
                          h uncovered
                        </span>
                        {isYearView ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                            {projectStartDate
                              ? "Anchored to project start"
                              : "Anchored to first programme week"}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="w-full lg:w-auto">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 sm:min-w-[22rem]">
                      <div className="mb-1.5 flex items-center justify-between gap-3 px-1">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Window
                        </div>
                        {snapshotTimestamp ? (
                          <div className="inline-flex min-w-0 items-center gap-1 text-[11px] font-medium text-slate-500">
                            <Clock3 className="h-3.5 w-3.5" />
                            <span className="truncate">
                              Updated {formatDateTime(snapshotTimestamp)}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-3 gap-1 rounded-lg bg-white p-1 shadow-sm">
                        {(["2W", "4W", "52W"] as CapacityWindowSize[]).map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => updateWindowSize(size)}
                            aria-pressed={windowSize === size}
                            className={`rounded-md px-3 py-2 text-sm font-semibold transition-all ${
                              windowSize === size
                                ? "bg-navy text-white shadow-sm"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            {size === "2W" ? "2 wk" : size === "4W" ? "4 wk" : "52 wk"}
                          </button>
                        ))}
                      </div>

                      {!isYearView ? (
                        <div className="mt-2 rounded-lg bg-white p-1.5 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => shiftVisibleWindow(-2)}
                              disabled={!canNavigateWeeks}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ChevronLeft size={14} />
                              Previous
                            </button>
                            <div className="min-w-0 px-2 text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Visible range
                              </p>
                              <p className="truncate text-[11px] font-medium text-slate-600">
                                {visibleRangeLabel}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => shiftVisibleWindow(2)}
                              disabled={!canNavigateWeeks}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Next
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {isLoading || capacityLoading ? <CapacityLoadingState /> : null}

            {noProject ? (
              <EmptyCapacityState
                title="Select a project to view capacity"
                message="Choose a project above to compare weekly capacity against demand and bookings."
              />
            ) : null}

            {!isLoading && capacityError ? (
              <EmptyCapacityState
                title="Capacity dashboard temporarily unavailable"
                message={getApiErrorMessage(
                  capacityError,
                  "We couldn't load the latest capacity planning data right now.",
                )}
                actionLabel="Retry"
                onAction={() => {
                  void mutate();
                }}
              />
            ) : null}

            {noData ? (
              <EmptyCapacityState
                title="No capacity data available"
                message="Ensure assets are planning-ready with capacity configured, and that a programme has been uploaded before opening the capacity dashboard."
              />
            ) : null}

            {!isLoading && capacityData && !capacityError && !noData ? (
              <>
                {isYearView ? (
                  <MinimalYearSummary
                    data={capacityData}
                    projectStartDate={projectStartDate}
                    gapWeekCount={gapWeekCount}
                  />
                ) : (
                  <CapacityStatCards data={capacityData} />
                )}

                {capacityData.message ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{capacityData.message}</p>
                  </div>
                ) : null}

                <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-slate-100 p-2">
                        <BarChart3 size={18} className="text-slate-700" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black tracking-tight text-slate-950">
                          Capacity matrix
                        </h2>
                        <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">
                          {isYearView
                            ? "A minimal annual utilization view for spotting when each asset type starts to run tight."
                            : "Scan each asset type across the planning window and spot where demand is balanced, tight, or over capacity."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {snapshotTimestamp ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          Updated {formatDateTime(snapshotTimestamp)}
                        </span>
                      ) : null}
                      {isYearView ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          52-week view
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Legend</span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                      0% / none
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#86efac]" />
                      &lt;90%
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#fb923c]" />
                      90-100%
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#f87171]" />
                      100%+
                    </span>
                  </div>

                  <div
                    className={`rounded-xl border border-slate-200 ${
                      isYearView ? "overflow-x-auto" : "overflow-hidden"
                    }`}
                  >
                    <div className={isYearView ? "min-w-[720px]" : "w-full"}>
                      <div
                        className="grid border-b border-slate-200 bg-slate-50"
                        style={{ gridTemplateColumns }}
                      >
                        <div
                          className={`border-r border-slate-200 px-4 py-2.5 ${
                            isYearView ? "sticky left-0 z-20 bg-slate-50" : ""
                          }`}
                        >
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Asset type
                          </p>
                        </div>
                        {weeks.map((week, index) => (
                          <div
                            key={week}
                            className={`border-r border-slate-200 last:border-r-0 ${
                              isYearView ? "px-1.5 py-2" : "px-4 py-2.5"
                            }`}
                          >
                            {isYearView ? (
                              <>
                                <p className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                  W{index + 1}
                                </p>
                                <p className="mt-0.5 text-center text-[10px] text-slate-400">
                                  {formatMonthLabel(week)}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-bold text-slate-900">
                                  Week {index + 1}
                                </p>
                                <p className="mt-0.5 text-[10px] font-mono text-slate-400">
                                  {formatWeekRange(week)}
                                </p>
                              </>
                            )}
                          </div>
                        ))}
                      </div>

                      {visibleAssetTypes.map((assetType) => {
                        const assetSummary =
                          capacityData.summary_by_asset_type[assetType];
                        const assetTypeMeta = assetTypeMetadata.get(assetType);

                        return (
                          <div
                            key={assetType}
                            className="grid border-b border-slate-100 last:border-b-0"
                            style={{ gridTemplateColumns }}
                          >
                            <div
                              className={`border-r border-slate-200 bg-white px-4 py-2.5 ${
                                isYearView ? "sticky left-0 z-10" : ""
                              }`}
                            >
                              <p className="text-sm font-bold text-slate-900">
                                {assetTypeMeta?.displayName ??
                                  formatCapacityAssetType(assetType)}
                              </p>
                              {isYearView ? (
                                <p className="mt-1 text-[11px] font-medium text-slate-500">
                                  {assetTypeMeta?.count ?? 0} assets
                                  {(assetSummary?.weeks_over_capacity ?? 0) > 0
                                    ? ` | ${assetSummary?.weeks_over_capacity ?? 0} over`
                                    : (assetSummary?.weeks_tight ?? 0) > 0
                                      ? ` | ${assetSummary?.weeks_tight ?? 0} tight`
                                      : ""}
                                </p>
                              ) : (
                                <div className="mt-1.5 flex flex-col items-start gap-2 text-[11px] font-semibold">
                                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                                    Assets: {assetTypeMeta?.count ?? 0}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                                    {formatHours(
                                      assetSummary?.total_demand_hours ?? 0,
                                    )}
                                    h demand
                                  </span>
                                  {(assetSummary?.weeks_over_capacity ?? 0) > 0 ? (
                                    <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">
                                      {assetSummary?.weeks_over_capacity ?? 0} over
                                    </span>
                                  ) : null}
                                  {(assetSummary?.weeks_tight ?? 0) > 0 ? (
                                    <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                                      {assetSummary?.weeks_tight ?? 0} tight
                                    </span>
                                  ) : null}
                                </div>
                              )}
                            </div>

                            {weeks.map((week) => (
                              <div
                                key={`${assetType}-${week}`}
                                className={`border-r border-slate-100 bg-white last:border-r-0 ${
                                  isYearView ? "px-1.5 py-1.5" : "px-3 py-2.5"
                                }`}
                              >
                                {isYearView ? (
                                  <MinimalCapacityCell
                                    cell={capacityData.rows[assetType]?.[week]}
                                  />
                                ) : (
                                  <CapacityCellCard
                                    cell={capacityData.rows[assetType]?.[week]}
                                    compact={compactMode}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}

                      <div
                        className="grid bg-slate-50"
                        style={{ gridTemplateColumns }}
                      >
                        <div
                          className={`border-r border-slate-200 px-4 py-2.5 ${
                            isYearView ? "sticky left-0 z-10 bg-slate-50" : ""
                          }`}
                        >
                          <p className="text-sm font-bold text-slate-950">
                            Weekly Summary
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {isYearView
                              ? "Overall weekly utilization"
                              : "Aggregate demand and highest utilization status by week"}
                          </p>
                        </div>
                        {weeks.map((week) => {
                          const weekSummary = capacityData.summary_by_week[week];
                          return (
                            <div
                              key={`summary-${week}`}
                              className={`border-r border-slate-200 last:border-r-0 ${
                                isYearView ? "px-1.5 py-1.5" : "px-3 py-2.5"
                              }`}
                            >
                              {weekSummary ? (
                                isYearView ? (
                                  <MinimalCapacityWeekSummaryCell
                                    summary={weekSummary}
                                  />
                                ) : (
                                  <CapacityWeekSummaryCell summary={weekSummary} />
                                )
                              ) : (
                                <div
                                  className={`flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-xs text-slate-300 ${
                                    isYearView ? "h-11" : "h-full min-h-20"
                                  }`}
                                >
                                  No summary
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>

              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
