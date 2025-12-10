"use client";

import { useState, useEffect, Fragment, useMemo } from "react";
import { Calendar } from "lucide-react";
import { groupBookings } from "@/lib/bookingHelpers";
import BookingCardMobile from "./BookingCardMobile";
import BookingCardDesktop from "./BookingCardDesktop";
import { Button } from "@/components/ui/button";

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

    const filtered = bookings.filter((booking) => {
      const status = (booking.bookingStatus || "").toLowerCase();
      const endDt = booking.bookingEnd ? new Date(booking.bookingEnd) : new Date();
      const now = new Date();

      if (activeTab === "Upcoming") {
        return endDt >= now && status !== "cancelled" && status !== "denied";
      }
      if (activeTab === "All") return true;
      return status === activeTab.toLowerCase();
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.bookingStart).getTime();
      const dateB = new Date(b.bookingStart).getTime();
      return dateA - dateB;
    });
  }, [bookings, activeTab]);

  // 2. PAGE JUMP LOGIC
  useEffect(() => {
    if (processedBookings.length === 0) {
      setCurrentPage(1);
      return;
    }
    const now = new Date();
    const todayIndex = processedBookings.findIndex((b) => new Date(b.bookingStart) >= now);

    if (todayIndex !== -1) {
      const targetPage = Math.floor(todayIndex / ITEMS_PER_PAGE) + 1;
      setCurrentPage(targetPage);
    } else {
      const lastPage = Math.ceil(processedBookings.length / ITEMS_PER_PAGE);
      setCurrentPage(lastPage);
    }
  }, [activeTab, processedBookings]);

  // 3. PAGINATION
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
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 bg-slate-50 rounded-xl animate-pulse border border-slate-100" />
        ))}
      </div>
    );
  }

  if (processedBookings.length === 0) {
    return (
      <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
          <Calendar size={20} className="text-slate-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          No bookings found
        </h3>
        <p className="text-xs text-slate-500">
          There are no {activeTab.toLowerCase()} bookings to display.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Booking List */}
      <div>
        {Object.keys(groupedBookings).map((month) => {
          const monthBookings = groupedBookings[month];
          if (monthBookings.length === 0) return null;

          return (
            <div key={month} className="mb-6">
              {/* Month Divider */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-2 mb-2 border-b border-slate-50">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">
                  {month}
                </h2>
              </div>

              <div className="space-y-3">
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
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4 border-t border-slate-100">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-[#0B1120] text-white hover:bg-[#1a253a] disabled:bg-slate-200 disabled:text-slate-400 rounded-full h-9 px-6 text-xs font-bold"
          >
            Prev
          </Button>

          <span className="text-xs font-bold text-slate-500">
             Page <span className="text-slate-900">{currentPage}</span> of <span className="text-slate-900">{totalPages}</span>
          </span>

          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-[#0B1120] text-white hover:bg-[#1a253a] disabled:bg-slate-200 disabled:text-slate-400 rounded-full h-9 px-6 text-xs font-bold"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}