"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Calendar } from "lucide-react";
import { groupBookings } from "@/lib/bookingHelpers";
import BookingCardMobile from "./BookingCardMobile";
import BookingCardDesktop from "./BookingCardDesktop";
import BookingHistorySidebar from "./BookingHistorySidebar";
import { Button } from "@/components/ui/button";

interface BookingListProps {
  bookings: any[];
  activeTab: string;
  loading: boolean;
  onActionComplete?: () => void;
  highlightBookingId?: string | null;
}

const ITEMS_PER_PAGE = 10;

export default function BookingList({
  bookings,
  activeTab,
  loading,
  onActionComplete,
  highlightBookingId,
}: BookingListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Sidebar state
  const [sidebarBooking, setSidebarBooking] = useState<any | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bookingRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasScrolledToHighlight = useRef(false);

  // 1. FILTER & SORT
  const processedBookings = useMemo(() => {
    if (!bookings) return [];

    const filtered = bookings.filter((booking) => {
      const status = (booking.bookingStatus || "").toLowerCase();
      const endDt = booking.bookingEnd
        ? new Date(booking.bookingEnd)
        : new Date();
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

    if (highlightBookingId) {
      const highlightIndex = processedBookings.findIndex(
        (b) => b.bookingKey === highlightBookingId,
      );
      if (highlightIndex !== -1) {
        const targetPage = Math.floor(highlightIndex / ITEMS_PER_PAGE) + 1;
        setCurrentPage(targetPage);
        setHighlightedId(highlightBookingId);
        hasScrolledToHighlight.current = false;
        return;
      }
    }

    const now = new Date();
    const todayIndex = processedBookings.findIndex(
      (b) => new Date(b.bookingStart) >= now,
    );

    if (todayIndex !== -1) {
      const targetPage = Math.floor(todayIndex / ITEMS_PER_PAGE) + 1;
      setCurrentPage(targetPage);
    } else {
      const lastPage = Math.ceil(processedBookings.length / ITEMS_PER_PAGE);
      setCurrentPage(lastPage);
    }
  }, [activeTab, processedBookings, highlightBookingId]);

  // 3. SCROLL + AUTO-OPEN dropdown (combined)
  useEffect(() => {
    if (!highlightedId || hasScrolledToHighlight.current) return;

    let openTimeout: NodeJS.Timeout;

    const scrollTimeout = setTimeout(() => {
      const el = bookingRefs.current[highlightedId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        hasScrolledToHighlight.current = true;

        if (highlightBookingId && highlightedId === highlightBookingId) {
          openTimeout = setTimeout(() => {
            setOpenDropdownId(highlightBookingId);
          }, 400);
        }
      }
    }, 300);

    return () => {
      clearTimeout(scrollTimeout);
      clearTimeout(openTimeout);
    };
  }, [highlightedId, currentPage, highlightBookingId]);

  // 4. GLOBAL CLICK-OUTSIDE
  useEffect(() => {
    if (!openDropdownId && !highlightedId) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      const isInsideModal = (target as Element)?.closest?.(
        '[role="dialog"], [data-radix-portal], .fixed',
      );
      if (isInsideModal) return;

      if (openDropdownId) {
        // Only protect the dropdown itself, not the entire card
        const dropdownEl = bookingRefs.current[openDropdownId]?.querySelector(
          "[data-booking-dropdown]",
        );
        if (dropdownEl && dropdownEl.contains(target)) return;
        setOpenDropdownId(null);
      }

      if (highlightedId) {
        const highlightedEl = bookingRefs.current[highlightedId];
        if (highlightedEl && highlightedEl.contains(target)) return;
        setHighlightedId(null);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownId, highlightedId]);

  const handleDropdownToggle = useCallback((bookingKey: string) => {
    setOpenDropdownId((prev) => (prev === bookingKey ? null : bookingKey));
  }, []);

  const setBookingRef = useCallback(
    (bookingKey: string) => (el: HTMLDivElement | null) => {
      bookingRefs.current[bookingKey] = el;
    },
    [],
  );

  // Open history sidebar
  const handleOpenHistory = useCallback((booking: any) => {
    setSidebarBooking(booking);
    setSidebarOpen(true);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // 5. PAGINATION
  const totalItems = processedBookings.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBookings = processedBookings.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // 6. GROUPING
  const groupedBookings = useMemo(() => {
    return groupBookings(paginatedBookings);
  }, [paginatedBookings]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setOpenDropdownId(null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 bg-slate-50 rounded-xl animate-pulse border border-slate-100"
          />
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
    <>
      <div className="space-y-6 pb-6">
        <div>
          {Object.keys(groupedBookings).map((month) => {
            const monthBookings = groupedBookings[month];
            if (monthBookings.length === 0) return null;

            return (
              <div key={month} className="mb-6">
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-2 mb-2 border-b border-slate-50">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">
                    {month}
                  </h2>
                </div>

                <div className="space-y-3">
                  {monthBookings.map((booking: any) => {
                    const isHighlighted = highlightedId === booking.bookingKey;
                    const isDropdownOpen =
                      openDropdownId === booking.bookingKey;

                    return (
                      <div
                        key={booking.bookingKey}
                        ref={setBookingRef(booking.bookingKey)}
                        className={`transition-all duration-500 rounded-xl ${
                          isHighlighted
                            ? "ring-2 ring-blue-400 ring-offset-2 shadow-lg shadow-blue-100/50"
                            : ""
                        }`}
                      >
                        <div className="block md:hidden">
                          <BookingCardMobile
                            booking={booking}
                            onActionComplete={onActionComplete}
                            isDropdownOpen={isDropdownOpen}
                            onDropdownToggle={handleDropdownToggle}
                            onViewHistory={handleOpenHistory}
                          />
                        </div>
                        <div className="hidden md:block">
                          <BookingCardDesktop
                            booking={booking}
                            onActionComplete={onActionComplete}
                            isDropdownOpen={isDropdownOpen}
                            onDropdownToggle={handleDropdownToggle}
                            onViewHistory={handleOpenHistory}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

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
              Page <span className="text-slate-900">{currentPage}</span> of{" "}
              <span className="text-slate-900">{totalPages}</span>
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

      {/* History Sidebar */}
      <BookingHistorySidebar
        booking={sidebarBooking}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />
    </>
  );
}
