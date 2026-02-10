"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
