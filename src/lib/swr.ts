import api from "./api";
import type { SWRConfiguration } from "swr";

export const swrFetcher = (url: string) => api.get(url).then((r) => r.data);

export const SWR_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 5 * 60 * 1000, // 5 min
  dedupingInterval: 60_000, // 60s dedup
};
