"use client";

import { useState } from "react";
import {
  Clock,
  ChevronDown,
  AlertCircle,
  Calendar,
  X,
  Settings,
  Truck,
  Wrench,
} from "lucide-react";
import { bookings } from "@/lib/data";

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Get current date for highlighting
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Function to check if a date is today
  const isToday = (date: Date) => {
    return (
      date.getDate() === currentDay &&
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  };

  // Format date to get day, month and weekday
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "short" });
    const dayOfWeek = date.toLocaleString("default", { weekday: "short" });

    return { day, month, dayOfWeek, date }; // Added date to the return
  };

  // Format time in hh:mm a format 
  const formatTime = (dateString: string, durationMins: number) => {
    const date = new Date(dateString);

    // Format start time in 12-hour format with AM/PM
    const startHours = date.getHours();
    const startMinutes = date.getMinutes();
    const startAmPm = startHours >= 12 ? "PM" : "AM";
    const startHours12 = startHours % 12 || 12; // Convert to 12-hour format
    const startTime = `${String(startHours12).padStart(2, "0")}:${String(
      startMinutes
    ).padStart(2, "0")} ${startAmPm}`;

    // Calculate and format end time
    const endDate = new Date(date.getTime() + durationMins * 60000);
    const endHours = endDate.getHours();
    const endMinutes = endDate.getMinutes();
    const endAmPm = endHours >= 12 ? "PM" : "AM";
    const endHours12 = endHours % 12 || 12; // Convert to 12-hour format
    const endTime = `${String(endHours12).padStart(2, "0")}:${String(
      endMinutes
    ).padStart(2, "0")} ${endAmPm}`;

    return `${startTime} - ${endTime}`;
  };

  // Toggle dropdown menu
  const toggleDropdown = (bookingId: string) => {
    if (openDropdown === bookingId) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(bookingId);
    }
  };

  // Get icon based on booking type
  const getBookingIcon = (bookingFor: string) => {
    switch (bookingFor.toLowerCase()) {
      case "equipment":
        return <Truck size={16} className="mr-1 text-blue-500" />;
      case "service":
        return <Wrench size={16} className="mr-1 text-green-500" />;
      default:
        return <Settings size={16} className="mr-1 text-orange-500" />;
    }
  };

  // Group bookings by month and day
  const groupedBookings = bookings.reduce((acc: any, booking) => {
    const date = new Date(booking.bookingTimedt);
    const month = date.toLocaleString("default", { month: "long" });

    if (!acc[month]) {
      acc[month] = [];
    }

    acc[month].push(booking);
    return acc;
  }, {});

  // Sort bookings by date within each month
  Object.keys(groupedBookings).forEach((month) => {
    groupedBookings[month].sort((a: any, b: any) => {
      return (
        new Date(a.bookingTimedt).getTime() -
        new Date(b.bookingTimedt).getTime()
      );
    });
  });

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto bg-stone-50 rounded-xl shadow-sm overflow-y-auto w-full mt-4">
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
          <p className="text-gray-500 mt-1">
            See your scheduled events from your calendar events links.
          </p>

          {/* Tabs */}
          <div className="flex mt-6 border-b">
            {["Upcoming", "Pending", "Confirmed", "Denied", "Cancelled"].map(
              (tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 font-medium ${
                    activeTab === tab
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              )
            )}
          </div>

          {/* Bookings List */}
          <div className="mt-4">
            {Object.keys(groupedBookings).map((month) => (
              <div key={month}>
                {/* Month Divider */}
                <div className="mt-6 mb-2">
                  <h2 className="text-lg font-medium text-gray-900">{month}</h2>
                </div>

                {groupedBookings[month]
                  .filter((booking: any) => {
                    if (activeTab === "Upcoming") return true;
                    return booking.bookingStatus === activeTab;
                  })
                  .map((booking: any) => {
                    const { day, dayOfWeek, date } = formatDate(
                      booking.bookingTimedt
                    );
                    const timeRange = formatTime(
                      booking.bookingTimedt,
                      booking.bookingDurationMins
                    );
                    const today = isToday(date);

                    return (
                      <div
                        key={booking.bookingKey}
                        className="border-b last:border-b-0"
                      >
                        <div className="flex py-4">
                          {/* Date column */}
                          <div className="w-24 flex-shrink-0 text-center">
                            <div className="text-gray-500">{dayOfWeek}</div>
                            <div
                              className={`text-3xl font-semibold ${
                                today
                                  ? "text-orange-500"
                                  : booking.bookingStatus === "Pending"
                                  ? "text-yellow-400"
                                  : "text-gray-800"
                              }`}
                            >
                              {String(day).padStart(2, "0")}
                            </div>
                          </div>

                          {/* Details column */}
                          <div className="flex-grow">
                            <div className="flex items-center text-gray-500 mb-1">
                              <Clock size={16} className="mr-1" />
                              <span>{timeRange}</span>
                              {booking.bookingStatus === "Pending" && (
                                <AlertCircle
                                  size={16}
                                  className="ml-2 text-yellow-400"
                                />
                              )}
                            </div>

                            <div className="font-medium text-gray-900 mb-1">
                              {booking.bookingTitle}
                            </div>

                            <div className="flex items-center text-gray-500 mb-1">
                              {getBookingIcon(booking.bookingFor)}
                              <span>{booking.bookingFor}</span>
                              {/* <span className="mx-2">•</span> */}
                              {/* <Building size={16} className="mr-1" /> */}
                              {/* <span>Project: {booking.bookingProject}</span> */}
                            </div>

                            <div className="text-sm text-gray-500 mb-2">
                              {booking.bookingDescription}
                            </div>

                            {/* Asset tags */}
                            <div className="flex flex-wrap gap-1">
                              {booking.bookedAssets.map((asset: string) => (
                                <span
                                  key={asset}
                                  className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
                                >
                                  {asset}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Action column */}
                          <div className="w-24 flex-shrink-0 flex items-start justify-end relative">
                            <button
                              onClick={() => toggleDropdown(booking.bookingKey)}
                              className={`px-4 py-2 text-sm rounded-md flex items-center
                                ${
                                  booking.bookingStatus === "Pending"
                                    ? "bg-gray-800 text-white hover:bg-gray-700"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                }`}
                            >
                              Edit
                              <ChevronDown
                                size={16}
                                className={`ml-1 transition-transform ${
                                  openDropdown === booking.bookingKey
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </button>

                            {/* Dropdown menu */}
                            {openDropdown === booking.bookingKey && (
                              <div className="absolute top-12 right-0 w-56 bg-white rounded-md shadow-lg z-10 border">
                                <div className="py-1">
                                  {booking.bookingStatus === "Pending" && (
                                    <>
                                      <button className="flex items-center px-4 py-2 text-sm text-green-600 hover:bg-gray-100 w-full text-left">
                                        <Calendar size={16} className="mr-2" />
                                        Confirm booking
                                      </button>
                                      <button className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left">
                                        <X size={16} className="mr-2" />
                                        Deny booking
                                      </button>
                                      <div className="border-t my-1"></div>
                                    </>
                                  )}
                                  <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                                    <Calendar size={16} className="mr-2" />
                                    Reschedule booking
                                  </button>
                                  {booking.bookingStatus === "Confirmed" && (
                                    <button className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left">
                                      <X size={16} className="mr-2" />
                                      Cancel booking
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Status badge */}
                            <div
                              className={`absolute -bottom-3 right-0 text-xs px-2 py-1 rounded
                              ${
                                booking.bookingStatus === "Confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : booking.bookingStatus === "Pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : booking.bookingStatus === "Denied"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {booking.bookingStatus}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}

            {/* Empty state when no bookings match the filter */}
            {Object.keys(groupedBookings).every(
              (month) =>
                groupedBookings[month].filter((booking: any) => {
                  if (activeTab === "Upcoming") return true;
                  return booking.bookingStatus === activeTab;
                }).length === 0
            ) && (
              <div className="py-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Calendar size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No bookings found
                </h3>
                <p className="text-gray-500">
                  There are no {activeTab.toLowerCase()} bookings to display.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
