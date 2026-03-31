"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Database } from "lucide-react";
import type {
  LookaheadSnapshotHistoryEntry,
  LookaheadSnapshotResponse,
} from "@/types";
import { formatDate } from "./utils";

interface Props {
  history: LookaheadSnapshotHistoryEntry[];
  currentSnapshot?: LookaheadSnapshotResponse | null;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
}

export function SnapshotHistoryPanel({
  history,
  currentSnapshot = null,
  isOpen: controlledOpen,
  onOpenChange,
  isLoading = false,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = controlledOpen ?? uncontrolledOpen;
  const panelId = "snapshot-history-panel";

  const currentSnapshotRowCount = useMemo(() => {
    if (!currentSnapshot?.rows) return null;
    return currentSnapshot.rows.length;
  }, [currentSnapshot]);

  const setIsOpen = (next: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-bold text-slate-600 hover:text-slate-900"
      >
        <span className="flex items-center gap-2">
          <Database className="h-4 w-4 text-teal" />
          Lookahead Snapshot History
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div id={panelId} className="space-y-2 border-t border-slate-100 p-3">
          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-6 text-sm text-slate-500">
              Loading snapshot history...
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-6 text-sm text-slate-500">
              No snapshot history available yet.
            </div>
          ) : (
            history.map((entry, index) => {
              const matchesCurrentSnapshot = Boolean(
                currentSnapshot &&
                  ((entry.snapshot_id &&
                    currentSnapshot.snapshot_id &&
                    entry.snapshot_id === currentSnapshot.snapshot_id) ||
                    (entry.snapshot_date &&
                      currentSnapshot.snapshot_date &&
                      entry.snapshot_date === currentSnapshot.snapshot_date)),
              );

              const rowCount =
                entry.row_count ??
                (entry.rows.length > 0 ? entry.rows.length : null) ??
                (matchesCurrentSnapshot ? currentSnapshotRowCount : null);

              return (
                <div
                  key={
                    entry.snapshot_id ||
                    `${entry.snapshot_date || "snapshot"}-${index}`
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        Snapshot {history.length - index}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(entry.snapshot_date || null)}
                        {entry.timezone ? ` · ${entry.timezone}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {rowCount == null ? "Cell count unavailable" : `${rowCount} heatmap cells`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
