"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { swrFetcher, SWR_CONFIG } from "@/lib/swr";
import {
  normalizeSubcontractorList,
  type NormalizedSubcontractor,
} from "@/lib/subcontractorNormalization";

type Params = {
  userRole?: string;
  projectId: string | null;
  enabled?: boolean;
  limit?: number;
  scope?: "roleBased" | "managerScoped";
};

type Result = {
  subcontractors: NormalizedSubcontractor[];
  data: unknown;
  error: unknown;
  isLoading: boolean;
  mutate: () => Promise<unknown>;
};

export function useProjectSubcontractors({
  userRole,
  projectId,
  enabled = true,
  limit = 1000,
  scope = "roleBased",
}: Params): Result {
  const swrKey = useMemo(() => {
    if (!enabled || !userRole) return null;
    if (scope === "managerScoped") {
      if (!projectId) return null;
      if (userRole !== "admin" && userRole !== "manager") return null;
      const params = new URLSearchParams({
        skip: "0",
        limit: String(limit),
        is_active: "true",
        project_id: projectId,
      });
      return `/subcontractors/my-subcontractors?${params.toString()}`;
    }

    if (userRole === "subcontractor") return null;
    const endpoint =
      userRole === "admin"
        ? "/subcontractors/"
        : "/subcontractors/my-subcontractors";
    const params = new URLSearchParams({
      skip: "0",
      limit: String(limit),
      is_active: "true",
    });
    if (projectId) {
      params.set("project_id", projectId);
    }
    return `${endpoint}?${params.toString()}`;
  }, [enabled, userRole, projectId, limit, scope]);

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    swrFetcher,
    SWR_CONFIG,
  );

  const subcontractors = useMemo(
    () => normalizeSubcontractorList(data),
    [data],
  );

  return {
    subcontractors,
    data,
    error,
    isLoading,
    mutate: () => mutate(),
  };
}
