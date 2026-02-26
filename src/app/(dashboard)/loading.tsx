export default function DashboardLoading() {
  return (
    <div
      className="min-h-screen bg-[var(--page-bg)] p-4 sm:p-6 lg:p-8"
      role="status"
      aria-label="Loading"
    >
      <div className="max-w-screen mx-auto space-y-4">
        {/* Header bar skeleton */}
        <div className="h-20 w-full bg-white rounded-2xl border border-slate-100 animate-pulse" />

        {/* Main card skeleton */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6">
          {/* Title row */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-9 w-32 bg-slate-100 rounded-lg animate-pulse" />
          </div>

          {/* Quick access cards skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>

          {/* Content rows skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 space-y-3">
              <div className="h-6 w-40 bg-slate-100 rounded animate-pulse" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 w-full bg-slate-50 rounded-xl border border-slate-100 animate-pulse" />
              ))}
            </div>
            <div className="col-span-12 lg:col-span-4">
              <div className="h-6 w-24 bg-slate-100 rounded animate-pulse mb-3" />
              <div className="h-64 w-full bg-slate-50 rounded-2xl border border-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      <span className="sr-only">Loading dashboard</span>
    </div>
  );
}
