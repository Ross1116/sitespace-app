// sentry.client.config.ts

import * as Sentry from "@sentry/nextjs";

// Patterns from browser extensions / password managers that are not our errors.
const IGNORED_VALUES = [
  // Password managers (Bitwarden, 1Password, LastPass, etc.) lose track of a
  // form element they injected into and throw an unhandled rejection with this
  // message. Completely outside our code.
  /Object Not Found Matching Id:\d+, MethodName:\w+, ParamCount:\d+/,
];

Sentry.init({
  dsn: "https://62536bc651057c866d45849a7977b3e0@o4510859309875200.ingest.de.sentry.io/4510859426529360",

  // Sample 30% of transactions in production (100% is expensive)
  tracesSampleRate: 0.3,
  // Capture 100% of errors
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
  sendDefaultPii: true,

  beforeSend(event) {
    const value = event.exception?.values?.[0]?.value ?? "";
    if (IGNORED_VALUES.some((pattern) => pattern.test(value))) {
      return null;
    }
    return event;
  },
});
