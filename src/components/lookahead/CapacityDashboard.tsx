"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Info,
  Layers3,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useResolvedProjectSelection } from "@/hooks/useResolvedProjectSelection";
import {
  useCapacityDashboard,
  useLookaheadSnapshot,
} from "@/hooks/lookahead/useLookaheadQueries";
import {
  type CapacityCell,
  type CapacityDashboardResponse,
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
  formatDate,
  formatWeekRange,
  pivotRows,
} from "./utils";
import {
  STATUS_STYLES,
  formatUtilPct,
  isCompact,
  resolveCapacityStatus,
} from "./capacityUtils";

const WINDOW_WEEKS: Record<CapacityWindowSize, number> = {
  "2W": 2,
  "4W": 4,
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

function getDisplayDemandUtilizationPct(cell: CapacityCell): number | null {
  if (cell.capacity_hours <= 0) {
    return cell.demand_hours > 0 ? null : 0;
  }

  return (cell.demand_hours / cell.capacity_hours) * 100;
}

function CapacityStatCards({
  data,
}: {
  data: CapacityDashboardResponse;
}) {
  const summary = data.headline_summary;

  const cards = [
    {
      label: "Total demand hours",
      value: `${formatHours(summary.total_demand_hours)}h`,
      tone: "text-slate-950",
      detail: null,
    },
    {
      label: "Total capacity hours",
      value: `${formatHours(summary.total_capacity_hours)}h`,
      tone: "text-slate-950",
      detail: null,
    },
    {
      label: "Capacity-backed utilization",
      value: `${Math.round(summary.avg_utilization_pct)}%`,
      tone:
        summary.demand_without_capacity_hours > 0
          ? "text-amber-700"
          : "text-slate-950",
      detail:
        summary.demand_without_capacity_hours > 0
          ? `${formatHours(summary.demand_without_capacity_hours)}h has no capacity`
          : null,
    },
    {
      label: "Weeks with gaps",
      value: String(summary.weeks_with_gaps),
      tone: summary.weeks_with_gaps > 0 ? "text-amber-700" : "text-slate-950",
      detail: null,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {card.label}
          </p>
          <p className={`mt-3 text-3xl font-black tracking-tight ${card.tone}`}>
            {card.value}
          </p>
          {card.detail ? (
            <p className="mt-2 text-xs font-medium text-slate-500">{card.detail}</p>
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
    return <div className="relative flex min-h-28 flex-col justify-between p-3 bg-slate-50" />;
  }
  const styles = STATUS_STYLES[cell.status];
  const displayUtilizationPct = getDisplayDemandUtilizationPct(cell);

  return (
    <div
      className={`relative flex min-h-28 flex-col justify-between p-3 ${styles.cell} ${
        compact ? "min-h-20" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Demand
        </span>
        {cell.is_anomalous ? (
          compact ? (
            <span
              className="h-2.5 w-2.5 rounded-full bg-orange-500"
              aria-label="Anomalous capacity cell"
              title="Anomalous capacity cell"
            />
          ) : (
            <AlertTriangle
              className="h-3.5 w-3.5 text-orange-500"
              aria-label="Anomalous capacity cell"
            />
          )
        ) : null}
      </div>

      <div className="flex-1 pt-2">
        <p className={`font-black tracking-tight ${compact ? "text-lg" : "text-3xl"}`}>
          {displayUtilizationPct === null ? "—" : formatUtilPct(displayUtilizationPct)}
        </p>
      </div>

      <div className="flex items-end justify-between gap-2">
        {!compact ? (
          <span className="text-[10px] font-medium text-slate-400">
            {formatHours(cell.demand_hours)}h / {formatHours(cell.capacity_hours)}h
          </span>
        ) : (
          <span className="text-[10px] font-medium text-slate-400">
            {formatHours(cell.uncovered_demand_hours)}h gap
          </span>
        )}
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold ${styles.badge}`}
        >
          {styles.label}
        </span>
      </div>
    </div>
  );
}

function CapacityWeekSummaryCell({ summary }: { summary: CapacityWeekSummary }) {
  const status = resolveCapacityStatus(summary.worst_status);
  const styles = STATUS_STYLES[status];

  return (
    <div className="flex min-h-24 flex-col justify-between bg-white p-3 text-slate-700">
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${styles.badge}`}>
          {STATUS_STYLES[status].label}
        </span>
        <span className="text-xs font-semibold text-slate-500">
          {formatUtilPct(summary.overall_demand_utilization_pct)}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-900">
          {formatHours(summary.total_demand_hours)}h / {formatHours(summary.total_capacity_hours)}h
        </p>
        <p className="text-[10px] text-slate-400">
          {formatHours(summary.total_booked_hours)}h booked
        </p>
      </div>
    </div>
  );
}

function CapacityDiagnosticsPanel({
  data,
}: {
  data: CapacityDashboardResponse;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const diagnostics = data.diagnostics;

  if (!diagnostics) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-950">Diagnostics</p>
          <p className="mt-1 text-sm text-slate-500">
            Trace exclusions, assumptions, and the capacity snapshot timestamp.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen((current) => !current)}
          className="gap-2"
        >
          {isOpen ? "Hide details" : "Show details"}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </div>

      {isOpen ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">Computed at:</span>{" "}
              {formatDateTime(diagnostics.capacity_computed_at)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Snapshot date:</span>{" "}
              {diagnostics.snapshot_date ? formatDate(diagnostics.snapshot_date) : "Not available"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Snapshot refreshed:</span>{" "}
              {formatDateTime(diagnostics.snapshot_refreshed_at)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Assets evaluated:</span>{" "}
              {diagnostics.total_assets_evaluated}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Unresolved assets:</span>{" "}
              {diagnostics.unresolved_asset_count}
            </p>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">Excluded not planning ready:</span>{" "}
              {diagnostics.excluded_not_planning_ready}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Excluded retired:</span>{" "}
              {diagnostics.excluded_retired}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Other demand hours:</span>{" "}
              {formatHours(diagnostics.other_demand_hours_total)}h
            </p>
            <p>
              <span className="font-semibold text-slate-900">Excluded asset types:</span>{" "}
              {diagnostics.excluded_asset_types.length > 0
                ? diagnostics.excluded_asset_types.map(formatAssetType).join(", ")
                : "None"}
            </p>
          </div>
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold text-slate-900">Assumptions</p>
            {diagnostics.assumptions.length > 0 ? (
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {diagnostics.assumptions.map((assumption) => (
                  <li key={assumption} className="rounded-xl bg-slate-50 px-3 py-2">
                    {assumption}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No assumptions were provided.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CapacityLoadingState() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-9 w-24" />
          </div>
        ))}
      </section>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Skeleton className="h-80 w-full rounded-xl" />
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
  const [hasMounted, setHasMounted] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [windowSize, setWindowSizeLocal] = useState<CapacityWindowSize>("4W");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasUIIntentHydrated = useUIIntentStore((state) => state.hasHydrated);
  const setCapacityWindowSize = useUIIntentStore(
    (state) => state.setCapacityWindowSize,
  );
  const { projects, projectId, selectedProject, projectBootstrapLoading, setProjectId } =
    useResolvedProjectSelection({ userId });

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
  const enabled = Boolean(projectId) && hasUIIntentHydrated && user?.role !== "subcontractor";
  const { snapshot } = useLookaheadSnapshot({ projectId, enabled });
  const heatmap = useMemo(
    () => (snapshot?.rows?.length ? pivotRows(snapshot.rows) : null),
    [snapshot],
  );
  const startWeek = useMemo(() => {
    if (!heatmap) return currentMondayISO();

    const weeks = heatmap.weeks;
    const count = WINDOW_WEEKS[windowSize];
    const currentWeek = currentMondayISO();
    let startIndex = weeks.findIndex((week) => week >= currentWeek);

    if (startIndex === -1) {
      startIndex = Math.max(0, weeks.length - count);
    }

    return weeks[startIndex] ?? currentWeek;
  }, [heatmap, windowSize]);
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
  const visibleAssetTypes = capacityData?.asset_types ?? [];

  const updateWindowSize = (next: CapacityWindowSize) => {
    setWindowSizeLocal(next);
    if (uiScopeKey) {
      setCapacityWindowSize(uiScopeKey, next);
    }
  };

  const handleProjectSelect = (project: ApiProject) => {
    if (!project?.id) return;
    setShowProjectSelector(false);
    setProjectId(project.id);
  };

  const gridTemplateColumns = useMemo(
    () => `180px repeat(${Math.max(weeks.length, 1)}, minmax(110px, 1fr))`,
    [weeks.length],
  );

  const isLoading = authLoading || projectBootstrapLoading;
  const noProject = !projectId && !isLoading;
  const noData =
    Boolean(capacityData) &&
    visibleAssetTypes.length === 0 &&
    !capacityError &&
    !capacityLoading;

  return (
    <div className="min-h-screen bg-(--page-bg) p-4 font-sans sm:p-6 lg:p-8">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-1 shadow-sm">
          <div className="space-y-6 p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Capacity Planning
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  Balance capacity against forecast demand
                </h1>
                <p className="mt-2 flex items-center gap-1 text-sm font-medium text-slate-500">
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
                    onClick={() => setShowProjectSelector((current) => !current)}
                    className="h-auto w-full rounded-lg bg-navy px-5 py-5 text-sm font-bold text-white shadow-md shadow-slate-900/10 hover:bg-(--navy-hover) sm:w-auto"
                  >
                    <span className="flex items-center gap-2">
                      {isLoading ? "Loading..." : selectedProject?.name ?? "Select Project"}
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
                                  <div className="truncate font-bold">{project.name}</div>
                                  <div
                                    className={`truncate text-[11px] ${
                                      isActive ? "text-slate-300" : "text-slate-400"
                                    }`}
                                  >
                                    {project.location || "No location"}
                                  </div>
                                </div>
                                {isActive ? <Check size={14} className="shrink-0" /> : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                  <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                    {(["2W", "4W"] as CapacityWindowSize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => updateWindowSize(size)}
                        aria-pressed={windowSize === size}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                          windowSize === size
                            ? "bg-navy text-white shadow-md shadow-slate-900/10"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

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
                <CapacityStatCards data={capacityData} />

                {capacityData.message ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{capacityData.message}</p>
                  </div>
                ) : null}

                <section className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                  <div
                    className="grid min-w-max gap-px bg-slate-200"
                    style={{ gridTemplateColumns }}
                  >
                    <div className="bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Asset type
                      </p>
                    </div>

                    {weeks.map((week, index) => (
                      <div key={week} className="bg-slate-50 p-4">
                        <p className="text-sm font-bold text-slate-900">Week {index + 1}</p>
                        <p className="mt-1 text-[11px] font-medium text-slate-500">
                          {formatWeekRange(week)}
                        </p>
                      </div>
                    ))}

                    {visibleAssetTypes.map((assetType) => {
                      const assetSummary = capacityData.summary_by_asset_type[assetType];

                      return (
                        <FragmentRow
                          key={assetType}
                          left={
                            <div className="flex min-h-28 flex-col justify-between bg-white p-4">
                              <div>
                                <p className="text-sm font-bold text-slate-950">
                                  {formatAssetType(assetType)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Peak{" "}
                                  {(assetSummary?.total_capacity_hours ?? 0) > 0
                                    ? formatUtilPct(assetSummary?.peak_demand_utilization_pct ?? 0)
                                    : "—"}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                                  {formatHours(assetSummary?.total_demand_hours ?? 0)}h demand
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
                            </div>
                          }
                          cells={weeks.map((week) => (
                            <CapacityCellCard
                              key={`${assetType}-${week}`}
                              cell={capacityData.rows[assetType]?.[week]}
                              compact={compactMode}
                            />
                          ))}
                        />
                      );
                    })}

                    <div className="bg-slate-50 p-4">
                      <p className="text-sm font-bold text-slate-950">Weekly Summary</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Aggregate demand and worst pressure status by week
                      </p>
                    </div>

                    {weeks.map((week) => {
                      const weekSummary = capacityData.summary_by_week[week];
                      if (!weekSummary) {
                        return (
                          <div
                            key={`summary-${week}`}
                            className="relative flex min-h-28 flex-col justify-between p-3 bg-slate-50"
                          />
                        );
                      }
                      return (
                        <CapacityWeekSummaryCell
                          key={`summary-${week}`}
                          summary={weekSummary}
                        />
                      );
                    })}
                  </div>
                </section>

                <CapacityDiagnosticsPanel data={capacityData} />
              </>
            ) : null}

            {hasMounted && capacityData ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <span>Start week {formatDate(capacityData.start_week)}</span>
                <button
                  type="button"
                  onClick={() => {
                    void mutate();
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-slate-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function FragmentRow({
  left,
  cells,
}: {
  left: ReactNode;
  cells: ReactNode[];
}) {
  return (
    <>
      {left}
      {cells}
    </>
  );
}
