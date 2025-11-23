"use client";

import { useState } from 'react';
import { Clock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate, formatTime, getBookingIcon, isToday } from './../../lib/bookingHelpers';
import BookingCardDropdown from './BookingCardDropdown';

interface BookingCardDesktopProps {
  booking: any;
  onActionComplete?: () => void;
}

export default function BookingCardDesktop({ booking, onActionComplete }: BookingCardDesktopProps) {
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

  return (
    <Card className="border-b last:border-b-0 my-2 bg-stone-50">
      <div className="hidden sm:flex w-full">
        {/* Date column - fixed width */}
        <div className="w-24 sm:w-32 flex-shrink-0 flex flex-col items-center text-center justify-center border-r-2 mr-4">
          <div
            className={`text-gray-500 text-sm sm:text-lg ${
              today
                ? "text-orange-500"
                : booking.bookingStatus === "Pending"
                ? "text-yellow-400"
                : "text-gray-500"
            }`}
          >
            {dayOfWeek}
          </div>
          <div
            className={`text-2xl sm:text-4xl font-semibold ${
              today
                ? "text-orange-600"
                : booking.bookingStatus === "Pending"
                ? "text-yellow-500"
                : "text-gray-800"
            }`}
          >
            {String(day).padStart(2, "0")}
          </div>
        </div>

        {/* Content area with fixed widths */}
        <div className="flex flex-1 flex-wrap md:flex-nowrap">
          {/* Left details column */}
          <div className="w-full md:w-64 lg:w-80 flex-shrink-0 flex flex-col mb-2 md:mb-0">
            <div className="flex items-center text-gray-500 mb-1">
              <Clock size={16} className="mr-1" />
              <span>{timeRange}</span>
              {booking.bookingStatus === "Pending" && (
                <AlertCircle
                  size={16}
                  className="ml-2 text-yellow-400"
                />
              )}
            </div>

            <div className="flex items-center text-gray-500 mb-1">
              <BookingIcon size={16} className={`mr-1 ${iconColor}`} />
              <span>{booking.bookingFor}</span>
            </div>

            {/* Asset tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {booking.bookedAssets.map((asset: string) => (
                <span
                  key={asset}
                  className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
                >
                  {asset}
                </span>
              ))}
            </div>
          </div>

          {/* Middle description column */}
          <div className="w-full md:flex-1 px-0 md:px-4">
            <div className="font-semibold text-base lg:text-lg text-gray-900 mb-1 text-left">
              {booking.bookingTitle}
            </div>
            <div className="text-sm lg:text-md text-gray-700 mb-2 text-left">
              {booking.bookingDescription}
            </div>
            <div className="text-xs lg:text-sm text-gray-500 mb-2 text-left">
              {booking.bookingNotes}
            </div>
          </div>

          {/* Right action column */}
          <div className="w-full md:w-24 mt-2 md:mt-0 md:ml-auto flex-shrink-0 flex items-start justify-end relative md:mr-4 lg:mr-8">
            <BookingCardDropdown
              bookingKey={booking.bookingKey}
              bookingStatus={booking.bookingStatus}
              isOpen={openDropdown}
              onToggle={toggleDropdown}
              onActionComplete={onActionComplete}
            />

            {/* Status badge */}
            <div
              className={`absolute bottom-0 right-0 text-xs px-2 py-1 rounded
              ${
                booking.bookingStatus === "Confirmed"
                  ? "bg-green-100 text-green-800"
                  : booking.bookingStatus === "Pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : booking.bookingStatus === "Denied"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {booking.bookingStatus}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}