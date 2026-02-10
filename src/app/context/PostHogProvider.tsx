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
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
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
