"use client";

import { useState } from "react";
import { Clock, ChevronDown, Trash2 } from "lucide-react";
import type { ProgrammeVersion } from "@/types";
import { formatDate } from "./utils";

interface Props {
  versions: ProgrammeVersion[];
  deletingIds: Set<string>;
  onDelete: (uploadId: string) => void;
}

export function VersionHistory({ versions, deletingIds, onDelete }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (versions.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="versionHistoryPanel"
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Clock size={14} className="text-teal" />
          Programme History
          <span className="text-[11px] font-normal text-slate-400">
            ({versions.length} {versions.length === 1 ? "version" : "versions"})
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div id="versionHistoryPanel" role="region" className="border-t border-slate-100 p-3 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
          {versions.map((v) => {
            const isConfirming = confirmDeleteId === v.upload_id;
            const isDeleting = deletingIds.has(v.upload_id);

            return (
              <div
                key={v.upload_id}
                className="flex items-center justify-between text-xs py-2 px-3 rounded-lg hover:bg-white transition-colors group"
              >
                {isConfirming ? (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="text-slate-600 font-medium">
                      Delete <span className="font-bold">v{v.version_number}</span>? This cannot be undone.
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          void onDelete(v.upload_id);
                          setConfirmDeleteId(null);
                        }}
                        disabled={isDeleting}
                        className="font-bold text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                      >
                        {isDeleting ? "Deleting…" : "Delete"}
                      </button>
                      <button
                        type="button"
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
                      <span className="font-bold text-slate-700 shrink-0">
                        v{v.version_number}
                      </span>
                      <span className="text-slate-500 truncate">{v.file_name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          v.status === "committed"
                            ? "bg-green-100 text-green-700"
                            : v.status === "degraded"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {v.status === "committed"
                          ? "Active"
                          : v.status === "degraded"
                            ? "Partial"
                            : "Processing"}
                      </span>
                      <span
                        className="text-slate-400 font-medium"
                        title={`${v.completeness_score}% of tasks in this programme were successfully matched to asset categories`}
                      >
                        {v.completeness_score}% matched
                      </span>
                      <span className="text-slate-400">{formatDate(v.created_at)}</span>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(v.upload_id)}
                        disabled={v.status === "processing" || isDeleting}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 text-slate-300 hover:text-red-500 disabled:cursor-not-allowed transition-all"
                        aria-label={`Delete version ${v.version_number}`}
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
  );
}
