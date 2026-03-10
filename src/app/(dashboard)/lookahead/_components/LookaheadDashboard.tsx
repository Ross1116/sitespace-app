"use client";

import { useAuth } from "@/app/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useResolvedProjectSelection } from "@/hooks/useResolvedProjectSelection";
import {
  useLookaheadSnapshot,
  useLookaheadAlerts,
  useProgrammeVersions,
} from "@/hooks/lookahead/useLookaheadData";
import { uploadProgramme, fetchUploadStatus, deleteProgrammeVersion } from "@/hooks/lookahead/api";
import type {
  LookaheadRow,
  LookaheadAnomalyFlags,
  UploadStatusResponse,
  ApiProject,
  DemandLevel,
} from "@/types";
import { getApiErrorMessage } from "@/types";
import {
  Upload,
  Check,
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  BarChart3,
  Clock,
  Loader2,
  TrendingUp,
  CalendarRange,
  MapPin,
  Trash2,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useUIIntentStore } from "@/stores/uiIntentStore";
import type { LookaheadWindowSize } from "@/stores/uiIntentStore";

// ── window size ───────────────────────────────────────────────────────────────
type WindowSize = LookaheadWindowSize;
const WINDOW_WEEKS: Record<WindowSize, number> = { "2W": 2, "4W": 4, "6W": 6 };

// ── helpers ───────────────────────────────────────────────────────────────────
function formatAssetType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatWeekRange(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  const fmt = (date: Date) =>
    date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  return `${fmt(d)}–${fmt(end)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

function pivotRows(rows: LookaheadRow[]) {
  const weekSet = new Set<string>();
  const assetSet = new Set<string>();
  const matrix = new Map<string, Map<string, LookaheadRow>>();

  for (const row of rows) {
    weekSet.add(row.week_start);
    assetSet.add(row.asset_type);
    if (!matrix.has(row.asset_type)) matrix.set(row.asset_type, new Map());
    matrix.get(row.asset_type)!.set(row.week_start, row);
  }

  return {
    weeks: Array.from(weekSet).sort(),
    assets: Array.from(assetSet).sort(),
    matrix,
  };
}

// ── demand level display maps (keyed on the API's demand_level field) ─────────
const LEVEL_BAR: Record<DemandLevel, string> = {
  low:      "bg-[var(--teal)]",
  medium:   "bg-amber-400",
  high:     "bg-orange-500",
  critical: "bg-red-500",
};

const LEVEL_TEXT: Record<DemandLevel, string> = {
  low:      "text-[var(--teal)]",
  medium:   "text-amber-600",
  high:     "text-orange-600",
  critical: "text-red-600",
};

const LEVEL_LABEL: Record<DemandLevel, string> = {
  low:      "Low",
  medium:   "Medium",
  high:     "High",
  critical: "Critical",
};

// ── upload state machine ──────────────────────────────────────────────────────
type UploadPhase =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "polling"; uploadId: string }
  | { kind: "done"; result: UploadStatusResponse }
  | { kind: "error"; message: string };

// ─────────────────────────────────────────────────────────────────────────────
export default function LookaheadDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>({ kind: "idle" });
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showVersions, setShowVersions] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [windowSize, setWindowSizeLocal] = useState<WindowSize>("4W");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userId = user?.id;

  // ── ui intent store (persists windowSize across sessions) ───────────────────
  const hasUIIntentHydrated = useUIIntentStore((state) => state.hasHydrated);
  const setLookaheadWindowSize = useUIIntentStore(
    (state) => state.setLookaheadWindowSize,
  );

  const {
    projects,
    projectId,
    selectedProject,
    projectBootstrapLoading: isDataLoading,
    setProjectId,
  } = useResolvedProjectSelection({ userId, role: user?.role });

  const uiScopeKey = useMemo(() => {
    if (!userId || !projectId) return null;
    return `${userId}:${projectId}`;
  }, [userId, projectId]);

  // Restore persisted windowSize once the store has rehydrated from localStorage
  useEffect(() => {
    if (!hasUIIntentHydrated || !uiScopeKey) return;
    const persisted = useUIIntentStore.getState().getLookaheadIntent(uiScopeKey);
    if (persisted?.windowSize) {
      setWindowSizeLocal(persisted.windowSize);
    }
  }, [hasUIIntentHydrated, uiScopeKey]);

  const setWindowSize = useCallback(
    (next: WindowSize) => {
      setWindowSizeLocal(next);
      if (uiScopeKey) setLookaheadWindowSize(uiScopeKey, next);
    },
    [uiScopeKey, setLookaheadWindowSize],
  );

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
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startPolling = useCallback(
    (uploadId: string) => {
      stopPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const status = await fetchUploadStatus(uploadId);
          if (status.status !== "processing") {
            stopPolling();
            setUploadPhase({ kind: "done", result: status });
            void mutateSnapshot();
            void mutateAlerts();
            void mutateVersions();
          }
        } catch {
          stopPolling();
          setUploadPhase({
            kind: "error",
            message: "Lost connection while checking upload status.",
          });
        }
      }, 2000);
    },
    [stopPolling, mutateSnapshot, mutateAlerts, mutateVersions],
  );

  // ── delete ───────────────────────────────────────────────────────────────────
  const handleDeleteVersion = useCallback(
    async (uploadId: string) => {
      setDeletingId(uploadId);
      setConfirmDeleteId(null);
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
        console.error("Delete failed:", getApiErrorMessage(err));
      } finally {
        setDeletingId(null);
      }
    },
    [mutateVersions, mutateSnapshot, mutateAlerts],
  );

  // ── upload ───────────────────────────────────────────────────────────────────
  const handleFileSelected = useCallback(
    async (file: File | null) => {
      if (!file || !projectId) return;
      setUploadPhase({ kind: "uploading" });
      try {
        const result = await uploadProgramme(projectId, file);
        setUploadPhase({ kind: "polling", uploadId: result.upload_id });
        startPolling(result.upload_id);
      } catch (err) {
        setUploadPhase({ kind: "error", message: getApiErrorMessage(err) });
      }
    },
    [projectId, startPolling],
  );

  // ── project switcher ─────────────────────────────────────────────────────────
  const handleProjectSelect = (proj: ApiProject) => {
    if (!proj?.id) return;
    setShowProjectSelector(false);
    setProjectId(proj.id);
    setUploadPhase({ kind: "idle" });
    setDismissedAlerts(new Set());
  };

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
    return heatmap.weeks.slice(0, WINDOW_WEEKS[windowSize]);
  }, [heatmap, windowSize]);

  const visibleRows = useMemo(() => {
    if (!heatmap || !visibleWeeks.length) return [] as LookaheadRow[];
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

  // Max demand_hours across visible rows — used to normalise bar widths.
  // Computed here (not inside JSX) so it doesn't re-run on every render pass.
  const maxDemand = useMemo(
    () =>
      Math.max(
        1,
        ...(heatmap
          ? heatmap.assets.flatMap((a) =>
              visibleWeeks.map(
                (w) => heatmap.matrix.get(a)?.get(w)?.demand_hours ?? 0,
              ),
            )
          : [0]),
      ),
    [heatmap, visibleWeeks],
  );

  const activeAlerts = useMemo(() => {
    if (!alerts?.alerts) return [];
    const flags = alerts.alerts as LookaheadAnomalyFlags;
    const result: {
      key: string;
      label: string;
      detail: string;
      level: "red" | "amber" | "blue";
    }[] = [];

    if (flags.demand_spike_over_100pct) {
      result.push({
        key: "demand_spike",
        label: "Demand spike detected",
        detail:
          "One or more asset types have more than doubled in weekly demand vs. the previous programme version.",
        level: "red",
      });
    }
    if (flags.mapping_changes_over_40pct) {
      const pct =
        flags.mapping_change_ratio != null
          ? ` (${formatPct(flags.mapping_change_ratio)} of mappings changed)`
          : "";
      result.push({
        key: "mapping_changes",
        label: "Large classification shift",
        detail: `More than 40% of activity–asset mappings changed${pct}. Review the auto-classified tab for accuracy.`,
        level: "amber",
      });
    }
    if (flags.activity_count_delta_over_30pct) {
      const pct =
        flags.activity_count_delta_ratio != null
          ? ` (${formatPct(flags.activity_count_delta_ratio)} delta)`
          : "";
      result.push({
        key: "activity_delta",
        label: "Activity count changed significantly",
        detail: `Activity count shifted by more than 30%${pct} vs. the previous programme version.`,
        level: "blue",
      });
    }

    return result.filter((a) => !dismissedAlerts.has(a.key));
  }, [alerts, dismissedAlerts]);

  const isLoading = authLoading || isDataLoading;

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

  // ─── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--page-bg)] p-4 sm:p-6 lg:p-8 font-sans">
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
                {/* Stat pills — only shown when data is available */}
                {!isLoading && !snapshotLoading && heatmap && (
                  <div className="flex gap-3">
                    <div className="bg-[var(--navy)] text-white rounded-xl px-5 py-2 flex flex-col items-center justify-center min-w-[100px] shadow-md shadow-slate-900/10">
                      <span className="text-2xl font-bold leading-none">
                        {stats.assetsTracked}
                      </span>
                      <span className="text-[10px] font-medium opacity-80 uppercase tracking-wide">
                        Asset Types
                      </span>
                    </div>
                    <div className="bg-[var(--brand-orange)] text-white rounded-xl px-5 py-2 flex flex-col items-center justify-center min-w-[100px] shadow-md shadow-orange-900/10">
                      <span className="text-2xl font-bold leading-none">
                        {stats.totalGapHours}h
                      </span>
                      <span className="text-[10px] font-medium opacity-90 uppercase tracking-wide">
                        Gap Hours
                      </span>
                    </div>
                  </div>
                )}

                {/* Project switcher */}
                <div className="relative" ref={dropdownRef}>
                  <Button
                    onClick={() => setShowProjectSelector((v) => !v)}
                    className="bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white rounded-lg px-5 py-5 h-auto text-sm font-bold shadow-md shadow-slate-900/10 flex items-center gap-2"
                  >
                    {isLoading
                      ? "Loading…"
                      : (selectedProject?.name ?? "Select Project")}
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
                      <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
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
                                className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between group cursor-pointer
                                  ${isActive
                                    ? "bg-[var(--navy)] text-white shadow-md shadow-slate-900/10"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                  }`}
                              >
                                <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                                  <span className="truncate w-full font-bold">
                                    {proj.name}
                                  </span>
                                  <span
                                    className={`text-[11px] truncate w-full ${isActive ? "text-slate-300" : "text-slate-400"}`}
                                  >
                                    {proj.location || "No location"}
                                  </span>
                                </div>
                                {isActive && (
                                  <Check size={16} className="text-white flex-shrink-0 ml-2" />
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
                  disabled={
                    !projectId ||
                    isLoading ||
                    uploadPhase.kind === "uploading" ||
                    uploadPhase.kind === "polling"
                  }
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white rounded-lg px-5 py-5 h-auto text-sm font-bold shadow-md shadow-slate-900/10 flex items-center gap-2 w-full sm:w-auto"
                >
                  {uploadPhase.kind === "uploading" ||
                  uploadPhase.kind === "polling" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Upload size={15} />
                  )}
                  Upload Programme
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xlsm"
                  className="hidden"
                  onChange={(e) =>
                    handleFileSelected(e.target.files?.[0] ?? null)
                  }
                />
              </div>
            </div>

            {/* ── WINDOW SELECTOR + TIMESTAMP ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-semibold text-slate-500">
                  Lookahead Window:
                </span>
                <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                  {(["2W", "4W", "6W"] as WindowSize[]).map((w) => (
                    <button
                      key={w}
                      onClick={() => setWindowSize(w)}
                      className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                        windowSize === w
                          ? "bg-[var(--navy)] text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {w === "2W" ? "2 Weeks" : w === "4W" ? "4 Weeks" : "6 Weeks"}
                    </button>
                  ))}
                </div>
              </div>
              {lastUpdated && !versionsLoading && (
                <p className="text-xs text-slate-400">
                  Last updated:{" "}
                  <span className="font-semibold text-slate-600">
                    {lastUpdated}
                  </span>
                </p>
              )}
            </div>

            {/* ── UPLOAD STATUS BANNER ── */}
            {uploadPhase.kind !== "idle" && (
              <div
                className={`rounded-xl border px-4 py-3 flex items-center gap-3 text-sm ${
                  uploadPhase.kind === "done" &&
                  uploadPhase.result.status === "committed"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : uploadPhase.kind === "error"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                {(uploadPhase.kind === "uploading" ||
                  uploadPhase.kind === "polling") && (
                  <Loader2
                    size={16}
                    className="animate-spin text-[var(--teal)] flex-shrink-0"
                  />
                )}
                {uploadPhase.kind === "done" &&
                  uploadPhase.result.status === "committed" && (
                    <CheckCircle2
                      size={16}
                      className="text-green-600 flex-shrink-0"
                    />
                  )}
                {uploadPhase.kind === "done" &&
                  uploadPhase.result.status !== "committed" && (
                    <AlertTriangle
                      size={16}
                      className="text-amber-500 flex-shrink-0"
                    />
                  )}
                {uploadPhase.kind === "error" && (
                  <XCircle size={16} className="text-red-500 flex-shrink-0" />
                )}
                <span className="flex-1">
                  {uploadPhase.kind === "uploading" && "Uploading file…"}
                  {uploadPhase.kind === "polling" &&
                    "Analysing programme — AI is mapping columns and classifying asset demand…"}
                  {uploadPhase.kind === "done" &&
                    uploadPhase.result.status === "committed" &&
                    `v${uploadPhase.result.version_number} committed · ${uploadPhase.result.completeness_score}% complete · Forecast updated`}
                  {uploadPhase.kind === "done" &&
                    uploadPhase.result.status !== "committed" &&
                    `v${uploadPhase.result.version_number} degraded — processing partially failed`}
                  {uploadPhase.kind === "error" && uploadPhase.message}
                </span>
                {(uploadPhase.kind === "done" ||
                  uploadPhase.kind === "error") && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setUploadPhase({ kind: "idle" });
                        fileInputRef.current && (fileInputRef.current.value = "");
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-[var(--teal)] hover:text-[var(--navy)] transition-colors"
                    >
                      <RefreshCw size={11} />
                      Upload another
                    </button>
                    <button
                      onClick={() => {
                        setUploadPhase({ kind: "idle" });
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIVE PLANNING ALERTS ── */}
            {!alertsLoading && activeAlerts.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  Active Planning Alerts
                </h2>
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.key}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-sm border-l-4 ${
                      alert.level === "red"
                        ? "bg-red-50 border-red-200 border-l-red-500"
                        : alert.level === "amber"
                          ? "bg-amber-50 border-amber-200 border-l-amber-500"
                          : "bg-blue-50 border-blue-200 border-l-blue-500"
                    }`}
                  >
                    {alert.level === "red" ? (
                      <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    ) : alert.level === "amber" ? (
                      <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold ${
                          alert.level === "red"
                            ? "text-red-800"
                            : alert.level === "amber"
                              ? "text-amber-800"
                              : "text-blue-800"
                        }`}
                      >
                        {alert.label}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          alert.level === "red"
                            ? "text-red-700"
                            : alert.level === "amber"
                              ? "text-amber-700"
                              : "text-blue-700"
                        }`}
                      >
                        {alert.detail}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setDismissedAlerts((prev) => new Set(prev).add(alert.key))
                      }
                      className={`flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity ${
                        alert.level === "red"
                          ? "text-red-600"
                          : alert.level === "amber"
                            ? "text-amber-600"
                            : "text-blue-600"
                      }`}
                      aria-label="Dismiss alert"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <p className="text-[11px] text-slate-400 italic">
                  Planning notices only. No contractual implications. Review
                  programme for certainty.
                </p>
              </div>
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
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: TrendingUp,
                    value: `${stats.totalDemandHours}h`,
                    label: "Total Demand",
                    sub: `Across ${visibleWeeks.length} week${visibleWeeks.length !== 1 ? "s" : ""}`,
                  },
                  {
                    icon: Calendar,
                    value: `${stats.totalBookedHours}h`,
                    label: "Hours Booked",
                    sub:
                      stats.totalDemandHours > 0
                        ? `${Math.round((stats.totalBookedHours / stats.totalDemandHours) * 100)}% of demand covered`
                        : "No demand data",
                  },
                  {
                    icon: CalendarRange,
                    value: `${stats.totalGapHours}h`,
                    label: "Unbooked Gap",
                    sub:
                      stats.totalGapHours === 0 && heatmap
                        ? "All demand covered ✓"
                        : "Hours still needing a booking",
                  },
                  {
                    icon: MapPin,
                    value: stats.assetsTracked,
                    label: "Asset Types",
                    sub: heatmap
                      ? heatmap.assets
                          .slice(0, 3)
                          .map(formatAssetType)
                          .join(", ") +
                        (heatmap.assets.length > 3 ? "…" : "")
                      : "No assets",
                  },
                ].map(({ icon: Icon, value, label, sub }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 hover:border-slate-200 transition-colors"
                  >
                    <Icon
                      size={18}
                      className="text-[var(--teal)] mb-3"
                      strokeWidth={1.75}
                    />
                    <p className="text-3xl font-extrabold text-slate-900 leading-none mb-1">
                      {value}
                    </p>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide leading-tight">
                      {label}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      {sub}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* ── ASSET DEMAND FORECAST ── */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[var(--teal)]" />
                <h2 className="text-base font-bold text-slate-900">
                  Asset Demand Forecast
                </h2>
                {snapshot?.snapshot_date && (
                  <span className="text-xs text-slate-400 ml-1">
                    Snapshot {formatDate(snapshot.snapshot_date)}
                    {snapshot.timezone && ` · ${snapshot.timezone}`}
                  </span>
                )}
              </div>

              {snapshotLoading || isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : !projectId ? (
                <EmptyForecastState reason="no-project" />
              ) : !heatmap || visibleWeeks.length === 0 ? (
                <EmptyForecastState reason="no-data" />
              ) : (
                <div className="rounded-xl border border-slate-100 overflow-x-auto">
                  <div
                    className="p-5 sm:p-6 min-w-[480px] grid gap-6"
                    style={{
                      gridTemplateColumns: `repeat(${visibleWeeks.length}, 1fr)`,
                    }}
                  >
                    {visibleWeeks.map((week, wIdx) => (
                      <div key={week}>
                        <div className="mb-4 pb-3 border-b border-slate-100">
                          <p className="text-sm font-bold text-slate-800">
                            Week {wIdx + 1}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {formatWeekRange(week)}
                          </p>
                        </div>

                        <div className="space-y-4">
                          {heatmap.assets.map((asset) => {
                            const row = heatmap.matrix.get(asset)?.get(week);
                            const level = row?.demand_level ?? "low";
                            const barWidth = row
                              ? Math.round((row.demand_hours / maxDemand) * 100)
                              : 0;
                            return (
                              <div key={asset}>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span
                                    className="text-xs font-medium text-slate-600 truncate"
                                    title={formatAssetType(asset)}
                                  >
                                    {formatAssetType(asset)}
                                  </span>
                                  {row ? (
                                    <span
                                      className={`text-xs font-bold flex-shrink-0 ${LEVEL_TEXT[level]}`}
                                    >
                                      {row.demand_hours}h
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-300 flex-shrink-0">
                                      —
                                    </span>
                                  )}
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  {row && (
                                    <div
                                      className={`h-full rounded-full transition-all duration-700 ${LEVEL_BAR[level]}`}
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  )}
                                </div>
                                {row && row.gap_hours > 0 && (
                                  <p className="text-[10px] text-red-500 mt-0.5">
                                    {row.gap_hours}h unbooked
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Legend — Low/Medium/High/Critical match the API's demand_level enum */}
                  <div className="px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-5 flex-wrap">
                    {(["low", "medium", "high", "critical"] as DemandLevel[]).map(
                      (lvl) => (
                        <div key={lvl} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-sm ${LEVEL_BAR[lvl]}`} />
                          <span className="text-xs text-slate-500">
                            {LEVEL_LABEL[lvl]}
                          </span>
                        </div>
                      ),
                    )}
                    <span className="text-xs text-slate-400 ml-auto">
                      Bar width = relative demand · colour = demand level from API
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── VERSION HISTORY (collapsible) ── */}
            {!versionsLoading && versions.length > 0 && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setShowVersions((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Clock size={14} className="text-[var(--teal)]" />
                    Programme History
                    <span className="text-[11px] font-normal text-slate-400">
                      ({versions.length}{" "}
                      {versions.length === 1 ? "version" : "versions"})
                    </span>
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${showVersions ? "rotate-180" : ""}`}
                  />
                </button>

                {showVersions && (
                  <div className="border-t border-slate-100 p-3 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                    {versions.map((v) => {
                      const isConfirming = confirmDeleteId === v.upload_id;
                      const isDeleting = deletingId === v.upload_id;
                      return (
                        <div
                          key={v.upload_id}
                          className="flex items-center justify-between text-xs py-2 px-3 rounded-lg hover:bg-white transition-colors group"
                        >
                          {isConfirming ? (
                            <div className="flex items-center gap-2 w-full justify-between">
                              <span className="text-slate-600 font-medium">
                                Delete{" "}
                                <span className="font-bold">v{v.version_number}</span>
                                ? This cannot be undone.
                              </span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => void handleDeleteVersion(v.upload_id)}
                                  disabled={isDeleting}
                                  className="font-bold text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                                >
                                  {isDeleting ? "Deleting…" : "Delete"}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-slate-700 flex-shrink-0">
                                  v{v.version_number}
                                </span>
                                <span className="text-slate-500 truncate">
                                  {v.file_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span
                                  className={`font-medium ${
                                    v.status === "committed"
                                      ? "text-green-600"
                                      : v.status === "degraded"
                                        ? "text-amber-600"
                                        : "text-slate-400"
                                  }`}
                                >
                                  {v.completeness_score}%
                                </span>
                                <span className="text-slate-400">
                                  {formatDate(v.created_at)}
                                </span>
                                <button
                                  onClick={() => setConfirmDeleteId(v.upload_id)}
                                  disabled={v.status === "processing" || isDeleting}
                                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 disabled:cursor-not-allowed transition-all"
                                  title="Delete this version"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────
function EmptyForecastState({ reason }: { reason: "no-project" | "no-data" }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
        <BarChart3 size={28} className="text-slate-300" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">
        No forecast data
      </h3>
      <p className="text-sm text-slate-500 max-w-sm">
        {reason === "no-project"
          ? "Select a project to view the demand forecast."
          : "Upload a programme file to generate the demand forecast. Progress bars will appear once the AI has classified asset demand."}
      </p>
    </div>
  );
}
