"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import BookingList from "./BookingList";
import { Button } from "@/components/ui/button";
import { addHours, startOfHour } from "date-fns";
import { Plus, Search } from "lucide-react";
import { CreateBookingForm } from "@/components/forms/CreateBookingForm";
import { Input } from "@/components/ui/input";
import { useSmartRefresh } from "@/lib/useSmartRefresh";
import { combineDateAndTime } from "@/lib/bookingHelpers";
import type {
  ApiBooking,
  BookingListResponse,
  TransformedBooking,
} from "@/types";

const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const calculateDuration = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 60;
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  return end - start;
};

const transformBookingToLegacyFormat = (booking: ApiBooking): TransformedBooking => {
  const cleanStart = (booking.start_time || "00:00")
    .split(":")
    .slice(0, 2)
    .join(":");
  const cleanEnd = (booking.end_time || "00:00").split(":").slice(0, 2).join(":");
  const startDateObj = combineDateAndTime(booking.booking_date, booking.start_time);
  const endDateObj = combineDateAndTime(booking.booking_date, booking.end_time);
  const duration = calculateDuration(cleanStart, cleanEnd);

  const managerName = booking.manager
    ? `${booking.manager.first_name} ${booking.manager.last_name}`
    : "Unknown";
  const subName =
    booking.subcontractor?.company_name ||
    (booking.subcontractor
      ? `${booking.subcontractor.first_name} ${booking.subcontractor.last_name}`
      : "");
  const bookedFor = booking.subcontractor_id ? subName : managerName;

  let assetId = "unknown";
  let assetName = "Unknown Asset";
  let assetCode = "";

  if (booking.asset && typeof booking.asset === "object") {
    assetId = booking.asset.id || assetId;
    assetName = booking.asset.name || assetName;
    assetCode = booking.asset.asset_code || assetCode;
  } else if (booking.asset_id) {
    assetId = booking.asset_id;
  }

  if (assetName === "Unknown Asset" && assetId !== "unknown") {
    if (assetCode) assetName = `Asset ${assetCode}`;
    else assetName = `Asset ${assetId.slice(0, 6)}...`;
  }

  let finalTitle = "";
  let finalDescription = "No description provided";

  const rawPurpose = booking.purpose;
  const rawNotes = booking.notes;

  if (rawPurpose && rawPurpose.trim() !== "") {
    finalTitle = rawPurpose;
  } else if (rawNotes && rawNotes.trim() !== "") {
    finalTitle = rawNotes;
  } else {
    finalTitle = `Booking for ${bookedFor}`;
  }

  if (rawNotes && rawNotes.trim() !== "") {
    if (finalTitle === rawNotes) {
      finalDescription = "No additional details";
    } else {
      finalDescription = rawNotes;
    }
  } else {
    finalDescription = "No description provided";
  }

  const normalizedStatus = (booking.status || "pending").toLowerCase();

  return {
    bookingKey: booking.id,
    bookingTitle: finalTitle,
    bookingDescription: finalDescription,
    bookingNotes: rawNotes || "",
    projectName: booking.project?.name || "",
    bookingTimeDt: booking.booking_date,
    bookingStartTime: cleanStart,
    bookingEndTime: cleanEnd,
    start: startDateObj,
    end: endDateObj,
    bookingStart: startDateObj,
    bookingEnd: endDateObj,
    bookingDurationMins: duration,
    bookingStatus: normalizedStatus,
    bookingFor: bookedFor || "Unknown",
    bookedAssets: [assetName],
    assetId: assetId,
    assetName: assetName,
    assetCode: assetCode,
    subcontractorId: booking.subcontractor_id ?? undefined,
    subcontractorName: subName,
    _originalData: booking,
  };
};

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [allBookings, setAllBookings] = useState<TransformedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { user } = useAuth();
  const userId = user?.id;
  const storageKey = `bookings_v5_${userId}`;
  const projectStorageKey = `project_${userId}`;

  // --- READ HIGHLIGHT PARAM ---
  const searchParams = useSearchParams();
  const highlightBookingId = searchParams.get("highlight");

  const now = new Date();
  const nextHour = startOfHour(addHours(now, 1));
  const endHour = addHours(nextHour, 1);

  const processRawBookings = (rawBookings: ApiBooking[]) => {
    const validBookings = rawBookings.filter(
      (b) => b && b.id,
    );
    return validBookings.map(transformBookingToLegacyFormat);
  };

  const fetchBookings = useCallback(
    async (isBackground = false) => {
      if (!user) return;

      const projectString = localStorage.getItem(projectStorageKey);
      if (!projectString) {
        if (typeof window !== "undefined") window.location.href = "/home";
        return;
      }

      if (!isBackground) setLoading(true);

      try {
        const project = JSON.parse(projectString);
        const response = await api.get<BookingListResponse>("/bookings/", {
          params: { project_id: project.id, limit: 1000, skip: 0 },
        });

        const rawBookings = response.data?.bookings || [];
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            bookings: rawBookings,
            timestamp: Date.now(),
          }),
        );
        const uiBookings = processRawBookings(rawBookings);
        setAllBookings(uiBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    },
    [user, storageKey, projectStorageKey],
  );

  const { refresh } = useSmartRefresh({
    onRefresh: () => fetchBookings(true),
    intervalMs: 5 * 60 * 1000,
    refreshOnFocus: true,
    refreshOnReconnect: true,
  });

  useEffect(() => {
    if (!user) return;

    const cachedData = localStorage.getItem(storageKey);
    if (cachedData) {
      try {
        const { bookings } = JSON.parse(cachedData);
        if (Array.isArray(bookings) && bookings.length > 0) {
          const uiBookings = processRawBookings(bookings);
          setAllBookings(uiBookings);
          setLoading(false);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    fetchBookings();
  }, [user, storageKey, fetchBookings]);

  // --- AUTO-SWITCH TAB when highlighting ---
  // If we have a highlight param, switch to "All" tab so the booking is guaranteed visible
  useEffect(() => {
    if (highlightBookingId && allBookings.length > 0) {
      // Find which tab the booking belongs to
      const targetBooking = allBookings.find(
        (b) => b.bookingKey === highlightBookingId,
      );
      if (targetBooking) {
        const status = (targetBooking.bookingStatus || "").toLowerCase();
        const endDt = targetBooking.bookingEnd
          ? new Date(targetBooking.bookingEnd)
          : new Date();
        const isUpcoming =
          endDt >= new Date() && status !== "cancelled" && status !== "denied";

        // If it's in the current "Upcoming" view, keep it. Otherwise switch to "All"
        if (activeTab === "Upcoming" && !isUpcoming) {
          setActiveTab("All");
        }
        // If current tab filters it out, switch to "All"
        if (
          activeTab !== "Upcoming" &&
          activeTab !== "All" &&
          status !== activeTab.toLowerCase()
        ) {
          setActiveTab("All");
        }
      } else {
        // Booking not found in current data, show all
        setActiveTab("All");
      }
    }
    // Only run when bookings load or highlight changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightBookingId, allBookings.length]);

  const handleSaveBooking = async () => {
    await refresh();
  };

  const handleFormClose = useCallback(() => {
    setIsBookingFormOpen(false);
    setTimeout(() => refresh(), 300);
  }, [refresh]);

  const filteredBookings = useMemo(() => {
    if (!allBookings || allBookings.length === 0) return [];
    if (!searchTerm.trim()) return allBookings;

    const term = searchTerm.toLowerCase();
    return allBookings.filter(
      (b) =>
        b.bookingTitle.toLowerCase().includes(term) ||
        b.assetName.toLowerCase().includes(term) ||
        b.bookingFor.toLowerCase().includes(term),
    );
  }, [allBookings, searchTerm]);

  const pendingCount = allBookings.filter(
    (b) => b.bookingStatus === "pending",
  ).length;

  return (
    <div className="min-h-screen bg-[hsl(20,60%,99%)] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-screen mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-1 min-h-[85vh] flex flex-col relative overflow-hidden">
          <div className="p-6 flex-1 flex flex-col">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-end mb-8 gap-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Bookings
                </h1>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                  Manage and track scheduled events
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="bg-[#0B1120] text-white rounded-xl px-5 py-2 flex flex-col items-center justify-center min-w-[110px] shadow-md shadow-slate-900/10">
                    <span className="text-2xl font-bold leading-none">
                      {allBookings.length}
                    </span>
                    <span className="text-[10px] font-medium opacity-80 uppercase tracking-wide">
                      Total
                    </span>
                  </div>
                  <div className="bg-[#D94E09] text-white rounded-xl px-5 py-2 flex flex-col items-center justify-center min-w-[110px] shadow-md shadow-orange-900/10">
                    <span className="text-2xl font-bold leading-none">
                      {pendingCount}
                    </span>
                    <span className="text-[10px] font-medium opacity-90 uppercase tracking-wide">
                      Pending
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => setIsBookingFormOpen(true)}
                  className="bg-[#0B1120] hover:bg-[#1a253a] text-white rounded-lg px-6 py-5 h-auto text-sm font-bold shadow-md shadow-slate-900/10 w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4 stroke-[3]" /> New Booking
                </Button>
              </div>
            </div>

            {/* Search & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search bookings..."
                  className="pl-10 bg-slate-50 border-transparent focus:bg-white transition-all rounded-xl h-10 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    {filteredBookings.length} results
                  </span>
                )}
              </div>

              <div className="flex overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar gap-2">
                {[
                  "Upcoming",
                  "Pending",
                  "Confirmed",
                  "Denied",
                  "Completed",
                  "Cancelled",
                  "All",
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap
                      ${
                        activeTab === tab
                          ? "bg-[#0B1120] text-white shadow-md shadow-slate-900/10"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      }
                    `}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Booking List — pass highlightBookingId */}
            <div className="flex-1">
              <BookingList
                bookings={filteredBookings}
                activeTab={activeTab}
                loading={loading}
                onActionComplete={refresh}
                highlightBookingId={highlightBookingId}
              />
            </div>
          </div>
        </div>

        <CreateBookingForm
          isOpen={isBookingFormOpen}
          onClose={handleFormClose}
          startTime={nextHour}
          endTime={endHour}
          onSave={handleSaveBooking}
        />
      </div>
    </div>
  );
}
