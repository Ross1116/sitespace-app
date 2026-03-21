import api from "./api";
import type { SWRConfiguration } from "swr";

export const swrFetcher = (url: string) => api.get(url).then((r) => r.data);

/**
 * Shared SWR config for all dashboard data hooks.
 *
 * Trade-off — API load vs. data staleness:
 *   revalidateOnFocus: false  — prevents a burst of 6+ concurrent requests every time the user
 *                               switches tabs (was the root cause of the N+1 Sentry issue #99236617).
 *                               Tab-focus updates are sacrificed; mutation invalidation covers freshness.
 *   refreshInterval: 0        — no background polling by default. Background polling on every hook
 *                               caused a burst of N concurrent /api/proxy calls every 5 minutes,
 *                               which Sentry flagged as a recurring N+1 (issue #99236617).
 *                               Hooks that genuinely need live updates (e.g. useCalendarBookingsQuery)
 *                               override this individually.
 *   dedupingInterval: 60s    — collapses duplicate requests within a 60-second window, reducing
 *                               redundant fetches from rapid re-mounts or strict-mode double invocations.
 *
 * Hooks affected by this config:
 *   useBookingsListQuery, useUpcomingBookingsQuery, useResolvedProjectSelection,
 *   useProjectSubcontractors, useProjectAssets, SitePlansSection
 *
 * Overrides:
 *   useCalendarBookingsQuery overrides refreshInterval to 30 s for the live multi-calendar view.
 *
 * Mutation invalidation:
 *   useBookingMutations calls mutate() after every create/update/delete, so optimistic updates
 *   and immediate cache invalidation compensate for the lack of background polling.
 *   Manual page refresh is the fallback for data changed by other users.
 *
 * See: src/hooks/bookings/useBookingsData.ts, src/hooks/useResolvedProjectSelection.ts
 */
export const SWR_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 0,
  dedupingInterval: 60_000, // 60s dedup
};
