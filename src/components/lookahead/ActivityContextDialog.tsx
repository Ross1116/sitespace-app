"use client";

import { CalendarDays, Loader2, Wrench } from "lucide-react";
import type {
  LookaheadRow,
  ProgrammeActivityBookingContextResponse,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatAssetType, formatDate, formatWeekRange } from "./utils";
import { getSuggestedDatesWithCoverageStatus } from "./activityBookingCoverage";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCell: LookaheadRow | null;
  bookingContext?: ProgrammeActivityBookingContextResponse | null;
  isLoading: boolean;
  onBook: () => void;
  onRescheduleLinked?: () => void;
}

function formatTimeWindow(
  date?: string | null,
  startTime?: string | null,
  endTime?: string | null,
): string {
  if (!date && !startTime && !endTime) return "No default window";
  const dateLabel = date ? formatDate(date) : "Unscheduled";
  const timeLabel =
    startTime && endTime
      ? `${startTime.slice(0, 5)}-${endTime.slice(0, 5)}`
      : startTime
        ? `${startTime.slice(0, 5)} start`
        : endTime
          ? `Until ${endTime.slice(0, 5)}`
          : "Time TBD";
  return `${dateLabel} - ${timeLabel}`;
}

function getSuggestedCoverageHours(
  suggestedDate: ProgrammeActivityBookingContextResponse["suggested_bulk_dates"][number],
): number | null {
  if (
    typeof suggestedDate.gap_hours === "number" &&
    Number.isFinite(suggestedDate.gap_hours)
  ) {
    return suggestedDate.gap_hours;
  }

  if (
    typeof suggestedDate.hours === "number" &&
    Number.isFinite(suggestedDate.hours)
  ) {
    return suggestedDate.hours;
  }

  return null;
}

export function ActivityContextDialog({
  open,
  onOpenChange,
  selectedCell,
  bookingContext,
  isLoading,
  onBook,
  onRescheduleLinked,
}: Props) {
  const suggestedDates = bookingContext?.suggested_bulk_dates ?? [];
  const linkedBookings = bookingContext?.linked_bookings ?? [];
  const candidateAssets = bookingContext?.candidate_assets ?? [];
  const linkedBookingGroup = bookingContext?.linked_booking_group;
  const { coveredSuggestedDates, remainingSuggestedDates } =
    getSuggestedDatesWithCoverageStatus(bookingContext);
  const activitySuggestedCoverageFullyLinked =
    suggestedDates.length > 0 &&
    remainingSuggestedDates.length === 0 &&
    linkedBookings.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>{bookingContext?.activity_name ?? "Booking context"}</span>
            {selectedCell && (
              <span className="text-sm font-normal text-slate-500">
                {formatAssetType(selectedCell.asset_type)} -{" "}
                {formatWeekRange(selectedCell.week_start)}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Review the backend booking context, linked coverage, and candidate
            assets before creating more activity-linked bookings.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-60 items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading activity context...
          </div>
        ) : !bookingContext ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No activity context was returned for this selection.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Expected asset
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {bookingContext.expected_asset_type
                    ? formatAssetType(bookingContext.expected_asset_type)
                    : "Not specified"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Default window
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatTimeWindow(
                    bookingContext.default_booking_date,
                    bookingContext.default_start_time,
                    bookingContext.default_end_time,
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Suggested dates
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {remainingSuggestedDates.length}/{suggestedDates.length}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Linked bookings
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {linkedBookings.length}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Booking plan
                    </p>
                    <p className="text-xs text-slate-500">
                      Review the backend-suggested activity coverage before
                      opening the booking form.
                    </p>
                  </div>
                  {linkedBookingGroup?.booking_group_id && (
                    <Badge variant="secondary">Booking group linked</Badge>
                  )}
                </div>

                <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-slate-800">Week:</span>{" "}
                    {bookingContext.selected_week_start ??
                      bookingContext.default_week_start ??
                      "Current"}
                  </div>
                  {bookingContext.level_name && (
                    <div>
                      <span className="font-medium text-slate-800">Level:</span>{" "}
                      {bookingContext.level_name}
                    </div>
                  )}
                  {bookingContext.zone_name && (
                    <div>
                      <span className="font-medium text-slate-800">Zone:</span>{" "}
                      {bookingContext.zone_name}
                    </div>
                  )}
                  {typeof linkedBookingGroup?.total_booked_hours === "number" && (
                    <div>
                      <span className="font-medium text-slate-800">
                        Grouped hours:
                      </span>{" "}
                      {linkedBookingGroup.total_booked_hours}h
                    </div>
                  )}
                </div>

                {activitySuggestedCoverageFullyLinked && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertDescription className="text-xs text-amber-700">
                      Every suggested date for this activity already has linked
                      coverage. Adjust the existing linked bookings instead of
                      creating a duplicate booking from here.
                    </AlertDescription>
                  </Alert>
                )}

                {!activitySuggestedCoverageFullyLinked &&
                  coveredSuggestedDates.length > 0 && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription className="text-xs text-blue-700">
                      {coveredSuggestedDates.length} suggested date
                      {coveredSuggestedDates.length === 1 ? "" : "s"} are
                      already linked, so the remaining plan below focuses only
                      on uncovered coverage.
                    </AlertDescription>
                  </Alert>
                )}

                {suggestedDates.length > 0 ? (
                  <div className="space-y-2">
                    {suggestedDates.map((suggestedDate) => (
                      <div
                        key={suggestedDate.date}
                        className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${
                          coveredSuggestedDates.some(
                            (coveredDate) => coveredDate.date === suggestedDate.date,
                          )
                            ? "border-amber-200 bg-amber-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="inline-flex items-center gap-2 text-slate-700">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span className="font-medium text-slate-900">
                            {formatDate(suggestedDate.date)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-slate-600">
                          {suggestedDate.start_time && suggestedDate.end_time && (
                            <span>
                              {suggestedDate.start_time.slice(0, 5)}-
                              {suggestedDate.end_time.slice(0, 5)}
                            </span>
                          )}
                          {typeof getSuggestedCoverageHours(suggestedDate) === "number" &&
                            getSuggestedCoverageHours(suggestedDate)! > 0 && (
                              <span className="rounded-full bg-white px-2 py-1">
                                {getSuggestedCoverageHours(suggestedDate)}h remaining
                              </span>
                            )}
                          {typeof suggestedDate.demand_hours === "number" &&
                            Number.isFinite(suggestedDate.demand_hours) && (
                              <span className="rounded-full bg-white px-2 py-1">
                                {suggestedDate.demand_hours}h demand
                              </span>
                            )}
                          {typeof suggestedDate.booked_hours === "number" &&
                            Number.isFinite(suggestedDate.booked_hours) && (
                              <span className="rounded-full bg-white px-2 py-1">
                                {suggestedDate.booked_hours}h booked
                              </span>
                            )}
                          {coveredSuggestedDates.some(
                            (coveredDate) => coveredDate.date === suggestedDate.date,
                          ) && (
                            <span className="rounded-full bg-white px-2 py-1 font-semibold uppercase tracking-wide text-amber-700">
                              Already linked
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No bulk dates were suggested for this activity.
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Candidate assets
                  </p>
                  <div className="mt-3 space-y-2">
                    {candidateAssets.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No candidate assets were returned.
                      </p>
                    ) : (
                      candidateAssets.slice(0, 5).map((asset) => (
                        <div
                          key={asset.id}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-900">
                              {asset.name}
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                              {asset.canonical_type && (
                                <Badge variant="outline">
                                  {formatAssetType(asset.canonical_type)}
                                </Badge>
                              )}
                              {asset.planning_ready !== undefined && (
                                <Badge
                                  variant={
                                    asset.planning_ready
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {asset.planning_ready
                                    ? "Planning ready"
                                    : "Needs review"}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {asset.availability_status && (
                            <p className="mt-1 text-slate-600">
                              Availability: {asset.availability_status}
                            </p>
                          )}
                          {asset.availability_reason && (
                            <p className="mt-1 text-slate-500">
                              {asset.availability_reason}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Existing linked bookings
                  </p>
                  <div className="mt-3 space-y-2">
                    {linkedBookings.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No linked bookings exist yet.
                      </p>
                    ) : (
                      linkedBookings.slice(0, 4).map((booking) => (
                        <div
                          key={booking.id}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-900">
                              {booking.asset?.name ?? booking.asset_id}
                            </span>
                            <Badge variant="outline" className="capitalize">
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="mt-1">
                            {booking.booking_date} {booking.start_time.slice(0, 5)}
                            -{booking.end_time.slice(0, 5)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {linkedBookings.length > 0 && onRescheduleLinked && (
                <Button variant="outline" onClick={onRescheduleLinked}>
                  Reschedule linked
                </Button>
              )}
              <Button onClick={onBook} disabled={activitySuggestedCoverageFullyLinked}>
                <Wrench className="mr-2 h-4 w-4" />
                {activitySuggestedCoverageFullyLinked
                  ? "Already fully planned"
                  : coveredSuggestedDates.length > 0
                    ? "Book remaining"
                    : "Book asset"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
