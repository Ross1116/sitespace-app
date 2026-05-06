"use client";

import { useCallback } from "react";
import { useSWRConfig } from "swr";
import type { ApiBooking } from "@/types";
import {
  applyBulkReschedule,
  BookingCreatePayload,
  BookingUpdatePayload,
  createBooking,
  hardDeleteBooking,
  patchBookingStatus,
  putBooking,
} from "./api";
import { isBookingsCollectionKey, isProjectScopedBookingsKey } from "./keys";
import type { CalendarDayResponse } from "./types";
import type {
  BulkRescheduleApplyResponse,
  BulkRescheduleRequestPayload,
} from "@/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isCalendarDaysArray = (value: unknown): value is CalendarDayResponse[] => {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return false;
  const first = value[0];
  return isRecord(first) && Array.isArray(first.bookings);
};

const patchBookingInArray = (
  bookings: ApiBooking[],
  bookingId: string,
  updater: (booking: ApiBooking) => ApiBooking | null,
): ApiBooking[] => {
  let changed = false;
  const next: ApiBooking[] = [];

  for (const booking of bookings) {
    if (!booking || booking.id !== bookingId) {
      next.push(booking);
      continue;
    }
    changed = true;
    const updated = updater(booking);
    if (updated) next.push(updated);
  }

  return changed ? next : bookings;
};

const patchBookingCacheShape = (
  currentData: unknown,
  bookingId: string,
  updater: (booking: ApiBooking) => ApiBooking | null,
): unknown => {
  if (!currentData) return currentData;

  if (Array.isArray(currentData)) {
    if (currentData.length === 0) return currentData;

    if (isCalendarDaysArray(currentData)) {
      let changed = false;
      const next = currentData.map((day) => {
        const nextBookings = patchBookingInArray(day.bookings || [], bookingId, updater);
        if (nextBookings !== day.bookings) changed = true;
        return nextBookings === day.bookings ? day : { ...day, bookings: nextBookings };
      });
      return changed ? next : currentData;
    }

    const maybeBookings = currentData as ApiBooking[];
    return patchBookingInArray(maybeBookings, bookingId, updater);
  }

  if (isRecord(currentData) && Array.isArray(currentData.bookings)) {
    const currentBookings = currentData.bookings as ApiBooking[];
    const nextBookings = patchBookingInArray(currentBookings, bookingId, updater);
    if (nextBookings === currentBookings) return currentData;
    return {
      ...currentData,
      bookings: nextBookings,
      total:
        typeof currentData.total === "number"
          ? Math.max(0, currentData.total - (currentBookings.length - nextBookings.length))
          : nextBookings.length,
    };
  }

  return currentData;
};

const normalizeStatus = (status: string): string => status.toLowerCase();

type ScopedMutationParams = {
  projectId: string | null | undefined;
  bookingId: string;
};

export function useBookingMutations() {
  const { mutate } = useSWRConfig();

  const mutateProjectBookingCaches = useCallback(
    async (
      { projectId, bookingId }: ScopedMutationParams,
      updater: (booking: ApiBooking) => ApiBooking | null,
    ) => {
      if (!projectId) return;
      await mutate(
        (key) => isProjectScopedBookingsKey(key, projectId),
        (currentData) => patchBookingCacheShape(currentData, bookingId, updater),
        { revalidate: false },
      );
    },
    [mutate],
  );

  const revalidateBookingsForProject = useCallback(
    async (projectId?: string | null) => {
      if (projectId) {
        await mutate((key) => isProjectScopedBookingsKey(key, projectId));
        return;
      }
      await mutate((key) => isBookingsCollectionKey(key));
    },
    [mutate],
  );

  const createBookings = useCallback(
    async ({
      projectId,
      payloads,
    }: {
      projectId?: string | null;
      payloads: BookingCreatePayload[];
    }): Promise<PromiseSettledResult<ApiBooking>[]> => {
      const results = await Promise.allSettled(payloads.map((payload) => createBooking(payload)));
      await revalidateBookingsForProject(projectId);
      return results;
    },
    [revalidateBookingsForProject],
  );

  const updateBookingStatus = useCallback(
    async ({
      bookingId,
      projectId,
      status,
    }: {
      bookingId: string;
      projectId?: string | null;
      status: string;
    }) => {
      const normalized = normalizeStatus(status);
      await mutateProjectBookingCaches(
        { projectId, bookingId },
        (booking) => ({
          ...booking,
          status: normalized,
        }),
      );

      try {
        await patchBookingStatus(bookingId, normalized);
      } catch (error) {
        await revalidateBookingsForProject(projectId);
        throw error;
      }

      await revalidateBookingsForProject(projectId);
    },
    [mutateProjectBookingCaches, revalidateBookingsForProject],
  );

  const updateBooking = useCallback(
    async ({
      bookingId,
      projectId,
      payload,
    }: {
      bookingId: string;
      projectId?: string | null;
      payload: BookingUpdatePayload;
    }) => {
      await mutateProjectBookingCaches(
        { projectId, bookingId },
        (booking) => ({
          ...booking,
          booking_date: payload.booking_date,
          start_time: payload.start_time,
          end_time: payload.end_time,
          purpose: payload.purpose ?? booking.purpose,
          notes: payload.notes ?? booking.notes,
        }),
      );

      try {
        await putBooking(bookingId, payload);
      } catch (error) {
        await revalidateBookingsForProject(projectId);
        throw error;
      }

      await revalidateBookingsForProject(projectId);
    },
    [mutateProjectBookingCaches, revalidateBookingsForProject],
  );

  const deleteBooking = useCallback(
    async ({
      bookingId,
      projectId,
    }: {
      bookingId: string;
      projectId?: string | null;
    }) => {
      await mutateProjectBookingCaches({ projectId, bookingId }, () => null);

      try {
        await hardDeleteBooking(bookingId);
      } catch (error) {
        await revalidateBookingsForProject(projectId);
        throw error;
      }

      await revalidateBookingsForProject(projectId);
    },
    [mutateProjectBookingCaches, revalidateBookingsForProject],
  );

  const bulkRescheduleBookings = useCallback(
    async ({
      projectId,
      payload,
    }: {
      projectId?: string | null;
      payload: BulkRescheduleRequestPayload;
    }): Promise<BulkRescheduleApplyResponse> => {
      const response = await applyBulkReschedule(payload);
      await revalidateBookingsForProject(projectId ?? payload.project_id);
      return response;
    },
    [revalidateBookingsForProject],
  );

  return {
    createBookings,
    updateBookingStatus,
    updateBooking,
    deleteBooking,
    bulkRescheduleBookings,
    revalidateBookingsForProject,
  };
}
