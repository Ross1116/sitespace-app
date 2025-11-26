"use client";

import { useState } from "react";
import { Calendar, X, ChevronDown, AlertTriangle, Trash2 } from "lucide-react";
import api from "@/lib/api";
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

interface BookingCardDropdownProps {
  bookingKey: string;
  bookingStatus: string;
  subcontractorId?: string; // ✅ Added to check ownership
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
  
  // Modal States
  const [isDenyModalOpen, setIsDenyModalOpen] = useState(false); // For Managers
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // For Subcontractors/Delete
  const [isRescheduleFormOpen, setIsRescheduleFormOpen] = useState(false);
  
  const { user } = useAuth();
  const hasManagerPrivileges = user?.role === "admin" || user?.role === "manager";
  const isMyBooking = user?.role === "subcontractor" && user?.id === subcontractorId;

  // --- Logic: Update Status (Patch) ---
  const updateBookingStatus = async (
    newStatus: "pending" | "confirmed" | "completed" | "cancelled" | "denied"
  ) => {
    setIsLoading(true);
    try {
      await api.patch(`/bookings/${bookingKey}/status`, null, {
        params: { new_status: newStatus },
      });
      onActionComplete?.();
    } catch (error: any) {
      console.error("Error updating status:", error);
      alert(error.response?.data?.detail || "Failed to update booking");
    } finally {
      setIsLoading(false);
      if (isOpen) onToggle();
      setIsDenyModalOpen(false);
    }
  };

  // --- Logic: Delete Booking (Delete) ---
  const deleteBooking = async () => {
    setIsLoading(true);
    try {
        // By default soft delete (cancelled), passing hard_delete=true removes it entirely
        // Based on your request "this booking should be deleted instead", we use DELETE method.
        // If your backend delete defaults to soft-delete, pass ?hard_delete=true if you want it gone-gone.
        await api.delete(`/bookings/${bookingKey}`, {
            params: { hard_delete: true } 
        });
        onActionComplete?.();
    } catch (error: any) {
        console.error("Error deleting booking:", error);
        alert(error.response?.data?.detail || "Failed to delete booking");
    } finally {
        setIsLoading(false);
        if (isOpen) onToggle();
        setIsDeleteModalOpen(false);
    }
  };

  // Actions
  const confirmBooking = () => updateBookingStatus("confirmed");
  const completeBooking = () => updateBookingStatus("completed");
  
  // Modals Triggers
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
        <button
          onClick={onToggle}
          disabled={isLoading}
          className={`px-3 py-1 text-xs rounded-md flex items-center transition-colors
          ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
          ${
            normalizedStatus === "pending"
              ? "bg-gray-800 text-white hover:bg-gray-700"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }`}
        >
          {isLoading ? "Loading..." : "Edit"}
          <ChevronDown
            size={14}
            className={`ml-1 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute bottom-full right-0 mb-1 w-48 bg-white rounded-md shadow-lg z-10 border">
            <div className="py-1">
              
              {/* --- PENDING --- */}
              {normalizedStatus === "pending" && (
                <>
                  {/* Managers: Confirm or Deny */}
                  {hasManagerPrivileges && (
                    <>
                      <button
                        onClick={confirmBooking}
                        className="flex items-center px-3 py-2 text-xs text-green-600 hover:bg-gray-100 w-full text-left"
                      >
                        <Calendar size={14} className="mr-2" />
                        Confirm booking
                      </button>
                      <button
                        onClick={handleDenyClick}
                        className="flex items-center px-3 py-2 text-xs text-red-600 hover:bg-gray-100 w-full text-left"
                      >
                        <X size={14} className="mr-2" />
                        Deny booking
                      </button>
                    </>
                  )}
                  
                  {/* Subcontractors: Reschedule or Delete (Cancel Request) */}
                  {isMyBooking && (
                     <>
                        <button
                            onClick={handleRescheduleClick}
                            className="flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                            <Calendar size={14} className="mr-2" />
                            Reschedule
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="flex items-center px-3 py-2 text-xs text-red-600 hover:bg-gray-100 w-full text-left"
                        >
                            <Trash2 size={14} className="mr-2" />
                            Cancel Request
                        </button>
                     </>
                  )}
                </>
              )}

              {/* --- CONFIRMED --- */}
              {normalizedStatus === "confirmed" && (
                <>
                   {hasManagerPrivileges && (
                        <button
                            onClick={completeBooking}
                            className="flex items-center px-3 py-2 text-xs text-blue-600 hover:bg-gray-100 w-full text-left"
                        >
                            <Calendar size={14} className="mr-2" />
                            Mark as completed
                        </button>
                   )}

                   {/* Both Manager and Sub can Reschedule */}
                    <button
                        onClick={handleRescheduleClick}
                        className="flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                        <Calendar size={14} className="mr-2" />
                        Reschedule
                    </button>
                   
                   {/* Both can Cancel (Manager sets status, Sub deletes) */}
                   {hasManagerPrivileges ? (
                        <button
                            onClick={handleDenyClick}
                            className="flex items-center px-3 py-2 text-xs text-red-600 hover:bg-gray-100 w-full text-left"
                        >
                            <X size={14} className="mr-2" />
                            Cancel booking
                        </button>
                   ) : (
                        <button
                            onClick={handleDeleteClick}
                            className="flex items-center px-3 py-2 text-xs text-red-600 hover:bg-gray-100 w-full text-left"
                        >
                            <Trash2 size={14} className="mr-2" />
                            Cancel booking
                        </button>
                   )}
                </>
              )}

              {/* --- CANCELLED / DENIED --- */}
              {(normalizedStatus === "cancelled" || normalizedStatus === "denied") && (
                <>
                    {/* Subcontractor can delete the denied/cancelled record entirely */}
                    {isMyBooking && (
                        <button
                            onClick={handleDeleteClick}
                            className="flex items-center px-3 py-2 text-xs text-red-600 hover:bg-gray-100 w-full text-left"
                        >
                            <Trash2 size={14} className="mr-2" />
                            Delete Record
                        </button>
                    )}
                </>
              )}
              
              {/* --- COMPLETED --- */}
              {normalizedStatus === "completed" && (
                <div className="px-3 py-2 text-xs text-gray-500 text-center">
                  No actions available
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Manager Deny Modal (Updates Status) */}
      <Dialog open={isDenyModalOpen} onOpenChange={setIsDenyModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {normalizedStatus === 'pending' ? "Deny Request" : "Cancel Booking"}
            </DialogTitle>
            <DialogDescription>
              Are you sure? This will change the status to <strong>{normalizedStatus === 'pending' ? "Denied" : "Cancelled"}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button variant="outline" onClick={() => setIsDenyModalOpen(false)}>
              Back
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => updateBookingStatus(normalizedStatus === 'pending' ? "denied" : "cancelled")}
            >
              Yes, {normalizedStatus === 'pending' ? "Deny" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcontractor Delete Modal (Deletes Record) */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Booking
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this booking? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Back
            </Button>
            <Button variant="destructive" onClick={deleteBooking}>
              Yes, Delete
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