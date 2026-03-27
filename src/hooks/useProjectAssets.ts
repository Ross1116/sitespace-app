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

  for (const key of ["data", "assets", "results", "items", "records"]) {
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
          const fallbackFields: string[] = [];

          const total =
            typeof payload.total === "number"
              ? payload.total
              : (fallbackFields.push("total"), assets.length);
          const skip =
            typeof payload.skip === "number"
              ? payload.skip
              : (fallbackFields.push("skip"), 0);
          const limit =
            typeof payload.limit === "number"
              ? payload.limit
              : (fallbackFields.push("limit"), 100);
          const has_more =
            typeof payload.has_more === "boolean"
              ? payload.has_more
              : (fallbackFields.push("has_more"), false);

          if (
            fallbackFields.length > 0 &&
            process.env.NODE_ENV !== "production"
          ) {
            console.warn("useProjectAssets applied pagination fallbacks", {
              swrKey,
              fallbackFields,
              payload,
            });
          }

          return {
            assets,
            total,
            skip,
            limit,
            has_more,
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
