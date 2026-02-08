// components/bookings/BookingHistorySidebar.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Clock,
  User,
  ArrowRight,
  FileText,
  Calendar,
  Box,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit3,
  PlusCircle,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "@/lib/api";
import { format, parseISO, formatDistanceToNow } from "date-fns";

interface AuditEntry {
  id: string;
  booking_id: string;
  actor_id: string;
  actor_role: string;
  actor_name: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  changes: Record<string, any> | null;
  comment: string | null;
  created_at: string;
}

interface AuditTrailResponse {
  booking_id: string;
  history: AuditEntry[];
}

interface BookingHistorySidebarProps {
  booking: any | null;
  isOpen: boolean;
  onClose: () => void;
}

const actionConfig: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    dotColor: string;
  }
> = {
  created: {
    label: "Created",
    icon: PlusCircle,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    dotColor: "bg-blue-500",
  },
  denied: {
    label: "Denied",
    icon: XCircle,
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    dotColor: "bg-red-500",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    dotColor: "bg-slate-500",
  },
  rescheduled: {
    label: "Rescheduled",
    icon: RotateCcw,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    dotColor: "bg-amber-500",
  },
  updated: {
    label: "Updated",
    icon: Edit3,
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    dotColor: "bg-violet-500",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    dotColor: "bg-emerald-500",
  },
};

const getActionConfig = (action: string) => {
  const normalized = action.toLowerCase();
  return (
    actionConfig[normalized] || {
      label: action,
      icon: FileText,
      color: "text-slate-700",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
      dotColor: "bg-slate-400",
    }
  );
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "text-amber-300 bg-amber-500/20 border-amber-500/30",
  },
  confirmed: {
    label: "Confirmed",
    className: "text-blue-300 bg-blue-500/20 border-blue-500/30",
  },
  denied: {
    label: "Denied",
    className: "text-red-300 bg-red-500/20 border-red-500/30",
  },
  cancelled: {
    label: "Cancelled",
    className: "text-slate-300 bg-slate-500/20 border-slate-500/30",
  },
  completed: {
    label: "Completed",
    className: "text-emerald-300 bg-emerald-500/20 border-emerald-500/30",
  },
  rescheduled: {
    label: "Rescheduled",
    className: "text-violet-300 bg-violet-500/20 border-violet-500/30",
  },
};

const getStatusDisplay = (status: string) => {
  const normalized = status.toLowerCase();
  return (
    statusConfig[normalized] || {
      label: status,
      className: "text-slate-300 bg-slate-500/20 border-slate-500/30",
    }
  );
};

const roleLabels: Record<string, { label: string; className: string }> = {
  admin: {
    label: "Admin",
    className: "text-purple-600 bg-purple-50 border-purple-200",
  },
  manager: {
    label: "Manager",
    className: "text-blue-600 bg-blue-50 border-blue-200",
  },
  subcontractor: {
    label: "Subcontractor",
    className: "text-amber-600 bg-amber-50 border-amber-200",
  },
};

const getRoleDisplay = (role: string) => {
  const normalized = role.toLowerCase();
  return (
    roleLabels[normalized] || {
      label: role,
      className: "text-slate-600 bg-slate-50 border-slate-200",
    }
  );
};

const safeFormatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  try {
    return format(parseISO(dateString), "PPP 'at' p");
  } catch {
    return dateString;
  }
};

const safeRelativeTime = (dateString?: string | null) => {
  if (!dateString) return "";
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return "";
  }
};

const formatChangeValue = (key: string, value: any): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }

  const dateFields = [
    "booking_date",
    "start_time",
    "end_time",
    "created_at",
    "updated_at",
  ];
  if (dateFields.includes(key) && typeof value === "string") {
    try {
      if (key.includes("time") && !value.includes("T")) {
        return value.split(":").slice(0, 2).join(":");
      }
      return format(parseISO(value), "PPP");
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const formatChangeKey = (key: string): string => {
  const keyLabels: Record<string, string> = {
    booking_date: "Date",
    start_time: "Start Time",
    end_time: "End Time",
    status: "Status",
    notes: "Notes",
    purpose: "Purpose",
    asset_id: "Asset",
    subcontractor_id: "Subcontractor",
    manager_id: "Manager",
  };
  return (
    keyLabels[key] ||
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

function ChangeDetails({ changes }: { changes: Record<string, any> }) {
  const [expanded, setExpanded] = useState(false);

  if (!changes || Object.keys(changes).length === 0) return null;

  const entries = Object.entries(changes);
  const visibleEntries = expanded ? entries : entries.slice(0, 2);
  const hasMore = entries.length > 2;

  return (
    <div className="mt-2.5">
      <div className="space-y-1.5">
        {visibleEntries.map(([key, value]) => {
          const isOldNew =
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value) &&
            ("old" in value || "new" in value);

          return (
            <div
              key={key}
              className="flex flex-col gap-0.5 text-xs bg-white/60 rounded-lg px-3 py-2 border border-slate-100"
            >
              <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider">
                {formatChangeKey(key)}
              </span>
              {isOldNew ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400 line-through">
                    {formatChangeValue(key, value.old)}
                  </span>
                  <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />
                  <span className="text-slate-800 font-medium">
                    {formatChangeValue(key, value.new)}
                  </span>
                </div>
              ) : (
                <span className="text-slate-800 font-medium">
                  {formatChangeValue(key, value)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> +{entries.length - 2} more
              changes
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function BookingHistorySidebar({
  booking,
  isOpen,
  onClose,
}: BookingHistorySidebarProps) {
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const fetchAuditTrail = useCallback(
    async (bookingId: string, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        // Backend route: GET /bookings/{booking_id}/audit
        // with query params: skip (int, default 0), limit (int, default 50, max 200)
        const response = await api.get<AuditTrailResponse>(
          `/bookings/${bookingId}/audit`,
          {
            params: { skip: 0, limit: 200 },
            signal,
          },
        );
        setAuditTrail(response.data?.history || []);
      } catch (err: any) {
        // Don't update state if request was cancelled
        if (err?.name === "CanceledError" || signal?.aborted) {
          return;
        }

        console.error("Error fetching audit trail:", err);
        if (err.response?.status === 403) {
          setError("You don't have permission to view this booking's history.");
        } else if (err.response?.status === 404) {
          setError("Booking not found.");
        } else {
          setError("Failed to load booking history. Please try again.");
        }
        setAuditTrail([]);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    // Cancel any in-flight request when dependencies change or unmount
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (isOpen && booking?.bookingKey) {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      fetchAuditTrail(booking.bookingKey, controller.signal);
    }

    if (!isOpen) {
      setAuditTrail([]);
      setError(null);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [isOpen, booking?.bookingKey, fetchAuditTrail]);

  // Trap focus inside sidebar when open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && sidebarRef.current) {
        const focusableElements =
          sidebarRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleRetry = useCallback(() => {
    if (booking?.bookingKey) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      fetchAuditTrail(booking.bookingKey, controller.signal);
    }
  }, [booking?.bookingKey, fetchAuditTrail]);

  const currentStatus = booking?.bookingStatus || "unknown";
  const statusDisplay = getStatusDisplay(currentStatus);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label="Booking history"
        className={`fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {booking && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 pb-5 bg-[#0B1120] text-white">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold leading-tight">
                      Booking History
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Audit trail & activity log
                    </p>
                  </div>
                </div>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  aria-label="Close booking history"
                  className="text-white hover:bg-white/10 rounded-full h-8 w-8 p-0"
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Booking summary card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-sm truncate"
                      title={booking.bookingTitle}
                    >
                      {booking.bookingTitle}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-slate-400 text-xs">
                      <Box size={12} />
                      <span className="truncate">{booking.assetName}</span>
                    </div>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border shrink-0 ${statusDisplay.className}`}
                  >
                    {statusDisplay.label}
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} />
                    <span>
                      {booking.bookingTimeDt
                        ? (() => {
                            try {
                              return format(
                                parseISO(booking.bookingTimeDt),
                                "MMM d, yyyy",
                              );
                            } catch {
                              return booking.bookingTimeDt;
                            }
                          })()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} />
                    <span>
                      {booking.bookingStartTime} – {booking.bookingEndTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={11} />
                    <span>{booking.bookingFor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline content */}
            <div className="flex-1 overflow-y-auto bg-slate-50">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  <p className="text-sm text-slate-500 font-medium">
                    Loading history...
                  </p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3 px-8">
                  <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  </div>
                  <p className="text-sm text-slate-600 font-medium text-center">
                    {error}
                  </p>
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    size="sm"
                    className="mt-2 rounded-full text-xs"
                  >
                    Try Again
                  </Button>
                </div>
              ) : auditTrail.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">
                    No history available
                  </p>
                  <p className="text-xs text-slate-400">
                    Activity will appear here as changes are made.
                  </p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Timeline
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                      {auditTrail.length}{" "}
                      {auditTrail.length === 1 ? "event" : "events"}
                    </span>
                  </div>

                  {/* Timeline */}
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[15px] top-3 bottom-3 w-px bg-slate-200" />

                    <div className="space-y-1">
                      {auditTrail.map((entry, index) => {
                        const config = getActionConfig(entry.action);
                        const ActionIcon = config.icon;
                        const roleDisplay = getRoleDisplay(
                          entry.actor_role || "",
                        );
                        const isLast = index === auditTrail.length - 1;

                        return (
                          <div
                            key={entry.id}
                            className={`relative pl-10 group ${isLast ? "pb-0" : "pb-5"}`}
                          >
                            {/* Timeline dot */}
                            <div
                              className={`absolute left-[9px] top-1.5 h-[14px] w-[14px] rounded-full border-2 border-white shadow-sm z-10 ${config.dotColor}`}
                            />

                            {/* Card */}
                            <div
                              className={`${config.bgColor} border ${config.borderColor} rounded-xl p-4 transition-all hover:shadow-md`}
                            >
                              {/* Action header */}
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <ActionIcon
                                    className={`h-4 w-4 ${config.color} shrink-0`}
                                  />
                                  <span
                                    className={`text-sm font-bold ${config.color}`}
                                  >
                                    {config.label}
                                  </span>
                                </div>
                                <span
                                  className="text-[10px] text-slate-400 shrink-0"
                                  title={safeFormatDate(entry.created_at)}
                                >
                                  {safeRelativeTime(entry.created_at)}
                                </span>
                              </div>

                              {/* Actor info */}
                              <div className="flex items-center gap-2 mt-2">
                                <div className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                                  <User className="h-3 w-3 text-slate-400" />
                                </div>
                                <span className="text-xs font-semibold text-slate-700">
                                  {entry.actor_name || "System"}
                                </span>
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${roleDisplay.className}`}
                                >
                                  {roleDisplay.label}
                                </span>
                              </div>

                              {/* Status transition */}
                              {entry.from_status && entry.to_status && (
                                <div className="flex items-center gap-2 mt-2.5 text-xs">
                                  <span className="text-slate-400 font-medium">
                                    Status:
                                  </span>
                                  <span className="font-semibold text-slate-500 capitalize">
                                    {entry.from_status}
                                  </span>
                                  <ArrowRight className="h-3 w-3 text-slate-300" />
                                  <span className="font-semibold text-slate-800 capitalize">
                                    {entry.to_status}
                                  </span>
                                </div>
                              )}

                              {/* Comment */}
                              {entry.comment && (
                                <div className="mt-2.5 text-xs text-slate-600 bg-white/60 rounded-lg px-3 py-2 border border-slate-100 italic">
                                  &ldquo;{entry.comment}&rdquo;
                                </div>
                              )}

                              {/* Changes */}
                              {entry.changes &&
                                Object.keys(entry.changes).length > 0 && (
                                  <ChangeDetails changes={entry.changes} />
                                )}

                              {/* Timestamp */}
                              <div className="mt-3 text-[10px] text-slate-400">
                                {safeFormatDate(entry.created_at)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-100">
              <Button
                onClick={onClose}
                className="w-full bg-[#0B1120] text-white hover:bg-[#1a253a] rounded-xl h-10 text-sm font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
