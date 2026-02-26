"use client";

import { useMemo } from "react";
import useSWR from "swr";
import type { ApiAsset } from "@/types";
import { swrFetcher, SWR_CONFIG } from "@/lib/swr";

type AssetListResponse = {
  assets?: ApiAsset[];
  total?: number;
  skip?: number;
  limit?: number;
  has_more?: boolean;
};

type Result = {
  assets: ApiAsset[];
  data: AssetListResponse | undefined;
  error: unknown;
  isLoading: boolean;
  mutate: () => Promise<AssetListResponse | undefined>;
};

export function useProjectAssets(projectId: string | null): Result {
  const swrKey = projectId
    ? `/assets/?project_id=${projectId}&skip=0&limit=100`
    : null;

  const { data, error, isLoading, mutate } = useSWR<AssetListResponse>(
    swrKey,
    swrFetcher,
    SWR_CONFIG,
  );

  const assets = useMemo<ApiAsset[]>(() => {
    const list = data?.assets;
    return Array.isArray(list) ? list : [];
  }, [data?.assets]);

  return {
    assets,
    data,
    error,
    isLoading,
    mutate: () => mutate(),
  };
}
