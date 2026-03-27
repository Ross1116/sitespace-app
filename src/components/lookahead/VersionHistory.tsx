"use client";

import { useState } from "react";
import { ChevronDown, Clock, FileWarning, Trash2 } from "lucide-react";
import type { ProgrammeVersion } from "@/types";
import { Button } from "@/components/ui/button";
import { formatDate } from "./utils";

interface Props {
  title?: string;
  versions: ProgrammeVersion[];
  deletingIds?: Set<string>;
  onDelete?: (uploadId: string) => void;
  onReviewUpload?: (uploadId: string) => void;
}

export function VersionHistory({
  title = "Programme History",
  versions,
  deletingIds = new Set<string>(),
  onDelete,
  onReviewUpload,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (versions.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Clock size={14} className="text-teal" />
          {title}
          <span className="text-[11px] font-normal text-slate-400">
            ({versions.length} {versions.length === 1 ? "entry" : "entries"})
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 p-3 space-y-2 max-h-72 overflow-y-auto">
          {versions.map((version) => {
            const isDeleting = deletingIds.has(version.upload_id);
            const requiresReview =
              version.status === "degraded" || version.completeness_score < 100;
            const isConfirming = confirmDeleteId === version.upload_id;

            return (
              <div
                key={version.upload_id}
                className="rounded-lg border border-slate-200 bg-white px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        v{version.version_number}
                      </span>
                      {requiresReview && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <FileWarning className="h-3 w-3" />
                          Review needed
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {version.file_name}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatDate(version.created_at)} · {version.completeness_score}% complete
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      version.status === "committed"
                        ? "bg-green-100 text-green-700"
                        : version.status === "degraded"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {version.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {onReviewUpload && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onReviewUpload(version.upload_id)}
                      className="h-8"
                    >
                      Open review
                    </Button>
                  )}

                  {onDelete && (
                    <>
                      {isConfirming ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              onDelete(version.upload_id);
                              setConfirmDeleteId(null);
                            }}
                            disabled={isDeleting}
                            className="h-8"
                          >
                            {isDeleting ? "Deleting..." : "Confirm delete"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-8"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmDeleteId(version.upload_id)}
                          disabled={version.status === "processing" || isDeleting}
                          className="h-8 text-slate-500"
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
