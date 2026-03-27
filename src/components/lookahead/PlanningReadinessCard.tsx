"use client";

import { ListChecks, ShieldCheck } from "lucide-react";
import type { PlanningCompletenessResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { formatDate } from "./utils";

interface Props {
  planningCompleteness?: PlanningCompletenessResponse;
  onTaskAction?: (link?: string | null) => void;
}

export function PlanningReadinessCard({
  planningCompleteness,
  onTaskAction,
}: Props) {
  if (!planningCompleteness) return null;

  const { counts, actionable_tasks: tasks } = planningCompleteness;
  const score = Math.round(planningCompleteness.score ?? 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--teal)]" />
            <h2 className="text-base font-bold text-slate-900">
              Planning Readiness
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {formatDate(planningCompleteness.window_start || null)} to{" "}
            {formatDate(planningCompleteness.window_end || null)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
          <div className="text-3xl font-extrabold text-slate-900">{score}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {planningCompleteness.status}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Assets
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {counts.confirmed_assets ?? 0} confirmed - {counts.inferred_assets ?? 0} inferred -{" "}
            {counts.unknown_assets ?? 0} unknown
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Trades
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {counts.confirmed_trades ?? 0} confirmed - {counts.inferred_trades ?? 0} inferred -{" "}
            {counts.unknown_trades ?? 0} unknown
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Blocking
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {counts.blocking_total ?? counts.blocking_assets ?? 0} total blockers
          </p>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Actionable tasks
            </h3>
          </div>

          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id || task.title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-1 text-xs text-slate-500">
                        {task.description}
                      </p>
                    )}
                  </div>
                  {task.link && onTaskAction && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onTaskAction(task.link)}
                    >
                      Open
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
