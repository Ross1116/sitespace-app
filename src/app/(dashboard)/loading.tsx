import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );
}
