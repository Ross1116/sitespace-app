"use client";

import { useState, useEffect, Fragment } from "react";
import { Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { groupBookings } from "../../lib/bookingHelpers";
import BookingCardMobile from "./BookingCardMobile";
import BookingCardDesktop from "./BookingCardDesktop";

interface BookingListProps {
  bookings: any[];
  activeTab: string;
  loading: boolean;
  onActionComplete?: () => void;
}

export default function BookingList({
  bookings,
  activeTab,
  loading,
  onActionComplete,
}: BookingListProps) {
  const [groupedBookings, setGroupedBookings] = useState<any>({});

  useEffect(() => {
    setGroupedBookings(groupBookings(bookings));
  }, [bookings]);

  const filteredBookings = (monthBookings: any[]) => {
    return monthBookings.filter((booking) => {
      const status = booking.bookingStatus.toLowerCase();

      // 1. UPCOMING: Future dates, excluding dead bookings
      if (activeTab === "Upcoming") {
        const bookingDate = new Date(booking.bookingTimeDt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return bookingDate >= today && status !== "cancelled" && status !== "denied";
      }
      
      // 2. ALL: Show everything
      if (activeTab === "All") return true;

      // 3. EXACT MATCH: Works for Pending, Confirmed, Completed, Cancelled, AND Denied
      return status === activeTab.toLowerCase();
    });
  };

  if (loading) {
    return (
      <>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card
            key={index}
            className="border-b last:border-b-0 my-2 bg-stone-50"
          >
            <div className="p-3 animate-pulse">
              <div className="flex mb-2">
                <div className="flex flex-col items-center justify-center mr-3 bg-gray-200 rounded p-1 w-12 h-14"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mt-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mt-2"></div>
              <div className="flex flex-wrap gap-1 mt-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded w-16"></div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </>
    );
  }

  // Check if there are any bookings that match the current filter
  const hasMatchingBookings = Object.keys(groupedBookings).some(
    (month) => filteredBookings(groupedBookings[month]).length > 0
  );

  if (!hasMatchingBookings) {
    return (
      <div className="py-6 sm:py-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 mb-3 sm:mb-4">
          <Calendar size={20} className="text-gray-400" />
        </div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
          No bookings found
        </h3>
        <p className="text-sm sm:text-base text-gray-500">
          There are no {activeTab.toLowerCase()} bookings to display.
        </p>
      </div>
    );
  }

  return (
    <>
      {Object.keys(groupedBookings).map((month) => {
        const monthBookings = filteredBookings(groupedBookings[month]);

        if (monthBookings.length === 0) return null;

        return (
          <div key={month}>
            {/* Month Divider */}
            <div className="mt-4 sm:mt-6 mb-2">
              <h2 className="text-base sm:text-lg font-medium text-gray-900">
                {month}
              </h2>
            </div>

            {monthBookings.map((booking: any) => (
              <Fragment key={booking.bookingKey}>
                <div className="block md:hidden">
                  <BookingCardMobile
                    booking={booking}
                    onActionComplete={onActionComplete}
                  />
                </div>
                <div className="hidden md:block">
                  <BookingCardDesktop
                    booking={booking}
                    onActionComplete={onActionComplete}
                  />
                </div>
              </Fragment>
            ))}
          </div>
        );
      })}
    </>
  );
}