// sentry.client.config.ts

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

Sentry.init({
  dsn: "https://62536bc651057c866d45849a7977b3e0@o4510859309875200.ingest.de.sentry.io/4510859426529360",

  // Sample 30% of transactions in production (100% is expensive)
  tracesSampleRate: 0.3,
  // Capture 100% of errors
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
  sendDefaultPii: true,
});

// Initialize PostHog with Sentry integration
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
});

// Link PostHog session to Sentry errors
Sentry.getCurrentScope().setTag("posthog_session_id", posthog.get_session_id());
