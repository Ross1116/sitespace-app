"use client";

import { Clock, HardHat, Briefcase, MapPin, History } from "lucide-react";
import { formatDate, formatTime, isToday } from "@/lib/bookingHelpers";
import BookingCardDropdown from "./BookingCardDropdown";

interface BookingCardDesktopProps {
  booking: any;
  onActionComplete?: () => void;
  isDropdownOpen: boolean;
  onDropdownToggle: (bookingKey: string) => void;
  onViewHistory?: (booking: any) => void;
}

export default function BookingCardDesktop({
  booking,
  onActionComplete,
  isDropdownOpen,
  onDropdownToggle,
  onViewHistory,
}: BookingCardDesktopProps) {
  const { day, month } = formatDate(booking.bookingTimeDt);
  const timeRange = formatTime(
    booking.bookingTimeDt,
    booking.bookingDurationMins,
    booking.bookingStartTime,
    booking.bookingEndTime,
  );
  const today = isToday(new Date(booking.bookingTimeDt));

  const isSubcontractor = !!booking.subcontractorId;
  const RoleIcon = isSubcontractor ? HardHat : Briefcase;

  const handleToggle = () => onDropdownToggle(booking.bookingKey);
  const status = (booking.bookingStatus || "").toString().toLowerCase();

  return (
    <div
      className={`
        group relative bg-white rounded-xl p-5
        border border-slate-200 
        mb-3 cursor-pointer
        
        ${
          isDropdownOpen
            ? "z-[99] border-slate-300 shadow-md relative"
            : "z-0 hover:z-40 hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200"
        }
      `}
    >
      <div className="grid grid-cols-[auto_340px_1fr_auto] gap-8 items-center">
        {/* COL 1: DATE */}
        <div
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border transition-colors
            ${
              today
                ? "bg-orange-50 border-orange-100 text-orange-700"
                : "bg-slate-50 border-slate-100 text-slate-600"
            }`}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider">
            {month}
          </span>
          <span className="text-xl font-bold leading-none">
            {String(day).padStart(2, "0")}
          </span>
        </div>

        {/* COL 2: INFO */}
        <div className="flex flex-col gap-2 border-r border-slate-100 pr-6 h-full justify-center">
          <h3
            className="font-bold text-slate-900 text-base leading-tight truncate"
            title={booking.bookingTitle}
          >
            {booking.bookingTitle || "Booking"}
          </h3>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Clock size={13} className="text-slate-400" />
              <span>{timeRange}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <RoleIcon size={13} className="text-slate-400" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">
                  Assigned to:
                </span>
                <span className="truncate max-w-[120px] text-slate-700">
                  {booking.bookingFor}
                </span>
              </div>

              {Array.isArray(booking.bookedAssets) &&
                booking.bookedAssets.length > 0 && (
                  <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                    <MapPin size={13} className="text-blue-500" />
                    <span className="text-xs font-bold text-blue-700 truncate max-w-[100px]">
                      {booking.bookedAssets[0]}
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* COL 3: DESCRIPTION */}
        <div className="px-2">
          <p
            className={`text-sm leading-relaxed line-clamp-2 ${
              booking.bookingDescription
                ? "text-slate-600"
                : "text-slate-400 italic"
            }`}
          >
            {booking.bookingDescription || "No description provided."}
          </p>
        </div>

        {/* COL 4: STATUS & ACTIONS */}
        <div className="flex flex-col items-end gap-3 pl-6 border-l border-slate-100 h-full justify-center min-w-[120px]">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border
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

          <div className="relative w-full flex justify-end items-center gap-1.5">
            {/* History Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory?.(booking);
              }}
              className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="View history"
            >
              <History size={15} />
            </button>

            <div data-booking-dropdown>
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
      </div>
    </div>
  );
}
