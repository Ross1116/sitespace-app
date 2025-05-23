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

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const { user } = useAuth();
  const hasFetched = useRef(false);
  const userId = user?.userId;
  const storageKey = `bookings_${userId}`;
  const projectStorageKey = `selectedProject_${userId}`;
  const initialLoadComplete = useRef(false);

  // Calculate times for booking form
  const now = new Date();
  const nextHour = startOfHour(addHours(now, 1));
  const endHour = addHours(nextHour, 1);

  // Fetch bookings from API
  const fetchBookings = async (forceRefresh = false) => {
    if (!user || (initialLoadComplete.current && !forceRefresh)) {
      return;
    }

    // Set loading state
    setLoading(true);

    const projectString = localStorage.getItem(projectStorageKey);

    if (!projectString) {
      console.error("No project found in localStorage");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching bookings...");
      const project = JSON.parse(projectString);

      const response = await api.get(
        "/api/slotBooking/getslotBookingList",
        {
          params: { projectId: project.id, userId: userId },
        }
      );

      const bookingsData = response.data?.bookingList || [];
      console.log("Bookings fetched:", bookingsData);
      setBookings(bookingsData);
      localStorage.setItem(storageKey, JSON.stringify(bookingsData));
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }

    initialLoadComplete.current = true;
  };

  useEffect(() => {
    if (!user) return;

    const userId = user.userId;
    const storageKey = `bookings_${userId}`;

    // First attempt to load from localStorage
    const cachedBookings = localStorage.getItem(storageKey);
    if (cachedBookings) {
      try {
        const parsedBookings = JSON.parse(cachedBookings);
        if (Array.isArray(parsedBookings)) {
          setBookings(parsedBookings);
          setLoading(false); // Important: Stop loading if we have cached data
          initialLoadComplete.current = true;
        }
      } catch (error) {
        console.error("Error parsing cached bookings:", error);
        localStorage.removeItem(storageKey);
      }
    }

    // Then fetch fresh data if we haven't already fetched or if forcing refresh
    if (!hasFetched.current) {
      fetchBookings();
      hasFetched.current = true;
      initialLoadComplete.current = true;

      const interval = setInterval(() => fetchBookings(true), 300000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleActionComplete = () => {
    fetchBookings(true);
  };

  const handleOnClickButton = () => {
    setIsBookingFormOpen(true);
  };

  const handleSaveBooking = () => {
    console.log("save booking works");
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
            <p className="text- sm:text-base text-gray-500 mt-1">
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
              "Denied",
              "Cancelled",
              "All",
            ].map((tab) => (
              <button
                key={tab}
                className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium whitespace-nowrap ${activeTab === tab
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
