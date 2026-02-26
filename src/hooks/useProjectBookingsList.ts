"use client";

import useSWR from "swr";
import { swrFetcher, SWR_CONFIG } from "@/lib/swr";
import type { ApiBooking, BookingListResponse } from "@/types";

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
  const swrKey =
    enabled && projectId
      ? `/bookings/?project_id=${encodeURIComponent(projectId)}&limit=${limit}&skip=${skip}`
      : null;

  const { data, isLoading, error, mutate } = useSWR<BookingListResponse>(
    swrKey,
    swrFetcher,
    SWR_CONFIG,
  );

  return {
    bookings: data?.bookings ?? [],
    data,
    isLoading,
    error,
    mutate: () => mutate(),
  };
}
