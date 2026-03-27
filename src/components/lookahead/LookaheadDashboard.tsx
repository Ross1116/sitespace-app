"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Loader2,
  MapPin,
  Upload,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useResolvedProjectSelection } from "@/hooks/useResolvedProjectSelection";
import { useBookingMutations } from "@/hooks/bookings/useBookingMutations";
import {
  deleteProgrammeVersion,
  fetchUploadStatus,
  promoteItemClassification,
  updateProgrammeMapping,
  uploadProgramme,
} from "@/hooks/lookahead/api";
import {
  useLookaheadActivities,
  useLookaheadAlerts,
  useLookaheadHistory,
  useLookaheadSnapshot,
  usePlanningCompleteness,
  useProgrammeActivityBookingContext,
  useProgrammeMappings,
  useProgrammeUploadStatus,
  useProgrammeVersions,
  useUnclassifiedMappings,
} from "@/hooks/lookahead/useLookaheadQueries";
import { useUIIntentStore } from "@/stores/uiIntentStore";
import type {
  ApiProject,
  LookaheadActivityCandidate,
  LookaheadAnomalyFlags,
  LookaheadRow,
} from "@/types";
import { getApiErrorMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DemandHeatmap } from "./DemandHeatmap";
import { EmptyForecastState } from "./EmptyForecastState";
import { PlanningAlerts, type PlanningAlert } from "./PlanningAlerts";
import { PlanningReadinessCard } from "./PlanningReadinessCard";
import { SnapshotHistoryPanel } from "./SnapshotHistoryPanel";
import { StatCards } from "./StatCards";
import { UploadBanner, type UploadPhase } from "./UploadBanner";
import { VersionHistory } from "./VersionHistory";
import { WindowSelector } from "./WindowSelector";
import { formatPct, pivotRows } from "./utils";

const CreateBookingForm = dynamic(
  () =>
    import("@/components/forms/CreateBookingForm").then((module) => ({
      default: module.CreateBookingForm,
    })),
  { ssr: false },
);

const ActivityDrilldownDialog = dynamic(
  () => import("./ActivityDrilldownDialog").then((module) => ({ default: module.ActivityDrilldownDialog })),
  { ssr: false },
);

const ActivityContextDialog = dynamic(
  () => import("./ActivityContextDialog").then((module) => ({ default: module.ActivityContextDialog })),
  { ssr: false },
);

const UploadReviewDialog = dynamic(
  () => import("./UploadReviewDialog").then((module) => ({ default: module.UploadReviewDialog })),
  { ssr: false },
);

type WindowSize = "2W" | "4W" | "6W";
type ActivityDialogMode = "context" | "booking";

const WINDOW_WEEKS: Record<WindowSize, number> = { "2W": 2, "4W": 4, "6W": 6 };
const POLL_MAX_ATTEMPTS = 60;

function toDateTime(date?: string | null, time?: string | null): Date | null {
  if (!date || !time) return null;
  const [hoursRaw, minutesRaw, secondsRaw] = time.trim().split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  const seconds = secondsRaw == null ? 0 : Number(secondsRaw);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  const normalizedTime = `${String(hours).padStart(2, "0")}:${String(
    minutes,
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const parsed = new Date(`${date}T${normalizedTime}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPersistentUploadAlertMessage(
  notes: Record<string, unknown> | null | undefined,
  unclassifiedCount?: number | null,
): string | null {
  const resolvedUnclassifiedCount =
    typeof unclassifiedCount === "number" ? unclassifiedCount : null;

  if (notes?.classification_ai_suppressed || notes?.work_profile_ai_suppressed) {
    return "Programme processed in deterministic fallback mode because AI was unavailable.";
  }

  if (notes?.ai_quota_exhausted) {
    return "Programme diagnostics report AI quota exhaustion. Review classifications before trusting coverage.";
  }

  if ((resolvedUnclassifiedCount ?? 0) > 0) {
    return `${resolvedUnclassifiedCount} mappings still need review before coverage is fully trustworthy.`;
  }

  return null;
}

export default function LookaheadDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id;
  const [hasMounted, setHasMounted] = useState(false);
  const hasUIIntentHydrated = useUIIntentStore((state) => state.hasHydrated);
  const setLookaheadWindowSize = useUIIntentStore(
    (state) => state.setLookaheadWindowSize,
  );
  const {
    projects,
    projectId,
    selectedProject,
    projectBootstrapLoading,
    setProjectId,
  } = useResolvedProjectSelection({
    userId,
    role: user?.role,
  });
  const { revalidateBookingsForProject } = useBookingMutations();

  const [windowSize, setWindowSizeLocal] = useState<WindowSize>("4W");
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>({ kind: "idle" });
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [selectedCell, setSelectedCell] = useState<LookaheadRow | null>(null);
  const [activityContextCell, setActivityContextCell] =
    useState<LookaheadRow | null>(null);
  const [selectedActivity, setSelectedActivity] =
    useState<LookaheadActivityCandidate | null>(null);
  const [activityDialogMode, setActivityDialogMode] =
    useState<ActivityDialogMode | null>(null);
  const [isUploadReviewOpen, setIsUploadReviewOpen] = useState(false);
  const [isSnapshotHistoryOpen, setIsSnapshotHistoryOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingGenerationRef = useRef(0);
  const projectIdRef = useRef(projectId);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  const uiScopeKey = useMemo(
    () => (userId && projectId ? `${userId}:${projectId}` : null),
    [projectId, userId],
  );

  useEffect(() => {
    if (!hasUIIntentHydrated || !uiScopeKey) return;
    const persisted = useUIIntentStore.getState().getLookaheadIntent(uiScopeKey);
    setWindowSizeLocal((persisted?.windowSize as WindowSize) ?? "4W");
  }, [hasUIIntentHydrated, uiScopeKey]);

  const updateWindowSize = useCallback(
    (next: WindowSize) => {
      setWindowSizeLocal(next);
      if (uiScopeKey) {
        setLookaheadWindowSize(uiScopeKey, next);
      }
    },
    [setLookaheadWindowSize, uiScopeKey],
  );

  const enabled = Boolean(projectId);
  const { snapshot, isLoading: snapshotLoading, mutate: mutateSnapshot } =
    useLookaheadSnapshot({ projectId, enabled });
  const { alerts, isLoading: alertsLoading, mutate: mutateAlerts } =
    useLookaheadAlerts({ projectId, enabled });
  const {
    history,
    isLoading: historyLoading,
    mutate: mutateHistory,
  } = useLookaheadHistory({
    projectId,
    enabled: enabled && isSnapshotHistoryOpen,
  });
  const { versions, isLoading: versionsLoading, mutate: mutateVersions } =
    useProgrammeVersions({ projectId, enabled });
  const {
    planningCompleteness,
    mutate: mutatePlanningCompleteness,
  } = usePlanningCompleteness({
    projectId,
    enabled,
  });

  const sortedVersions = useMemo(
    () =>
      [...versions].sort(
        (left, right) =>
          (right.version_number ?? 0) - (left.version_number ?? 0),
      ),
    [versions],
  );
  const latestVersion = sortedVersions[0] ?? null;
  const latestUploadKey = latestVersion?.upload_id ?? null;
  const snapshotKey = snapshot?.snapshot_id ?? snapshot?.snapshot_date ?? null;

  const {
    uploadStatus,
    isLoading: uploadStatusLoading,
    mutate: mutateUploadStatus,
  } = useProgrammeUploadStatus({
    uploadId: latestVersion?.upload_id ?? null,
    enabled: Boolean(latestVersion?.upload_id),
  });
  const {
    mappings,
    isLoading: mappingsLoading,
    mutate: mutateMappings,
  } = useProgrammeMappings({
    uploadId: latestVersion?.upload_id ?? null,
    enabled: Boolean(latestVersion?.upload_id && isUploadReviewOpen),
  });
  const {
    mappings: unclassifiedMappings,
    isLoading: unclassifiedMappingsLoading,
    mutate: mutateUnclassified,
  } = useUnclassifiedMappings({
    uploadId: latestVersion?.upload_id ?? null,
    enabled: Boolean(latestVersion?.upload_id && isUploadReviewOpen),
  });
  const {
    activities,
    isLoading: activitiesLoading,
    mutate: mutateActivities,
  } = useLookaheadActivities({
    projectId,
    weekStart: selectedCell?.week_start,
    assetType: selectedCell?.asset_type,
    enabled: Boolean(selectedCell?.week_start && selectedCell?.asset_type && projectId),
  });
  const {
    bookingContext,
    isLoading: bookingContextLoading,
    mutate: mutateBookingContext,
  } = useProgrammeActivityBookingContext({
    activityId: selectedActivity?.activity_id ?? null,
    selectedWeekStart: activityContextCell?.week_start,
    enabled: Boolean(selectedActivity?.activity_id),
  });

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    pollingGenerationRef.current += 1;
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    setDismissedAlerts(new Set());
    setDeletingIds(new Set());
  }, [latestUploadKey, snapshotKey]);

  const refreshLookaheadWorkspace = useCallback(async () => {
    const refreshTasks: Promise<unknown>[] = [
      mutateSnapshot(),
      mutateAlerts(),
      mutateHistory(),
      mutateVersions(),
      mutateUploadStatus(),
      mutateActivities(),
      mutateBookingContext(),
      mutatePlanningCompleteness(),
    ];

    if (projectId) {
      refreshTasks.push(revalidateBookingsForProject(projectId));
    }

    await Promise.allSettled(refreshTasks);
  }, [
    mutateActivities,
    mutateAlerts,
    mutateBookingContext,
    mutateHistory,
    mutatePlanningCompleteness,
    mutateSnapshot,
    mutateUploadStatus,
    mutateVersions,
    projectId,
    revalidateBookingsForProject,
  ]);

  const closeActivityFlow = useCallback(() => {
    setSelectedActivity(null);
    setActivityContextCell(null);
    setActivityDialogMode(null);
  }, []);

  const isUploadInFlight =
    uploadPhase.kind === "uploading" || uploadPhase.kind === "polling";

  const startPolling = useCallback(
    (uploadId: string) => {
      if (pollingRef.current || uploadPhase.kind === "polling") {
        return;
      }

      stopPolling();
      isFetchingRef.current = false;
      const generation = ++pollingGenerationRef.current;
      let attempts = 0;
      let consecutiveErrors = 0;

      pollingRef.current = setInterval(async () => {
        if (pollingGenerationRef.current !== generation || isFetchingRef.current) {
          return;
        }

        attempts += 1;
        if (attempts > POLL_MAX_ATTEMPTS) {
          stopPolling();
          setUploadPhase({
            kind: "error",
            message: "Upload is taking too long. Please refresh and try again.",
          });
          return;
        }

        isFetchingRef.current = true;
        try {
          const status = await fetchUploadStatus(uploadId);
          if (pollingGenerationRef.current !== generation) return;
          consecutiveErrors = 0;
          if (status.status !== "processing") {
            stopPolling();
            setUploadPhase({ kind: "done", result: status });
            void refreshLookaheadWorkspace();
          }
        } catch {
          consecutiveErrors += 1;
          if (consecutiveErrors >= 3) {
            stopPolling();
            setUploadPhase({
              kind: "error",
              message: "Lost connection while checking upload status.",
            });
          }
        } finally {
          isFetchingRef.current = false;
        }
      }, 2000);
    },
    [refreshLookaheadWorkspace, stopPolling, uploadPhase.kind],
  );

  const handleFileSelected = useCallback(
    async (file: File | null) => {
      if (!file || !projectId || isUploadInFlight) return;

      const targetProject = projectId;
      setUploadPhase({ kind: "uploading" });

      try {
        const result = await uploadProgramme(targetProject, file);
        if (targetProject !== projectIdRef.current) return;
        setUploadPhase({ kind: "polling", uploadId: result.upload_id });
        startPolling(result.upload_id);
      } catch (error) {
        if (targetProject !== projectIdRef.current) return;
        setUploadPhase({ kind: "error", message: getApiErrorMessage(error) });
      }
    },
    [isUploadInFlight, projectId, startPolling],
  );

  const handleDeleteVersion = useCallback(
    async (uploadId: string) => {
      setDeletingIds((current) => new Set(current).add(uploadId));
      try {
        await deleteProgrammeVersion(uploadId);
        await refreshLookaheadWorkspace();
      } catch (error) {
        setUploadPhase({ kind: "error", message: getApiErrorMessage(error) });
      } finally {
        setDeletingIds((current) => {
          const next = new Set(current);
          next.delete(uploadId);
          return next;
        });
      }
    },
    [refreshLookaheadWorkspace],
  );

  const handleProjectSelect = useCallback(
    (project: ApiProject) => {
      stopPolling();
      setProjectId(project.id);
      setShowProjectSelector(false);
      setUploadPhase({ kind: "idle" });
      setDismissedAlerts(new Set());
      setSelectedCell(null);
      closeActivityFlow();
    },
    [closeActivityFlow, setProjectId, stopPolling],
  );

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

  const heatmap = useMemo(
    () => (snapshot?.rows?.length ? pivotRows(snapshot.rows) : null),
    [snapshot],
  );

  const visibleWeeks = useMemo(() => {
    if (!heatmap) return [];
    const weeks = heatmap.weeks;
    const count = WINDOW_WEEKS[windowSize];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    const currentWeek = monday.toLocaleDateString("en-CA");
    let startIndex = weeks.findIndex((week) => week >= currentWeek);

    if (startIndex === -1) {
      startIndex = Math.max(0, weeks.length - count);
    }

    return weeks.slice(startIndex, startIndex + count);
  }, [heatmap, windowSize]);

  const visibleRows = useMemo(() => {
    if (!heatmap || visibleWeeks.length === 0) return [];
    return heatmap.assets.flatMap((asset) =>
      visibleWeeks.flatMap((week) => {
        const row = heatmap.matrix.get(asset)?.get(week);
        return row ? [row] : [];
      }),
    );
  }, [heatmap, visibleWeeks]);

  const stats = useMemo(
    () => ({
      totalDemandHours: visibleRows.reduce((sum, row) => sum + row.demand_hours, 0),
      totalBookedHours: visibleRows.reduce((sum, row) => sum + row.booked_hours, 0),
      totalGapHours: visibleRows.reduce((sum, row) => sum + row.gap_hours, 0),
      assetsTracked: heatmap?.assets.length ?? 0,
    }),
    [heatmap, visibleRows],
  );

  const maxDemand = useMemo(
    () =>
      Math.max(
        1,
        ...(heatmap
          ? heatmap.assets.flatMap((asset) =>
              visibleWeeks.map(
                (week) => heatmap.matrix.get(asset)?.get(week)?.demand_hours ?? 0,
              ),
            )
          : [0]),
      ),
    [heatmap, visibleWeeks],
  );

  const unclassifiedCount =
    uploadStatus?.completeness_notes?.unclassified_mapping_count ??
    unclassifiedMappings.length;
  const persistentUploadMessage = useMemo(
    () =>
      getPersistentUploadAlertMessage(
        uploadStatus?.completeness_notes,
        unclassifiedCount,
      ),
    [unclassifiedCount, uploadStatus?.completeness_notes],
  );

  const activeAlerts = useMemo((): PlanningAlert[] => {
    const flags = (alerts?.alerts as LookaheadAnomalyFlags | undefined) ?? {};
    const nextAlerts: PlanningAlert[] = [];

    if (flags.demand_spike_over_100pct) {
      nextAlerts.push({
        key: "demand_spike",
        label: "Demand surge detected",
        detail:
          "Demand doubled or more compared with the previous snapshot. Review linked activities and create bookings against the new load.",
      level: "red",
      });
    }

    if (flags.mapping_changes_over_40pct) {
      nextAlerts.push({
        key: "mapping_changes",
        label: "Large mapping shift",
        detail:
          flags.mapping_change_ratio != null
            ? `${formatPct(flags.mapping_change_ratio)} of rows changed category. Open the upload review surface to triage mappings.`
            : "Many tasks changed category since the previous programme.",
        level: "amber",
        ctaLabel: "Review mappings",
        onAction: () => setIsUploadReviewOpen(true),
      });
    }

    if (flags.activity_count_delta_over_30pct) {
      nextAlerts.push({
        key: "activity_delta",
        label: "Activity volume changed materially",
        detail:
          flags.activity_count_delta_ratio != null
            ? `Activity count changed by ${formatPct(flags.activity_count_delta_ratio)} versus the previous snapshot.`
            : "Activity volume changed materially since the previous snapshot.",
        level: "blue",
      });
    }

    if (persistentUploadMessage) {
      nextAlerts.push({
        key: "upload_quality",
        label: "Latest upload needs review",
        detail: persistentUploadMessage,
        level: "amber",
        ctaLabel: "Open upload review",
        onAction: () => setIsUploadReviewOpen(true),
      });
    }

    return nextAlerts.filter((alert) => !dismissedAlerts.has(alert.key));
  }, [alerts, dismissedAlerts, persistentUploadMessage]);

  const latestUploadDate = latestVersion?.created_at
    ? new Date(latestVersion.created_at).toLocaleString("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const firstSuggestedBookingDate = bookingContext?.suggested_bulk_dates[0] ?? null;

  const bookingStartTime = useMemo(() => {
    const defaultDate =
      bookingContext?.default_booking_date ??
      firstSuggestedBookingDate?.date ??
      activityContextCell?.week_start ??
      snapshot?.snapshot_date ??
      null;
    return (
      toDateTime(
        defaultDate,
        bookingContext?.default_start_time ?? firstSuggestedBookingDate?.start_time,
      ) ??
      toDateTime(defaultDate, "07:00:00") ??
      new Date()
    );
  }, [activityContextCell?.week_start, bookingContext, firstSuggestedBookingDate, snapshot?.snapshot_date]);

  const bookingEndTime = useMemo(
    () =>
      toDateTime(
        bookingContext?.default_booking_date ??
          firstSuggestedBookingDate?.date ??
          activityContextCell?.week_start ??
          null,
        bookingContext?.default_end_time ?? firstSuggestedBookingDate?.end_time,
      ) ??
      new Date(bookingStartTime.getTime() + 60 * 60 * 1000),
    [activityContextCell?.week_start, bookingContext, bookingStartTime, firstSuggestedBookingDate],
  );

  const isLoading = authLoading || projectBootstrapLoading;
  const topActionButtonsReady = hasMounted && !isLoading;
  const hasForecast = Boolean(projectId && heatmap && visibleWeeks.length > 0);
  const coveragePct =
    stats.totalDemandHours > 0
      ? Math.round((stats.totalBookedHours / stats.totalDemandHours) * 100)
      : 0;
  const readinessScore = Math.round(planningCompleteness?.score ?? 0);
  const topAlert = activeAlerts[0] ?? null;
  const latestUploadNeedsReview = Boolean(
    persistentUploadMessage || unclassifiedCount > 0,
  );
  const focusHeadline =
    !projectId
      ? "Start by selecting a project"
      : stats.totalGapHours > 0
        ? `${stats.totalGapHours}h still unbooked`
        : hasForecast
          ? "Forecast demand is covered"
          : "Upload a programme to start planning";
  const focusDescription =
    !projectId
      ? "Choose a project and upload a programme to turn this into a planning workspace."
      : stats.totalGapHours > 0
        ? "Use the heatmap to open the weekly activity behind the gap, then book directly from context."
        : hasForecast
          ? "Use the heatmap below to confirm activity coverage and spot changes early."
          : "This project needs a fresh programme upload before the heatmap can drive planning.";

  return (
    <div className="min-h-screen bg-(--page-bg) p-4 font-sans sm:p-6 lg:p-8">
      <div className="mx-auto max-w-screen space-y-6">
        <div className="relative min-h-[85vh] overflow-hidden rounded-3xl border border-slate-100 bg-white p-1 shadow-sm">
          <div className="flex flex-1 flex-col space-y-8 p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Lookahead Workspace
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  Plan demand before it becomes a booking gap
                </h1>
                <p className="mt-2 flex items-center gap-1 text-sm font-medium text-slate-500">
                  {selectedProject?.location ? (
                    <>
                      <MapPin size={13} className="text-slate-300" />
                      {selectedProject.location}
                    </>
                  ) : (
                    "Forecast demand, inspect activity, and book directly from the same workspace."
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

                  {showProjectSelector && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl ring-1 ring-black/5">
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Available Projects
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {projects.length}
                        </span>
                      </div>
                      <div className="max-h-75 overflow-y-auto p-2 space-y-1">
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
                                {isActive && <Check size={14} className="shrink-0" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  disabled={!topActionButtonsReady || !projectId || isUploadInFlight}
                  onClick={() => {
                    if (isUploadInFlight) return;
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    fileInputRef.current?.click();
                  }}
                  className="h-auto w-full rounded-lg bg-navy px-5 py-5 text-sm font-bold text-white shadow-md shadow-slate-900/10 hover:bg-(--navy-hover) sm:w-auto"
                >
                  <span className="flex items-center gap-2">
                    {uploadPhase.kind === "uploading" || uploadPhase.kind === "polling" ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Upload size={15} />
                    )}
                    Upload Programme
                  </span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!topActionButtonsReady || !latestVersion}
                  onClick={() => setIsUploadReviewOpen(true)}
                  className="h-auto rounded-lg px-5 py-5 text-sm font-bold"
                >
                  Review latest upload
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xlsm,.pdf"
                  className="hidden"
                  disabled={isUploadInFlight}
                  onChange={(event) =>
                    handleFileSelected(event.target.files?.[0] ?? null)
                  }
                />
              </div>
            </div>

            <UploadBanner
              phase={uploadPhase}
              onDismiss={() => setUploadPhase({ kind: "idle" })}
              onUploadAnother={() => {
                setUploadPhase({ kind: "idle" });
                fileInputRef.current?.click();
              }}
            />

            <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
              <div className="rounded-7 border border-slate-200 bg-[linear-gradient(135deg,rgba(11,17,32,0.04)_0%,rgba(14,124,155,0.10)_100%)] p-6 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Planning focus
                    </p>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                      {focusHeadline}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                      {focusDescription}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                        {visibleWeeks.length} week{visibleWeeks.length === 1 ? "" : "s"} in view
                      </span>
                      <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                        {coveragePct}% covered
                      </span>
                      <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                        {stats.assetsTracked} asset type{stats.assetsTracked === 1 ? "" : "s"}
                      </span>
                      {latestVersion && (
                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                          Upload v{latestVersion.version_number}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:min-w-70 lg:grid-cols-1">
                    <div className="rounded-2xl bg-navy p-5 text-white shadow-lg shadow-slate-900/10">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                        Next move
                      </p>
                      <p className="mt-2 text-lg font-bold">
                        {stats.totalGapHours > 0
                          ? "Open the hottest heatmap cells first"
                          : "Stay on top of activity changes"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {stats.totalGapHours > 0
                          ? "Red and orange cells show uncovered demand. Click a cell to inspect the activity and book from context."
                          : "Even with coverage in place, the heatmap is where activity shifts show up first."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Planning readiness
                      </p>
                      <div className="mt-2 flex items-end gap-2">
                        <span className="text-3xl font-black leading-none text-slate-950">
                          {readinessScore}
                        </span>
                        <span className="pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {planningCompleteness?.status ?? "Unknown"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Metadata quality affects how much booked work can count
                        toward forecast coverage.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {isLoading || snapshotLoading ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {[1, 2, 3, 4].map((index) => (
                        <div
                          key={index}
                          className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4"
                        >
                          <Skeleton className="h-4 w-20 rounded" />
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : hasForecast ? (
                    <StatCards
                      stats={stats}
                      visibleWeeksCount={visibleWeeks.length}
                      heatmap={heatmap}
                    />
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <WindowSelector
                  windowSize={windowSize}
                  onSetWindowSize={updateWindowSize}
                  lastUpdated={versionsLoading ? null : latestUploadDate}
                />

                {topAlert && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-amber-50 p-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Needs attention
                        </p>
                        <p className="mt-2 text-base font-bold text-slate-950">
                          {topAlert.label}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {topAlert.detail}
                        </p>
                        {topAlert.onAction && topAlert.ctaLabel && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={topAlert.onAction}
                            className="mt-4"
                          >
                            {topAlert.ctaLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {uploadStatus && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Data quality
                          </p>
                          <p className="mt-2 text-base font-bold text-slate-950">
                            {latestUploadNeedsReview
                              ? "Latest upload needs review"
                              : "Latest upload is planning-ready"}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {persistentUploadMessage ||
                              "Diagnostics, mappings, and exclusions look healthy enough for planning."}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsUploadReviewOpen(true)}
                        >
                          Review
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                          v{uploadStatus.version_number}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                          {unclassifiedCount} unclassified
                        </span>
                        {typeof uploadStatus.completeness_notes?.excluded_booking_count ===
                          "number" && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                            {uploadStatus.completeness_notes.excluded_booking_count} excluded bookings
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Main workspace
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    Book against the forecast
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    The heatmap is the main planning surface. Click a demand
                    cell to inspect the activity behind it and book directly
                    from context.
                  </p>
                </div>
                {hasForecast && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {visibleWeeks.length} week{visibleWeeks.length === 1 ? "" : "s"} currently visible
                  </span>
                )}
              </div>

              {snapshotLoading || isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-52" />
                  <Skeleton className="h-90 w-full rounded-7" />
                </div>
              ) : !projectId ? (
                <EmptyForecastState reason="no-project" />
              ) : !heatmap || visibleWeeks.length === 0 ? (
                <EmptyForecastState reason="no-data" />
              ) : (
                <DemandHeatmap
                  heatmap={heatmap}
                  visibleWeeks={visibleWeeks}
                  maxDemand={maxDemand}
                  snapshotDate={snapshot?.snapshot_date}
                  timezone={snapshot?.timezone}
                  onCellSelect={(row) => {
                    setSelectedCell(row);
                    closeActivityFlow();
                  }}
                />
              )}
            </section>

            <section className="space-y-4 border-t border-slate-100 pt-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Supporting detail
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  Diagnostics, readiness, and history
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  These sections support forecast quality and follow-up work,
                  but the booking workspace stays above them.
                </p>
              </div>

              {!alertsLoading && (
                <PlanningAlerts
                  alerts={activeAlerts}
                  onDismiss={(key) =>
                    setDismissedAlerts((current) => new Set(current).add(key))
                  }
                />
              )}

              {(planningCompleteness || uploadStatus) && (
                <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  <PlanningReadinessCard planningCompleteness={planningCompleteness} />

                  {uploadStatus && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Upload quality
                        </h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {persistentUploadMessage ||
                          "Latest upload diagnostics are healthy enough for planning review."}
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Latest upload
                          </p>
                          <p className="mt-2 text-xl font-black text-slate-950">
                            v{uploadStatus.version_number}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {uploadStatus.file_name}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Mapping triage
                          </p>
                          <p className="mt-2 text-xl font-black text-slate-950">
                            {unclassifiedCount}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            rows still need classification review
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Excluded coverage
                          </p>
                          <p className="mt-2 text-xl font-black text-slate-950">
                            {uploadStatus.completeness_notes?.excluded_booking_count ?? 0}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            booked rows excluded from coverage
                          </p>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-2">
                <SnapshotHistoryPanel
                  history={history}
                  isOpen={isSnapshotHistoryOpen}
                  onOpenChange={setIsSnapshotHistoryOpen}
                  isLoading={Boolean(
                    isSnapshotHistoryOpen && enabled && historyLoading,
                  )}
                />
                {!versionsLoading && (
                  <VersionHistory
                    versions={sortedVersions}
                    deletingIds={deletingIds}
                    onDelete={handleDeleteVersion}
                    onReviewUpload={() => setIsUploadReviewOpen(true)}
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <ActivityDrilldownDialog
        open={Boolean(selectedCell)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCell(null);
          }
        }}
        selectedCell={selectedCell}
        activities={activities}
        isLoading={activitiesLoading}
        onBook={(activity) => {
          setActivityContextCell(selectedCell);
          setSelectedActivity(activity);
          setActivityDialogMode("booking");
          setSelectedCell(null);
        }}
        onViewContext={(activity) => {
          setActivityContextCell(selectedCell);
          setSelectedActivity(activity);
          setActivityDialogMode("context");
          setSelectedCell(null);
        }}
      />

      <ActivityContextDialog
        open={activityDialogMode === "context" && Boolean(selectedActivity)}
        onOpenChange={(open) => {
          if (!open) {
            closeActivityFlow();
          }
        }}
        selectedCell={activityContextCell}
        bookingContext={bookingContext}
        isLoading={bookingContextLoading}
        onBook={() => setActivityDialogMode("booking")}
      />

      <UploadReviewDialog
        open={isUploadReviewOpen}
        onOpenChange={setIsUploadReviewOpen}
        status={uploadStatus}
        mappings={mappings}
        unclassifiedMappings={unclassifiedMappings}
        isLoading={Boolean(
          isUploadReviewOpen &&
            latestVersion?.upload_id &&
            (uploadStatusLoading ||
              mappingsLoading ||
              unclassifiedMappingsLoading),
        )}
        userRole={user?.role}
        onCorrectMapping={async (mappingId, assetType) => {
          await updateProgrammeMapping(mappingId, { asset_type: assetType });
          await Promise.allSettled([
            mutateMappings(),
            mutateUnclassified(),
            mutateUploadStatus(),
            mutatePlanningCompleteness(),
          ]);
        }}
        onPromoteToMemory={async (itemId, assetType) => {
          await promoteItemClassification(itemId, { asset_type: assetType });
          await Promise.allSettled([
            mutateMappings(),
            mutateUnclassified(),
            mutateUploadStatus(),
            mutatePlanningCompleteness(),
          ]);
        }}
      />

      {activityDialogMode === "booking" &&
        selectedActivity &&
        bookingContext &&
        !bookingContextLoading && (
        <CreateBookingForm
          isOpen={true}
          onClose={closeActivityFlow}
          startTime={bookingStartTime}
          endTime={bookingEndTime}
          onSave={() => {
            void refreshLookaheadWorkspace();
          }}
          activityContext={bookingContext}
        />
      )}
    </div>
  );
}
