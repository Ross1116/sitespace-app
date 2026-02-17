// components/bookings/BookingCardMobile.tsx
"use client";

import { memo } from "react";
import { Clock, HardHat, Briefcase, History, MapPin } from "lucide-react";
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
  const pendingRequestCount = booking.competingPendingCount ?? 0;

  return (
    <div
      className={`
        bg-white rounded-xl p-4 sm:p-5 border border-slate-200 
        shadow-[0_2px_8px_rgba(0,0,0,0.02)]
    `}
    >
      <div className="mb-3.5 flex">
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

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="truncate pr-2 font-bold text-slate-900">
              {booking.bookingTitle || "Booking"}
            </div>
            <div className="flex flex-row flex-wrap items-center gap-1.5 sm:flex-col sm:items-end">
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

              {pendingRequestCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-orange-50 text-orange-700 border-orange-100">
                  {pendingRequestCount} request
                  {pendingRequestCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Clock size={12} className="text-slate-400" />
            <span className="truncate">{timeRange}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium min-w-0">
            <RoleIcon size={12} className="text-slate-400" />
            <span className="text-[10px] uppercase tracking-wide font-bold text-slate-500 shrink-0">
              Booked by:
            </span>
            <span
              className="truncate min-w-0 text-slate-700"
              title={booking.bookingFor}
            >
              {booking.bookingFor}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <MapPin size={12} className="text-blue-500" />
            <span className="truncate text-blue-700">
              {booking.assetName ||
                booking.bookedAssets?.[0] ||
                "Unknown Asset"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1">
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
