"use client";

import { useMemo, useState } from "react";
import { Coins, FileWarning, Loader2, Sparkles } from "lucide-react";
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
import { reportError } from "@/lib/monitoring";

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
  ].filter((value): value is string => Boolean(value));
}

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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [memoryBusyId, setMemoryBusyId] = useState<string | null>(null);
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const isAdmin = userRole === "admin";
  const notes = status?.completeness_notes;
  const badges = diagnosticBadges(notes);

  const reviewRows = useMemo(
    () => (unclassifiedMappings.length > 0 ? unclassifiedMappings : mappings),
    [mappings, unclassifiedMappings],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-5xl bg-white">
        <DialogHeader>
          <DialogTitle>Upload review</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Review diagnostics, mapping confidence, and upload-local corrections
            for the latest programme import.
          </DialogDescription>
        </DialogHeader>

        {status && (
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Completeness</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {status.completeness_score}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Status</p>
              <p className="mt-1 text-lg font-bold text-slate-900 capitalize">{status.status}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">AI telemetry</p>
              <p className="mt-1 text-sm text-slate-700">
                <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                {status.ai_tokens_used ?? 0} tokens
              </p>
              <p className="text-sm text-slate-700">
                <Coins className="mr-1 inline h-3.5 w-3.5" />$
                {(status.ai_cost_usd ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Needs review</p>
              <p className="mt-1 text-lg font-bold text-amber-700">
                {reviewRows.length}
              </p>
            </div>
          </div>
        )}

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge key={badge} variant="secondary">
                <FileWarning className="mr-1 h-3 w-3" />
                {badge}
              </Badge>
            ))}
          </div>
        )}

        {notes?.notes && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {Array.isArray(notes.notes) ? notes.notes.join(" ") : notes.notes}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-60 items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading review data...
          </div>
        ) : reviewRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No mapping issues were returned for this upload.
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Source row</th>
                  <th className="px-3 py-2">Current mapping</th>
                  <th className="px-3 py-2">Provenance</th>
                  <th className="px-3 py-2">Correction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {reviewRows.map((mapping) => {
                  const draft = drafts[mapping.id] ?? mapping.asset_type ?? "";
                  return (
                    <tr key={mapping.id}>
                      <td className="px-3 py-3 align-top">
                        <p className="font-medium text-slate-900">
                          {mapping.activity_name || mapping.source_value || "Mapping row"}
                        </p>
                        {(mapping.level_name || mapping.zone_name) && (
                          <p className="mt-1 text-xs text-slate-500">
                            {[mapping.level_name, mapping.zone_name].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="text-slate-700">
                          {mapping.asset_type ||
                            mapping.classification_name ||
                            "Unclassified"}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="space-y-1 text-xs text-slate-500">
                          <p>Source: {mapping.source || "Unknown"}</p>
                          <p>
                            Confidence:{" "}
                            {mapping.confidence != null
                              ? `${Math.round(mapping.confidence * 100)}%`
                              : "n/a"}
                          </p>
                          <p>
                            Manual: {mapping.manual_correction ? "Yes" : "No"}
                          </p>
                          {mapping.corrected_by && (
                            <p>
                              Corrected by {mapping.corrected_by}
                              {mapping.corrected_at ? ` on ${mapping.corrected_at}` : ""}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            value={draft}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [mapping.id]: event.target.value,
                              }))
                            }
                            placeholder="e.g. scissor_lift"
                            className="max-w-xs"
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={!draft.trim() || busyId === mapping.id}
                            onClick={async () => {
                              const trimmedDraft = draft.trim();
                              const errorKey = `mapping:${mapping.id}`;
                              setBusyId(mapping.id);
                              try {
                                await onCorrectMapping(mapping.id, trimmedDraft);
                                setActionErrors((current) => {
                                  const next = { ...current };
                                  delete next[errorKey];
                                  return next;
                                });
                              } catch (error) {
                                reportError(
                                  error,
                                  "UploadReviewDialog: failed to correct mapping",
                                );
                                setActionErrors((current) => ({
                                  ...current,
                                  [errorKey]: getApiErrorMessage(error),
                                }));
                              } finally {
                                setBusyId(null);
                              }
                            }}
                          >
                            {busyId === mapping.id ? "Saving..." : "Save correction"}
                          </Button>
                          {isAdmin && mapping.item_id && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                !draft.trim() || memoryBusyId === mapping.item_id
                              }
                              onClick={async () => {
                                const trimmedDraft = draft.trim();
                                const memoryKey = `memory:${mapping.item_id}`;
                                setMemoryBusyId(mapping.item_id || null);
                                try {
                                  await onPromoteToMemory(
                                    mapping.item_id as string,
                                    trimmedDraft,
                                  );
                                  setActionErrors((current) => {
                                    const next = { ...current };
                                    delete next[memoryKey];
                                    return next;
                                  });
                                } catch (error) {
                                  reportError(
                                    error,
                                    "UploadReviewDialog: failed to promote mapping memory",
                                  );
                                  setActionErrors((current) => ({
                                    ...current,
                                    [memoryKey]: getApiErrorMessage(error),
                                  }));
                                } finally {
                                  setMemoryBusyId(null);
                                }
                              }}
                            >
                              {memoryBusyId === mapping.item_id
                                ? "Promoting..."
                                : "Promote to memory"}
                            </Button>
                          )}
                        </div>
                        {(actionErrors[`mapping:${mapping.id}`] ||
                          (mapping.item_id &&
                            actionErrors[`memory:${mapping.item_id}`])) && (
                          <p className="mt-2 text-xs text-red-600">
                            {actionErrors[`mapping:${mapping.id}`] ??
                              actionErrors[`memory:${mapping.item_id}`]}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
