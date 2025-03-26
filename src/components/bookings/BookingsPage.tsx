"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import BookingList from './BookingList';

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const hasFetched = useRef(false);

  // Fetch bookings from API
  const fetchBookings = async () => {
    if (!user) return;
    
    const userId = user.userId;
    const storageKey = `bookings_${userId}`;
    
    setLoading(true);
    
    try {
      const response = await api.get(
        "/api/auth/slotBooking/getslotBookingList",
        {
          params: { projectId: "P001", userId: "SM001" },
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

  return (
    <Card className="px-6 sm:my-8 mx-4 bg-stone-100">
      <div className="p-3 sm:p-6">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
          Bookings
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          See your scheduled events from your calendar events links.
        </p>

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