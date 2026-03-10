"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { SWR_CONFIG } from "@/lib/swr";
import type {
  LookaheadSnapshotResponse,
  LookaheadAlertsResponse,
  ProgrammeVersion,
} from "@/types";
import {
  fetchLookaheadSnapshot,
  fetchLookaheadAlerts,
  fetchProgrammeVersions,
} from "./api";
import { lookaheadKeys } from "./keys";

type LookaheadParams = {
  projectId: string | null;
  enabled?: boolean;
};

export function useLookaheadSnapshot({ projectId, enabled = true }: LookaheadParams): {
  snapshot: LookaheadSnapshotResponse | undefined;
  isLoading: boolean;
  error: unknown;
  mutate: () => Promise<LookaheadSnapshotResponse | undefined>;
} {
  const key = useMemo(
    () => (enabled && projectId ? lookaheadKeys.snapshot(projectId) : null),
    [enabled, projectId],
  );

  const { data, isLoading, error, mutate } = useSWR<LookaheadSnapshotResponse>(
    key,
    key ? () => fetchLookaheadSnapshot(projectId as string) : null,
    SWR_CONFIG,
  );

  return { snapshot: data, isLoading, error, mutate: () => mutate() };
}

export function useLookaheadAlerts({ projectId, enabled = true }: LookaheadParams): {
  alerts: LookaheadAlertsResponse | undefined;
  isLoading: boolean;
  error: unknown;
  mutate: () => Promise<LookaheadAlertsResponse | undefined>;
} {
  const key = useMemo(
    () => (enabled && projectId ? lookaheadKeys.alerts(projectId) : null),
    [enabled, projectId],
  );

  const { data, isLoading, error, mutate } = useSWR<LookaheadAlertsResponse>(
    key,
    key ? () => fetchLookaheadAlerts(projectId as string) : null,
    SWR_CONFIG,
  );

  return { alerts: data, isLoading, error, mutate: () => mutate() };
}

export function useProgrammeVersions({ projectId, enabled = true }: LookaheadParams): {
  versions: ProgrammeVersion[];
  isLoading: boolean;
  error: unknown;
  mutate: () => Promise<ProgrammeVersion[] | undefined>;
} {
  const key = useMemo(
    () => (enabled && projectId ? lookaheadKeys.versions(projectId) : null),
    [enabled, projectId],
  );

  const { data, isLoading, error, mutate } = useSWR<ProgrammeVersion[]>(
    key,
    key ? () => fetchProgrammeVersions(projectId as string) : null,
    SWR_CONFIG,
  );

  return {
    versions: data ?? [],
    isLoading,
    error,
    mutate: () => mutate(),
  };
}
