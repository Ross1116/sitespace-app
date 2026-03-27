"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Plus } from "lucide-react";
import useSWR from "swr";
import { swrFetcher, SWR_CONFIG } from "@/lib/swr";
import type { SitePlan } from "@/types";
import { toProxyUrl } from "@/lib/sitePlanUtils";
import { SitePlanUploadDialog } from "./SitePlanUploadDialog";
import { SitePlanViewerDialog } from "./SitePlanViewerDialog";

interface SitePlansSectionProps {
  projectId: string;
  canEdit: boolean;
}

export function SitePlansSection({ projectId, canEdit }: SitePlansSectionProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<SitePlan | null>(null);

  const {
    data: plansRaw,
    isLoading,
    error,
    mutate,
  } = useSWR(
    projectId ? `/site-plans/?project_id=${projectId}` : null,
    swrFetcher,
    SWR_CONFIG,
  );

  const plans = useMemo<SitePlan[]>(() => {
    if (!plansRaw) return [];
    if (Array.isArray(plansRaw)) return plansRaw;
    if (Array.isArray((plansRaw as { site_plans?: SitePlan[] }).site_plans))
      return (plansRaw as { site_plans: SitePlan[] }).site_plans;
    if (Array.isArray((plansRaw as { items?: SitePlan[] }).items))
      return (plansRaw as { items: SitePlan[] }).items;
    return [];
  }, [plansRaw]);

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-slate-900">Site Plans</h2>
        {canEdit && (
          <Button
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="bg-navy hover:bg-(--navy-hover) text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> Upload Plan
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-100">
        {error && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center h-full min-h-100">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm w-full max-w-xs">
              Failed to load site plans. Please try again.
            </div>
          </div>
        ) : isLoading ? (
          <div className="p-3">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center h-full min-h-100">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <ImageIcon className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              No site plans yet
            </p>
            {canEdit && (
              <p className="text-xs text-slate-400 mt-1">
                Upload the first plan to get started
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-y-auto max-h-150 p-3 custom-scrollbar">
            <div className={`grid gap-3 ${plans.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setViewingPlan(plan)}
                  className="group rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all overflow-hidden bg-white cursor-pointer text-left"
                >
                  {/* Preview */}
                  <div className="w-full aspect-video bg-slate-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={toProxyUrl(plan.file.preview_url)}
                      alt={plan.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {/* Info */}
                  <div className="px-3 py-2.5">
                    <p className="font-semibold text-sm text-slate-900 truncate">
                      {plan.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {plan.file.original_filename}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <SitePlanUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        projectId={projectId}
        onSuccess={() => {
          setIsUploadOpen(false);
          void mutate();
        }}
      />

      <SitePlanViewerDialog
        plan={viewingPlan}
        isOpen={!!viewingPlan}
        onClose={() => setViewingPlan(null)}
        canEdit={canEdit}
        projectId={projectId}
        onUpdated={() => {
          setViewingPlan(null);
          void mutate();
        }}
        onDeleted={() => {
          setViewingPlan(null);
          void mutate();
        }}
      />
    </>
  );
}
