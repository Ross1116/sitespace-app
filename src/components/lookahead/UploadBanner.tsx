"use client";

import { CheckCircle2, XCircle, AlertTriangle, Loader2, X, RefreshCw } from "lucide-react";
import type { UploadStatusResponse } from "@/types";

export type UploadPhase =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "polling"; uploadId: string }
  | { kind: "done"; result: UploadStatusResponse }
  | { kind: "error"; message: string };

interface Props {
  phase: UploadPhase;
  onDismiss: () => void;
  onUploadAnother: () => void;
}

export function UploadBanner({ phase, onDismiss, onUploadAnother }: Props) {
  if (phase.kind === "idle") return null;

  const isSuccess = phase.kind === "done" && phase.result.status === "committed";
  const isError = phase.kind === "error";
  const isInProgress = phase.kind === "uploading" || phase.kind === "polling";

  return (
    <div
      className={`rounded-xl border px-4 py-3 flex items-center gap-3 text-sm ${
        isSuccess
          ? "bg-green-50 border-green-200 text-green-800"
          : isError
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-slate-50 border-slate-200 text-slate-700"
      }`}
    >
      {isInProgress && (
        <Loader2 size={16} className="animate-spin text-[var(--teal)] flex-shrink-0" />
      )}
      {isSuccess && <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />}
      {phase.kind === "done" && phase.result.status !== "committed" && (
        <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
      )}
      {isError && <XCircle size={16} className="text-red-500 flex-shrink-0" />}

      <span className="flex-1">
        {phase.kind === "uploading" && "Uploading file…"}
        {phase.kind === "polling" &&
          "Reading your programme and forecasting resource demand — this usually takes 30–60 seconds…"}
        {phase.kind === "done" && phase.result.status === "committed" && (
          <span className="flex flex-col gap-0.5">
            <span>{`Programme v${phase.result.version_number} imported · ${phase.result.completeness_score}% of tasks matched · Forecast updated`}</span>
            {phase.result.completeness_score < 100 && (
              <span className="text-green-700 text-xs">
                Tasks that couldn&apos;t be matched to a known asset type won&apos;t appear in the forecast.
              </span>
            )}
            {phase.result.completeness_notes?.ai_classification_fallback && (
              <span className="text-amber-700 text-xs font-medium">
                ⚠ Automatic classification was unavailable — some tasks may be missing from the forecast. Try re-uploading later.
              </span>
            )}
          </span>
        )}
        {phase.kind === "done" &&
          phase.result.status !== "committed" &&
          `Programme v${phase.result.version_number} partially imported — the file was read but some processing steps failed. The forecast may be incomplete.`}
        {phase.kind === "error" && phase.message}
      </span>

      {(phase.kind === "done" || phase.kind === "error") && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onUploadAnother}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--teal)] hover:text-[var(--navy)] transition-colors"
          >
            <RefreshCw size={11} />
            Upload another
          </button>
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
