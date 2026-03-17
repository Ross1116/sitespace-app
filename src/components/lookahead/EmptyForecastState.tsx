import { BarChart3 } from "lucide-react";

export function EmptyForecastState({ reason }: { reason: "no-project" | "no-data" }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
        <BarChart3 size={28} className="text-slate-300" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">No forecast data</h3>
      <p className="text-sm text-slate-500 max-w-sm">
        {reason === "no-project"
          ? "Select a project above to view its resource demand forecast."
          : "Upload your programme file (CSV, Excel, or PDF) to generate the forecast. The AI will read the schedule and predict how many hours of each resource type you'll need each week."}
      </p>
    </div>
  );
}
