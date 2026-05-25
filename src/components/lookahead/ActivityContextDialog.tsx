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
import { formatProjectLocalAssetName } from "@/lib/assetDisplay";

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

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200/80 bg-amber-50/60"
      : tone === "success"
        ? "border-emerald-200/80 bg-emerald-50/60"
        : "border-slate-200/80 bg-white";

  const valueClass =
    tone === "warning"
      ? "text-amber-900"
      : tone === "success"
        ? "text-emerald-900"
        : "text-slate-950";

  return (
    <div
      className={`min-w-0 rounded-2xl border px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.035)] ${toneClass}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <div className={`mt-1.5 text-sm font-bold leading-5 ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  trailing,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.035)]">
      <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
        <div className="min-w-0">
          <p className="text-base font-extrabold tracking-tight text-slate-950">
            {title}
          </p>
          {description && (
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>
        {trailing}
      </div>

      <div className="px-5 pb-5 pt-2">{children}</div>
    </section>
  );
}

function InlineInfo({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-semibold leading-5 text-slate-950">
        {value}
      </div>
    </div>
  );
}

function SoftPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warning" | "success";
}) {
  const className =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
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
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1rem)] max-w-5xl flex-col overflow-hidden rounded-[28px] border-0 bg-slate-50 p-0 shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-slate-200/80 bg-white px-7 pb-5 pt-6 sm:px-8">
          <DialogHeader className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <DialogTitle className="max-w-2xl text-[1.7rem] font-black leading-tight tracking-tight text-slate-950">
                  {bookingContext?.activity_name ?? "Booking context"}
                </DialogTitle>

                <DialogDescription className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Review booking coverage, suggested dates, linked bookings, and
                  available assets before creating more activity-linked bookings.
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
        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5 sm:px-8">
          {isLoading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm font-medium">Loading activity context...</p>
            </div>
          ) : !bookingContext ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No activity context found
              </p>
              <p className="mt-1 text-sm text-slate-400">
                No activity context was returned for this selection.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Summary */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  label="Expected asset"
                  value={
                    bookingContext.expected_asset_type
                      ? formatAssetType(bookingContext.expected_asset_type)
                      : "Not specified"
                  }
                />

                <SummaryCard
                  label="Default window"
                  value={formatTimeWindow(
                    bookingContext.default_booking_date,
                    bookingContext.default_start_time,
                    bookingContext.default_end_time,
                  )}
                />

                <SummaryCard
                  label="Suggested dates"
                  value={`${remainingSuggestedDates.length}/${suggestedDates.length}`}
                  tone={
                    activitySuggestedCoverageFullyLinked ? "success" : "neutral"
                  }
                />

                <SummaryCard
                  label="Linked bookings"
                  value={linkedBookings.length}
                  tone={linkedBookings.length > 0 ? "success" : "neutral"}
                />
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                {/* Booking plan */}
                <SectionCard
                  title="Booking plan"
                  description="Backend-suggested activity coverage for this selection."
                  trailing={
                    linkedBookingGroup?.booking_group_id ? (
                      <SoftPill>Group linked</SoftPill>
                    ) : null
                  }
                >
                  <div className="space-y-4">
                    <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:grid-cols-2">
                      <InlineInfo
                        label="Week"
                        value={
                          bookingContext.selected_week_start ??
                          bookingContext.default_week_start ??
                          "Current"
                        }
                      />

                      {bookingContext.level_name && (
                        <InlineInfo
                          label="Level"
                          value={bookingContext.level_name}
                        />
                      )}

                      {bookingContext.zone_name && (
                        <InlineInfo
                          label="Zone"
                          value={bookingContext.zone_name}
                        />
                      )}

                      {typeof linkedBookingGroup?.total_booked_hours ===
                        "number" && (
                        <InlineInfo
                          label="Grouped hours"
                          value={`${linkedBookingGroup.total_booked_hours}h`}
                        />
                      )}
                    </div>

                    {activitySuggestedCoverageFullyLinked && (
                      <Alert className="rounded-2xl border-amber-200 bg-amber-50">
                        <AlertDescription className="text-xs leading-5 text-amber-800">
                          Every suggested date for this activity already has
                          linked coverage. Adjust the existing linked bookings
                          instead of creating a duplicate booking from here.
                        </AlertDescription>
                      </Alert>
                    )}

                    {!activitySuggestedCoverageFullyLinked &&
                      coveredSuggestedDates.length > 0 && (
                        <Alert className="rounded-2xl border-blue-200 bg-blue-50">
                          <AlertDescription className="text-xs leading-5 text-blue-800">
                            {coveredSuggestedDates.length} suggested date
                            {coveredSuggestedDates.length === 1 ? "" : "s"} are
                            already linked, so the remaining plan below focuses
                            only on uncovered coverage.
                          </AlertDescription>
                        </Alert>
                      )}

                    {suggestedDates.length > 0 ? (
                      <div className="space-y-2.5">
                        {suggestedDates.map((suggestedDate) => {
                          const isCovered = coveredSuggestedDates.some(
                            (coveredDate) =>
                              coveredDate.date === suggestedDate.date,
                          );
                          const coverageHours =
                            getSuggestedCoverageHours(suggestedDate);

                          return (
                            <div
                              key={suggestedDate.date}
                              className={`rounded-2xl border px-4 py-3 ${
                                isCovered
                                  ? "border-amber-200/80 bg-amber-50/60"
                                  : "border-slate-200/80 bg-white"
                              }`}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="inline-flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                                    <p className="text-sm font-bold text-slate-950">
                                      {formatDate(suggestedDate.date)}
                                    </p>
                                  </div>

                                  {suggestedDate.start_time &&
                                    suggestedDate.end_time && (
                                      <p className="mt-1 pl-6 text-xs font-medium text-slate-500">
                                        {suggestedDate.start_time.slice(0, 5)}-
                                        {suggestedDate.end_time.slice(0, 5)}
                                      </p>
                                    )}
                                </div>

                                {isCovered && (
                                  <SoftPill tone="warning">
                                    Already linked
                                  </SoftPill>
                                )}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {typeof coverageHours === "number" &&
                                  coverageHours > 0 && (
                                    <SoftPill>
                                      {coverageHours}h remaining
                                    </SoftPill>
                                  )}

                                {typeof suggestedDate.demand_hours ===
                                  "number" &&
                                  Number.isFinite(
                                    suggestedDate.demand_hours,
                                  ) && (
                                    <SoftPill>
                                      {suggestedDate.demand_hours}h demand
                                    </SoftPill>
                                  )}

                                {typeof suggestedDate.booked_hours ===
                                  "number" &&
                                  Number.isFinite(
                                    suggestedDate.booked_hours,
                                  ) && (
                                    <SoftPill>
                                      {suggestedDate.booked_hours}h booked
                                    </SoftPill>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                        No bulk dates were suggested for this activity.
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* Right column */}
                <div className="space-y-5">
                  <SectionCard
                    title="Candidate assets"
                    description="Available assets returned for this booking context."
                  >
                    {candidateAssets.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No candidate assets were returned.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {candidateAssets.slice(0, 5).map((asset) => (
                          <div
                            key={asset.id}
                            className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.025)]"
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start justify-between gap-3">
                                <p className="min-w-0 font-bold leading-5 text-slate-950">
                                  {formatProjectLocalAssetName(
                                    asset.name,
                                    asset.asset_code,
                                    asset.id,
                                  ) || asset.name}
                                </p>

                                {asset.planning_ready !== undefined && (
                                  <SoftPill
                                    tone={
                                      asset.planning_ready
                                        ? "success"
                                        : "neutral"
                                    }
                                  >
                                    {asset.planning_ready ? "Ready" : "Review"}
                                  </SoftPill>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {asset.canonical_type && (
                                  <SoftPill>
                                    {formatAssetType(asset.canonical_type)}
                                  </SoftPill>
                                )}

                                {asset.availability_status && (
                                  <SoftPill>
                                    {asset.availability_status}
                                  </SoftPill>
                                )}
                              </div>

                              {asset.availability_reason && (
                                <p className="text-xs leading-5 text-slate-500">
                                  {asset.availability_reason}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Existing linked bookings"
                    description="Current bookings already connected to this activity."
                  >
                    {linkedBookings.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No linked bookings exist yet.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {linkedBookings.slice(0, 4).map((booking) => (
                          <div
                            key={booking.id}
                            className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.025)]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="min-w-0 font-bold leading-5 text-slate-950">
                                {booking.asset?.name ?? booking.asset_id}
                              </p>

                              <SoftPill>{booking.status}</SoftPill>
                            </div>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {booking.booking_date}{" "}
                              {booking.start_time.slice(0, 5)}-
                              {booking.end_time.slice(0, 5)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && bookingContext && (
          <div className="shrink-0 border-t border-slate-200/80 bg-white px-7 py-4 sm:px-8">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="h-10 rounded-xl border-slate-200 bg-white px-4 text-sm font-semibold shadow-sm"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>

              {linkedBookings.length > 0 && onRescheduleLinked && (
                <Button
                  variant="outline"
                  className="h-10 rounded-xl border-slate-200 bg-white px-4 text-sm font-semibold shadow-sm"
                  onClick={onRescheduleLinked}
                >
                  Reschedule linked
                </Button>
              )}

              <Button
                className="h-10 rounded-xl px-5 text-sm font-semibold shadow-sm"
                onClick={onBook}
                disabled={activitySuggestedCoverageFullyLinked}
              >
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