"use client";

import { useState, useEffect, Fragment, useMemo } from "react";
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

const ITEMS_PER_PAGE = 10;

export default function BookingList({
  bookings,
  activeTab,
  loading,
  onActionComplete,
}: BookingListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // 1. FILTER & SORT
  const processedBookings = useMemo(() => {
    if (!bookings) return [];

    // A. Filter based on Tab
    const filtered = bookings.filter((booking) => {
      const status = (booking.bookingStatus || "").toLowerCase();
      
      const startDt = booking.bookingStart ? new Date(booking.bookingStart) : new Date();
      const endDt = booking.bookingEnd ? new Date(booking.bookingEnd) : startDt;
      const now = new Date();

      if (activeTab === "Upcoming") {
        // Upcoming: End date is in the future AND not cancelled/denied
        return endDt >= now && status !== "cancelled" && status !== "denied";
      }

      if (activeTab === "All") return true;

      // Exact Status Match
      return status === activeTab.toLowerCase();
    });

    // B. Sort (Ascending: Oldest -> Newest)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.bookingStart).getTime();
      const dateB = new Date(b.bookingStart).getTime();
      return dateA - dateB;
    });
  }, [bookings, activeTab]);

  // 2. INTELLIGENT PAGE JUMP LOGIC
  useEffect(() => {
    if (processedBookings.length === 0) {
      setCurrentPage(1);
      return;
    }

    const now = new Date();
    
    // Find the index of the first booking that starts NOW or in the FUTURE
    const todayIndex = processedBookings.findIndex((b) => {
      const start = new Date(b.bookingStart);
      return start >= now;
    });

    if (todayIndex !== -1) {
      // Case A: Future bookings exist (e.g. All, Confirmed, Pending)
      const targetPage = Math.floor(todayIndex / ITEMS_PER_PAGE) + 1;
      setCurrentPage(targetPage);
    } else {
      // Case B: All bookings are in the past (e.g. Completed, History)
      const lastPage = Math.ceil(processedBookings.length / ITEMS_PER_PAGE);
      setCurrentPage(lastPage);
    }
  }, [activeTab, processedBookings]);

  // 3. PAGINATION CALCS
  const totalItems = processedBookings.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBookings = processedBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // 4. GROUPING
  const groupedBookings = useMemo(() => {
    return groupBookings(paginatedBookings);
  }, [paginatedBookings]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (typeof window !== "undefined") {
    }
  };

  if (loading) {
    return (
      <>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="border-b last:border-b-0 my-2 bg-stone-50">
            <div className="p-3 animate-pulse">
              <div className="flex mb-2">
                <div className="bg-gray-200 rounded p-1 w-12 h-14 mr-3"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </>
    );
  }

  if (processedBookings.length === 0) {
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
    <div className="space-y-4">
      {/* Booking List */}
      <div>
        {Object.keys(groupedBookings).map((month) => {
          const monthBookings = groupedBookings[month];
          if (monthBookings.length === 0) return null;

          return (
            <div key={month}>
              {/* Month Divider */}
              <div className="mt-4 sm:mt-6 mb-2 sticky top-0 bg-stone-100 z-10 py-1">
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
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-1 sm:space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-2 sm:px-3 py-1 rounded text-sm ${
              currentPage === 1 
                ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                : "bg-orange-200 text-gray-700 hover:bg-orange-300"
            }`}
          >
            Prev
          </button>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNumber;
            // Logic to keep the active page centered in the pagination list
            if (totalPages <= 7) pageNumber = i + 1;
            else if (currentPage <= 4) pageNumber = i + 1;
            else if (currentPage >= totalPages - 3) pageNumber = totalPages - 6 + i;
            else pageNumber = currentPage - 3 + i;

            return (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`px-2 sm:px-3 py-1 rounded text-sm ${
                  currentPage === pageNumber
                    ? "bg-orange-400 text-white"
                    : "bg-orange-200 text-gray-700 hover:bg-orange-300"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-2 sm:px-3 py-1 rounded text-sm ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-orange-200 text-gray-700 hover:bg-orange-300"
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Showing X to Y of Z Text */}
      {totalItems > 0 && (
        <div className="text-center mt-2 text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} bookings
        </div>
      )}
    </div>
  );
}