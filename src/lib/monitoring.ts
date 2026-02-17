import * as Sentry from "@sentry/nextjs";

export function reportError(
  error: unknown,
  context: string,
  source?: "frontend" | "server",
) {
  Sentry.withScope((scope) => {
    const detectedSource =
      source || (typeof window !== "undefined" ? "frontend" : "server");
    scope.setTag("source", detectedSource);
    scope.setContext("error_context", { context });

    if (error instanceof Error) {
      Sentry.captureException(error);
      return;
    }

    Sentry.withScope((nonErrorScope) => {
      nonErrorScope.setTag("source", detectedSource);
      nonErrorScope.setContext("error_context", { context });
      nonErrorScope.setExtra("nonErrorValue", error ?? null);
      nonErrorScope.setExtra("nonErrorType", typeof error);
      Sentry.captureException(new Error(String(error ?? context)));
    });
  });
}

export function reportMessage(
  message: string,
  level: "info" | "warning" | "error" = "warning",
) {
  Sentry.captureMessage(message, level);
}
