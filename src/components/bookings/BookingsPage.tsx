"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import BookingList from "./BookingList";
import { Button } from "../ui/button";
import { BookingFromCalendar } from "../forms/BookingFromCalendar";
import { addHours, startOfHour } from "date-fns";
import { Plus } from "lucide-react"; 

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
  
  // Calculate times for booking form
  const now = new Date();
  const nextHour = startOfHour(addHours(now, 1));
  const endHour = addHours(nextHour, 1);

  // Fetch bookings from API
  const fetchBookings = async () => {
    if (!user) return;

    setLoading(true);

    const projectString = localStorage.getItem(projectStorageKey);

    if (!projectString) {
      console.error("No project found in localStorage");
      setLoading(false);
      return;
    }

    try {
      const project = JSON.parse(projectString);

      const response = await api.get(
        "/api/auth/slotBooking/getslotBookingList",
        {
          params: { projectId: project.id, userId: userId },
        }
      );

      const bookingsData = response.data?.bookingList || [];
      setBookings(bookingsData);
      localStorage.setItem(storageKey, JSON.stringify(bookingsData));
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || hasFetched.current) return;

    const userId = user.userId;
    const storageKey = `bookings_${userId}`;

    // Load cached bookings from localStorage
    const cachedBookings = localStorage.getItem(storageKey);

    if (cachedBookings) {
      try {
        const parsedBookings = JSON.parse(cachedBookings);
        if (Array.isArray(parsedBookings)) {
          setBookings(parsedBookings);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error parsing cached bookings:", error);
        localStorage.removeItem(storageKey);
      }
    }

    fetchBookings();
    hasFetched.current = true;

    const interval = setInterval(fetchBookings, 300000);

    return () => clearInterval(interval);
  }, [user]);

  const handleActionComplete = () => {
    fetchBookings();
  };

  const handleOnClickButton = () => {
    setIsBookingFormOpen(true);
  };

  const handleSaveBooking = () => {
    setIsBookingFormOpen(false);
    fetchBookings();
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
          <BookingFromCalendar
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