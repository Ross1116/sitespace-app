"use client";

import type { ApiBooking, BookingListResponse } from "@/types";
import { useBookingsListQuery } from "@/hooks/bookings/useBookingsData";

type Params = {
  projectId: string | null;
  enabled?: boolean;
  limit?: number;
  skip?: number;
};

type Result = {
  bookings: ApiBooking[];
  data: BookingListResponse | undefined;
  isLoading: boolean;
  error: unknown;
  mutate: () => Promise<BookingListResponse | undefined>;
};

export function useProjectBookingsList({
  projectId,
  enabled = true,
  limit = 1000,
  skip = 0,
}: Params): Result {
  const { data, bookings, isLoading, error, mutate } = useBookingsListQuery({
    projectId,
    enabled,
    limit,
    skip,
  });

  return {
    bookings,
    data,
    isLoading,
    error,
    mutate: () => mutate(),
  };
}
