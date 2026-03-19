"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Upload, Check, ChevronDown, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/app/context/AuthContext";
import { useResolvedProjectSelection } from "@/hooks/useResolvedProjectSelection";
import {
  useLookaheadSnapshot,
  useLookaheadAlerts,
  useProgrammeVersions,
} from "@/hooks/lookahead/useLookaheadData";
import { uploadProgramme, fetchUploadStatus, deleteProgrammeVersion } from "@/hooks/lookahead/api";
import { useUIIntentStore } from "@/stores/uiIntentStore";
import type { LookaheadWindowSize } from "@/stores/uiIntentStore";
import type { LookaheadAnomalyFlags, ApiProject } from "@/types";
import { getApiErrorMessage } from "@/types";

import { StatCards } from "./StatCards";
import { UploadBanner, type UploadPhase } from "./UploadBanner";
import { PlanningAlerts, type PlanningAlert } from "./PlanningAlerts";
import { DemandHeatmap } from "./DemandHeatmap";
import { WindowSelector } from "./WindowSelector";
import { VersionHistory } from "./VersionHistory";
import { EmptyForecastState } from "./EmptyForecastState";
import { pivotRows, formatPct } from "./utils";

// ── constants ─────────────────────────────────────────────────────────────────
type WindowSize = LookaheadWindowSize;
const WINDOW_WEEKS: Record<WindowSize, number> = { "2W": 2, "4W": 4, "6W": 6 };
const POLL_MAX_ATTEMPTS = 60; // 60 × 2s = 2 min max

// ─────────────────────────────────────────────────────────────────────────────
export default function LookaheadDashboard() {
  const { user, isLoading: authLoading } = useAuth();

  // ── local ui state ──────────────────────────────────────────────────────────
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>({ kind: "idle" });
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [windowSize, setWindowSizeLocal] = useState<WindowSize>("4W");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingGenerationRef = useRef(0);
  const userId = user?.id;

  // ── zustand: persisted window size ─────────────────────────────────────────
  const hasUIIntentHydrated = useUIIntentStore((state) => state.hasHydrated);
  const setLookaheadWindowSize = useUIIntentStore((state) => state.setLookaheadWindowSize);

  // ── project selection ───────────────────────────────────────────────────────
  const {
    projects,
    projectId,
    selectedProject,
    projectBootstrapLoading: isDataLoading,
    setProjectId,
  } = useResolvedProjectSelection({ userId, role: user?.role });

  const projectIdRef = useRef(projectId);

  // Keep projectIdRef in sync so async callbacks can read the live value
  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  const uiScopeKey = useMemo(
    () => (userId && projectId ? `${userId}:${projectId}` : null),
    [userId, projectId],
  );

  useEffect(() => {
    if (!hasUIIntentHydrated || !uiScopeKey) return;
    const persisted = useUIIntentStore.getState().getLookaheadIntent(uiScopeKey);
    setWindowSizeLocal(persisted?.windowSize ?? "4W");
  }, [hasUIIntentHydrated, uiScopeKey]);

  const setWindowSize = useCallback(
    (next: WindowSize) => {
      setWindowSizeLocal(next);
      if (uiScopeKey) setLookaheadWindowSize(uiScopeKey, next);
    },
    [uiScopeKey, setLookaheadWindowSize],
  );

  // ── swr data ────────────────────────────────────────────────────────────────
  const enabled = Boolean(projectId);
  const { snapshot, isLoading: snapshotLoading, mutate: mutateSnapshot } =
    useLookaheadSnapshot({ projectId, enabled });
  const { alerts, isLoading: alertsLoading, mutate: mutateAlerts } =
    useLookaheadAlerts({ projectId, enabled });
  const { versions, isLoading: versionsLoading, mutate: mutateVersions } =
    useProgrammeVersions({ projectId, enabled });

  // ── polling ─────────────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    pollingGenerationRef.current += 1;
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const isFetchingRef = useRef(false);

  const startPolling = useCallback(
    (uploadId: string) => {
      stopPolling();
      isFetchingRef.current = false;
      const generation = ++pollingGenerationRef.current;
      let attempts = 0;
      let consecutiveErrors = 0;
      pollingRef.current = setInterval(async () => {
        if (pollingGenerationRef.current !== generation) return;
        // Prevent overlapping requests when fetchUploadStatus takes > 2s
        if (isFetchingRef.current) return;
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
            void mutateSnapshot();
            void mutateAlerts();
            void mutateVersions();
          }
        } catch {
          if (pollingGenerationRef.current !== generation) return;
          consecutiveErrors += 1;
          // Allow up to 2 transient failures (proxy timeout, brief network blip)
          // before surfacing an error. The next interval tick will retry.
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
    [stopPolling, mutateSnapshot, mutateAlerts, mutateVersions],
  );

  // ── upload handler ──────────────────────────────────────────────────────────
  const handleFileSelected = useCallback(
    async (file: File | null) => {
      if (!file || !projectId) return;
      const targetProject = projectId;
      setUploadPhase({ kind: "uploading" });
      try {
        const result = await uploadProgramme(targetProject, file);
        // Discard result if the user switched projects while uploading
        if (targetProject !== projectIdRef.current) return;
        setUploadPhase({ kind: "polling", uploadId: result.upload_id });
        startPolling(result.upload_id);
      } catch (err) {
        if (targetProject !== projectIdRef.current) return;
        setUploadPhase({ kind: "error", message: getApiErrorMessage(err) });
      }
    },
    [projectId, startPolling],
  );

  // ── delete handler ──────────────────────────────────────────────────────────
  const handleDeleteVersion = useCallback(
    async (uploadId: string) => {
      setDeletingId(uploadId);
      try {
        await deleteProgrammeVersion(uploadId);
        void mutateVersions();
        void mutateSnapshot();
        void mutateAlerts();
        setUploadPhase((prev) =>
          prev.kind === "done" && prev.result.upload_id === uploadId
            ? { kind: "idle" }
            : prev,
        );
      } catch (err) {
        setUploadPhase({ kind: "error", message: getApiErrorMessage(err) });
      } finally {
        setDeletingId(null);
      }
    },
    [mutateVersions, mutateSnapshot, mutateAlerts],
  );

  // ── project switcher ─────────────────────────────────────────────────────────
  const handleProjectSelect = useCallback(
    (proj: ApiProject) => {
      if (!proj?.id) return;
      stopPolling();
      setShowProjectSelector(false);
      setProjectId(proj.id);
      setUploadPhase({ kind: "idle" });
      setDismissedAlerts(new Set());
    },
    [stopPolling, setProjectId],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target instanceof Node)) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProjectSelector(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── derived data ─────────────────────────────────────────────────────────────
  const heatmap = useMemo(
    () => (snapshot?.rows?.length ? pivotRows(snapshot.rows) : null),
    [snapshot],
  );

  const visibleWeeks = useMemo(() => {
    if (!heatmap) return [];
    const weeks = heatmap.weeks;
    const n = WINDOW_WEEKS[windowSize];

    // Find the Monday of the current week (ISO date string YYYY-MM-DD).
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sun
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    const currentWeekStr = monday.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

    // Start from the first week that is >= the current week's Monday.
    // If the programme is entirely in the past, fall back to the last N weeks.
    let startIdx = weeks.findIndex((w) => w >= currentWeekStr);
    if (startIdx === -1) startIdx = Math.max(0, weeks.length - n);

    return weeks.slice(startIdx, startIdx + n);
  }, [heatmap, windowSize]);

  const visibleRows = useMemo(() => {
    if (!heatmap || !visibleWeeks.length) return [];
    return heatmap.assets.flatMap((asset) =>
      visibleWeeks.flatMap((week) => {
        const row = heatmap.matrix.get(asset)?.get(week);
        return row ? [row] : [];
      }),
    );
  }, [heatmap, visibleWeeks]);

  const stats = useMemo(
    () => ({
      totalDemandHours: visibleRows.reduce((s, r) => s + r.demand_hours, 0),
      totalBookedHours: visibleRows.reduce((s, r) => s + r.booked_hours, 0),
      totalGapHours:    visibleRows.reduce((s, r) => s + r.gap_hours, 0),
      assetsTracked:    heatmap?.assets.length ?? 0,
    }),
    [visibleRows, heatmap],
  );

  const maxDemand = useMemo(
    () =>
      Math.max(
        1,
        ...(heatmap
          ? heatmap.assets.flatMap((a) =>
              visibleWeeks.map((w) => heatmap.matrix.get(a)?.get(w)?.demand_hours ?? 0),
            )
          : [0]),
      ),
    [heatmap, visibleWeeks],
  );

  const activeAlerts = useMemo((): PlanningAlert[] => {
    if (!alerts?.alerts) return [];
    const flags = alerts.alerts as LookaheadAnomalyFlags;
    const result: PlanningAlert[] = [];

    if (flags.demand_spike_over_100pct) {
      result.push({
        key: "demand_spike",
        label: "Workload surge detected",
        detail:
          "One or more asset types now need more than double the hours compared to your previous programme. Check that bookings are in place to cover the increase.",
        level: "red",
      });
    }
    if (flags.mapping_changes_over_40pct) {
      const pct =
        flags.mapping_change_ratio != null
          ? ` — ${formatPct(flags.mapping_change_ratio)} of tasks were reassigned`
          : "";
      result.push({
        key: "mapping_changes",
        label: "Many tasks re-categorised",
        detail: `More than 40% of tasks were assigned to different asset categories compared to your last upload${pct}. It's worth checking the results look correct before relying on the forecast.`,
        level: "amber",
      });
    }
    if (flags.activity_count_delta_over_30pct) {
      const pct =
        flags.activity_count_delta_ratio != null
          ? ` (${formatPct(flags.activity_count_delta_ratio)} difference)`
          : "";
      result.push({
        key: "activity_delta",
        label: "Task count changed significantly",
        detail: `The number of tasks in this programme is more than 30% different from your previous upload${pct}. This may be expected if the scope changed.`,
        level: "blue",
      });
    }

    return result.filter((a) => !dismissedAlerts.has(a.key));
  }, [alerts, dismissedAlerts]);

  const latestVersion = useMemo(
    () => versions.find((v) => v.status === "committed") ?? versions[0] ?? null,
    [versions],
  );

  const lastUpdated = useMemo(() => {
    if (!latestVersion?.created_at) return null;
    return new Date(latestVersion.created_at).toLocaleString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [latestVersion]);

  useEffect(() => {
    setDismissedAlerts(new Set());
  }, [latestVersion?.upload_id]);

  const isLoading = authLoading || isDataLoading;
  const isUploading = uploadPhase.kind === "uploading" || uploadPhase.kind === "polling";
  const hasForecast = !!projectId && !!heatmap && visibleWeeks.length > 0;

  // ─── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-(--page-bg) p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-screen mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-1 min-h-[85vh] flex flex-col relative overflow-hidden">
          <div className="p-6 flex-1 flex flex-col space-y-6">

            {/* ── HEADER ── */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Lookahead Dashboard
                </h1>
                <p className="text-slate-500 text-sm mt-1 font-medium flex items-center gap-1">
                  {selectedProject?.location ? (
                    <>
                      <MapPin size={13} className="text-slate-300" />
                      {selectedProject.location}
                    </>
                  ) : (
                    "Asset demand forecast and programme planning"
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto">
                {/* Stat pills */}
                {!isLoading && !snapshotLoading && heatmap && (
                  <div className="flex gap-3">
                    <div className="bg-navy text-white rounded-xl px-5 py-2 flex flex-col items-center justify-center min-w-25 shadow-md shadow-slate-900/10">
                      <span className="text-2xl font-bold leading-none">
                        {stats.assetsTracked}
                      </span>
                      <span className="text-[10px] font-medium opacity-80 uppercase tracking-wide">
                        Asset Types
                      </span>
                    </div>
                    <div className="bg-(--brand-orange) text-white rounded-xl px-5 py-2 flex flex-col items-center justify-center min-w-25 shadow-md shadow-orange-900/10">
                      <span className="text-2xl font-bold leading-none">
                        {stats.totalGapHours}h
                      </span>
                      <span className="text-[10px] font-medium opacity-90 uppercase tracking-wide">
                        Still Unbooked
                      </span>
                    </div>
                  </div>
                )}

                {/* Project switcher */}
                <div className="relative" ref={dropdownRef}>
                  <Button
                    onClick={() => setShowProjectSelector((v) => !v)}
                    className="bg-navy hover:bg-(--navy-hover) text-white rounded-lg px-5 py-5 h-auto text-sm font-bold shadow-md shadow-slate-900/10 flex items-center gap-2"
                  >
                    {isLoading ? "Loading…" : (selectedProject?.name ?? "Select Project")}
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-200 ${showProjectSelector ? "rotate-180" : ""}`}
                    />
                  </Button>

                  {showProjectSelector && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Available Projects
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {projects.length}
                        </span>
                      </div>
                      <div className="max-h-75 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {projects.length === 0 ? (
                          <p className="text-center py-4 text-sm text-slate-400">
                            No projects found
                          </p>
                        ) : (
                          projects.map((proj) => {
                            const isActive = selectedProject?.id === proj.id;
                            return (
                              <button
                                key={proj.id}
                                onClick={() => handleProjectSelect(proj)}
                                className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between group cursor-pointer ${
                                  isActive
                                    ? "bg-navy text-white shadow-md shadow-slate-900/10"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                              >
                                <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                                  <span className="truncate w-full font-bold">{proj.name}</span>
                                  <span
                                    className={`text-[11px] truncate w-full ${isActive ? "text-slate-300" : "text-slate-400"}`}
                                  >
                                    {proj.location || "No location"}
                                  </span>
                                </div>
                                {isActive && (
                                  <Check size={16} className="text-white shrink-0 ml-2" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload button */}
                <Button
                  disabled={!projectId || isLoading || isUploading}
                  onClick={() => {
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    fileInputRef.current?.click();
                  }}
                  className="bg-navy hover:bg-(--navy-hover) text-white rounded-lg px-5 py-5 h-auto text-sm font-bold shadow-md shadow-slate-900/10 flex items-center gap-2 w-full sm:w-auto"
                >
                  {isUploading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Upload size={15} />
                  )}
                  Upload Programme
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xlsm,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            {/* ── WINDOW SELECTOR + TIMESTAMP ── */}
            <WindowSelector
              windowSize={windowSize}
              onSetWindowSize={setWindowSize}
              lastUpdated={versionsLoading ? null : lastUpdated}
            />

            {/* ── UPLOAD STATUS BANNER ── */}
            <UploadBanner
              phase={uploadPhase}
              onDismiss={() => {
                setUploadPhase({ kind: "idle" });
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              onUploadAnother={() => {
                setUploadPhase({ kind: "idle" });
                if (fileInputRef.current) fileInputRef.current.value = "";
                fileInputRef.current?.click();
              }}
            />

            {/* ── PLANNING ALERTS ── */}
            {!alertsLoading && (
              <PlanningAlerts
                alerts={activeAlerts}
                onDismiss={(key) =>
                  setDismissedAlerts((prev) => new Set(prev).add(key))
                }
              />
            )}

            {/* ── STAT CARDS ── */}
            {isLoading || snapshotLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 space-y-3"
                  >
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-3 w-28" />
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

            {/* ── DEMAND FORECAST ── */}
            {snapshotLoading || isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
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
              />
            )}

            {/* ── VERSION HISTORY ── */}
            {!versionsLoading && (
              <VersionHistory
                versions={versions}
                deletingId={deletingId}
                onDelete={handleDeleteVersion}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
