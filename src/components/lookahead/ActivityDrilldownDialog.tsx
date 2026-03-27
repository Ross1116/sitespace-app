"use client";

import { CalendarDays, Link2, Loader2 } from "lucide-react";
import type { LookaheadActivityCandidate, LookaheadRow } from "@/types";
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
  onBook: (activity: LookaheadActivityCandidate) => void;
  onViewContext: (activity: LookaheadActivityCandidate) => void;
}

export function ActivityDrilldownDialog({
  open,
  onOpenChange,
  selectedCell,
  activities,
  isLoading,
  onBook,
  onViewContext,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>Weekly activity drilldown</span>
            {selectedCell && (
              <span className="text-sm font-normal text-slate-500">
                {formatAssetType(selectedCell.asset_type)} · {formatWeekRange(selectedCell.week_start)}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Review the activities behind this heatmap cell and open the relevant
            booking or context workflow.
          </DialogDescription>
        </DialogHeader>

        {selectedCell && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Demand</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{selectedCell.demand_hours}h</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Booked</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{selectedCell.booked_hours}h</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Gap</p>
              <p className="mt-1 text-lg font-bold text-orange-600">{selectedCell.gap_hours}h</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading activities...
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No activities were returned for this cell.
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {activities.map((activity) => (
              <div
                key={activity.activity_id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {activity.activity_name}
                      </p>
                      {activity.booking_group_id && (
                        <Badge variant="secondary">Booking group linked</Badge>
                      )}
                      {(activity.linked_booking_count ?? 0) > 0 && (
                        <Badge variant="outline">
                          {activity.linked_booking_count} already planned
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {activity.start_date && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {activity.start_date}
                          {activity.end_date ? ` to ${activity.end_date}` : ""}
                        </span>
                      )}
                      <span>{activity.overlap_hours}h overlap</span>
                      {activity.level_name && <span>{activity.level_name}</span>}
                      {activity.zone_name && <span>{activity.zone_name}</span>}
                      {activity.row_confidence != null && (
                        <span>Confidence {Math.round(activity.row_confidence * 100)}%</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onViewContext(activity)}
                    >
                      <Link2 className="mr-1 h-3.5 w-3.5" />
                      View context
                    </Button>
                    <Button type="button" size="sm" onClick={() => onBook(activity)}>
                      {(activity.linked_booking_count ?? 0) > 0
                        ? "Book remaining"
                        : "Book asset"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
