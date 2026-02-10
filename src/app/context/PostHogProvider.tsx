"use client";

import posthog from "posthog-js";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

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
      loaded: (ph) => {
        Sentry.getCurrentScope().setTag(
          "posthog_session_id",
          ph.get_session_id()
        );
      },
    });
  }, []);

  return <>{children}</>;
}
