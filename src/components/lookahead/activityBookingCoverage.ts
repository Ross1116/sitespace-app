"use client";

import type {
  ApiBooking,
  ProgrammeActivityBookingContextResponse,
  ProgrammeActivitySuggestedBookingDate,
} from "@/types";

function normalizeTimeValue(value?: string | null): string {
  return typeof value === "string" ? value.slice(0, 5) : "";
}

function buildSlotKey(
  date: string,
  startTime?: string | null,
  endTime?: string | null,
): string {
  return [date, normalizeTimeValue(startTime), normalizeTimeValue(endTime)].join(
    "|",
  );
}

function isActiveLinkedBooking(booking: ApiBooking): boolean {
  const status = (booking.status ?? "").toLowerCase();
  return status !== "cancelled" && status !== "denied";
}

export function isSuggestedDateCovered(
  suggestedDate: ProgrammeActivitySuggestedBookingDate,
  bookingContext?: ProgrammeActivityBookingContextResponse | null,
): boolean {
  if (!bookingContext) return false;

  if (
    typeof suggestedDate.gap_hours === "number" &&
    Number.isFinite(suggestedDate.gap_hours)
  ) {
    return suggestedDate.gap_hours <= 0;
  }

  if (
    typeof suggestedDate.demand_hours === "number" &&
    Number.isFinite(suggestedDate.demand_hours) &&
    typeof suggestedDate.booked_hours === "number" &&
    Number.isFinite(suggestedDate.booked_hours)
  ) {
    return suggestedDate.booked_hours >= suggestedDate.demand_hours;
  }

  const linkedBookings = bookingContext.linked_bookings.filter(
    isActiveLinkedBooking,
  );
  const startTime = suggestedDate.start_time ?? bookingContext.default_start_time;
  const endTime = suggestedDate.end_time ?? bookingContext.default_end_time;

  if (startTime || endTime) {
    const slotKey = buildSlotKey(suggestedDate.date, startTime, endTime);
    return linkedBookings.some(
      (booking) =>
        buildSlotKey(
          booking.booking_date,
          booking.start_time,
          booking.end_time,
        ) === slotKey,
    );
  }

  return linkedBookings.some(
    (booking) => booking.booking_date === suggestedDate.date,
  );
}

export function getSuggestedDatesWithCoverageStatus(
  bookingContext?: ProgrammeActivityBookingContextResponse | null,
): {
  coveredSuggestedDates: ProgrammeActivitySuggestedBookingDate[];
  remainingSuggestedDates: ProgrammeActivitySuggestedBookingDate[];
} {
  const suggestedDates = bookingContext?.suggested_bulk_dates ?? [];
  const coveredSuggestedDates: ProgrammeActivitySuggestedBookingDate[] = [];
  const remainingSuggestedDates: ProgrammeActivitySuggestedBookingDate[] = [];

  for (const suggestedDate of suggestedDates) {
    if (isSuggestedDateCovered(suggestedDate, bookingContext)) {
      coveredSuggestedDates.push(suggestedDate);
    } else {
      remainingSuggestedDates.push(suggestedDate);
    }
  }

  return {
    coveredSuggestedDates,
    remainingSuggestedDates,
  };
}
