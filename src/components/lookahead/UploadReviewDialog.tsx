"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileWarning,
  Loader2,
  Search,
  Zap,
} from "lucide-react";
import type {
  ActivityMappingResponse,
  ProgrammeUploadDiagnostics,
  UploadStatusResponse,
  UserRole,
} from "@/types";
import { getApiErrorMessage } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORK_PROFILE_SHAPE_OPTIONS } from "@/lib/formOptions";
import { useProjectAssetTypes } from "@/hooks/useProjectAssetTypes";
import { reportError } from "@/lib/monitoring";
import { formatAssetType } from "./utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status?: UploadStatusResponse;
  projectId?: string | null;
  mappings: ActivityMappingResponse[];
  unclassifiedMappings: ActivityMappingResponse[];
  isLoading: boolean;
  userRole?: UserRole | string;
  onCorrectMapping: (
    mappingId: string,
    correction: { asset_type: string; profile_shape?: string | null },
  ) => Promise<void>;
  onPromoteToMemory: (itemId: string, assetType: string) => Promise<void>;
}

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const REVIEW_PAGE_SIZE = 25;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function diagnosticBadges(notes?: ProgrammeUploadDiagnostics | null) {
  if (!notes) return [];

  return [
    notes.classification_ai_suppressed || notes.work_profile_ai_suppressed
      ? "AI suppressed"
      : null,
    notes.ai_quota_exhausted ? "Quota exhausted" : null,
    (notes.unclassified_mapping_count ?? 0) > 0
      ? `${notes.unclassified_mapping_count} unclassified`
      : null,
    (notes.non_planning_ready_asset_count ?? 0) > 0
      ? `${notes.non_planning_ready_asset_count} non-ready assets`
      : null,
    (notes.excluded_booking_count ?? 0) > 0
      ? `${notes.excluded_booking_count} excluded bookings`
      : null,
  ].filter((v): v is string => Boolean(v));
}

function getCurrentMappingLabel(m: ActivityMappingResponse): string {
  return (
    m.asset_type ||
    m.classification_name ||
    m.current_classification ||
    "Unclassified"
  );
}

function getInitialDraft(m: ActivityMappingResponse): string {
  return (
    m.suggested_classification ||
    m.asset_type ||
    m.classification_name ||
    m.current_classification ||
    ""
  );
}

function formatMappingConfidence(confidence: string | null | undefined): string {
  if (!confidence) return "n/a";

  const normalized = confidence.trim().toLowerCase();
  if (normalized === "high") return "High";
  if (normalized === "medium") return "Medium";
  if (normalized === "low") return "Low";

  return confidence;
}

function formatSourceLabel(source: string | null | undefined): string {
  if (!source) return "Unknown";

  const normalized = source.trim();
  if (normalized === "") return "Unknown";
  if (normalized.toLowerCase() === "ai") return "AI";

  return normalized;
}

function formatOptionalHours(value: number | null | undefined): string | null {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}h`
    : null;
}

function normalizeOptions(values: Array<string | null | undefined>): string[] {
  const unique = new Set<string>();

  for (const v of values) {
    const t = v?.trim();
    if (t) unique.add(t);
  }

  return Array.from(unique).sort((a, b) =>
    formatAssetType(a).localeCompare(formatAssetType(b)),
  );
}

function getMatchingOption(
  value: string | null | undefined,
  options: readonly string[],
): string {
  const normalized = value?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized) return "";

  return options.find((opt) => opt === normalized) ?? "";
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  children,
  toneClass = "border-slate-200/80 bg-white",
}: {
  label: string;
  children: React.ReactNode;
  toneClass?: string;
}) {
  return (
    <div
      className={`flex min-h-[104px] min-w-0 flex-col justify-between rounded-2xl border px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${toneClass}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <div className="mt-3 min-w-0">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="max-w-[62%] text-right text-sm font-semibold leading-5 text-slate-950">
        {value}
      </div>
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  setPage,
}: PaginationControlsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-xl border-slate-200 bg-white shadow-sm"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="min-w-14 text-center text-sm font-semibold text-slate-700">
        {page}/{totalPages}
      </span>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-xl border-slate-200 bg-white shadow-sm"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function UploadReviewDialog({
  open,
  onOpenChange,
  status,
  projectId,
  mappings,
  unclassifiedMappings,
  isLoading,
  userRole,
  onCorrectMapping,
  onPromoteToMemory,
}: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [profileShapeDrafts, setProfileShapeDrafts] = useState<
    Record<string, string>
  >({});
  const [mappingBusy, setMappingBusy] = useState<Record<string, boolean>>({});
  const [memoryBusy, setMemoryBusy] = useState<Record<string, boolean>>({});
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [activeLocalTypeRowId, setActiveLocalTypeRowId] = useState<
    string | null
  >(null);
  const [isCreatingLocalType, setIsCreatingLocalType] = useState(false);
  const [localTypeName, setLocalTypeName] = useState("");
  const [localTypeDescription, setLocalTypeDescription] = useState("");
  const [localTypeMaxHours, setLocalTypeMaxHours] = useState("");

  const { assetTypes, createProjectAssetType } =
    useProjectAssetTypes(projectId);

  const isAdmin = userRole === "admin";
  const notes = status?.completeness_notes;
  const badges = diagnosticBadges(notes);
  const deferredSearch = useDeferredValue(searchTerm);

  /* ---- derived data ---- */

  const reviewRows = useMemo(
    () => (unclassifiedMappings.length > 0 ? unclassifiedMappings : mappings),
    [mappings, unclassifiedMappings],
  );

  const correctionOptions = useMemo(
    () => normalizeOptions(assetTypes.map((type) => type.code)),
    [assetTypes],
  );

  const assetTypeLabels = useMemo(
    () =>
      new Map(
        assetTypes.map((type) => [
          type.code,
          `${type.display_name || formatAssetType(type.code)}${
            type.scope === "project" ? " (Project)" : ""
          }`,
        ]),
      ),
    [assetTypes],
  );

  const filteredRows = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return reviewRows;

    return reviewRows.filter((m) =>
      [
        m.activity_name,
        m.source_value,
        m.asset_type ? formatAssetType(m.asset_type) : null,
        m.classification_name ? formatAssetType(m.classification_name) : null,
        m.current_classification
          ? formatAssetType(m.current_classification)
          : null,
        m.suggested_classification
          ? formatAssetType(m.suggested_classification)
          : null,
        m.asset_role ? formatAssetType(m.asset_role) : null,
        m.profile_shape ? formatAssetType(m.profile_shape) : null,
        m.level_name,
        m.zone_name,
      ].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [deferredSearch, reviewRows]);

  useEffect(() => {
    if (open) setPage(1);
  }, [deferredSearch, open]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / REVIEW_PAGE_SIZE),
  );

  const clampedPage = Math.max(1, Math.min(page, totalPages));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const visibleRows = useMemo(() => {
    const start = (clampedPage - 1) * REVIEW_PAGE_SIZE;
    return filteredRows.slice(start, start + REVIEW_PAGE_SIZE);
  }, [clampedPage, filteredRows]);

  const rangeStart =
    filteredRows.length === 0 ? 0 : (clampedPage - 1) * REVIEW_PAGE_SIZE + 1;

  const rangeEnd = Math.min(
    clampedPage * REVIEW_PAGE_SIZE,
    filteredRows.length,
  );

  /* ---- actions ---- */

  async function handleCorrect(
    mapping: ActivityMappingResponse,
    value: string,
    profileShape?: string | null,
  ) {
    const key = `mapping:${mapping.id}`;
    if (mappingBusy[mapping.id]) return;

    setMappingBusy((prev) => ({ ...prev, [mapping.id]: true }));

    try {
      const nextProfileShape =
        profileShape === undefined
          ? mapping.profile_shape ?? null
          : profileShape || null;

      await onCorrectMapping(mapping.id, {
        asset_type: value,
        profile_shape: nextProfileShape,
      });

      setActionErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      reportError(err, "UploadReviewDialog: failed to correct mapping");
      setActionErrors((prev) => ({
        ...prev,
        [key]: getApiErrorMessage(err),
      }));
    } finally {
      setMappingBusy((prev) => ({ ...prev, [mapping.id]: false }));
    }
  }

  async function handlePromote(itemId: string, value: string) {
    const key = `memory:${itemId}`;
    if (memoryBusy[itemId]) return;

    setMemoryBusy((prev) => ({ ...prev, [itemId]: true }));

    try {
      await onPromoteToMemory(itemId, value);

      setActionErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      reportError(err, "UploadReviewDialog: failed to promote mapping memory");
      setActionErrors((prev) => ({
        ...prev,
        [key]: getApiErrorMessage(err),
      }));
    } finally {
      setMemoryBusy((prev) => ({ ...prev, [itemId]: false }));
    }
  }

  function resetLocalTypeForm() {
    setLocalTypeName("");
    setLocalTypeDescription("");
    setLocalTypeMaxHours("");
    setActiveLocalTypeRowId(null);
  }

  async function handleCreateLocalType(rowId: string) {
    if (isCreatingLocalType) return;

    const errorKey = `localType:${rowId}`;

    if (!localTypeName.trim() || !localTypeDescription.trim()) {
      setActionErrors((prev) => ({
        ...prev,
        [errorKey]: "Local asset type name and description are required",
      }));
      return;
    }

    const maxHours = localTypeMaxHours.trim()
      ? Number(localTypeMaxHours)
      : 10;

    if (!Number.isFinite(maxHours) || maxHours < 0 || maxHours > 24) {
      setActionErrors((prev) => ({
        ...prev,
        [errorKey]: "Max hours per day must be a number from 0 to 24",
      }));
      return;
    }

    setIsCreatingLocalType(true);

    try {
      const created = await createProjectAssetType({
        display_name: localTypeName.trim(),
        description: localTypeDescription.trim(),
        max_hours_per_day: maxHours,
      });

      resetLocalTypeForm();

      setDrafts((prev) => ({
        ...prev,
        [rowId]: created.code,
      }));

      setActionErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    } finally {
      setIsCreatingLocalType(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] w-full max-w-[1140px] flex-col overflow-hidden rounded-[28px] border-0 bg-slate-50 p-0 shadow-2xl">
        {/* ─── HEADER ─── */}
        <div className="shrink-0 border-b border-slate-200/80 bg-white px-8 pb-6 pt-8">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-[2rem] font-black tracking-tight text-slate-950">
              Upload review
            </DialogTitle>
            <DialogDescription className="max-w-3xl text-base leading-8 text-slate-500">
              Match each programme row to its correct asset type. Apply fixes to
              this upload, or save them for all future imports.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ─── BODY ─── */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-8 py-6">
          {/* ── Stats ── */}
          {status && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard label="Completeness">
                <div className="flex items-end gap-1">
                  <p className="text-4xl font-black leading-none tracking-tight text-slate-950">
                    {status.completeness_score}
                  </p>
                  <span className="pb-0.5 text-lg font-bold text-slate-400">
                    %
                  </span>
                </div>
              </StatCard>

              <StatCard label="Status">
                <p className="break-words text-base font-black capitalize leading-tight tracking-tight text-slate-950 sm:text-lg">
                  {status.status}
                </p>
              </StatCard>

              <StatCard
                label="Needs review"
                toneClass={
                  reviewRows.length > 0
                    ? "border-amber-200/80 bg-amber-50/70"
                    : "border-emerald-200/80 bg-emerald-50/70"
                }
              >
                <p
                  className={`text-4xl font-black leading-none tracking-tight ${
                    reviewRows.length > 0
                      ? "text-amber-900"
                      : "text-emerald-900"
                  }`}
                >
                  {reviewRows.length}
                </p>
              </StatCard>
            </div>
          )}

          {/* ── Diagnostic badges ── */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <Badge
                  key={b}
                  variant="secondary"
                  className="gap-1.5 rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-50"
                >
                  <FileWarning className="h-3 w-3" />
                  {b}
                </Badge>
              ))}
            </div>
          )}

          {/* ── Notes ── */}
          {notes?.notes && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-5 py-3.5 text-sm leading-6 text-amber-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              {Array.isArray(notes.notes) ? notes.notes.join(" ") : notes.notes}
            </div>
          )}

          {/* ── Toolbar ── */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full sm:max-w-xs lg:max-w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search activities, locations, or types"
                placeholder="Search activity, location, or type…"
                className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9 text-sm placeholder:text-slate-400 focus-visible:bg-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <p className="whitespace-nowrap text-sm font-medium text-slate-500">
                {filteredRows.length === 0
                  ? "No rows"
                  : `${rangeStart}–${rangeEnd} of ${filteredRows.length}`}
                {filteredRows.length !== reviewRows.length && (
                  <span className="text-slate-400">
                    {" "}
                    from {reviewRows.length}
                  </span>
                )}
              </p>

              <PaginationControls
                page={clampedPage}
                totalPages={totalPages}
                setPage={setPage}
              />
            </div>
          </div>

          {/* ── List body ── */}
          {isLoading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm font-medium">Loading review data…</p>
            </div>
          ) : reviewRows.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <p className="text-sm font-semibold text-slate-700">
                All clear — no mapping issues found
              </p>
              <p className="text-sm text-slate-400">
                Every row in this upload has been classified.
              </p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <Search className="h-7 w-7 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">
                No rows match your search
              </p>
              <p className="text-sm text-slate-400">
                Try a different keyword or clear the search field.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {visibleRows.map((mapping) => {
                const draftCandidate =
                  drafts[mapping.id] ?? getInitialDraft(mapping);

                const draft = getMatchingOption(
                  draftCandidate,
                  correctionOptions,
                );

                const trimmed = draft.trim();
                const current = getCurrentMappingLabel(mapping);
                const suggested = mapping.suggested_classification?.trim();

                const suggestedOption = getMatchingOption(
                  suggested,
                  correctionOptions,
                );

                const profileShape = getMatchingOption(
                  profileShapeDrafts[mapping.id] ?? mapping.profile_shape,
                  WORK_PROFILE_SHAPE_OPTIONS,
                );

                const estimatedHours = formatOptionalHours(
                  mapping.estimated_total_hours,
                );

                const mapErr = actionErrors[`mapping:${mapping.id}`];

                const memErr = mapping.item_id
                  ? actionErrors[`memory:${mapping.item_id}`]
                  : undefined;

                const localTypeError = actionErrors[`localType:${mapping.id}`];

                const isLocalTypeFormActive =
                  activeLocalTypeRowId === mapping.id;

                return (
                  <div
                    key={mapping.id}
                    className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex flex-col xl:grid xl:grid-cols-12">
                      {/* ── Left details ── */}
                      <div className="min-w-0 p-7 xl:col-span-7">
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <p className="max-w-[34rem] text-xl font-extrabold leading-snug tracking-tight text-slate-950">
                              {mapping.activity_name ||
                                mapping.source_value ||
                                "Unnamed row"}
                            </p>

                            {(mapping.level_name || mapping.zone_name) && (
                              <p className="text-sm leading-6 text-slate-500">
                                {[mapping.level_name, mapping.zone_name]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant="secondary"
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Current: {formatAssetType(current)}
                            </Badge>

                            {suggested && (
                              <Badge className="rounded-full border border-teal-200/70 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50">
                                <Zap className="mr-1 h-3 w-3" />
                                Suggested: {formatAssetType(suggested)}
                              </Badge>
                            )}

                            {mapping.asset_role && (
                              <Badge
                                variant="outline"
                                className="rounded-full border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500"
                              >
                                Role: {formatAssetType(mapping.asset_role)}
                              </Badge>
                            )}

                            {mapping.manual_correction && (
                              <Badge
                                variant="outline"
                                className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                              >
                                Manually corrected
                              </Badge>
                            )}
                          </div>

                          <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                            <div className="divide-y divide-slate-100">
                              <DetailRow
                                label="Source"
                                value={formatSourceLabel(mapping.source)}
                              />

                              <DetailRow
                                label="Confidence"
                                value={formatMappingConfidence(
                                  mapping.confidence,
                                )}
                              />

                              {mapping.profile_shape && (
                                <DetailRow
                                  label="Shape"
                                  value={formatAssetType(mapping.profile_shape)}
                                />
                              )}

                              {estimatedHours && (
                                <DetailRow
                                  label="Est. hours"
                                  value={estimatedHours}
                                />
                              )}

                              {mapping.corrected_by && (
                                <DetailRow
                                  label="Changed by"
                                  value={mapping.corrected_by}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Right actions ── */}
                      <div className="border-t border-slate-100 bg-slate-50/80 p-7 xl:col-span-5 xl:border-l xl:border-t-0">
                        <div className="space-y-5">
                          <div className="space-y-1.5">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                              Review action
                            </p>
                            <p className="max-w-sm text-sm leading-6 text-slate-500">
                              Confirm the asset type and work pattern for this
                              row.
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <p className="text-xs font-bold text-slate-700">
                                Asset type
                              </p>

                              <Select
                                value={trimmed || undefined}
                                onValueChange={(v) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [mapping.id]: v,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm shadow-sm">
                                  <SelectValue placeholder="Choose an asset type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {correctionOptions.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                      {assetTypeLabels.get(opt) ??
                                        formatAssetType(opt)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <p className="text-xs font-bold text-slate-700">
                                Work pattern
                              </p>

                              <Select
                                value={profileShape || undefined}
                                onValueChange={(v) =>
                                  setProfileShapeDrafts((prev) => ({
                                    ...prev,
                                    [mapping.id]: v,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm shadow-sm">
                                  <SelectValue placeholder="Choose a work pattern" />
                                </SelectTrigger>
                                <SelectContent>
                                  {WORK_PROFILE_SHAPE_OPTIONS.map((shape) => (
                                    <SelectItem key={shape} value={shape}>
                                      {formatAssetType(shape)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {suggestedOption && trimmed !== suggestedOption && (
                            <button
                              type="button"
                              onClick={() =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [mapping.id]: suggestedOption,
                                }))
                              }
                              className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/70 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100"
                            >
                              <Zap className="h-3 w-3" />
                              Use suggested: {formatAssetType(suggestedOption)}
                            </button>
                          )}

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-10 w-full rounded-xl border-slate-200 bg-white px-4 text-sm font-semibold shadow-sm"
                            onClick={() => {
                              if (isLocalTypeFormActive) {
                                resetLocalTypeForm();
                              } else {
                                setActiveLocalTypeRowId(mapping.id);
                              }
                            }}
                          >
                            {isLocalTypeFormActive
                              ? "Cancel new asset type"
                              : "Add asset type"}
                          </Button>

                          {isLocalTypeFormActive && (
                            <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                              <Input
                                value={localTypeName}
                                onChange={(event) =>
                                  setLocalTypeName(event.target.value)
                                }
                                placeholder="Type name"
                                className="h-10 rounded-xl border-slate-200 text-sm"
                              />

                              <Textarea
                                value={localTypeDescription}
                                onChange={(event) =>
                                  setLocalTypeDescription(event.target.value)
                                }
                                placeholder="Description"
                                className="min-h-20 rounded-xl border-slate-200 text-sm"
                              />

                              <Input
                                type="number"
                                min={0}
                                max={24}
                                step="0.5"
                                value={localTypeMaxHours}
                                onChange={(event) =>
                                  setLocalTypeMaxHours(event.target.value)
                                }
                                placeholder="Max hours per day (default 10)"
                                className="h-10 rounded-xl border-slate-200 text-sm"
                              />

                              <Button
                                type="button"
                                size="sm"
                                className="h-9 rounded-xl px-4 text-sm font-semibold shadow-sm"
                                disabled={isCreatingLocalType}
                                onClick={() => {
                                  void handleCreateLocalType(mapping.id).catch(
                                    (error) => {
                                      reportError(
                                        error,
                                        "UploadReviewDialog: failed to create local asset type",
                                      );
                                      setActionErrors((prev) => ({
                                        ...prev,
                                        [`localType:${mapping.id}`]:
                                          getApiErrorMessage(error),
                                      }));
                                    },
                                  );
                                }}
                              >
                                {isCreatingLocalType ? (
                                  <>
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save type"
                                )}
                              </Button>
                            </div>
                          )}

                          <div className="grid gap-2.5 pt-1">
                            <Button
                              type="button"
                              size="sm"
                              className="h-11 w-full rounded-xl px-4 text-sm font-semibold shadow-sm"
                              disabled={
                                !trimmed || Boolean(mappingBusy[mapping.id])
                              }
                              onClick={() =>
                                handleCorrect(mapping, trimmed, profileShape)
                              }
                            >
                              {mappingBusy[mapping.id] ? (
                                <>
                                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                  Saving…
                                </>
                              ) : (
                                "Apply changes"
                              )}
                            </Button>

                            {isAdmin && mapping.item_id && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-10 w-full rounded-xl border-slate-200 bg-white px-4 text-sm font-semibold shadow-sm"
                                disabled={
                                  !trimmed ||
                                  Boolean(
                                    mapping.item_id &&
                                      memoryBusy[mapping.item_id],
                                  )
                                }
                                onClick={() =>
                                  handlePromote(
                                    mapping.item_id as string,
                                    trimmed,
                                  )
                                }
                              >
                                {mapping.item_id &&
                                memoryBusy[mapping.item_id] ? (
                                  <>
                                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                    Saving…
                                  </>
                                ) : (
                                  "Save rule for future uploads"
                                )}
                              </Button>
                            )}
                          </div>

                          {localTypeError && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                              {localTypeError}
                            </p>
                          )}

                          {(mapErr || memErr) && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                              {mapErr ?? memErr}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <p className="text-sm font-medium text-slate-500">
                    Rows {rangeStart}–{rangeEnd} of {filteredRows.length}
                  </p>

                  <PaginationControls
                    page={clampedPage}
                    totalPages={totalPages}
                    setPage={setPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
