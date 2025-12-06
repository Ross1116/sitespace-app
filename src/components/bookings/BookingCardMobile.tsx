"use client";

import { useState } from 'react';
import { Clock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate, formatTime, getBookingIcon, isToday } from './../../lib/bookingHelpers';
import BookingCardDropdown from './BookingCardDropdown';

interface BookingCardMobileProps {
  booking: any;
  onActionComplete?: () => void;
}

export default function BookingCardMobile({ booking, onActionComplete }: BookingCardMobileProps) {
  const [openDropdown, setOpenDropdown] = useState<boolean>(false);
  
  const { day, dayOfWeek, date } = formatDate(booking.bookingTimeDt);
  const timeRange = formatTime(
    booking.bookingTimeDt, 
    booking.bookingDurationMins,
    booking.bookingStartTime,
    booking.bookingEndTime
  );
  const today = isToday(date);
  const { icon: BookingIcon, color: iconColor } = getBookingIcon(booking.bookingFor);

  const toggleDropdown = () => {
    setOpenDropdown(!openDropdown);
  };

  const status = (booking.bookingStatus || "").toString().toLowerCase();

  return (
    <Card className="border-b last:border-b-0 my-2 bg-stone-50">
      <div className="block sm:hidden p-3">
        {/* Header with date and status */}
        <div className="flex mb-2">
          <div className="flex flex-col items-center justify-center mr-3 bg-gray-50 rounded p-1 w-12">
            <div
              className={`text-xs ${
                today
                  ? "text-orange-500"
                  : status === "pending"
                  ? "text-yellow-400"
                  : "text-gray-500"
              }`}
            >
              {dayOfWeek}
            </div>
            <div
              className={`text-xl font-semibold ${
                today
                  ? "text-orange-600"
                  : status === "pending"
                  ? "text-yellow-500"
                  : "text-gray-800"
              }`}
            >
              {String(day).padStart(2, "0")}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                {/* Primary bold title */}
                <div className="font-semibold text-gray-900">
                  {booking.bookingTitle || "Booking"}
                </div>

                {/* Description (secondary) */}
                {booking.bookingDescription && (
                  <div className="text-xs text-gray-700 mt-0.5 truncate">
                    {booking.bookingDescription}
                  </div>
                )}

                {/* Project as tiny muted subscript */}
                {booking.projectName && (
                  <div className="text-[11px] text-gray-400 mt-1">
                    {booking.projectName}
                  </div>
                )}
              </div>

              <div
                className={`text-xs px-2 py-1 rounded ml-1 flex-shrink-0 ${
                  status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : status === "denied" || status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {booking.bookingStatus}
              </div>
            </div>

            <div className="flex items-center text-xs text-gray-500 mt-1">
              <Clock size={12} className="mr-1" />
              <span>{timeRange}</span>
              {status === "pending" && (
                <AlertCircle
                  size={12}
                  className="ml-1 text-yellow-400"
                />
              )}
            </div>

            {/* Booking details - aligned with date */}
            <div className="mt-2">
              {booking.bookingNotes && (
                <div className="text-xs text-gray-500">
                  {booking.bookingNotes}
                </div>
              )}
            </div>

            <div className="flex items-center text-xs text-gray-500 mt-2">
              <BookingIcon size={16} className={`mr-1 ${iconColor}`} />
              <span>{booking.bookingFor}</span>
            </div>

            {/* Asset tags and edit button in same row */}
            <div className="flex justify-between items-center mt-1.5">
              <div className="flex flex-wrap gap-1 flex-1">
                {Array.isArray(booking.bookedAssets) &&
                  booking.bookedAssets.map((asset: string) => (
                    <span
                      key={asset}
                      className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
                    >
                      {asset}
                    </span>
                  ))}
              </div>

              {/* Edit button aligned with asset tags */}
              <div className="relative ml-2">
                <BookingCardDropdown
                  bookingKey={booking.bookingKey}
                  bookingStatus={booking.bookingStatus}
                  subcontractorId={booking.subcontractorId}
                  isOpen={openDropdown}
                  onToggle={toggleDropdown}
                  onActionComplete={onActionComplete}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
