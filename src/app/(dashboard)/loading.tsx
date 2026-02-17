import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div
      className="flex-1 flex items-center justify-center min-h-[60vh]"
      role="status"
      aria-live="polite"
      aria-label="Loading dashboard"
    >
      <Loader2
        className="h-8 w-8 animate-spin text-slate-400"
        aria-hidden="true"
      />
      <span className="sr-only">Loading dashboard</span>
    </div>
  );
}
