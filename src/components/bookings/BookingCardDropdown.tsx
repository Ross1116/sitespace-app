"use client";

import { Calendar, X, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { useState } from "react";
import { format } from "date-fns";

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

  const getBookingDetails = async () => {
    try {
      const response = await api.get(
        "/api/auth/slotBooking/editSlotBookingdetails",
        {
          params: { bookingKey: bookingKey },
        }
      );
      const data = response.data.bookingList[0]
      const updatedData = {
        ...data,
        bookingTimeDt: format(data.bookingTimeDt	,"yyyy-MM-dd'T'HH:mm:ss")
      };
      return updatedData
    } catch (error) {
      console.error("Error fetching booking details:", error);
      throw error;
    }
  };

  const confirmBooking = async () => {
    setIsLoading(true);
    try {
      const bookingDetails = await getBookingDetails();
      const updatedBooking = {
        ...bookingDetails,
        bookingStatus: "Confirmed",
      };

      await api.post("/api/auth/slotBooking/updateSlotBooking", updatedBooking);
      console.log(updatedBooking)

      onActionComplete?.();
    } catch (error) {
      console.error("Error confirming booking:", error);
    } finally {
      setIsLoading(false);
      onToggle();
    }
  };

  const denyBooking = async () => {
    setIsLoading(true);
    try {
      const bookingDetails = await getBookingDetails();

      const updatedBooking = {
        ...bookingDetails,
        bookingStatus: "Denied",
      };

      await api.post("/api/auth/slotBooking/updateSlotBooking", updatedBooking);

      onActionComplete?.();
    } catch (error) {
      console.error("Error confirming booking:", error);
    } finally {
      setIsLoading(false);
      onToggle();
    }
  };

  const cancelBooking = async () => {
    setIsLoading(true);
    try {
      const bookingDetails = await getBookingDetails();

      const updatedBooking = {
        ...bookingDetails,
        bookingStatus: "Cancelled",
      };

      await api.post("/api/auth/slotBooking/updateSlotBooking", updatedBooking);

      onActionComplete?.();
    } catch (error) {
      console.error("Error canceling booking:", error);
    } finally {
      setIsLoading(false);
      onToggle();
    }
  };

  const rescheduleBooking = async () => {
    setIsLoading(true);
    try {
      const bookingDetails = await getBookingDetails();

      // Here you would typically navigate to a reschedule form
      // or open a modal with the booking details
      console.log("Booking details for reschedule:", bookingDetails);

      // You might want to store these details in a state or context
      // and navigate to a reschedule page

      onToggle();
    } catch (error) {
      console.error("Error fetching booking details for reschedule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        disabled={isLoading}
        className={`px-3 py-1 text-xs rounded-md flex items-center
        ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
        ${
          bookingStatus === "Pending"
            ? "bg-gray-800 text-white hover:bg-gray-700"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }`}
      >
        Edit
        <ChevronDown
          size={14}
          className={`ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-1 w-48 bg-white rounded-md shadow-lg z-10 border">
          <div className="py-1">
            {bookingStatus === "Pending" && (
              <>
                <button
                  onClick={confirmBooking}
                  disabled={isLoading}
                  className="flex items-center px-3 py-2 text-xs text-green-600 hover:bg-gray-100 w-full text-left"
                >
                  <Calendar size={14} className="mr-2" />
                  Confirm booking
                </button>
                <button
                  onClick={denyBooking}
                  disabled={isLoading}
                  className="flex items-center px-3 py-2 text-xs text-red-600 hover:bg-gray-100 w-full text-left"
                >
                  <X size={14} className="mr-2" />
                  Deny booking
                </button>
                <div className="border-t my-1"></div>
              </>
            )}
            <button
              onClick={rescheduleBooking}
              disabled={isLoading}
              className="flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <Calendar size={14} className="mr-2" />
              Reschedule booking
            </button>
            {bookingStatus === "Confirmed" && (
              <button
                onClick={cancelBooking}
                disabled={isLoading}
                className="flex items-center px-3 py-2 text-xs text-red-600 hover:bg-gray-100 w-full text-left"
              >
                <X size={14} className="mr-2" />
                Cancel booking
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
