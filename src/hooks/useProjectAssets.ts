"use client";

import { useMemo } from "react";
import useSWR from "swr";
import api from "@/lib/api";
import type { ApiAsset, AssetListResponse } from "@/types";
import { normalizeAssetList } from "@/lib/apiNormalization";
import { SWR_CONFIG } from "@/lib/swr";

type Result = {
  assets: ApiAsset[];
  data: AssetListResponse | undefined;
  error: unknown;
  isLoading: boolean;
  mutate: () => Promise<AssetListResponse | undefined>;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function hasAssetList(value: unknown): value is UnknownRecord {
  if (!isRecord(value)) return false;

  return ["assets", "data", "records", "items", "results"].some((key) =>
    Array.isArray(value[key]),
  );
}

function getAssetEnvelope(payload: unknown): UnknownRecord {
  if (!isRecord(payload)) return {};
  if (hasAssetList(payload)) return payload;

  for (const key of ["data", "assets", "results", "items"]) {
    const nestedValue = payload[key];
    if (hasAssetList(nestedValue)) {
      return nestedValue;
    }
  }

  return payload;
}

export function useProjectAssets(projectId: string | null): Result {
  const swrKey = projectId
    ? `/assets/?project_id=${encodeURIComponent(projectId)}&skip=0&limit=100`
    : null;

  const { data, error, isLoading, mutate } = useSWR<AssetListResponse>(
    swrKey,
    swrKey
      ? async () => {
          const response = await api.get<unknown>(swrKey);
          const payload = getAssetEnvelope(response.data);
          const assets = normalizeAssetList(payload);

          return {
            assets,
            total:
              typeof payload.total === "number" ? payload.total : assets.length,
            skip: typeof payload.skip === "number" ? payload.skip : 0,
            limit: typeof payload.limit === "number" ? payload.limit : 100,
            has_more:
              typeof payload.has_more === "boolean" ? payload.has_more : false,
          };
        }
      : null,
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
