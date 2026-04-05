type QueryValue = string | number | null | undefined;

type BuildQueryInput = Record<string, QueryValue>;

const buildQuery = (params: BuildQueryInput): string => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
};

export const lookaheadKeys = {
  snapshot: (projectId: string): string => `/lookahead/${projectId}`,
  alerts: (projectId: string): string => `/lookahead/${projectId}/alerts`,
  history: (projectId: string): string => `/lookahead/${projectId}/history`,
  capacityDashboard: (
    projectId: string,
    params?: { startWeek?: string | null; weeks?: number | null },
  ): string =>
    `/lookahead/${projectId}/capacity-dashboard${buildQuery({
      start_week: params?.startWeek,
      weeks: params?.weeks,
    })}`,
  activities: (
    projectId: string,
    params?: { weekStart?: string | null; assetType?: string | null },
  ): string =>
    `/lookahead/${projectId}/activities${buildQuery({
      week_start: params?.weekStart,
      asset_type: params?.assetType,
    })}`,
  versions: (projectId: string): string => `/programmes/${projectId}`,
  uploadStatus: (uploadId: string): string => `/programmes/${uploadId}/status`,
  mappings: (uploadId: string): string => `/programmes/${uploadId}/mappings`,
  unclassifiedMappings: (uploadId: string): string =>
    `/programmes/${uploadId}/mappings/unclassified`,
  activityBookingContext: (
    activityId: string,
    params?: { selectedWeekStart?: string | null },
  ): string =>
    `/programmes/activities/${activityId}/booking-context${buildQuery({
      selected_week_start: params?.selectedWeekStart,
    })}`,
  planningCompleteness: (projectId: string): string =>
    `/projects/${projectId}/planning-completeness`,
  deleteVersion: (uploadId: string): string => `/programmes/${uploadId}`,
};
