import { AlertTriangle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyForecastReason = "no-project" | "no-data" | "load-error";

interface EmptyForecastStateProps {
  reason: EmptyForecastReason;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const STATE_COPY: Record<
  EmptyForecastReason,
  { title: string; message: string; icon: typeof BarChart3; iconClassName: string }
> = {
  "no-project": {
    title: "Choose a project to begin",
    message: "Select a project above to view its resource demand forecast.",
    icon: BarChart3,
    iconClassName: "text-slate-300",
  },
  "no-data": {
    title: "No forecast data",
    message:
      "Upload your programme file (CSV, Excel, or PDF) to generate the forecast. The AI will read the schedule and predict how many hours of each resource type you'll need each week.",
    icon: BarChart3,
    iconClassName: "text-slate-300",
  },
  "load-error": {
    title: "Forecast temporarily unavailable",
    message:
      "We couldn't load the latest planning forecast right now. Try again in a moment.",
    icon: AlertTriangle,
    iconClassName: "text-amber-500",
  },
};

export function EmptyForecastState({
  reason,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyForecastStateProps) {
  const state = STATE_COPY[reason];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-100 px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
        <Icon size={28} className={state.iconClassName} />
      </div>
      <h3 className="mb-1 text-base font-bold text-slate-900">
        {title ?? state.title}
      </h3>
      <p className="max-w-md text-sm text-slate-500">
        {message ?? state.message}
      </p>
      {onAction && actionLabel && (
        <Button
          type="button"
          variant={reason === "load-error" ? "default" : "outline"}
          size="sm"
          onClick={onAction}
          className="mt-5"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
