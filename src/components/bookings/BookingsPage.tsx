"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import BookingList from "./BookingList";
import { Button } from "../ui/button";
import { addHours, startOfHour } from "date-fns";
import { Plus } from "lucide-react";
import { CreateBookingForm } from "../forms/CreateBookingForm";

// ===== TYPE DEFINITIONS =====
interface BookingDetail {
  id: string;
  project_id?: string;
  manager_id: string;
  subcontractor_id?: string;
  asset_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
  project?: { id: string; name: string; location?: string };
  manager?: { id: string; first_name: string; last_name: string };
  subcontractor?: { id: string; company_name?: string; first_name: string; last_name: string };
  asset?: { id: string; name: string; asset_type: string };
}

interface BookingListResponse {
  bookings: BookingDetail[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

// ===== HELPER FUNCTIONS =====
const parseTimeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const calculateDuration = (startTime: string, endTime: string): number => {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  return end - start;
};

const transformBookingToLegacyFormat = (booking: BookingDetail) => {
  const duration = calculateDuration(booking.start_time, booking.end_time);
  
  return {
    bookingKey: booking.id,
    bookingTitle: booking.project?.name || "Booking",
    bookingDescription: booking.notes || "",
    bookingNotes: booking.notes || "",
    bookingTimeDt: booking.booking_date,
    bookingStartTime: booking.start_time,
    bookingEndTime: booking.end_time,
    bookingDurationMins: duration,
    bookingStatus: booking.status.charAt(0).toUpperCase() + booking.status.slice(1), // Capitalize
    bookingFor: booking.manager
      ? `${booking.manager.first_name} ${booking.manager.last_name}`
      : booking.subcontractor?.company_name || "Unknown",
    bookedAssets: booking.asset ? [booking.asset.name] : [],
    assetId: booking.asset_id,
    assetName: booking.asset?.name,
    subcontractorId: booking.subcontractor_id,
    subcontractorName: booking.subcontractor?.company_name,
    // Keep original data for reference
    _originalData: booking,
  };
};

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const { user } = useAuth();
  const hasFetched = useRef(false);
  const userId = user?.id;
  const storageKey = `bookings_${userId}`;
  const projectStorageKey = `project_${userId}`;
  const initialLoadComplete = useRef(false);

  // Calculate times for booking form
  const now = new Date();
  const nextHour = startOfHour(addHours(now, 1));
  const endHour = addHours(nextHour, 1);

  // Fetch bookings from API using new backend
  const fetchBookings = async (forceRefresh = false) => {
    if (!user || (initialLoadComplete.current && !forceRefresh)) {
      return;
    }

    setLoading(true);

    const projectString = localStorage.getItem(projectStorageKey);

    if (!projectString) {
      console.error("No project found in localStorage");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching bookings from new backend...");
      const project = JSON.parse(projectString);

      // Use new backend endpoint
      const response = await api.get<BookingListResponse>("/bookings/", {
        params: {
          project_id: project.id,
          limit: 1000,
          skip: 0,
        },
      });

      const bookingsData = response.data?.bookings || [];
      console.log("Bookings fetched:", bookingsData.length);

      // Transform to legacy format for backward compatibility
      const transformedBookings = bookingsData.map(transformBookingToLegacyFormat);
      
      setBookings(transformedBookings);
      localStorage.setItem(storageKey, JSON.stringify(transformedBookings));
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      
      // Try to use cached data on error
      const cachedBookings = localStorage.getItem(storageKey);
      if (cachedBookings) {
        try {
          const parsedBookings = JSON.parse(cachedBookings);
          setBookings(parsedBookings);
        } catch (e) {
          console.error("Error parsing cached bookings:", e);
        }
      }
    } finally {
      setLoading(false);
      initialLoadComplete.current = true;
    }
  };

  useEffect(() => {
    if (!user) return;

    // First attempt to load from localStorage
    const cachedBookings = localStorage.getItem(storageKey);
    if (cachedBookings) {
      try {
        const parsedBookings = JSON.parse(cachedBookings);
        if (Array.isArray(parsedBookings)) {
          setBookings(parsedBookings);
          setLoading(false);
          initialLoadComplete.current = true;
        }
      } catch (error) {
        console.error("Error parsing cached bookings:", error);
        localStorage.removeItem(storageKey);
      }
    }

    // Then fetch fresh data if we haven't already fetched
    if (!hasFetched.current) {
      fetchBookings();
      hasFetched.current = true;

      // Set up periodic refresh (5 minutes)
      const interval = setInterval(() => fetchBookings(true), 300000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleActionComplete = () => {
    console.log("Action completed, refreshing bookings...");
    fetchBookings(true);
  };

  const handleOnClickButton = () => {
    setIsBookingFormOpen(true);
  };

  const handleSaveBooking = () => {
    console.log("Booking saved successfully");
    setIsBookingFormOpen(false);
    fetchBookings(true);
  };

  return (
    <Card className="px-6 sm:my-8 mx-4 bg-stone-100">
      <div className="p-3 sm:p-6">
        {/* Header with title and create button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
              Bookings
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              See your scheduled events from your calendar events links.
            </p>
          </div>

          {/* Desktop button */}
          <Button
            onClick={handleOnClickButton}
            className="hidden sm:flex mt-4 sm:mt-0 cursor-pointer"
          >
            Create new booking
          </Button>

          {/* Mobile button - icon only */}
          <Button
            onClick={handleOnClickButton}
            className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-10"
            size="icon"
          >
            <Plus size={24} />
          </Button>
        </div>

        {/* Booking Form Modal */}
        {isBookingFormOpen && (
          <CreateBookingForm
            isOpen={isBookingFormOpen}
            onClose={() => setIsBookingFormOpen(false)}
            startTime={nextHour}
            endTime={endHour}
            onSave={handleSaveBooking}
          />
        )}

        {/* Tabs - Scrollable on mobile */}
        <div className="mt-4 sm:mt-6 border-b overflow-x-auto pb-1">
          <div className="flex w-max min-w-full">
            {[
              "Upcoming",
              "Pending",
              "Confirmed",
              "Completed",
              "Cancelled",
              "All",
            ].map((tab) => (
              <button
                key={tab}
                className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium whitespace-nowrap ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div className="mt-4">
          <BookingList
            bookings={bookings}
            activeTab={activeTab}
            loading={loading}
            onActionComplete={handleActionComplete}
          />
        </div>
      </div>
    </Card>
  );
}