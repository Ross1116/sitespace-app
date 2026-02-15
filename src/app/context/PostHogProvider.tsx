"use client";

import posthog from "posthog-js";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

const SENSITIVE_QUERY_KEYS = new Set([
  "token",
  "access_token",
  "refresh_token",
]);

function sanitizeUrlValue(value: unknown): unknown {
  if (typeof value !== "string") return value;

  try {
    const parsedUrl = new URL(value);
    const keysToDelete = Array.from(parsedUrl.searchParams.keys()).filter(
      (key) => SENSITIVE_QUERY_KEYS.has(key.toLowerCase()),
    );

    keysToDelete.forEach((key) => parsedUrl.searchParams.delete(key));

    return parsedUrl.toString();
  } catch {
    return value
      .replace(
        /([?&])(token|access_token|refresh_token)=[^&#]*/gi,
        (_, separator: string) => (separator === "?" ? "?" : ""),
      )
      .replace(/[?&]$/, "");
  }
}

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: "/ingest",
      ui_host: "https://eu.posthog.com",
      capture_pageview: true,
      capture_pageleave: true,
      disable_session_recording: false,
      before_send: (event) => {
        const properties = event?.properties;
        if (!properties || typeof properties !== "object") return event;

        const sanitizedProperties = {
          ...properties,
          $current_url: sanitizeUrlValue(properties.$current_url),
          $pathname: sanitizeUrlValue(properties.$pathname),
          $referrer: sanitizeUrlValue(properties.$referrer),
        };

        return {
          ...event,
          properties: sanitizedProperties,
        };
      },
      loaded: (ph) => {
        Sentry.getCurrentScope().setTag(
          "posthog_session_id",
          ph.get_session_id(),
        );
      },
    });
  }, []);

  return <>{children}</>;
}
