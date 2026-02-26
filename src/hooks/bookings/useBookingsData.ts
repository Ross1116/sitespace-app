"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { SWR_CONFIG } from "@/lib/swr";
import type { ApiBooking, BookingListResponse } from "@/types";
import { fetchBookingsList, fetchCalendarBookings, fetchUpcomingBookings } from "./api";
import { bookingsKeys } from "./keys";
import type { CalendarDayResponse } from "./types";

type BookingsListParams = {
  projectId: string | null;
  enabled?: boolean;
  limit?: number;
  skip?: number;
  dateFrom?: string;
  dateTo?: string;
};

type UpcomingBookingsParams = {
  projectId: string | null;
  enabled?: boolean;
  limit?: number;
};

type CalendarBookingsParams = {
  projectId: string | null;
  enabled?: boolean;
  dateFrom: string;
  dateTo: string;
  refreshInterval?: number;
};

export function useBookingsListQuery({
  projectId,
  enabled = true,
  limit = 1000,
  skip = 0,
  dateFrom,
  dateTo,
}: BookingsListParams): {
  data: BookingListResponse | undefined;
  bookings: ApiBooking[];
  isLoading: boolean;
  error: unknown;
  mutate: () => Promise<BookingListResponse | undefined>;
  key: string | null;
} {
  const key = useMemo(
    () =>
      enabled && projectId
        ? bookingsKeys.list({ projectId, limit, skip, dateFrom, dateTo })
        : null,
    [enabled, projectId, limit, skip, dateFrom, dateTo],
  );

  const { data, isLoading, error, mutate } = useSWR<BookingListResponse>(
    key,
    key
      ? () =>
          fetchBookingsList({
            projectId: projectId as string,
            limit,
            skip,
            dateFrom,
            dateTo,
          })
      : null,
    SWR_CONFIG,
  );

  return {
    data,
    bookings: data?.bookings ?? [],
    isLoading,
    error,
    mutate: () => mutate(),
    key,
  };
}

export function useUpcomingBookingsQuery({
  projectId,
  enabled = true,
  limit = 50,
}: UpcomingBookingsParams): {
  bookings: ApiBooking[];
  data: ApiBooking[] | undefined;
  isLoading: boolean;
  error: unknown;
  mutate: () => Promise<ApiBooking[] | undefined>;
  key: string | null;
} {
  const key = useMemo(
    () =>
      enabled && projectId ? bookingsKeys.upcoming({ projectId, limit }) : null,
    [enabled, projectId, limit],
  );

  const { data, isLoading, error, mutate } = useSWR<ApiBooking[]>(
    key,
    key
      ? () =>
          fetchUpcomingBookings({
            projectId: projectId as string,
            limit,
          })
      : null,
    SWR_CONFIG,
  );

  return {
    bookings: data ?? [],
    data,
    isLoading,
    error,
    mutate: () => mutate(),
    key,
  };
}

export function useCalendarBookingsQuery({
  projectId,
  enabled = true,
  dateFrom,
  dateTo,
  refreshInterval = 30_000,
}: CalendarBookingsParams): {
  calendarData: CalendarDayResponse[] | undefined;
  isLoading: boolean;
  error: unknown;
  mutate: () => Promise<CalendarDayResponse[] | undefined>;
  key: string | null;
} {
  const key = useMemo(
    () =>
      enabled && projectId
        ? bookingsKeys.calendar({ projectId, dateFrom, dateTo })
        : null,
    [enabled, projectId, dateFrom, dateTo],
  );

  const { data, isLoading, error, mutate } = useSWR<CalendarDayResponse[]>(
    key,
    key
      ? () =>
          fetchCalendarBookings({
            projectId: projectId as string,
            dateFrom,
            dateTo,
          })
      : null,
    {
      ...SWR_CONFIG,
      refreshInterval,
    },
  );

  return {
    calendarData: data,
    isLoading,
    error,
    mutate: () => mutate(),
    key,
  };
}
