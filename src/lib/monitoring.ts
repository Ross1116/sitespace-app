import * as Sentry from "@sentry/nextjs";

export function reportError(error: unknown, context: string) {
  Sentry.withScope((scope) => {
    scope.setTag("source", "frontend");
    scope.setContext("error_context", { context });
    if (error instanceof Error) {
      Sentry.captureException(error);
      return;
    }
    Sentry.captureException(new Error(context));
  });
}

export function reportMessage(
  message: string,
  level: "info" | "warning" | "error" = "warning",
) {
  Sentry.captureMessage(message, level);
}
