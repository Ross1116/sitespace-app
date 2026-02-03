// lib/useSmartRefresh.ts
import { useEffect, useCallback, useRef } from "react";

interface SmartRefreshOptions {
  onRefresh: () => Promise<void>;
  intervalMs?: number;
  refreshOnFocus?: boolean;
  refreshOnReconnect?: boolean;
}

export function useSmartRefresh({
  onRefresh,
  intervalMs = 5 * 60 * 1000,
  refreshOnFocus = true,
  refreshOnReconnect = true,
}: SmartRefreshOptions) {
  const lastRefresh = useRef<number>(Date.now());
  const MIN_REFRESH_INTERVAL = 30 * 1000;

  const refresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefresh.current < MIN_REFRESH_INTERVAL) return;

    lastRefresh.current = now;
    await onRefresh();
  }, [onRefresh]);

  useEffect(() => {
    const interval = setInterval(refresh, intervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    const handleOnline = () => {
      refresh();
    };

    if (refreshOnFocus) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    if (refreshOnReconnect) {
      window.addEventListener("online", handleOnline);
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [refresh, intervalMs, refreshOnFocus, refreshOnReconnect]);

  return { refresh };
}
