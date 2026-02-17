import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  Clock,
  User,
  FileText,
  Loader2,
  AlertCircle,
  Check,
  X,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle2,
  Ban,
  HardHat,
} from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import RescheduleBookingForm from "@/components/forms/RescheduleBookingForm";
import {
  ApiBooking,
  ApiManager,
  AuditEntry,
  AuditTrailResponse,
  BookingListResponse,
  getApiErrorMessage,
} from "@/types";
import { reportError } from "@/lib/monitoring";
import { BOOKING_PAGINATION_MAX_PAGES } from "@/lib/pagination";

type BookingDetail = Omit<ApiBooking, "manager" | "asset"> & {
  manager?: (ApiManager & { email?: string }) | null;
  asset?: { id: string; name: string; asset_code?: string };
  created_by_id?: string | null;
  created_by_name?: string | null;
  created_by_role?: string | null;
  created_by_email?: string | null;
  booked_by_name?: string | null;
  booked_by_role?: string | null;
  booked_by_email?: string | null;
  requested_by_name?: string | null;
  requested_by_role?: string | null;
  requested_by_email?: string | null;
  created_by?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email?: string;
    role?: string;
  } | null;
};

const isAbortError = (error: unknown, signal?: AbortSignal) => {
  if (signal?.aborted) return true;
  if (error instanceof Error && error.name === "CanceledError") return true;
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ERR_CANCELED"
  ) {
    return true;
  }
  return false;
};

interface BookingDetailsDialogProps {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: () => void;
}

export function BookingDetailsDialog({
  bookingId,
  isOpen,
  onClose,
  onActionComplete,
}: BookingDetailsDialogProps) {
  const { user } = useAuth();

  // Data States
  const [data, setData] = useState<BookingDetail | null>(null);
  const [createdByEntry, setCreatedByEntry] = useState<AuditEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [competingPendingBookings, setCompetingPendingBookings] = useState<
    ApiBooking[]
  >([]);

  // Modal States
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "deny" | "cancel" | "delete" | "confirm" | "complete";
    isOpen: boolean;
  }>({ type: "deny", isOpen: false });

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const controller = new AbortController();
    if (isOpen && bookingId) {
      fetchDetails(controller.signal);
    } else {
      setData(null);
      setCreatedByEntry(null);
      setLoading(true);
      setError(null);
    }
    return () => controller.abort();
  }, [isOpen, bookingId]);

  const fetchDetails = async (signal?: AbortSignal) => {
    setLoading(true);
    setCreatedByEntry(null);
    try {
      const res = await api.get<BookingDetail>(`/bookings/${bookingId}`, {
        signal,
      });
      if (signal?.aborted) return;
      setData(res.data);
      setLoading(false);

      void (async () => {
        try {
          const auditRes = await api.get<AuditTrailResponse>(
            `/bookings/${bookingId}/audit`,
            {
              params: { skip: 0, limit: 200 },
              signal,
            },
          );
          if (signal?.aborted) return;
          const createdEntry = (auditRes.data?.history || []).find(
            (entry) => entry.action?.toLowerCase() === "created",
          );
          setCreatedByEntry(createdEntry || null);
        } catch {
          if (!signal?.aborted) setCreatedByEntry(null);
        }
      })();
    } catch (err) {
      if (isAbortError(err, signal)) return;
      reportError(err, "BookingDetailDialog: failed to fetch booking details");
      setError("Failed to load booking details.");
      if (!signal?.aborted) setLoading(false);
    }
  };

  // --- 2. PERMISSIONS & HELPERS ---
  const hasManagerPrivileges =
    user?.role === "admin" || user?.role === "manager";
  const isMyBooking =
    user?.role === "subcontractor" && user?.id === data?.subcontractor_id;

  // UI LOGIC: Always lowercase for comparison
  const status = (data?.status || "pending").toLowerCase();
  const competingPendingCount = data?.competing_pending_count ?? 0;

  const bookedBy = useMemo(() => {
    const initials = (name?: string | null) => {
      if (!name) return "?";
      const parts = name
        .split(" ")
        .map((part) => part.trim())
        .filter(Boolean);
      if (parts.length === 0) return "?";
      if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
      return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
    };

    if (createdByEntry?.actor_name) {
      return {
        name: createdByEntry.actor_name,
        role: createdByEntry.actor_role || undefined,
        email: undefined as string | undefined,
        initials: initials(createdByEntry.actor_name),
      };
    }

    if (!data) return null;

    const subcontractorFullName =
      `${data.subcontractor?.first_name || ""} ${data.subcontractor?.last_name || ""}`.trim();

    const createdByObj = data.created_by;
    const createdByObjName =
      createdByObj?.full_name ||
      [createdByObj?.first_name, createdByObj?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();

    let explicitName: string | undefined;
    let explicitRole: string | undefined;
    let explicitEmail: string | undefined;

    if (data.created_by_name) {
      explicitName = data.created_by_name;
      explicitRole = data.created_by_role || createdByObj?.role || undefined;
      explicitEmail = data.created_by_email || createdByObj?.email || undefined;
    } else if (data.booked_by_name) {
      explicitName = data.booked_by_name;
      explicitRole = data.booked_by_role || undefined;
      explicitEmail = data.booked_by_email || undefined;
    } else if (data.requested_by_name) {
      explicitName = data.requested_by_name;
      explicitRole = data.requested_by_role || undefined;
      explicitEmail = data.requested_by_email || undefined;
    } else if (createdByObjName) {
      explicitName = createdByObjName;
      explicitRole = createdByObj?.role || undefined;
      explicitEmail = createdByObj?.email || undefined;
    }

    if (explicitName) {
      return {
        name: explicitName,
        role: explicitRole,
        email: explicitEmail,
        initials: initials(explicitName),
      };
    }

    const createdById = data.created_by_id || createdByObj?.id || undefined;
    if (createdById && data.subcontractor?.id === createdById) {
      const subName = subcontractorFullName || "Unknown Subcontractor";
      return {
        name: subName,
        role: "subcontractor",
        email: undefined as string | undefined,
        initials: initials(subName),
      };
    }
    if (createdById && data.manager?.id === createdById) {
      const managerName =
        `${data.manager.first_name} ${data.manager.last_name}`.trim();
      return {
        name: managerName,
        role: "manager",
        email: data.manager.email,
        initials: initials(managerName),
      };
    }

    if (!createdById && data.subcontractor) {
      const subName = subcontractorFullName || "Unknown Subcontractor";
      return {
        name: subName,
        role: "subcontractor",
        email: undefined as string | undefined,
        initials: initials(subName),
      };
    }

    if (!createdById && data.manager) {
      const managerName =
        `${data.manager.first_name} ${data.manager.last_name}`.trim();
      return {
        name: managerName,
        role: "manager",
        email: data.manager.email,
        initials: initials(managerName),
      };
    }

    return null;
  }, [createdByEntry, data]);

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, "h:mm a");
    } catch {
      return timeStr;
    }
  };

  const getStatusColor = (st: string) => {
    switch (st?.toLowerCase()) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "cancelled":
        return "bg-red-50 text-red-600 border-red-100";
      case "denied":
        return "bg-red-50 text-red-600 border-red-100";
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // --- 3. ACTIONS ---
  const handleUpdateStatus = async (newStatus: string) => {
    setActionLoading(true);
    try {
      // API LOGIC: Always send UPPERCASE to satisfy Backend Enums
      await api.patch(`/bookings/${bookingId}/status`, {
        status: newStatus.toUpperCase(),
      });
      setConfirmAction({ ...confirmAction, isOpen: false });
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update status"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/bookings/${bookingId}`, {
        params: { hard_delete: true },
      });
      setConfirmAction({ ...confirmAction, isOpen: false });
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to delete booking"));
    } finally {
      setActionLoading(false);
    }
  };

  const fetchLatestCompetingPending = async (): Promise<{
    count: number;
    bookings: ApiBooking[];
  } | null> => {
    try {
      const res = await api.get<BookingDetail>(`/bookings/${bookingId}`);
      setData(res.data);
      const competingCount = res.data.competing_pending_count ?? 0;

      if (competingCount === 0) {
        return { count: 0, bookings: [] };
      }

      const { booking_date, start_time, end_time, asset_id, project_id } =
        res.data;
      if (!booking_date || !start_time || !end_time || !asset_id) {
        return { count: competingCount, bookings: [] };
      }

      const limit = 200;
      let skip = 0;
      let hasMore = true;
      let pageCount = 0;
      const collected: ApiBooking[] = [];

      while (hasMore) {
        if (pageCount >= BOOKING_PAGINATION_MAX_PAGES) {
          reportError(
            new Error(
              `Pagination guard triggered in BookingDetailDialog: pageCount=${pageCount}, maxPages=${BOOKING_PAGINATION_MAX_PAGES}, bookingId=${bookingId}, projectId=${project_id ?? "unknown"}`,
            ),
            "BookingDetailDialog: pagination safety limit reached while loading competing pending bookings",
          );
          break;
        }

        const listRes = await api.get<BookingListResponse>(`/bookings/`, {
          params: {
            project_id,
            date_from: booking_date,
            date_to: booking_date,
            limit,
            skip,
          },
        });

        collected.push(...(listRes.data.bookings || []));
        hasMore = Boolean(listRes.data.has_more);
        skip += limit;
        pageCount += 1;
      }

      const normalizeTime = (value: string) =>
        value.split(":").slice(0, 2).join(":");
      const normalizedStart = normalizeTime(start_time);
      const normalizedEnd = normalizeTime(end_time);

      const matchedPending = collected.filter((booking) => {
        const status = (booking.status || "").toLowerCase();
        return (
          status === "pending" &&
          booking.id !== bookingId &&
          booking.asset_id === asset_id &&
          booking.booking_date === booking_date &&
          normalizeTime(booking.start_time) === normalizedStart &&
          normalizeTime(booking.end_time) === normalizedEnd
        );
      });

      return {
        count: matchedPending.length || competingCount,
        bookings: matchedPending,
      };
    } catch (err: unknown) {
      reportError(
        err,
        `BookingDetailDialog: failed to validate booking state (bookingId=${bookingId})`,
      );
      setError(getApiErrorMessage(err, "Failed to validate booking state"));
      return null;
    }
  };

  const openConfirm = (
    type: "deny" | "cancel" | "delete" | "confirm" | "complete",
  ) => {
    if (type === "confirm") {
      void (async () => {
        const freshCompetingPending = await fetchLatestCompetingPending();
        if (!freshCompetingPending) return;

        if (freshCompetingPending.count === 0) {
          setCompetingPendingBookings([]);
          await handleUpdateStatus("confirmed");
          return;
        }

        setCompetingPendingBookings(freshCompetingPending.bookings);
        setConfirmAction({ type, isOpen: true });
      })();
      return;
    }
    setConfirmAction({ type, isOpen: true });
  };

  // --- 4. RENDERERS ---
  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-lg bg-white p-0 gap-0 border-slate-200 shadow-2xl overflow-hidden">
          {/* HEADER */}
          <DialogHeader className="px-6 pt-6 pb-4 bg-white border-b border-slate-50 pr-12">
            <div className="flex items-start justify-between gap-3">
              <DialogTitle className="text-xl font-semibold text-slate-900 leading-tight">
                {loading ? "Loading..." : data?.purpose || "Untitled Booking"}
              </DialogTitle>
              {!loading && data && (
                <Badge
                  className={`${getStatusColor(status)} capitalize border px-3 py-1 text-xs font-semibold shadow-none rounded-full shrink-0 mt-0.5`}
                >
                  {status}
                </Badge>
              )}
            </div>
            {!loading && data?.asset && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">Asset:</span>
                <span className="max-w-full truncate text-sm font-medium text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {data.asset.name}
                  <span className="text-slate-400 ml-1 font-normal">
                    ({data.asset.asset_code})
                  </span>
                </span>
              </div>
            )}
          </DialogHeader>

          {/* BODY */}
          <div className="px-6 py-6 bg-white min-h-[200px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Fetching booking details...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 text-sm border border-red-100">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {error}
              </div>
            ) : data ? (
              <div className="space-y-6">
                {/* Grid Info */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <CalendarIcon className="h-3.5 w-3.5" /> Date
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {format(
                        new Date(data.booking_date),
                        "EEEE, MMMM d, yyyy",
                      )}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Clock className="h-3.5 w-3.5" /> Time
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {formatTime(data.start_time)} -{" "}
                      {formatTime(data.end_time)}
                    </p>
                  </div>

                  {/* Booked By */}
                  {bookedBy && (
                    <div
                      className={`space-y-2 ${data.subcontractor ? "col-span-2 sm:col-span-1" : "col-span-2"}`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <User className="h-3.5 w-3.5" /> Booked By
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-md border border-slate-100">
                        <div className="h-8 w-8 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center font-bold ring-2 ring-white shadow-sm shrink-0">
                          {bookedBy.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {bookedBy.name}
                          </p>
                          {bookedBy.email ? (
                            <p className="text-xs text-slate-500 truncate">
                              {bookedBy.email}
                            </p>
                          ) : bookedBy.role ? (
                            <p className="text-xs text-slate-500 truncate capitalize">
                              {bookedBy.role}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Subcontractor (Assigned To) */}
                  {data.subcontractor && (
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <HardHat className="h-3.5 w-3.5" /> Assigned To
                      </div>
                      <div className="flex items-center gap-3 bg-orange-50/50 p-2 rounded-md border border-orange-100">
                        <div className="h-8 w-8 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center font-bold ring-2 ring-white shadow-sm shrink-0">
                          {data.subcontractor.first_name?.[0] ||
                            data.subcontractor.last_name?.[0] ||
                            "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {`${data.subcontractor.first_name || ""} ${data.subcontractor.last_name || ""}`.trim() ||
                              "Unknown Subcontractor"}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            Subcontractor
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="bg-slate-100" />

                {/* Notes */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                    <FileText className="h-3.5 w-3.5" /> Notes
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {data.notes || (
                      <span className="text-slate-400 italic">
                        No notes provided.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* FOOTER ACTIONS - Split Layout for Intuitive UX */}
          {!loading && data && (
            <div className="bg-slate-50 p-4 border-t border-slate-100">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between w-full gap-3">
                {/* LEFT SIDE: Destructive / Negative Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Cancel / Deny Logic */}
                  {(status === "pending" || status === "confirmed") && (
                    <>
                      {hasManagerPrivileges && status === "pending" && (
                        <Button
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 justify-start"
                          onClick={() => openConfirm("deny")}
                        >
                          <Ban className="h-4 w-4 mr-2" /> Reject
                        </Button>
                      )}
                      {(hasManagerPrivileges || isMyBooking) &&
                        status === "confirmed" && (
                          <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 justify-start"
                            onClick={() => openConfirm("cancel")}
                          >
                            <X className="h-4 w-4 mr-2" /> Cancel Booking
                          </Button>
                        )}
                      {isMyBooking &&
                        !hasManagerPrivileges &&
                        status === "pending" && (
                          <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 justify-start"
                            onClick={() => openConfirm("cancel")}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Withdraw Request
                          </Button>
                        )}
                    </>
                  )}

                  {/* Delete Logic */}
                  {(status === "cancelled" || status === "denied") &&
                    isMyBooking && (
                      <Button
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 justify-start"
                        onClick={() => openConfirm("delete")}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Record
                      </Button>
                    )}
                </div>

                {/* RIGHT SIDE: Positive / Constructive Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Close button always available on mobile if stacked */}
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="sm:hidden text-slate-500"
                  >
                    Close
                  </Button>

                  {(status === "pending" || status === "confirmed") && (
                    <>
                      {/* Reschedule is always available for active bookings */}
                      {(hasManagerPrivileges || isMyBooking) && (
                        <Button
                          variant="outline"
                          className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 justify-start sm:justify-center"
                          onClick={() => setIsRescheduleOpen(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" /> Reschedule
                        </Button>
                      )}

                      {/* Primary Actions */}
                      {hasManagerPrivileges && status === "pending" && (
                        <Button
                          className="bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white justify-start sm:justify-center"
                          onClick={() => openConfirm("confirm")}
                        >
                          <Check className="h-4 w-4 mr-2" /> Approve Request
                        </Button>
                      )}
                      {hasManagerPrivileges && status === "confirmed" && (
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white justify-start sm:justify-center"
                          onClick={() => openConfirm("complete")}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Job
                          Complete
                        </Button>
                      )}
                    </>
                  )}

                  {status === "denied" &&
                    (hasManagerPrivileges || isMyBooking) && (
                      <Button
                        variant="outline"
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 justify-start sm:justify-center"
                        onClick={() => setIsRescheduleOpen(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Reschedule
                      </Button>
                    )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- SUB-MODAL: RESCHEDULE --- */}
      {isRescheduleOpen && bookingId && (
        <RescheduleBookingForm
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          bookingId={bookingId}
          onSave={() => {
            setIsRescheduleOpen(false);
            if (onActionComplete) onActionComplete();
            onClose();
          }}
        />
      )}

      {/* --- SUB-MODAL: ALERTS --- */}
      <AlertDialog
        open={confirmAction.isOpen}
        onOpenChange={(open) =>
          setConfirmAction({ ...confirmAction, isOpen: open })
        }
      >
        <AlertDialogContent className="w-[calc(100vw-1rem)] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmAction.type === "confirm" ||
              confirmAction.type === "complete" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              {confirmAction.type === "confirm" && "Approve Booking?"}
              {confirmAction.type === "complete" && "Complete Job?"}
              {confirmAction.type === "deny" && "Reject Request?"}
              {confirmAction.type === "cancel" && "Cancel Booking?"}
              {confirmAction.type === "delete" && "Delete Record?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              {confirmAction.type === "confirm" &&
                (competingPendingCount > 0
                  ? `Confirming this booking will auto-deny ${competingPendingCount} other pending request${competingPendingCount === 1 ? "" : "s"} for this time slot. Continue?`
                  : "This will confirm the booking time and notify the user.")}
              {confirmAction.type === "complete" &&
                "This will mark the job as finished and archive it."}
              {confirmAction.type === "deny" &&
                "The user will be notified that their request was rejected."}
              {confirmAction.type === "cancel" &&
                "Are you sure you want to cancel this booking? The slot will become available again."}
              {confirmAction.type === "delete" &&
                "This action is permanent and cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmAction.type === "confirm" &&
            competingPendingBookings.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-md border border-gray-200 p-3 text-sm text-slate-700">
                <p className="font-medium text-slate-800">Impacted bookings:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {competingPendingBookings.map((booking) => (
                    <li key={booking.id}>
                      {`${booking.purpose || booking.title || "Booking"} (${booking.status || "pending"}) — ${booking.booking_date} ${booking.start_time}-${booking.end_time}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel
              disabled={actionLoading}
              className="w-full sm:w-auto"
            >
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              className={`w-full sm:w-auto
                        ${
                          confirmAction.type === "deny" ||
                          confirmAction.type === "cancel" ||
                          confirmAction.type === "delete"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-[var(--navy)] hover:bg-[var(--navy-hover)]"
                        } text-white
                    `}
              onClick={(e) => {
                e.preventDefault();
                if (confirmAction.type === "delete") handleDelete();
                else if (confirmAction.type === "confirm")
                  handleUpdateStatus("confirmed");
                else if (confirmAction.type === "complete")
                  handleUpdateStatus("completed");
                else if (confirmAction.type === "deny")
                  handleUpdateStatus("denied");
                else if (confirmAction.type === "cancel")
                  handleUpdateStatus("cancelled");
              }}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Yes, Proceed"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
