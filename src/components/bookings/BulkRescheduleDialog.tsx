"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { addDays, format } from "date-fns";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { previewBulkReschedule } from "@/hooks/bookings/api";
import { useBookingMutations } from "@/hooks/bookings/useBookingMutations";
import { reportError } from "@/lib/monitoring";
import type {
  BulkRescheduleItemPayload,
  BulkRescheduleItemResult,
  BulkRescheduleRequestPayload,
  BulkRescheduleValidationResponse,
  ProgrammeActivitySuggestedBookingDate,
  TransformedBooking,
} from "@/types";
import { getApiErrorMessage } from "@/types";

type DraftTarget = {
  bookingId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  assetId?: string | null;
  subcontractorId?: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  bookings: TransformedBooking[];
  suggestedDates?: ProgrammeActivitySuggestedBookingDate[];
  initialShiftDays?: number;
  onComplete?: () => void;
}

const normalizeTime = (value?: string | null): string =>
  (value || "").split(":").slice(0, 2).join(":");

const toApiTime = (value: string): string =>
  value.length === 5 ? `${value}:00` : value;

const isOverrideIssue = (code: string): boolean => {
  const normalized = code.toLowerCase();
  return (
    normalized.includes("non_working") ||
    normalized.includes("working_hours") ||
    normalized.includes("outside_working")
  );
};

const hasIssueMatching = (
  validation: BulkRescheduleValidationResponse | null,
  predicate: (code: string) => boolean,
): boolean =>
  Boolean(
    validation?.items.some((item) =>
      [...item.errors, ...item.warnings].some((issue) =>
        predicate(issue.code),
      ),
    ),
  );

/**
 * suggestedDates must be in the same order as bookings; each suggestion is
 * paired with the booking at the same index.
 */
function buildInitialTargets(
  bookings: TransformedBooking[],
  suggestedDates?: ProgrammeActivitySuggestedBookingDate[],
  shiftDays = 0,
): DraftTarget[] {
  const alignedSuggestedDates =
    suggestedDates && suggestedDates.length !== bookings.length
      ? undefined
      : suggestedDates;

  if (suggestedDates && suggestedDates.length !== bookings.length) {
    console.warn(
      "BulkRescheduleDialog: suggestedDates must be parallel-ordered with bookings; ignoring suggestedDates because lengths differ.",
      { bookings, suggestedDates },
    );
  }

  return bookings.map((booking, index) => {
    const suggested = alignedSuggestedDates?.[index];
    const baseDate = suggested?.date ?? booking.bookingTimeDt;
    return {
      bookingId: booking.bookingKey,
      bookingDate:
        shiftDays === 0
          ? baseDate
          : format(addDays(new Date(`${baseDate}T00:00:00`), shiftDays), "yyyy-MM-dd"),
      startTime:
        normalizeTime(suggested?.start_time) ||
        normalizeTime(booking.bookingStartTime) ||
        "08:00",
      endTime:
        normalizeTime(suggested?.end_time) ||
        normalizeTime(booking.bookingEndTime) ||
        "09:00",
      assetId: booking.assetId,
      subcontractorId: booking.subcontractorId ?? null,
    };
  });
}

function resultTone(result: BulkRescheduleItemResult | null): string {
  if (!result) return "border-slate-200 bg-white shadow-sm";
  if (result.errors.length > 0) return "border-red-200 bg-red-50 shadow-sm";
  if (result.warnings.length > 0 || result.conflicts.length > 0) {
    return "border-amber-200 bg-amber-50 shadow-sm";
  }
  return "border-emerald-200 bg-emerald-50 shadow-sm";
}

function resultStatus(
  result: BulkRescheduleItemResult | null,
): {
  label: string;
  className: string;
  icon: "check" | "alert" | null;
} {
  if (!result) {
    return {
      label: "Not previewed",
      className: "border-slate-200 bg-white text-slate-600",
      icon: null,
    };
  }
  if (result.errors.length > 0) {
    return {
      label: "Blocked",
      className: "border-red-200 bg-red-100 text-red-700",
      icon: "alert",
    };
  }
  if (result.warnings.length > 0 || result.conflicts.length > 0) {
    return {
      label: "Needs review",
      className: "border-amber-200 bg-amber-100 text-amber-800",
      icon: "alert",
    };
  }
  return {
    label: "Ready",
    className: "border-emerald-200 bg-emerald-100 text-emerald-700",
    icon: "check",
  };
}

const ValidationSummary = memo(function ValidationSummary({
  validation,
}: {
  validation: BulkRescheduleValidationResponse;
}) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Total
        </p>
        <p className="mt-1 text-2xl font-black text-slate-950">
          {validation.summary.total}
        </p>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Valid
        </p>
        <p className="mt-1 text-2xl font-black text-emerald-900">
          {validation.summary.valid}
        </p>
      </div>
      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
          Invalid
        </p>
        <p className="mt-1 text-2xl font-black text-red-900">
          {validation.summary.invalid}
        </p>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          Warnings
        </p>
        <p className="mt-1 text-2xl font-black text-amber-900">
          {validation.summary.warnings}
        </p>
      </div>
    </section>
  );
});

type TargetCardProps = {
  target: DraftTarget;
  booking?: TransformedBooking;
  result: BulkRescheduleItemResult | null;
  onUpdateTarget: (bookingId: string, patch: Partial<DraftTarget>) => void;
};

const TargetCard = memo(function TargetCard({
  target,
  booking,
  result,
  onUpdateTarget,
}: TargetCardProps) {
  const status = resultStatus(result);

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 ${resultTone(result)}`}
    >
      <div className="flex flex-col gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <p
              className="min-w-0 text-base font-bold leading-6 text-slate-900"
              title={booking?.bookingTitle || "Booking"}
            >
              {booking?.bookingTitle || "Booking"}
            </p>
            <Badge
              variant="outline"
              className={`w-fit shrink-0 ${status.className}`}
            >
              {status.icon === "check" && (
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              )}
              {status.icon === "alert" && (
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              )}
              {status.label}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700">
              {booking?.assetName || target.assetId || "Asset"}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600">
              Current: {booking?.bookingTimeDt || "Unknown date"}{" "}
              {booking?.bookingStartTime || "--:--"}-
              {booking?.bookingEndTime || "--:--"}
            </span>
          </div>

          {result && (
            <div className="grid gap-2 text-xs text-slate-600 min-[420px]:grid-cols-2">
              <div className="rounded-lg bg-white/80 px-3 py-2">
                <span className="block font-semibold text-slate-800">
                  Working week
                </span>
                {result.work_days_per_week} days from{" "}
                {result.work_days_source}
              </div>
              <div className="rounded-lg bg-white/80 px-3 py-2">
                <span className="block font-semibold text-slate-800">
                  Holidays
                </span>
                {result.holiday_region_code || "SA"} from{" "}
                {result.holiday_region_source || "default"}
              </div>
            </div>
          )}
        </div>

        <div className="grid min-w-0 gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-1.5">
            <Label
              htmlFor={`bulk-date-${target.bookingId}`}
              className="text-xs font-semibold text-slate-600"
            >
              Target date
            </Label>
            <Input
              id={`bulk-date-${target.bookingId}`}
              type="date"
              value={target.bookingDate}
              onChange={(event) =>
                onUpdateTarget(target.bookingId, {
                  bookingDate: event.target.value,
                })
              }
              className="h-11 min-w-0 bg-white"
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label
              htmlFor={`bulk-start-${target.bookingId}`}
              className="text-xs font-semibold text-slate-600"
            >
              Start
            </Label>
            <Input
              id={`bulk-start-${target.bookingId}`}
              type="time"
              value={target.startTime}
              onChange={(event) =>
                onUpdateTarget(target.bookingId, {
                  startTime: event.target.value,
                })
              }
              className="h-11 min-w-0 bg-white"
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label
              htmlFor={`bulk-end-${target.bookingId}`}
              className="text-xs font-semibold text-slate-600"
            >
              End
            </Label>
            <Input
              id={`bulk-end-${target.bookingId}`}
              type="time"
              value={target.endTime}
              onChange={(event) =>
                onUpdateTarget(target.bookingId, {
                  endTime: event.target.value,
                })
              }
              className="h-11 min-w-0 bg-white"
            />
          </div>
        </div>
      </div>

      {result && (result.errors.length > 0 || result.warnings.length > 0) && (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {result.errors.map((issue) => (
            <p
              key={`${issue.code}-${issue.message}`}
              className="rounded-lg bg-white/90 px-3 py-2 text-xs font-medium leading-5 text-red-700"
            >
              {issue.message}
            </p>
          ))}
          {result.warnings.map((issue) => (
            <p
              key={`${issue.code}-${issue.message}`}
              className="rounded-lg bg-white/90 px-3 py-2 text-xs font-medium leading-5 text-amber-700"
            >
              {issue.message}
            </p>
          ))}
        </div>
      )}

      {result && result.conflicts.length > 0 && (
        <div className="mt-4 rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-slate-700">
          {result.conflicts.length} booking conflict
          {result.conflicts.length === 1 ? "" : "s"} found.
        </div>
      )}
    </div>
  );
});

export function BulkRescheduleDialog({
  open,
  onOpenChange,
  projectId,
  bookings,
  suggestedDates,
  initialShiftDays = 0,
  onComplete,
}: Props) {
  const { bulkRescheduleBookings } = useBookingMutations();
  const previewRequestIdRef = useRef(0);
  const [targets, setTargets] = useState<DraftTarget[]>([]);
  const [validation, setValidation] =
    useState<BulkRescheduleValidationResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowNonWorkingDays, setAllowNonWorkingDays] = useState(false);
  const [allowOutsideWorkingHours, setAllowOutsideWorkingHours] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) return;
    setTargets(buildInitialTargets(bookings, suggestedDates, initialShiftDays));
    setValidation(null);
    setError(null);
    setAllowNonWorkingDays(false);
    setAllowOutsideWorkingHours(false);
    setComment("");
    // Initialize from the latest open payload only when the dialog opens.
    // Parent re-renders can refresh bookings/suggestedDates while the user is editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const validationPayload = useMemo<BulkRescheduleRequestPayload | null>(() => {
    if (!projectId || targets.length === 0) return null;
    return {
      project_id: projectId,
      items: targets.map(
        (target): BulkRescheduleItemPayload => ({
          booking_id: target.bookingId,
          booking_date: target.bookingDate,
          start_time: toApiTime(target.startTime),
          end_time: toApiTime(target.endTime),
          asset_id: target.assetId,
          subcontractor_id: target.subcontractorId,
        }),
      ),
      allow_non_working_days: allowNonWorkingDays,
      allow_outside_working_hours: allowOutsideWorkingHours,
    };
  }, [allowNonWorkingDays, allowOutsideWorkingHours, projectId, targets]);

  const applyPayload = useMemo<BulkRescheduleRequestPayload | null>(() => {
    if (!validationPayload) return null;
    return {
      ...validationPayload,
      comment: comment.trim() || null,
    };
  }, [comment, validationPayload]);
  const bookingById = useMemo(
    () =>
      new Map(
        bookings.map((booking) => [booking.bookingKey, booking] as const),
      ),
    [bookings],
  );
  const resultByBookingId = useMemo(
    () =>
      new Map(
        validation?.items.map((item) => [item.booking_id, item] as const) ?? [],
      ),
    [validation],
  );

  const canPreview = Boolean(validationPayload && targets.length > 0);
  const hasNonWorkingIssue = hasIssueMatching(validation, (code) =>
    code.toLowerCase().includes("non_working"),
  );
  const hasWorkingHoursIssue = hasIssueMatching(validation, (code) => {
    const normalized = code.toLowerCase();
    return (
      normalized.includes("working_hours") ||
      normalized.includes("outside_working")
    );
  });
  const onlyOverrideErrors = Boolean(
    validation &&
      validation.summary.invalid > 0 &&
      validation.items.every((item) =>
        item.errors.every((issue) => isOverrideIssue(issue.code)),
      ),
  );
  const canApply = Boolean(
    validation &&
      (validation.can_apply ||
        (onlyOverrideErrors &&
          (!hasNonWorkingIssue || allowNonWorkingDays) &&
          (!hasWorkingHoursIssue || allowOutsideWorkingHours))),
  );

  const runPreview = useCallback(
    async (nextPayload: BulkRescheduleRequestPayload | null) => {
      if (!nextPayload) return;
      const requestId = previewRequestIdRef.current + 1;
      previewRequestIdRef.current = requestId;
      setLoadingPreview(true);
      setError(null);
      try {
        const response = await previewBulkReschedule(nextPayload);
        if (requestId !== previewRequestIdRef.current) return;
        setValidation(response);
      } catch (err) {
        if (requestId !== previewRequestIdRef.current) return;
        reportError(err, "BulkRescheduleDialog: failed to preview");
        setError(getApiErrorMessage(err, "Failed to preview bulk reschedule"));
      } finally {
        if (requestId === previewRequestIdRef.current) {
          setLoadingPreview(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!open || !validationPayload) return;
    const timer = window.setTimeout(() => {
      void runPreview(validationPayload);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [open, runPreview, validationPayload]);

  const updateTarget = useCallback(
    (bookingId: string, patch: Partial<DraftTarget>) => {
      setTargets((current) =>
        current.map((target) =>
          target.bookingId === bookingId ? { ...target, ...patch } : target,
        ),
      );
      setValidation(null);
    },
    [],
  );

  const shiftAll = useCallback((days: number) => {
    setTargets((current) =>
      current.map((target) => ({
        ...target,
        bookingDate: format(addDays(new Date(`${target.bookingDate}T00:00:00`), days), "yyyy-MM-dd"),
      })),
    );
    setValidation(null);
  }, []);

  async function handlePreview() {
    await runPreview(validationPayload);
  }

  async function handleApply() {
    if (!applyPayload || !canApply) return;
    setApplying(true);
    setError(null);
    try {
      const response = await bulkRescheduleBookings({
        projectId,
        payload: applyPayload,
      });
      setValidation(response.validation);
      onComplete?.();
      onOpenChange(false);
    } catch (err) {
      reportError(err, "BulkRescheduleDialog: failed to apply");
      setError(getApiErrorMessage(err, "Failed to apply bulk reschedule"));
    } finally {
      setApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[96dvh] w-[calc(100vw-1rem)] max-w-6xl grid-rows-none flex-col gap-0 overflow-hidden bg-white p-0 sm:max-h-[92vh]">
        <DialogHeader className="border-b border-slate-100 px-4 pb-4 pt-5 pr-12 sm:px-6 sm:pt-6 sm:pr-14">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarClock className="h-5 w-5 shrink-0 text-teal-700" />
            Bulk reschedule
          </DialogTitle>
          <DialogDescription className="max-w-3xl text-sm leading-6 sm:text-base">
            Adjust dates or times as needed. Calendar, holiday, maintenance, and
            conflict checks run automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5">
          {error && (
            <Alert className="border-red-200 bg-red-50 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {bookings.length} booking{bookings.length === 1 ? "" : "s"} selected
              </p>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                Choose a quick shift or edit individual rows. Checks refresh in
                the background.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={() => shiftAll(1)}
                className="h-11"
              >
                +1 day
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => shiftAll(7)}
                className="h-11"
              >
                +1 week
              </Button>
              <Button
                type="button"
                onClick={handlePreview}
                disabled={!canPreview || loadingPreview}
                className="col-span-2 h-11 bg-navy text-white hover:bg-(--navy-hover) sm:col-span-1"
              >
                {loadingPreview ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {loadingPreview ? "Checking..." : "Refresh checks"}
              </Button>
            </div>
          </section>

          {validation && <ValidationSummary validation={validation} />}

          <section className="space-y-3">
            {targets.map((target) => (
              <TargetCard
                key={target.bookingId}
                target={target}
                booking={bookingById.get(target.bookingId)}
                result={resultByBookingId.get(target.bookingId) ?? null}
                onUpdateTarget={updateTarget}
              />
            ))}
          </section>

          {validation && (hasNonWorkingIssue || hasWorkingHoursIssue) && (
            <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
              <p className="text-sm font-semibold text-amber-900">
                Manager override
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {hasNonWorkingIssue && (
                  <label className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-amber-900">
                    <Checkbox
                      checked={allowNonWorkingDays}
                      onCheckedChange={(checked) => {
                        setAllowNonWorkingDays(Boolean(checked));
                        setValidation(null);
                      }}
                    />
                    Allow non-working days
                  </label>
                )}
                {hasWorkingHoursIssue && (
                  <label className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-amber-900">
                    <Checkbox
                      checked={allowOutsideWorkingHours}
                      onCheckedChange={(checked) => {
                        setAllowOutsideWorkingHours(Boolean(checked));
                        setValidation(null);
                      }}
                    />
                    Allow outside working hours
                  </label>
                )}
              </div>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Optional audit comment"
                className="bg-white"
              />
              {(allowNonWorkingDays || allowOutsideWorkingHours) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={loadingPreview}
                  className="w-full sm:w-auto"
                >
                  Re-preview with overrides
                </Button>
              )}
            </section>
          )}
        </div>

        <DialogFooter className="border-t border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={!canApply || applying || loadingPreview}
            className="w-full bg-navy text-white hover:bg-(--navy-hover) sm:w-auto"
          >
            {applying
              ? "Applying..."
              : loadingPreview
                ? "Checking..."
                : "Apply reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
