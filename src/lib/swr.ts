import api from "./api";
import type { SWRConfiguration } from "swr";

export const swrFetcher = (url: string) => api.get(url).then((r) => r.data);

/**
 * Shared SWR config for all dashboard data hooks.
 *
 * Trade-off — API load vs. data staleness:
 *   revalidateOnFocus: false  — prevents a burst of 6+ concurrent requests every time the user
 *                               switches tabs (was the root cause of the N+1 Sentry issue #99236617).
 *                               Tab-focus updates are sacrificed; background polling covers freshness.
 *   refreshInterval: 5 min   — background revalidation every 5 minutes is sufficient for bookings,
 *                               assets, subcontractors, and project data on the dashboard.
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
 *   and immediate cache invalidation compensate for the reduced background revalidation frequency.
 *   Manual page refresh or the 5-minute background poll handles the remainder.
 *
 * See: src/hooks/bookings/useBookingsData.ts, src/hooks/useResolvedProjectSelection.ts
 */
export const SWR_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 5 * 60 * 1000, // 5 min
  dedupingInterval: 60_000, // 60s dedup
};
