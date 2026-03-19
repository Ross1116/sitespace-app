"use client";

import React from "react";
import { AlertTriangle, Info, X } from "lucide-react";

export interface PlanningAlert {
  key: string;
  label: string;
  detail: string;
  level: "red" | "amber" | "blue";
}

interface Props {
  alerts: PlanningAlert[];
  onDismiss: (key: string) => void;
}

export const PlanningAlerts = React.memo(function PlanningAlerts({ alerts, onDismiss }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
        <AlertTriangle size={16} className="text-amber-500" />
        Active Planning Alerts
      </h2>
      {alerts.map((alert) => (
        <div
          key={alert.key}
          className={`flex items-start gap-3 p-4 rounded-xl border text-sm border-l-4 ${
            alert.level === "red"
              ? "bg-red-50 border-red-200 border-l-red-500"
              : alert.level === "amber"
                ? "bg-amber-50 border-amber-200 border-l-amber-500"
                : "bg-blue-50 border-blue-200 border-l-blue-500"
          }`}
        >
          {alert.level === "red" ? (
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          ) : alert.level === "amber" ? (
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          ) : (
            <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={`font-semibold ${
                alert.level === "red"
                  ? "text-red-800"
                  : alert.level === "amber"
                    ? "text-amber-800"
                    : "text-blue-800"
              }`}
            >
              {alert.label}
            </p>
            <p
              className={`text-xs mt-0.5 ${
                alert.level === "red"
                  ? "text-red-700"
                  : alert.level === "amber"
                    ? "text-amber-700"
                    : "text-blue-700"
              }`}
            >
              {alert.detail}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(alert.key)}
            className={`flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity ${
              alert.level === "red"
                ? "text-red-600"
                : alert.level === "amber"
                  ? "text-amber-600"
                  : "text-blue-600"
            }`}
            aria-label="Dismiss alert"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <p className="text-[11px] text-slate-400 italic">
        Planning notices only. No contractual implications. Review programme for certainty.
      </p>
    </div>
  );
});
