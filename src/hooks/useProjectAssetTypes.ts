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

type RawAssetTypeOption = Omit<AssetTypeOption, "max_hours_per_day"> & {
  max_hours_per_day: number | string | null;
};

function normalizeAssetTypeOption(option: RawAssetTypeOption): AssetTypeOption {
  const maxHours =
    option.max_hours_per_day == null
      ? null
      : Number(option.max_hours_per_day);

  return {
    ...option,
    max_hours_per_day: Number.isFinite(maxHours) ? maxHours : null,
  };
}

async function fetchProjectAssetTypes(projectId: string): Promise<AssetTypeOption[]> {
  const response = await api.get<RawAssetTypeOption[]>(`/projects/${projectId}/asset-types`);
  if (!Array.isArray(response.data)) {
    throw new Error(
      `Expected project asset types array for project ${projectId}, got status ${response.status}: ${JSON.stringify(response.data)}`,
    );
  }
  return response.data.map(normalizeAssetTypeOption);
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
    const response = await api.post<RawAssetTypeOption>(
      `/projects/${projectId}/asset-types`,
      payload,
    );
    await mutate();
    return normalizeAssetTypeOption(response.data);
  }

  return {
    assetTypes: data ?? fallbackAssetTypes,
    isLoading,
    error,
    mutate,
    createProjectAssetType,
  };
}
