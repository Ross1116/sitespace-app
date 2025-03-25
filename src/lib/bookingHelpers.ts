import { Truck, Wrench, Settings } from "lucide-react";

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });
  const dayOfWeek = date.toLocaleString("default", { weekday: "short" });

  return { day, month, dayOfWeek, date };
};

export const formatTime = (dateString: string, durationMins: number) => {
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

export const getBookingIcon = (bookingFor: string) => {
  switch (bookingFor.toLowerCase()) {
    case "equipment":
      return { icon: Truck, color: "text-blue-500" };
    case "service":
      return { icon: Wrench, color: "text-green-500" };
    default:
      return { icon: Settings, color: "text-orange-500" };
  }
};

export const isToday = (date: Date) => {
  const currentDate = new Date();
  return (
    date.getDate() === currentDate.getDate() &&
    date.getMonth() === currentDate.getMonth() &&
    date.getFullYear() === currentDate.getFullYear()
  );
};

export const groupBookings = (bookings: any[]) => {
  const groupedBookings = bookings.reduce((acc: any, booking) => {
    const date = new Date(booking.bookingTimeDt);
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
        new Date(a.bookingTimeDt).getTime() -
        new Date(b.bookingTimeDt).getTime()
      );
    });
  });

  return groupedBookings;
};
