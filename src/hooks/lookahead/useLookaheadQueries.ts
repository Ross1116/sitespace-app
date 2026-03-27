"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { SWR_CONFIG } from "@/lib/swr";
import type {
  ActivityMappingResponse,
  LookaheadActivitiesResponse,
  LookaheadAlertsResponse,
  LookaheadSnapshotHistoryEntry,
  LookaheadSnapshotResponse,
  PlanningCompletenessResponse,
  ProgrammeActivityBookingContextResponse,
  ProgrammeVersion,
  UploadStatusResponse,
} from "@/types";
import {
  fetchLookaheadActivities,
  fetchLookaheadAlerts,
  fetchLookaheadHistory,
  fetchLookaheadSnapshot,
  fetchPlanningCompleteness,
  fetchProgrammeActivityBookingContext,
  fetchProgrammeMappings,
  fetchProgrammeVersions,
  fetchUnclassifiedMappings,
  fetchUploadStatus,
} from "./api";
import { lookaheadKeys } from "./keys";

type BaseParams = {
  enabled?: boolean;
};

type ProjectParams = BaseParams & {
  projectId: string | null;
};

type UploadParams = BaseParams & {
  uploadId: string | null;
};

type ActivityParams = BaseParams & {
  activityId: string | null;
  selectedWeekStart?: string | null;
};

type LookaheadActivityParams = ProjectParams & {
  weekStart?: string | null;
  assetType?: string | null;
};

type SwrResult<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: unknown;
  mutate: () => Promise<T | undefined>;
  key: string | null;
};

function useTypedSWR<T>(
  key: string | null,
  fetcher: (() => Promise<T>) | null,
): SwrResult<T> {
  const { data, isLoading, error, mutate } = useSWR<T>(
    key,
    fetcher,
    SWR_CONFIG,
  );

  return {
    data,
    isLoading,
    error,
    mutate: () => mutate(),
    key,
  };
}

export function useLookaheadSnapshot({
  projectId,
  enabled = true,
}: ProjectParams) {
  const key = useMemo(
    () => (enabled && projectId ? lookaheadKeys.snapshot(projectId) : null),
    [enabled, projectId],
  );
  const result = useTypedSWR<LookaheadSnapshotResponse>(
    key,
    key ? () => fetchLookaheadSnapshot(projectId as string) : null,
  );

  return { snapshot: result.data, ...result };
}

export function useLookaheadAlerts({
  projectId,
  enabled = true,
}: ProjectParams) {
  const key = useMemo(
    () => (enabled && projectId ? lookaheadKeys.alerts(projectId) : null),
    [enabled, projectId],
  );
  const result = useTypedSWR<LookaheadAlertsResponse>(
    key,
    key ? () => fetchLookaheadAlerts(projectId as string) : null,
  );

  return { alerts: result.data, ...result };
}

export function useLookaheadHistory({
  projectId,
  enabled = true,
}: ProjectParams) {
  const key = useMemo(
    () => (enabled && projectId ? lookaheadKeys.history(projectId) : null),
    [enabled, projectId],
  );
  const result = useTypedSWR<LookaheadSnapshotHistoryEntry[]>(
    key,
    key ? () => fetchLookaheadHistory(projectId as string) : null,
  );

  return { history: result.data ?? [], ...result };
}

export function useLookaheadActivities({
  projectId,
  weekStart,
  assetType,
  enabled = true,
}: LookaheadActivityParams) {
  const key = useMemo(
    () =>
      enabled && projectId && weekStart && assetType
        ? lookaheadKeys.activities(projectId, { weekStart, assetType })
        : null,
    [enabled, projectId, weekStart, assetType],
  );
  const result = useTypedSWR<LookaheadActivitiesResponse>(
    key,
    key
      ? () =>
          fetchLookaheadActivities({
            projectId: projectId as string,
            weekStart,
            assetType,
          })
      : null,
  );

  return {
    activitiesResponse: result.data,
    activities: result.data?.activities ?? [],
    ...result,
  };
}

export function useProgrammeVersions({
  projectId,
  enabled = true,
}: ProjectParams) {
  const key = useMemo(
    () => (enabled && projectId ? lookaheadKeys.versions(projectId) : null),
    [enabled, projectId],
  );
  const result = useTypedSWR<ProgrammeVersion[]>(
    key,
    key ? () => fetchProgrammeVersions(projectId as string) : null,
  );

  return {
    versions: result.data ?? [],
    ...result,
  };
}

export function useProgrammeUploadStatus({
  uploadId,
  enabled = true,
}: UploadParams) {
  const key = useMemo(
    () => (enabled && uploadId ? lookaheadKeys.uploadStatus(uploadId) : null),
    [enabled, uploadId],
  );
  const result = useTypedSWR<UploadStatusResponse>(
    key,
    key ? () => fetchUploadStatus(uploadId as string) : null,
  );

  return { uploadStatus: result.data, ...result };
}

export function useProgrammeMappings({
  uploadId,
  enabled = true,
}: UploadParams) {
  const key = useMemo(
    () => (enabled && uploadId ? lookaheadKeys.mappings(uploadId) : null),
    [enabled, uploadId],
  );
  const result = useTypedSWR<ActivityMappingResponse[]>(
    key,
    key ? () => fetchProgrammeMappings(uploadId as string) : null,
  );

  return {
    mappings: result.data ?? [],
    ...result,
  };
}

export function useUnclassifiedMappings({
  uploadId,
  enabled = true,
}: UploadParams) {
  const key = useMemo(
    () =>
      enabled && uploadId ? lookaheadKeys.unclassifiedMappings(uploadId) : null,
    [enabled, uploadId],
  );
  const result = useTypedSWR<ActivityMappingResponse[]>(
    key,
    key ? () => fetchUnclassifiedMappings(uploadId as string) : null,
  );

  return {
    mappings: result.data ?? [],
    ...result,
  };
}

export function useProgrammeActivityBookingContext({
  activityId,
  selectedWeekStart,
  enabled = true,
}: ActivityParams) {
  const key = useMemo(
    () =>
      enabled && activityId
        ? lookaheadKeys.activityBookingContext(activityId, {
            selectedWeekStart,
          })
        : null,
    [enabled, activityId, selectedWeekStart],
  );
  const result = useTypedSWR<ProgrammeActivityBookingContextResponse>(
    key,
    key
      ? () =>
          fetchProgrammeActivityBookingContext({
            activityId: activityId as string,
            selectedWeekStart,
          })
      : null,
  );

  return { bookingContext: result.data, ...result };
}

export function usePlanningCompleteness({
  projectId,
  enabled = true,
}: ProjectParams) {
  const key = useMemo(
    () =>
      enabled && projectId ? lookaheadKeys.planningCompleteness(projectId) : null,
    [enabled, projectId],
  );
  const result = useTypedSWR<PlanningCompletenessResponse>(
    key,
    key ? () => fetchPlanningCompleteness(projectId as string) : null,
  );

  return { planningCompleteness: result.data, ...result };
}
