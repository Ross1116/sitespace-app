import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Loading authentication page"
    >
      <Loader2
        className="h-8 w-8 animate-spin text-slate-400"
        aria-hidden="true"
      />
      <span className="sr-only">Loading authentication page</span>
    </div>
  );
}
