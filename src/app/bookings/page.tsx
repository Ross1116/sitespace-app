"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button"; // Assuming you have this component
import { bookings } from "@/lib/data";

export default function BookingsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = bookings.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(bookings.length / itemsPerPage);

  // Handle page changes
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Handle booking confirmation
  const handleConfirmBooking = (bookingKey: string) => {
    console.log(`Confirming booking: ${bookingKey}`);
    // In a real app, this would call an API to update the booking status
    alert(`Booking ${bookingKey} confirmed!`);
  };

  // Handle booking denial
  const handleDenyBooking = (bookingKey: string) => {
    console.log(`Denying booking: ${bookingKey}`);
    // In a real app, this would call an API to update the booking status
    alert(`Booking ${bookingKey} denied!`);
  };

  // Format date and time
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };

  // Format duration in hours and minutes
  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="flex flex-col h-screen w-full p-4 pt-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Slot Bookings</h1>
      </div>

      <div className="flex-grow overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full w-full h-full bg-amber-50">
          <thead>
            <tr className="sticky top-0 text-left bg-orange-200 text-gray-700 uppercase text-sm">
              <th className="sticky top-0 py-6 px-6 text-left">Title</th>
              <th>Type</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 divide-y divide-gray-200">
            {currentBookings.length > 0 ? (
              currentBookings.map((booking) => (
                <tr key={booking.bookingKey} className="hover:bg-orange-100">
                  <td className="py-4 px-6">
                    <div className="font-medium">{booking.bookingTitle}</div>
                    <div className="text-xs text-gray-500">
                      {booking.bookingDescription}
                    </div>
                  </td>
                  <td className="py-4 px-6">{booking.bookingFor}</td>
                  <td className="py-4 px-6">
                    {formatDateTime(booking.bookingTimedt)}
                  </td>
                  <td className="py-4 px-6">
                    {formatDuration(booking.bookingDurationMins)}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold 
                      ${
                        booking.bookingStatus === "Confirmed"
                          ? "bg-green-100 text-green-800"
                          : booking.bookingStatus === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {booking.bookingStatus}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {booking.bookingStatus === "Pending" && (
                      <div className="flex space-x-2 justify-center">
                        <Button
                          onClick={() =>
                            handleConfirmBooking(booking.bookingKey)
                          }
                          className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded text-xs"
                        >
                          Confirm
                        </Button>
                        <Button
                          onClick={() => handleDenyBooking(booking.bookingKey)}
                          className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Deny
                        </Button>
                      </div>
                    )}
                    {booking.bookingStatus !== "Pending" && (
                      <Button className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-3 py-1 rounded text-xs">
                        View Details
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  No bookings found for this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - only show if there are bookings */}
      {bookings.length > 0 && (
        <div className="flex justify-center items-center mt-4 space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${
              currentPage === 1
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-orange-200 text-gray-700 hover:bg-orange-300"
            }`}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page
                  ? "bg-orange-400 text-white"
                  : "bg-orange-200 text-gray-700 hover:bg-orange-300"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-orange-200 text-gray-700 hover:bg-orange-300"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
