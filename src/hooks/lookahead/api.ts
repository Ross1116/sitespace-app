import api from "@/lib/api";
import { normalizeBookingList } from "@/lib/apiNormalization";
import type {
  ActivityMappingResponse,
  LookaheadActivitiesResponse,
  LookaheadAlertsResponse,
  LookaheadSnapshotHistoryEntry,
  LookaheadSnapshotResponse,
  ProgrammeActivityBookingContextResponse,
  ProgrammeActivityCandidateAsset,
  ProgrammeActivitySuggestedBookingDate,
  ProgrammeVersion,
  PlanningCompletenessResponse,
  PlanningCompletenessTask,
  UploadAcceptedResponse,
  UploadStatusResponse,
} from "@/types";
import { lookaheadKeys } from "./keys";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const asOptionalString = (value: unknown): string | null => {
  const normalized = asString(value).trim();
  return normalized.length > 0 ? normalized : null;
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const toRecords = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => isRecord(item))
    : [];

const extractList = (payload: unknown, preferredKeys: string[]): Record<string, unknown>[] => {
  if (Array.isArray(payload)) return toRecords(payload);
  if (!isRecord(payload)) return [];

  for (const key of preferredKeys) {
    if (Array.isArray(payload[key])) {
      return toRecords(payload[key]);
    }
  }

  const fallback = Object.values(payload).find((value) => Array.isArray(value));
  return toRecords(fallback);
};

const normalizeMappings = (payload: unknown): ActivityMappingResponse[] =>
  extractList(payload, ["mappings", "items", "data", "results"]).map((record) => ({
    id: asString(record.id) || asString(record.mapping_id),
    item_id: asOptionalString(record.item_id),
    activity_name:
      asOptionalString(record.activity_name) ??
      asOptionalString(record.item_name) ??
      asOptionalString(record.source_value),
    source_value:
      asOptionalString(record.source_value) ??
      asOptionalString(record.item_value) ??
      asOptionalString(record.activity_name),
    asset_type:
      asOptionalString(record.asset_type) ??
      asOptionalString(record.classification_name) ??
      asOptionalString(record.current_classification),
    classification_name:
      asOptionalString(record.classification_name) ??
      asOptionalString(record.asset_type),
    current_classification: asOptionalString(record.current_classification),
    suggested_classification: asOptionalString(record.suggested_classification),
    source: asOptionalString(record.source),
    confidence: asNumber(record.confidence),
    manual_correction: asBoolean(record.manual_correction),
    corrected_by:
      asOptionalString(record.corrected_by) ??
      asOptionalString(record.corrected_by_name),
    corrected_at: asOptionalString(record.corrected_at),
    level_name: asOptionalString(record.level_name),
    zone_name: asOptionalString(record.zone_name),
  }));

const normalizeCandidateAssets = (value: unknown): ProgrammeActivityCandidateAsset[] =>
  extractList(value, ["candidate_assets", "assets", "items", "data"]).map((record) => ({
    id: asString(record.id),
    asset_code: asOptionalString(record.asset_code) ?? undefined,
    name: asString(record.name) || asString(record.asset_name) || "Unknown asset",
    status: asOptionalString(record.status),
    canonical_type:
      asOptionalString(record.canonical_type) ?? asOptionalString(record.type),
    planning_ready: asBoolean(record.planning_ready),
    availability_status: asOptionalString(record.availability_status),
    availability_reason: asOptionalString(record.availability_reason),
    booked_hours_in_week: asNumber(record.booked_hours_in_week),
  }));

const normalizeSuggestedBookingDates = (
  value: unknown,
  defaults?: {
    startTime?: string | null;
    endTime?: string | null;
  },
): ProgrammeActivitySuggestedBookingDate[] => {
  if (!Array.isArray(value)) return [];

  return value.reduce<ProgrammeActivitySuggestedBookingDate[]>((acc, entry) => {
    if (typeof entry === "string") {
      acc.push({
        date: entry,
        start_time: defaults?.startTime ?? null,
        end_time: defaults?.endTime ?? null,
        hours: null,
        demand_hours: null,
        booked_hours: null,
        gap_hours: null,
      });
      return acc;
    }

    if (!isRecord(entry)) return acc;

    const date =
      asString(entry.date) ||
      asString(entry.value) ||
      asString(entry.booking_date);
    if (!date) return acc;

    acc.push({
      date,
      start_time:
        asOptionalString(entry.start_time) ??
        asOptionalString(entry.default_start_time) ??
        defaults?.startTime ??
        null,
      end_time:
        asOptionalString(entry.end_time) ??
        asOptionalString(entry.default_end_time) ??
        defaults?.endTime ??
        null,
      hours:
        asNumber(entry.hours) ??
        asNumber(entry.daily_hours) ??
        asNumber(entry.booking_hours) ??
        asNumber(entry.planned_hours) ??
        asNumber(entry.suggested_hours) ??
        asNumber(entry.remaining_hours) ??
        null,
      demand_hours:
        asNumber(entry.demand_hours) ??
        asNumber(entry.overlap_hours) ??
        null,
      booked_hours: asNumber(entry.booked_hours) ?? null,
      gap_hours:
        asNumber(entry.gap_hours) ??
        asNumber(entry.remaining_hours) ??
        asNumber(entry.unbooked_hours) ??
        asNumber(entry.uncovered_hours) ??
        null,
    });
    return acc;
  }, []);
};

const normalizePlanningTasks = (value: unknown): PlanningCompletenessTask[] =>
  extractList(value, ["actionable_tasks", "tasks", "items", "data"]).map((record, index) => ({
    id: asString(record.id) || `task-${index}`,
    title:
      asString(record.title) ||
      asString(record.label) ||
      asString(record.description) ||
      "Planning task",
    description:
      asOptionalString(record.description) ?? asOptionalString(record.detail),
    severity: asOptionalString(record.severity),
    status: asOptionalString(record.status),
    link: asOptionalString(record.link),
    entity_type: asOptionalString(record.entity_type),
    entity_id: asOptionalString(record.entity_id),
    count: asNumber(record.count),
  }));

export async function fetchLookaheadSnapshot(
  projectId: string,
): Promise<LookaheadSnapshotResponse> {
  const response = await api.get<LookaheadSnapshotResponse>(
    lookaheadKeys.snapshot(projectId),
  );
  return response.data;
}

export async function fetchLookaheadAlerts(
  projectId: string,
): Promise<LookaheadAlertsResponse> {
  const response = await api.get<LookaheadAlertsResponse>(
    lookaheadKeys.alerts(projectId),
  );
  return response.data;
}

export async function fetchLookaheadHistory(
  projectId: string,
): Promise<LookaheadSnapshotHistoryEntry[]> {
  const response = await api.get<unknown>(lookaheadKeys.history(projectId));
  return extractList(response.data, ["history", "snapshots", "items", "data"]).map(
    (entry) => ({
      snapshot_id: asOptionalString(entry.snapshot_id) ?? undefined,
      snapshot_date: asOptionalString(entry.snapshot_date),
      timezone: asOptionalString(entry.timezone),
      rows: Array.isArray(entry.rows) ? (entry.rows as LookaheadSnapshotResponse["rows"]) : [],
    }),
  );
}

export async function fetchLookaheadActivities(params: {
  projectId: string;
  weekStart?: string | null;
  assetType?: string | null;
}): Promise<LookaheadActivitiesResponse> {
  const response = await api.get<unknown>(
    lookaheadKeys.activities(params.projectId, {
      weekStart: params.weekStart,
      assetType: params.assetType,
    }),
  );
  const payload = isRecord(response.data) ? response.data : {};
  const activities = extractList(response.data, [
    "activities",
    "items",
    "data",
    "results",
  ]).map((record) => ({
    activity_id: asString(record.activity_id) || asString(record.id),
    programme_upload_id: asOptionalString(record.programme_upload_id),
    activity_name:
      asString(record.activity_name) || asString(record.name) || "Untitled activity",
    start_date: asOptionalString(record.start_date),
    end_date: asOptionalString(record.end_date),
    overlap_hours: asNumber(record.overlap_hours) ?? 0,
    level_name: asOptionalString(record.level_name),
    zone_name: asOptionalString(record.zone_name),
    row_confidence: asNumber(record.row_confidence),
    sort_order: asNumber(record.sort_order),
    booking_group_id: asOptionalString(record.booking_group_id),
    linked_booking_count: asNumber(record.linked_booking_count),
  }));

  return {
    project_id: asOptionalString(payload.project_id) ?? params.projectId,
    week_start: asOptionalString(payload.week_start) ?? params.weekStart ?? null,
    asset_type: asOptionalString(payload.asset_type) ?? params.assetType ?? null,
    activities,
  };
}

export async function fetchProgrammeVersions(
  projectId: string,
): Promise<ProgrammeVersion[]> {
  const response = await api.get<ProgrammeVersion[] | { versions?: ProgrammeVersion[] }>(
    lookaheadKeys.versions(projectId),
  );

  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.versions)) return response.data.versions;
  return [];
}

export async function fetchUploadStatus(
  uploadId: string,
): Promise<UploadStatusResponse> {
  const response = await api.get<UploadStatusResponse>(
    lookaheadKeys.uploadStatus(uploadId),
  );
  return response.data;
}

export async function fetchProgrammeMappings(
  uploadId: string,
): Promise<ActivityMappingResponse[]> {
  const response = await api.get<unknown>(lookaheadKeys.mappings(uploadId));
  return normalizeMappings(response.data).filter((entry) => Boolean(entry.id));
}

export async function fetchUnclassifiedMappings(
  uploadId: string,
): Promise<ActivityMappingResponse[]> {
  const response = await api.get<unknown>(
    lookaheadKeys.unclassifiedMappings(uploadId),
  );
  return normalizeMappings(response.data).filter((entry) => Boolean(entry.id));
}

export async function updateProgrammeMapping(
  mappingId: string,
  payload: { asset_type: string },
): Promise<ActivityMappingResponse> {
  const response = await api.patch<unknown>(
    `/programmes/mappings/${mappingId}`,
    payload,
  );
  return normalizeMappings(response.data)[0] ?? {
    id: mappingId,
    asset_type: payload.asset_type,
  };
}

export async function promoteItemClassification(
  itemId: string,
  payload: { asset_type: string },
): Promise<void> {
  await api.post(`/items/${itemId}/classification`, payload);
}

export async function fetchProgrammeActivityBookingContext(params: {
  activityId: string;
  selectedWeekStart?: string | null;
}): Promise<ProgrammeActivityBookingContextResponse> {
  const response = await api.get<unknown>(
    lookaheadKeys.activityBookingContext(params.activityId, {
      selectedWeekStart: params.selectedWeekStart,
    }),
  );
  const payload = isRecord(response.data) ? response.data : {};
  const defaultStartTime = asOptionalString(payload.default_start_time);
  const defaultEndTime = asOptionalString(payload.default_end_time);

  return {
    activity_id: asString(payload.activity_id) || params.activityId,
    activity_name:
      asString(payload.activity_name) || asString(payload.name) || "Activity",
    programme_upload_id: asOptionalString(payload.programme_upload_id),
    expected_asset_type: asOptionalString(payload.expected_asset_type),
    selected_week_start:
      asOptionalString(payload.selected_week_start) ??
      params.selectedWeekStart ??
      null,
    default_week_start: asOptionalString(payload.default_week_start),
    default_booking_date: asOptionalString(payload.default_booking_date),
    default_start_time: defaultStartTime,
    default_end_time: defaultEndTime,
    suggested_bulk_dates: normalizeSuggestedBookingDates(payload.suggested_bulk_dates, {
      startTime: defaultStartTime,
      endTime: defaultEndTime,
    }),
    linked_booking_group: isRecord(payload.linked_booking_group)
      ? {
          booking_group_id: asOptionalString(payload.linked_booking_group.booking_group_id),
          booking_count: asNumber(payload.linked_booking_group.booking_count) ?? 0,
          total_booked_hours:
            asNumber(payload.linked_booking_group.total_booked_hours) ?? 0,
          last_booking_at: asOptionalString(payload.linked_booking_group.last_booking_at),
        }
      : null,
    linked_bookings: normalizeBookingList(payload.linked_bookings),
    candidate_assets: normalizeCandidateAssets(payload.candidate_assets),
    level_name: asOptionalString(payload.level_name),
    zone_name: asOptionalString(payload.zone_name),
  };
}

export async function fetchPlanningCompleteness(
  projectId: string,
): Promise<PlanningCompletenessResponse> {
  const response = await api.get<unknown>(
    lookaheadKeys.planningCompleteness(projectId),
  );
  const payload = isRecord(response.data) ? response.data : {};
  const countsRecord =
    isRecord(payload.counts) && payload.counts
      ? payload.counts
      : (payload as Record<string, unknown>);
  const counts: PlanningCompletenessResponse["counts"] = {};

  for (const [key, value] of Object.entries(countsRecord)) {
    const numericValue = asNumber(value);
    if (numericValue !== null) {
      counts[key] = numericValue;
    }
  }

  return {
    score: asNumber(payload.score) ?? 0,
    status: asString(payload.status) || "unknown",
    window_start: asOptionalString(payload.window_start),
    window_end: asOptionalString(payload.window_end),
    counts,
    actionable_tasks: normalizePlanningTasks(payload.actionable_tasks ?? payload.tasks),
  };
}

export async function deleteProgrammeVersion(uploadId: string): Promise<void> {
  await api.delete(lookaheadKeys.deleteVersion(uploadId));
}

export async function uploadProgramme(
  projectId: string,
  file: File,
): Promise<UploadAcceptedResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `/api/proxy?path=/programmes/upload&project_id=${encodeURIComponent(projectId)}`,
    {
      method: "POST",
      body: formData,
      credentials: "include",
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail =
      typeof payload?.message === "string"
        ? payload.message
        : typeof payload?.detail === "string"
          ? payload.detail
          : "Upload failed. Please try again.";
    throw new Error(detail);
  }

  return response.json() as Promise<UploadAcceptedResponse>;
}
