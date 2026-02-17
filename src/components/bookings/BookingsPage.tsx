"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/app/context/AuthContext";
import BookingList from "./BookingList";
import { Button } from "@/components/ui/button";
import { addHours, startOfHour } from "date-fns";
import { Plus, Search } from "lucide-react";
import { CreateBookingForm } from "@/components/forms/CreateBookingForm";
import { Input } from "@/components/ui/input";
import { swrFetcher, SWR_CONFIG } from "@/lib/swr";
import { combineDateAndTime } from "@/lib/bookingHelpers";
import { readStoredProject } from "@/lib/projectStorage";
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

const getSafeString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const transformBookingToLegacyFormat = (
  booking: ApiBooking,
): TransformedBooking => {
  const cleanStart = (booking.start_time || "00:00")
    .split(":")
    .slice(0, 2)
    .join(":");
  const cleanEnd = (booking.end_time || "00:00")
    .split(":")
    .slice(0, 2)
    .join(":");
  const startDateObj = combineDateAndTime(
    booking.booking_date,
    booking.start_time,
  );
  const endDateObj = combineDateAndTime(booking.booking_date, booking.end_time);
  const duration = calculateDuration(cleanStart, cleanEnd);

  const managerName = booking.manager
    ? `${booking.manager.first_name} ${booking.manager.last_name}`
    : "Unknown";
  const subName = booking.subcontractor
    ? [
        getSafeString(booking.subcontractor.first_name),
        getSafeString(booking.subcontractor.last_name),
      ]
        .filter(Boolean)
        .join(" ")
        .trim()
    : "";

  const createdByName =
    booking.created_by_name ||
    booking.booked_by_name ||
    booking.requested_by_name ||
    booking.created_by?.full_name ||
    (booking.created_by
      ? `${booking.created_by.first_name || ""} ${booking.created_by.last_name || ""}`.trim()
      : "");

  const createdById = booking.created_by_id || booking.created_by?.id;

  const bookedFor = createdByName
    ? createdByName
    : createdById &&
        booking.subcontractor_id &&
        createdById === booking.subcontractor_id
      ? subName
      : createdById && booking.manager_id && createdById === booking.manager_id
        ? managerName
        : booking.subcontractor_id
          ? subName || managerName
          : managerName;

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
    competingPendingCount: booking.competing_pending_count ?? 0,
    _originalData: booking,
  };
};

const processRawBookings = (rawBookings: ApiBooking[]) => {
  return rawBookings
    .filter((b) => b && b.id)
    .map(transformBookingToLegacyFormat);
};

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { user } = useAuth();
  const userId = user?.id;

  // Read project ID from localStorage for the SWR key
  const projectId = useMemo(() => {
    if (typeof window === "undefined" || !userId) return null;
    const parsed = readStoredProject(userId);
    return parsed?.id ?? null;
  }, [userId]);

  // Redirect if no project selected
  useEffect(() => {
    if (userId && !projectId && typeof window !== "undefined") {
      window.location.href = "/home";
    }
  }, [userId, projectId]);

  // --- SWR: fetch bookings ---
  const swrKey = projectId
    ? `/bookings/?project_id=${projectId}&limit=1000&skip=0`
    : null;

  const { data, isLoading, mutate } = useSWR<BookingListResponse>(
    swrKey,
    swrFetcher,
    SWR_CONFIG,
  );

  const allBookings = useMemo(
    () => processRawBookings(data?.bookings || []),
    [data],
  );

  // --- READ HIGHLIGHT PARAM ---
  const searchParams = useSearchParams();
  const highlightBookingId = searchParams.get("highlight");

  const now = new Date();
  const nextHour = startOfHour(addHours(now, 1));
  const endHour = addHours(nextHour, 1);

  // --- AUTO-SWITCH TAB when highlighting ---
  useEffect(() => {
    if (highlightBookingId && allBookings.length > 0) {
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

        if (activeTab === "Upcoming" && !isUpcoming) {
          setActiveTab("All");
        }
        if (
          activeTab !== "Upcoming" &&
          activeTab !== "All" &&
          status !== activeTab.toLowerCase()
        ) {
          setActiveTab("All");
        }
      } else {
        setActiveTab("All");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightBookingId, allBookings.length]);

  const handleSaveBooking = useCallback(() => {
    mutate();
  }, [mutate]);

  const handleFormClose = useCallback(() => {
    setIsBookingFormOpen(false);
    mutate();
  }, [mutate]);

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
    <div className="min-h-screen bg-[var(--page-bg)] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-screen mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-1 min-h-[85vh] flex flex-col relative overflow-hidden">
          <div className="p-6 flex-1 flex flex-col">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Bookings
                </h1>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                  Manage and track scheduled events
                </p>
              </div>

              <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center xl:w-auto">
                <div className="flex w-full gap-3 sm:w-auto">
                  <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl bg-[var(--navy)] px-4 py-2.5 text-white shadow-md shadow-slate-900/10 sm:min-w-[110px] sm:flex-none sm:px-5">
                    <span className="text-2xl font-bold leading-none">
                      {allBookings.length}
                    </span>
                    <span className="text-[10px] font-medium opacity-80 uppercase tracking-wide">
                      Total
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl bg-[var(--brand-orange)] px-4 py-2.5 text-white shadow-md shadow-orange-900/10 sm:min-w-[110px] sm:flex-none sm:px-5">
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
                  className="h-auto w-full rounded-lg bg-[var(--navy)] px-6 py-3 text-sm font-bold text-white shadow-md shadow-slate-900/10 hover:bg-[var(--navy-hover)] sm:w-auto"
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
                  aria-label="Search bookings"
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
                          ? "bg-[var(--navy)] text-white shadow-md shadow-slate-900/10"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      }
                    `}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Booking List */}
            <div className="flex-1">
              <BookingList
                bookings={filteredBookings}
                activeTab={activeTab}
                loading={isLoading}
                onActionComplete={() => mutate()}
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
