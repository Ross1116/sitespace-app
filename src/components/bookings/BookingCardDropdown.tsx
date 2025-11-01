"use client";

import { Calendar, X, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

interface BookingCardDropdownProps {
  bookingKey: string;
  bookingStatus: string;
  isOpen: boolean;
  onToggle: () => void;
  onActionComplete?: () => void;
}

export default function BookingCardDropdown({
  bookingKey,
  bookingStatus,
  isOpen,
  onToggle,
  onActionComplete,
}: BookingCardDropdownProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const hasManagerPrivileges =
    user?.role === "admin" || user?.role === "manager";

  // Update booking status using new backend
  const updateBookingStatus = async (
    newStatus: "pending" | "confirmed" | "completed" | "cancelled"
  ) => {
    setIsLoading(true);
    try {
      // Use new backend endpoint for status update
      await api.patch(`/bookings/${bookingKey}/status`, null, {
        params: { new_status: newStatus },
      });

      console.log(`Booking ${bookingKey} status updated to ${newStatus}`);
      onActionComplete?.();
    } catch (error: any) {
      console.error("Error updating booking status:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to update booking";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
      onToggle();
    }
  };

  const confirmBooking = () => updateBookingStatus("confirmed");
  const denyBooking = () => updateBookingStatus("cancelled");
  const cancelBooking = () => updateBookingStatus("cancelled");
  const completeBooking = () => updateBookingStatus("completed");

  const rescheduleBooking = async () => {
    setIsLoading(true);
    try {
      // Fetch booking details
      const response = await api.get(`/bookings/${bookingKey}`);
      const bookingDetails = response.data;

      console.log("Booking details for reschedule:", bookingDetails);

      // Here you would typically open a reschedule modal/form
      // For now, just log the details
      alert(
        "Reschedule functionality - implement modal with booking details"
      );

      onToggle();
    } catch (error) {
      console.error("Error fetching booking details for reschedule:", error);
      alert("Failed to fetch booking details");
    } finally {
      setIsLoading(false);
    }
  };

  // Normalize status for comparison (backend uses lowercase)
  const normalizedStatus = bookingStatus.toLowerCase();

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        disabled={isLoading}
        className={`px-3 py-1 text-xs rounded-md flex items-center
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
            {/* Pending status actions (Manager/Admin only) */}
            {normalizedStatus === "pending" && hasManagerPrivileges && (
              <>
                <button
                  onClick={confirmBooking}
                  disabled={isLoading}
                  className="flex items-center px-3 py-2 text-xs text-green-600 hover:bg-gray-100 w-full text-left disabled:opacity-50"
                >
                  <Calendar size={14} className="mr-2" />
                  Confirm booking
                </button>
                <button
                  onClick={denyBooking}
                  disabled={isLoading}
                  className="flex items-center px-3 py-2 text-xs text-red-600 hover:bg-gray-100 w-full text-left disabled:opacity-50"
                >
                  <X size={14} className="mr-2" />
                  Deny booking
                </button>
                <div className="border-t my-1"></div>
              </>
            )}

            {/* Confirmed status actions */}
            {normalizedStatus === "confirmed" && (
              <>
                <button
                  onClick={completeBooking}
                  disabled={isLoading}
                  className="flex items-center px-3 py-2 text-xs text-blue-600 hover:bg-gray-100 w-full text-left disabled:opacity-50"
                >
                  <Calendar size={14} className="mr-2" />
                  Mark as completed
                </button>
                <button
                  onClick={cancelBooking}
                  disabled={isLoading}
                  className="flex items-center px-3 py-2 text-xs text-red-600 hover:bg-gray-100 w-full text-left disabled:opacity-50"
                >
                  <X size={14} className="mr-2" />
                  Cancel booking
                </button>
                <div className="border-t my-1"></div>
              </>
            )}

            {/* Reschedule option (available for pending and confirmed) */}
            {(normalizedStatus === "pending" ||
              normalizedStatus === "confirmed") && (
              <button
                onClick={rescheduleBooking}
                disabled={isLoading}
                className="flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 w-full text-left disabled:opacity-50"
              >
                <Calendar size={14} className="mr-2" />
                Reschedule booking
              </button>
            )}

            {/* No actions for completed or cancelled bookings */}
            {(normalizedStatus === "completed" ||
              normalizedStatus === "cancelled") && (
              <div className="px-3 py-2 text-xs text-gray-500 text-center">
                No actions available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}