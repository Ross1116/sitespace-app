import api from "./api";
import type { SWRConfiguration } from "swr";

export const swrFetcher = (url: string) => api.get(url).then((r) => r.data);

export const SWR_CONFIG: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 5 * 60 * 1000, // 5 min
  dedupingInterval: 30_000, // 30s dedup
};
