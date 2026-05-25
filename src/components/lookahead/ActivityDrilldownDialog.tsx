"use client";

import { CalendarDays, Link2, Loader2 } from "lucide-react";
import type { LookaheadActivityCandidate, LookaheadRow } from "@/types";
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
import { formatAssetType, formatWeekRange } from "./utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCell: LookaheadRow | null;
  activities: LookaheadActivityCandidate[];
  isLoading: boolean;
  bookingActivityId?: string | null;
  bookingContextLoading?: boolean;
  bookingContextError?: unknown;
  onBook: (activity: LookaheadActivityCandidate) => void;
  onRetryBook?: (activity: LookaheadActivityCandidate) => void;
  onViewContext: (activity: LookaheadActivityCandidate) => void;
}

const getActivityRowKey = (activity: LookaheadActivityCandidate): string => {
  const mappingId = activity.activity_asset_mapping_id?.trim();
  return mappingId && mappingId.length > 0 ? mappingId : activity.activity_id;
};

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
        tone === "warning"
          ? "border-orange-200/80 bg-orange-50/70"
          : "border-slate-200/80 bg-white"
      }`}
    >
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.16em] ${
          tone === "warning" ? "text-orange-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-black leading-none tracking-tight ${
          tone === "warning" ? "text-orange-700" : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ActivityMeta({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200/80">
      {children}
    </span>
  );
}

export function ActivityDrilldownDialog({
  open,
  onOpenChange,
  selectedCell,
  activities,
  isLoading,
  bookingActivityId,
  bookingContextLoading = false,
  bookingContextError,
  onBook,
  onRetryBook,
  onViewContext,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1rem)] max-w-4xl flex-col overflow-hidden rounded-[26px] border-0 bg-slate-50 p-0 shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-slate-200/80 bg-white px-6 pb-5 pt-6 sm:px-8 sm:pt-7">
          <DialogHeader className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-950">
                  Weekly activity drilldown
                </DialogTitle>

                <DialogDescription className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Review the activities behind this heatmap cell and open the
                  relevant booking or context workflow.
                </DialogDescription>
              </div>

              {selectedCell && (
                <div className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {formatAssetType(selectedCell.asset_type)} ·{" "}
                  {formatWeekRange(selectedCell.week_start)}
                </div>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-8">
          {selectedCell && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryCard
                label="Demand"
                value={`${selectedCell.demand_hours}h`}
              />
              <SummaryCard
                label="Booked"
                value={`${selectedCell.booked_hours}h`}
              />
              <SummaryCard
                label="Gap"
                value={`${selectedCell.gap_hours}h`}
                tone="warning"
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm font-medium">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No activities found
              </p>
              <p className="mt-1 text-sm text-slate-400">
                No activities were returned for this heatmap cell.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-1">
              {activities.map((activity) => {
                const rowKey = getActivityRowKey(activity);
                const isRowBusy =
                  bookingActivityId === rowKey && bookingContextLoading;
                const hasRowError =
                  bookingActivityId === rowKey && Boolean(bookingContextError);

                return (
                  <div
                    key={rowKey}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)]"
                  >
                    {isRowBusy && (
                      <div className="border-b border-slate-200/80 bg-slate-50 px-5 py-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Loading booking context...
                        </div>
                      </div>
                    )}

                    {hasRowError && (
                      <div className="border-b border-red-200 bg-red-50 px-5 py-3">
                        <div className="flex flex-col gap-2 text-xs text-red-700 sm:flex-row sm:items-center sm:justify-between">
                          <span>
                            {String(
                              getApiErrorMessage(
                                bookingContextError,
                                "We couldn't load booking context for this activity.",
                              ),
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => (onRetryBook ?? onBook)(activity)}
                            className="font-bold text-red-700 underline underline-offset-2"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                      {/* Activity content */}
                      <div className="min-w-0 space-y-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="max-w-2xl text-base font-extrabold leading-snug tracking-tight text-slate-950">
                              {activity.activity_name}
                            </p>

                            {activity.booking_group_id && (
                              <Badge
                                variant="secondary"
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Booking group linked
                              </Badge>
                            )}

                            {(activity.linked_booking_count ?? 0) > 0 && (
                              <Badge
                                variant="outline"
                                className="rounded-full border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500"
                              >
                                {activity.linked_booking_count} already planned
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {activity.start_date && (
                              <ActivityMeta>
                                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                  {activity.start_date}
                                  {activity.end_date
                                    ? ` to ${activity.end_date}`
                                    : ""}
                                </span>
                              </ActivityMeta>
                            )}

                            <ActivityMeta>
                              {activity.overlap_hours}h overlap
                            </ActivityMeta>

                            {activity.level_name && (
                              <ActivityMeta>{activity.level_name}</ActivityMeta>
                            )}

                            {activity.zone_name && (
                              <ActivityMeta>{activity.zone_name}</ActivityMeta>
                            )}

                            {activity.row_confidence != null && (
                              <ActivityMeta>
                                Confidence{" "}
                                {Math.round(activity.row_confidence * 100)}%
                              </ActivityMeta>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 sm:flex-row lg:w-40 lg:flex-col">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-10 w-full rounded-xl border-slate-200 bg-white px-3 text-sm font-semibold shadow-sm"
                          disabled={isRowBusy}
                          onClick={() => onViewContext(activity)}
                        >
                          <Link2 className="mr-1.5 h-3.5 w-3.5" />
                          View context
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          className="h-10 w-full rounded-xl px-3 text-sm font-semibold shadow-sm"
                          disabled={isRowBusy}
                          onClick={() => onBook(activity)}
                        >
                          {isRowBusy ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              Loading...
                            </>
                          ) : (activity.linked_booking_count ?? 0) > 0 ? (
                            "Book remaining"
                          ) : (
                            "Book asset"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}