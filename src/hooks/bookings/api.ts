import api from "@/lib/api";
import { normalizeBookingList } from "@/lib/apiNormalization";
import { reportError } from "@/lib/monitoring";
import { BOOKING_PAGINATION_MAX_PAGES } from "@/lib/pagination";
import type { ApiBooking, BookingListResponse } from "@/types";
import { bookingsKeys } from "./keys";
import type { CalendarDayResponse } from "./types";

type BookingStatusForWrite =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "denied";

export type BookingCreatePayload = {
  project_id?: string;
  subcontractor_id?: string;
  asset_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  purpose?: string;
};

export type BookingUpdatePayload = {
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose?: string;
  notes?: string;
};

type FetchBookingsForDateParams = {
  projectId: string;
  bookingDate: string;
  context: string;
  limit?: number;
};

type CompetingPendingBySlotParams = {
  bookings: ApiBooking[];
  bookingDate: string;
  startTime: string;
  endTime: string;
  assetIds: string[];
  excludeBookingId?: string | null;
};

type DuplicateAssetIdsParams = {
  bookings: ApiBooking[];
  bookingDate: string;
  startTime: string;
  endTime: string;
  targetSubcontractorId: string;
  assetIds: string[];
};

const normalizeTime = (value: string): string =>
  (value || "").split(":").slice(0, 2).join(":");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeBookingListResponse = (
  payload: unknown,
  fallbackLimit: number,
  fallbackSkip: number,
): BookingListResponse => {
  const records = normalizeBookingList(payload);
  if (!isRecord(payload)) {
    return {
      bookings: records,
      total: records.length,
      skip: fallbackSkip,
      limit: fallbackLimit,
      has_more: false,
    };
  }

  const total =
    typeof payload.total === "number" ? payload.total : records.length;
  const skip = typeof payload.skip === "number" ? payload.skip : fallbackSkip;
  const limit =
    typeof payload.limit === "number" ? payload.limit : fallbackLimit;
  const has_more =
    typeof payload.has_more === "boolean" ? payload.has_more : false;

  return {
    bookings: records,
    total,
    skip,
    limit,
    has_more,
  };
};

export async function fetchBookingsList(params: {
  projectId: string;
  limit?: number;
  skip?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<BookingListResponse> {
  const limit = params.limit ?? 1000;
  const skip = params.skip ?? 0;
  const key = bookingsKeys.list({
    projectId: params.projectId,
    limit,
    skip,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });
  const response = await api.get<unknown>(key);
  return normalizeBookingListResponse(response.data, limit, skip);
}

export async function fetchUpcomingBookings(params: {
  projectId: string;
  limit?: number;
}): Promise<ApiBooking[]> {
  const key = bookingsKeys.upcoming({
    projectId: params.projectId,
    limit: params.limit ?? 50,
  });
  const response = await api.get<unknown>(key);
  return normalizeBookingList(response.data);
}

export async function fetchCalendarBookings(params: {
  projectId: string;
  dateFrom: string;
  dateTo: string;
}): Promise<CalendarDayResponse[]> {
  const key = bookingsKeys.calendar(params);
  const response = await api.get<unknown>(key);
  if (!Array.isArray(response.data)) {
    return [];
  }

  return response.data
    .filter((entry): entry is Record<string, unknown> => isRecord(entry))
    .map((entry) => ({
      date: typeof entry.date === "string" ? entry.date : "",
      bookings: normalizeBookingList(entry.bookings),
    }));
}

export async function fetchBookingById(
  bookingId: string,
  signal?: AbortSignal,
): Promise<ApiBooking> {
  const response = await api.get<ApiBooking>(bookingsKeys.detail(bookingId), {
    signal,
  });
  return response.data;
}

export async function fetchBookingsForDate({
  projectId,
  bookingDate,
  context,
  limit = 200,
}: FetchBookingsForDateParams): Promise<ApiBooking[]> {
  let skip = 0;
  let hasMore = true;
  let pageCount = 0;
  const collected: ApiBooking[] = [];

  while (hasMore) {
    if (pageCount >= BOOKING_PAGINATION_MAX_PAGES) {
      reportError(
        new Error(
          `Pagination guard triggered: pageCount=${pageCount}, maxPages=${BOOKING_PAGINATION_MAX_PAGES}, projectId=${projectId}, bookingDate=${bookingDate}`,
        ),
        `${context}: pagination safety limit reached while loading bookings`,
      );
      throw new Error(
        "Too many bookings to load for this date. Please narrow your search or contact support.",
      );
    }

    const response = await api.get<unknown>("/bookings/", {
      params: {
        project_id: projectId,
        date_from: bookingDate,
        date_to: bookingDate,
        limit,
        skip,
      },
    });

    const normalized = normalizeBookingListResponse(response.data, limit, skip);
    collected.push(...normalized.bookings);
    hasMore = normalized.has_more;
    const responseLimit =
      isRecord(response.data) && typeof response.data.limit === "number"
        ? response.data.limit
        : undefined;
    skip += responseLimit ?? normalized.bookings.length;
    pageCount += 1;
  }

  return collected;
}

export function getCompetingPendingBookingsForAssets({
  bookings,
  bookingDate,
  startTime,
  endTime,
  assetIds,
  excludeBookingId = null,
}: CompetingPendingBySlotParams): ApiBooking[] {
  const targetAssets = new Set(assetIds);
  if (targetAssets.size === 0) return [];

  const normalizedStart = normalizeTime(startTime);
  const normalizedEnd = normalizeTime(endTime);

  return bookings.filter((booking) => {
    const status = (booking.status || "").toLowerCase();
    return (
      status === "pending" &&
      booking.booking_date === bookingDate &&
      normalizeTime(booking.start_time) === normalizedStart &&
      normalizeTime(booking.end_time) === normalizedEnd &&
      targetAssets.has(booking.asset_id) &&
      (!excludeBookingId || booking.id !== excludeBookingId)
    );
  });
}

export function getDuplicateAssetIdsForSubcontractor({
  bookings,
  bookingDate,
  startTime,
  endTime,
  targetSubcontractorId,
  assetIds,
}: DuplicateAssetIdsParams): Set<string> {
  const targetAssets = new Set(assetIds);
  if (targetAssets.size === 0) return new Set<string>();

  const normalizedStart = normalizeTime(startTime);
  const normalizedEnd = normalizeTime(endTime);

  return new Set(
    bookings
      .filter((booking) => {
        const status = (booking.status || "").toLowerCase();
        if (status === "cancelled" || status === "denied") return false;
        return (
          booking.subcontractor_id === targetSubcontractorId &&
          booking.booking_date === bookingDate &&
          normalizeTime(booking.start_time) === normalizedStart &&
          normalizeTime(booking.end_time) === normalizedEnd &&
          targetAssets.has(booking.asset_id)
        );
      })
      .map((booking) => booking.asset_id),
  );
}

export async function fetchCompetingPendingBookingsForBooking(
  booking: ApiBooking,
  context: string,
): Promise<ApiBooking[]> {
  const { booking_date, start_time, end_time, asset_id, project_id, project, id } =
    booking;
  const effectiveProjectId = project_id ?? project?.id ?? null;

  if (!booking_date || !start_time || !end_time || !asset_id || !effectiveProjectId) {
    return [];
  }

  const sameDateBookings = await fetchBookingsForDate({
    projectId: effectiveProjectId,
    bookingDate: booking_date,
    context,
  });

  return getCompetingPendingBookingsForAssets({
    bookings: sameDateBookings,
    bookingDate: booking_date,
    startTime: start_time,
    endTime: end_time,
    assetIds: [asset_id],
    excludeBookingId: id,
  });
}

export async function createBooking(
  payload: BookingCreatePayload,
): Promise<ApiBooking> {
  const response = await api.post<ApiBooking>("/bookings/", payload);
  return response.data;
}

export async function putBooking(
  bookingId: string,
  payload: BookingUpdatePayload,
): Promise<ApiBooking> {
  const response = await api.put<ApiBooking>(bookingsKeys.detail(bookingId), payload);
  return response.data;
}

export async function patchBookingStatus(
  bookingId: string,
  status: BookingStatusForWrite | string,
): Promise<void> {
  await api.patch(`${bookingsKeys.detail(bookingId)}/status`, {
    status: String(status).toUpperCase(),
  });
}

export async function hardDeleteBooking(bookingId: string): Promise<void> {
  await api.delete(bookingsKeys.detail(bookingId), {
    data: { hard_delete: true },
  });
}
