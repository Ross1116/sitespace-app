import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );
}
