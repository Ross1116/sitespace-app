"use client";

import { useState } from "react";
import {
  Calendar,
  X,
  ChevronDown,
  AlertTriangle,
  Trash2,
  Edit,
} from "lucide-react";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/types";
import { useAuth } from "@/app/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RescheduleBookingForm from "@/components/forms/RescheduleBookingForm";
import { ApiBooking } from "@/types";

interface BookingCardDropdownProps {
  bookingKey: string;
  bookingStatus: string;
  subcontractorId?: string;
  isOpen: boolean;
  onToggle: () => void;
  onActionComplete?: () => void;
}

export default function BookingCardDropdown({
  bookingKey,
  bookingStatus,
  subcontractorId,
  isOpen,
  onToggle,
  onActionComplete,
}: BookingCardDropdownProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDenyModalOpen, setIsDenyModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRescheduleFormOpen, setIsRescheduleFormOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [competingPendingCount, setCompetingPendingCount] = useState(0);

  const { user } = useAuth();
  const hasManagerPrivileges =
    user?.role === "admin" || user?.role === "manager";
  const isMyBooking =
    user?.role === "subcontractor" && user?.id === subcontractorId;

  // Type definition for status
  type BookingStatusType =
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "denied";

  const updateBookingStatus = async (newStatus: BookingStatusType) => {
    setIsLoading(true);
    try {
      await api.patch(`/bookings/${bookingKey}/status`, {
        status: newStatus.toUpperCase(),
      });
      onActionComplete?.();
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, "Failed to update booking"));
    } finally {
      setIsLoading(false);
      if (isOpen) onToggle();
      setIsDenyModalOpen(false);
    }
  };

  const deleteBooking = async () => {
    setIsLoading(true);
    try {
      await api.delete(`/bookings/${bookingKey}`, {
        data: { hard_delete: true },
      });
      onActionComplete?.();
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, "Failed to delete booking"));
    } finally {
      setIsLoading(false);
      if (isOpen) onToggle();
      setIsDeleteModalOpen(false);
    }
  };

  const confirmBooking = () => updateBookingStatus("confirmed");
  const completeBooking = () => updateBookingStatus("completed");

  const handleConfirmClick = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<ApiBooking>(`/bookings/${bookingKey}`);
      const competingCount = response.data.competing_pending_count ?? 0;
      if (competingCount > 0) {
        setCompetingPendingCount(competingCount);
        if (isOpen) onToggle();
        setIsConfirmModalOpen(true);
      } else {
        await updateBookingStatus("confirmed");
      }
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(error, "Failed to load booking details"),
      );
      if (isOpen) onToggle();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDenyClick = () => {
    onToggle();
    setIsDenyModalOpen(true);
  };
  const handleDeleteClick = () => {
    onToggle();
    setIsDeleteModalOpen(true);
  };
  const handleRescheduleClick = () => {
    onToggle();
    setIsRescheduleFormOpen(true);
  };
  const handleRescheduleComplete = () => {
    setIsRescheduleFormOpen(false);
    onActionComplete?.();
  };

  const normalizedStatus = bookingStatus.toLowerCase();

  return (
    <>
      <div className="relative">
        <Button
          onClick={onToggle}
          disabled={isLoading}
          variant="ghost"
          className="h-8 px-3 text-xs font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded-md"
        >
          {isLoading ? "..." : "Edit"}
          <ChevronDown
            size={12}
            className={`ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="py-1">
              {normalizedStatus === "pending" && (
                <>
                  {hasManagerPrivileges && (
                    <>
                      <button
                        onClick={handleConfirmClick}
                        className="flex items-center px-4 py-2.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 w-full text-left"
                      >
                        <Calendar size={14} className="mr-2" /> Confirm
                      </button>
                      <button
                        onClick={handleDenyClick}
                        className="flex items-center px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <X size={14} className="mr-2" /> Deny
                      </button>
                    </>
                  )}
                  {isMyBooking && (
                    <>
                      <button
                        onClick={handleRescheduleClick}
                        className="flex items-center px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 w-full text-left"
                      >
                        <Edit size={14} className="mr-2" /> Reschedule
                      </button>
                      <button
                        onClick={handleDeleteClick}
                        className="flex items-center px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <Trash2 size={14} className="mr-2" /> Cancel Request
                      </button>
                    </>
                  )}
                </>
              )}

              {normalizedStatus === "confirmed" && (
                <>
                  {hasManagerPrivileges && (
                    <button
                      onClick={completeBooking}
                      className="flex items-center px-4 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 w-full text-left"
                    >
                      <Calendar size={14} className="mr-2" /> Mark Completed
                    </button>
                  )}
                  <button
                    onClick={handleRescheduleClick}
                    className="flex items-center px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 w-full text-left"
                  >
                    <Edit size={14} className="mr-2" /> Reschedule
                  </button>
                  {hasManagerPrivileges ? (
                    <button
                      onClick={handleDenyClick}
                      className="flex items-center px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <X size={14} className="mr-2" /> Cancel Booking
                    </button>
                  ) : (
                    <button
                      onClick={handleDeleteClick}
                      className="flex items-center px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <Trash2 size={14} className="mr-2" /> Cancel Booking
                    </button>
                  )}
                </>
              )}

              {normalizedStatus === "denied" &&
                (hasManagerPrivileges || isMyBooking) && (
                  <button
                    onClick={handleRescheduleClick}
                    className="flex items-center px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 w-full text-left"
                  >
                    <Edit size={14} className="mr-2" /> Reschedule
                  </button>
                )}

              {(normalizedStatus === "cancelled" ||
                normalizedStatus === "denied") &&
                isMyBooking && (
                  <button
                    onClick={handleDeleteClick}
                    className="flex items-center px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <Trash2 size={14} className="mr-2" /> Delete Record
                  </button>
                )}

              {normalizedStatus === "completed" && (
                <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                  No actions available
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Deny Modal */}
      <Dialog open={isDenyModalOpen} onOpenChange={setIsDenyModalOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {normalizedStatus === "pending"
                ? "Deny Request"
                : "Cancel Booking"}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure? This will change the status to{" "}
              <strong>
                {normalizedStatus === "pending" ? "Denied" : "Cancelled"}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDenyModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() =>
                updateBookingStatus(
                  normalizedStatus === "pending" ? "denied" : "cancelled",
                )
              }
            >
              Yes, Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Booking
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure you want to permanently delete this booking? This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={deleteBooking}
              className="w-full sm:w-auto"
            >
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Modal for Competing Pending Requests */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Booking?
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Confirming this booking will auto-deny{" "}
              <strong>{competingPendingCount}</strong> other pending request
              {competingPendingCount === 1 ? "" : "s"} for this time slot.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
            <Button
              className="w-full bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] sm:w-auto"
              onClick={async () => {
                setIsConfirmModalOpen(false);
                await updateBookingStatus("confirmed");
              }}
              disabled={isLoading}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={!!errorMessage} onOpenChange={() => setErrorMessage(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Error
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setErrorMessage(null)}
              className="w-full sm:w-auto"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Form */}
      {isRescheduleFormOpen && (
        <RescheduleBookingForm
          isOpen={isRescheduleFormOpen}
          onClose={() => setIsRescheduleFormOpen(false)}
          bookingId={bookingKey}
          onSave={handleRescheduleComplete}
        />
      )}
    </>
  );
}
