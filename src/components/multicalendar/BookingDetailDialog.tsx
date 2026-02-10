import { useEffect, useState } from "react";
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
import { ApiBooking, ApiManager, getApiErrorMessage } from "@/types";

type BookingDetail = Omit<ApiBooking, "manager" | "asset"> & {
  manager?: (ApiManager & { email?: string }) | null;
  asset?: { id: string; name: string; asset_code?: string };
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
      setLoading(true);
      setError(null);
    }
    return () => controller.abort();
  }, [isOpen, bookingId]);

  const fetchDetails = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await api.get<BookingDetail>(`/bookings/${bookingId}`, {
        signal,
      });
      if (signal?.aborted) return;
      setData(res.data);
    } catch (err) {
      if (isAbortError(err, signal)) return;
      console.error("Error fetching booking details:", err);
      setError("Failed to load booking details.");
    } finally {
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

  const openConfirm = (
    type: "deny" | "cancel" | "delete" | "confirm" | "complete",
  ) => {
    setConfirmAction({ type, isOpen: true });
  };

  // --- 4. RENDERERS ---
  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg bg-white p-0 gap-0 border-slate-200 shadow-2xl overflow-hidden">
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
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-500">Asset:</span>
                <span className="text-sm font-medium text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
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
                <div className="grid grid-cols-2 gap-6">
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

                  {/* Manager (Booked By) */}
                  {data.manager && (
                    <div
                      className={`space-y-2 ${data.subcontractor ? "col-span-2 sm:col-span-1" : "col-span-2"}`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <User className="h-3.5 w-3.5" /> Booked By
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-md border border-slate-100">
                        <div className="h-8 w-8 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center font-bold ring-2 ring-white shadow-sm shrink-0">
                          {data.manager.first_name?.[0]}
                          {data.manager.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {data.manager.first_name} {data.manager.last_name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {data.manager.email}
                          </p>
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
                          {data.subcontractor.company_name?.[0] ||
                            data.subcontractor.first_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {data.subcontractor.company_name ||
                              `${data.subcontractor.first_name} ${data.subcontractor.last_name}`}
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
        <AlertDialogContent className="bg-white">
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
                "This will confirm the booking time and notify the user."}
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
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel disabled={actionLoading}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              className={`
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

