"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileWarning,
  Loader2,
  Search,
  Sparkles,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASSET_TYPE_OPTIONS } from "@/lib/formOptions";
import { reportError } from "@/lib/monitoring";
import { formatAssetType } from "./utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status?: UploadStatusResponse;
  mappings: ActivityMappingResponse[];
  unclassifiedMappings: ActivityMappingResponse[];
  isLoading: boolean;
  userRole?: UserRole | string;
  onCorrectMapping: (mappingId: string, assetType: string) => Promise<void>;
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
      ? `${notes.non_planning_ready_asset_count} non‑ready assets`
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

/* ------------------------------------------------------------------ */
/*  Sub‑components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  children,
  toneClass = "border-slate-200 bg-white",
}: {
  label: string;
  children: React.ReactNode;
  toneClass?: string;
}) {
  return (
    <div
      className={`flex h-full min-w-0 flex-col justify-between rounded-2xl border px-5 py-4 shadow-sm ${toneClass}`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function StepHint({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
        {step}
      </span>
      <div>
        <p className="text-sm font-semibold leading-tight text-slate-800">
          {title}
        </p>
        <p className="mt-0.5 text-sm leading-snug text-slate-500">
          {description}
        </p>
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
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-lg"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-14 text-center text-sm font-medium text-slate-700">
        {page}/{totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-lg"
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
  mappings,
  unclassifiedMappings,
  isLoading,
  userRole,
  onCorrectMapping,
  onPromoteToMemory,
}: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [mappingBusy, setMappingBusy] = useState<Record<string, boolean>>({});
  const [memoryBusy, setMemoryBusy] = useState<Record<string, boolean>>({});
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const isAdmin = userRole === "admin";
  const notes = status?.completeness_notes;
  const badges = diagnosticBadges(notes);
  const deferredSearch = useDeferredValue(searchTerm);

  /* ---- derived data ---- */

  const reviewRows = useMemo(
    () => (unclassifiedMappings.length > 0 ? unclassifiedMappings : mappings),
    [mappings, unclassifiedMappings],
  );

  const baseCorrectionOptions = useMemo(
    () =>
      normalizeOptions([
        ...reviewRows.flatMap((m) => [
          m.asset_type,
          m.classification_name,
          m.current_classification,
          m.suggested_classification,
        ]),
        ...ASSET_TYPE_OPTIONS,
      ]),
    [reviewRows],
  );

  const correctionOptions = useMemo(
    () => normalizeOptions([...baseCorrectionOptions, ...Object.values(drafts)]),
    [baseCorrectionOptions, drafts],
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
        m.current_classification ? formatAssetType(m.current_classification) : null,
        m.suggested_classification ? formatAssetType(m.suggested_classification) : null,
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
  const rangeEnd = Math.min(clampedPage * REVIEW_PAGE_SIZE, filteredRows.length);

  /* ---- actions ---- */

  async function handleCorrect(mapping: ActivityMappingResponse, value: string) {
    const key = `mapping:${mapping.id}`;
    if (mappingBusy[mapping.id]) return;
    setMappingBusy((prev) => ({ ...prev, [mapping.id]: true }));
    try {
      await onCorrectMapping(mapping.id, value);
      setActionErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      reportError(err, "UploadReviewDialog: failed to correct mapping");
      setActionErrors((prev) => ({ ...prev, [key]: getApiErrorMessage(err) }));
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
      setActionErrors((prev) => ({ ...prev, [key]: getApiErrorMessage(err) }));
    } finally {
      setMemoryBusy((prev) => ({ ...prev, [itemId]: false }));
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] w-full max-w-screen-2xl flex-col overflow-hidden rounded-2xl border-0 bg-slate-50 p-0 shadow-2xl">
        {/* ─── HEADER ─── */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-8 pb-5 pt-7">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-2xl font-extrabold tracking-tight text-slate-950">
              Upload review
            </DialogTitle>
            <DialogDescription className="max-w-2xl text-sm leading-relaxed text-slate-500">
              Match each programme row to its correct asset type. Apply fixes to
              this upload, or save them for all future imports.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ─── SCROLLABLE BODY ─── */}
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-8 py-6">
          {/* ── Stats ── */}
          {status && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatCard label="Completeness">
                <p className="text-3xl font-black leading-none text-slate-950">
                  {status.completeness_score}
                  <span className="text-lg font-bold text-slate-400">%</span>
                </p>
              </StatCard>

              <StatCard label="Status">
                <p className="wrap-break-word text-base font-bold capitalize leading-tight text-slate-950 sm:text-lg">
                  {status.status}
                </p>
              </StatCard>

              <StatCard label="AI telemetry">
                <div className="space-y-1.5 text-sm text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                    {status.ai_tokens_used ?? 0} tokens
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-slate-400" />$
                    {(status.ai_cost_usd ?? 0).toFixed(2)}
                  </span>
                </div>
              </StatCard>

              <StatCard label="Needs review">
                <p className="text-3xl font-black leading-none text-slate-950">
                  {reviewRows.length}
                </p>
              </StatCard>
            </div>
          )}

          {/* ── Diagnostic badges ── */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <Badge
                  key={b}
                  variant="secondary"
                  className="gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100"
                >
                  <FileWarning className="h-3 w-3" />
                  {b}
                </Badge>
              ))}
            </div>
          )}

          {/* ── Notes banner ── */}
          {notes?.notes && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-5 py-3.5 text-sm leading-relaxed text-amber-800">
              {Array.isArray(notes.notes) ? notes.notes.join(" ") : notes.notes}
            </div>
          )}

          {/* ── How‑to steps (compact) ── */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="grid gap-5 lg:grid-cols-3">
              <StepHint
                step={1}
                title="Read the source row"
                description="Use the activity name and location to identify the required plant or equipment."
              />
              <StepHint
                step={2}
                title="Choose the asset type"
                description="Pick from the suggested or known types. Add a custom type only if nothing matches."
              />
              <StepHint
                step={3}
                title="Save at the right scope"
                description={`"Apply" fixes this import only.${isAdmin ? " Admins can also save mappings for future uploads." : ""}`}
              />
            </div>
          </div>

          {/* ── Toolbar: search + pagination ── */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full sm:max-w-xs lg:max-w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search activities, locations, or types"
                placeholder="Search activity, location, or type…"
                  className="h-9 rounded-lg border-slate-200 bg-slate-50 pl-9 text-sm placeholder:text-slate-400 focus-visible:bg-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <p className="whitespace-nowrap text-sm text-slate-500">
                {filteredRows.length === 0
                  ? "No rows"
                  : `${rangeStart}–${rangeEnd} of ${filteredRows.length}`}
                {filteredRows.length !== reviewRows.length && (
                  <span className="text-slate-400">
                    {" "}
                    (from {reviewRows.length})
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
            <div className="flex min-h-70 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm font-medium">Loading review data…</p>
            </div>
          ) : reviewRows.length === 0 ? (
            <div className="flex min-h-70 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <p className="text-sm font-medium text-slate-700">
                All clear — no mapping issues found
              </p>
              <p className="text-sm text-slate-400">
                Every row in this upload has been classified.
              </p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex min-h-70 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <Search className="h-7 w-7 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">
                No rows match your search
              </p>
              <p className="text-sm text-slate-400">
                Try a different keyword or clear the search field.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {visibleRows.map((mapping) => {
                const draft =
                  drafts[mapping.id] ?? getInitialDraft(mapping);
                const trimmed = draft.trim();
                const current = getCurrentMappingLabel(mapping);
                const suggested =
                  mapping.suggested_classification?.trim();
                const mapErr = actionErrors[`mapping:${mapping.id}`];
                const memErr = mapping.item_id
                  ? actionErrors[`memory:${mapping.item_id}`]
                  : undefined;

                return (
                  <div
                    key={mapping.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="grid divide-y divide-slate-100 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
                      {/* ── Left: source info ── */}
                      <div className="space-y-4 p-5 lg:col-span-3">
                        {/* Title + location */}
                        <div>
                          <p className="text-base font-semibold leading-snug text-slate-900">
                            {mapping.activity_name ||
                              mapping.source_value ||
                              "Unnamed row"}
                          </p>
                          {(mapping.level_name || mapping.zone_name) && (
                            <p className="mt-1 text-sm text-slate-500">
                              {[mapping.level_name, mapping.zone_name]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant="secondary"
                            className="rounded-md bg-slate-100 text-slate-600"
                          >
                            Current:{" "}
                            {formatAssetType(current)}
                          </Badge>
                          {suggested && (
                            <Badge className="rounded-md border-0 bg-teal-50 text-teal-700 hover:bg-teal-100">
                              <Zap className="mr-0.5 h-3 w-3" />
                              Suggested:{" "}
                              {formatAssetType(suggested)}
                            </Badge>
                          )}
                          {mapping.manual_correction && (
                            <Badge
                              variant="outline"
                              className="rounded-md text-slate-500"
                            >
                              Manually corrected
                            </Badge>
                          )}
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                          <span>
                            Source:{" "}
                            <span className="font-medium text-slate-700">
                              {mapping.source || "Unknown"}
                            </span>
                          </span>
                          <span>
                            Confidence:{" "}
                            <span className="font-medium text-slate-700">
                              {formatMappingConfidence(mapping.confidence)}
                            </span>
                          </span>
                          {mapping.corrected_by && (
                            <span>
                              Changed by{" "}
                              <span className="font-medium text-slate-700">
                                {mapping.corrected_by}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ── Right: action panel ── */}
                      <div className="space-y-4 bg-slate-50/60 p-5 lg:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                          Assign asset type
                        </p>

                        {/* Dropdown */}
                        <Select
                          value={trimmed || undefined}
                          onValueChange={(v) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [mapping.id]: v,
                            }))
                          }
                        >
                          <SelectTrigger className="h-9 w-full max-w-full rounded-lg border-slate-200 bg-white text-sm sm:max-w-72">
                            <SelectValue placeholder="Choose an asset type" />
                          </SelectTrigger>
                          <SelectContent>
                            {correctionOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {formatAssetType(opt)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Custom input */}
                        <Input
                          value={draft}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [mapping.id]: e.target.value,
                            }))
                          }
                          placeholder="Or type a custom asset type…"
                          aria-label={`Custom asset type for ${
                            mapping.activity_name ||
                            mapping.source_value ||
                            "this mapping row"
                          }`}
                          className="h-9 w-full max-w-full rounded-lg border-slate-200 bg-white text-sm sm:max-w-72"
                        />

                        {/* Quick‑fill suggestion */}
                        {suggested && trimmed !== suggested && (
                          <button
                            type="button"
                            onClick={() =>
                              setDrafts((prev) => ({
                                ...prev,
                                [mapping.id]: suggested,
                              }))
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100"
                          >
                            <Zap className="h-3 w-3" />
                            Use suggested: {formatAssetType(suggested)}
                          </button>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            type="button"
                            size="sm"
                            className="h-9 rounded-lg px-4 text-sm font-semibold"
                            disabled={!trimmed || Boolean(mappingBusy[mapping.id])}
                            onClick={() => handleCorrect(mapping, trimmed)}
                          >
                            {mappingBusy[mapping.id] ? (
                              <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                Saving…
                              </>
                            ) : (
                              "Apply to this upload"
                            )}
                          </Button>

                          {isAdmin && mapping.item_id && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-9 rounded-lg px-4 text-sm font-semibold"
                              disabled={
                                !trimmed ||
                                Boolean(
                                  mapping.item_id && memoryBusy[mapping.item_id],
                                )
                              }
                              onClick={() =>
                                handlePromote(
                                  mapping.item_id as string,
                                  trimmed,
                                )
                              }
                            >
                              {mapping.item_id && memoryBusy[mapping.item_id] ? (
                                <>
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  Saving…
                                </>
                              ) : (
                                "Save for future uploads"
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Error feedback */}
                        {(mapErr || memErr) && (
                          <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                            {mapErr ?? memErr}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ── Bottom pagination ── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3">
                  <p className="text-sm text-slate-500">
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
