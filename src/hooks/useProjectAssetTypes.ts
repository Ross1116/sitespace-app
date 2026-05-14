"use client";

import useSWR from "swr";
import api from "@/lib/api";
import { SWR_CONFIG } from "@/lib/swr";
import { ASSET_TYPE_OPTIONS } from "@/lib/formOptions";
import type { AssetTypeOption } from "@/types";

const fallbackAssetTypes: AssetTypeOption[] = ASSET_TYPE_OPTIONS.map((code) => ({
  code,
  display_name: code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  scope: "global",
  max_hours_per_day: code === "none" ? 0 : 10,
}));

export type ProjectAssetTypeCreatePayload = {
  display_name: string;
  description: string;
  max_hours_per_day: number;
};

async function fetchProjectAssetTypes(projectId: string): Promise<AssetTypeOption[]> {
  const response = await api.get<AssetTypeOption[]>(`/projects/${projectId}/asset-types`);
  return Array.isArray(response.data) ? response.data : fallbackAssetTypes;
}

export function useProjectAssetTypes(projectId?: string | null) {
  const key = projectId ? `/projects/${projectId}/asset-types` : null;
  const { data, error, isLoading, mutate } = useSWR<AssetTypeOption[]>(
    key,
    projectId ? () => fetchProjectAssetTypes(projectId) : null,
    SWR_CONFIG,
  );

  async function createProjectAssetType(payload: ProjectAssetTypeCreatePayload) {
    if (!projectId) throw new Error("Select a project before adding a local asset type.");
    const response = await api.post<AssetTypeOption>(
      `/projects/${projectId}/asset-types`,
      payload,
    );
    await mutate();
    return response.data;
  }

  return {
    assetTypes: data ?? fallbackAssetTypes,
    isLoading,
    error,
    mutate,
    createProjectAssetType,
  };
}
