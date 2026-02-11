// components/bookings/BookingCardMobile.tsx
"use client";

import { memo } from "react";
import { Clock, HardHat, Briefcase, History } from "lucide-react";
import { formatDate, formatTime, isToday } from "@/lib/bookingHelpers";
import BookingCardDropdown from "./BookingCardDropdown";
import type { TransformedBooking } from "@/types";

interface BookingCardMobileProps {
  booking: TransformedBooking;
  onActionComplete?: () => void;
  isDropdownOpen: boolean;
  onDropdownToggle: (bookingKey: string) => void;
  onViewHistory?: (booking: TransformedBooking) => void;
}

function BookingCardMobile({
  booking,
  onActionComplete,
  isDropdownOpen,
  onDropdownToggle,
  onViewHistory,
}: BookingCardMobileProps) {
  const { day, dayOfWeek, date } = formatDate(booking.bookingTimeDt);
  const timeRange = formatTime(
    booking.bookingTimeDt,
    booking.bookingDurationMins,
    booking.bookingStartTime,
    booking.bookingEndTime,
  );
  const today = isToday(date);

  const isSubcontractor = !!booking.subcontractorId;
  const RoleIcon = isSubcontractor ? HardHat : Briefcase;

  const handleToggle = () => onDropdownToggle(booking.bookingKey);
  const status = (booking.bookingStatus || "").toString().toLowerCase();

  return (
    <div
      className={`
        bg-white rounded-xl p-4 border border-slate-200 
        shadow-[0_2px_8px_rgba(0,0,0,0.02)]
    `}
    >
      <div className="flex mb-3">
        {/* Date */}
        <div
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border flex-shrink-0 mr-3 
            ${
              today
                ? "bg-orange-50 border-orange-100 text-orange-700"
                : "bg-slate-50 border-slate-100 text-slate-600"
            }`}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider">
            {dayOfWeek}
          </span>
          <span className="text-lg font-bold leading-none">
            {String(day).padStart(2, "0")}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div className="font-bold text-slate-900 truncate pr-2">
              {booking.bookingTitle || "Booking"}
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border shrink-0
                    ${
                      status === "confirmed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : status === "pending"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : status === "cancelled" || status === "denied"
                            ? "bg-red-50 text-red-700 border-red-100"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                    }
                `}
            >
              {status}
            </span>
          </div>
          <p className="text-xs text-slate-600 truncate">
            {booking.bookingDescription}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Clock size={12} className="text-slate-400" />
            {timeRange}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <RoleIcon size={12} className="text-slate-400" />
            <span className="truncate max-w-[150px]">{booking.bookingFor}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex -space-x-1 mr-1">
            {Array.isArray(booking.bookedAssets) &&
              booking.bookedAssets
                .slice(0, 2)
                .map((asset: string, i: number) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white"
                  />
                ))}
          </div>

          {/* History Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewHistory?.(booking);
            }}
            className="cursor-pointer h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="View history"
            aria-label="View booking history"
          >
            <History size={14} />
          </button>

          <BookingCardDropdown
            bookingKey={booking.bookingKey}
            bookingStatus={booking.bookingStatus}
            subcontractorId={booking.subcontractorId}
            isOpen={isDropdownOpen}
            onToggle={handleToggle}
            onActionComplete={onActionComplete}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(BookingCardMobile);
