import { Truck, Wrench, Settings } from "lucide-react";

// --- Shared Date/Time Helpers ---

export const combineDateAndTime = (dateStr: string, timeStr: string): Date => {
  try {
    if (!dateStr) return new Date();
    const cleanDate = dateStr.split("T")[0];
    const cleanTime = timeStr ? timeStr.split("T").pop() : "00:00:00";
    return new Date(`${cleanDate}T${cleanTime}`);
  } catch {
    return new Date();
  }
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });
  const dayOfWeek = date.toLocaleString("default", { weekday: "short" });

  return { day, month, dayOfWeek, date };
};

export const formatDateLong = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const dayOfWeek = date.toLocaleString("default", { weekday: "short" });
  return { day, month, dayOfWeek, date };
};

export const formatTimeRange = (start: Date, end: Date) => {
  const format = (d: Date) =>
    d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  return `${format(start)} - ${format(end)}`;
};

//  FIXED: Accepts explicit start/end times to avoid Timezone/Midnight shifting
export const formatTime = (
  dateString: string,
  durationMins: number,
  explicitStart?: string,
  explicitEnd?: string,
) => {
  // 1. If we have explicit times (e.g. "10:00"), use them directly!
  if (explicitStart && explicitEnd) {
    const format12Hour = (timeStr: string) => {
      if (!timeStr) return "";
      // Handle "10:00:00" or "10:00"
      const [hoursStr, minsStr] = timeStr.split(":");
      let hours = parseInt(hoursStr, 10);
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      return `${String(hours).padStart(2, "0")}:${minsStr} ${ampm}`;
    };

    return `${format12Hour(explicitStart)} - ${format12Hour(explicitEnd)}`;
  }

  // 2. Fallback Logic (Old method - prone to timezone issues)
  const date = new Date(dateString);

  // Format start time in 12-hour format with AM/PM
  const startHours = date.getHours();
  const startMinutes = date.getMinutes();
  const startAmPm = startHours >= 12 ? "PM" : "AM";
  const startHours12 = startHours % 12 || 12;
  const startTime = `${String(startHours12).padStart(2, "0")}:${String(
    startMinutes,
  ).padStart(2, "0")} ${startAmPm}`;

  // Calculate and format end time
  const endDate = new Date(date.getTime() + durationMins * 60000);
  const endHours = endDate.getHours();
  const endMinutes = endDate.getMinutes();
  const endAmPm = endHours >= 12 ? "PM" : "AM";
  const endHours12 = endHours % 12 || 12;
  const endTime = `${String(endHours12).padStart(2, "0")}:${String(
    endMinutes,
  ).padStart(2, "0")} ${endAmPm}`;

  return `${startTime} - ${endTime}`;
};

export const getBookingIcon = (bookingFor: string) => {
  const target = (bookingFor || "").toLowerCase();
  if (target.includes("equipment"))
    return { icon: Truck, color: "text-blue-500" };
  if (target.includes("service"))
    return { icon: Wrench, color: "text-green-500" };
  return { icon: Settings, color: "text-orange-500" };
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
    // Ensure date parsing works safely
    const dateStr = booking.bookingTimeDt || booking.booking_date;
    if (!dateStr) return acc;

    const date = new Date(dateStr);
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
      const timeA = new Date(a.bookingTimeDt).getTime();
      const timeB = new Date(b.bookingTimeDt).getTime();
      // Secondary sort by time if dates are equal
      if (timeA === timeB && a.bookingStartTime && b.bookingStartTime) {
        return a.bookingStartTime.localeCompare(b.bookingStartTime);
      }
      return timeA - timeB;
    });
  });

  return groupedBookings;
};

export const groupBookingsByMonth = <T extends { booking_date: string }>(
  bookings: T[],
) => {
  const groups: Record<string, T[]> = {};
  bookings.forEach((b) => {
    const date = new Date(`${b.booking_date}T00:00:00`);
    const month = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    if (!groups[month]) groups[month] = [];
    groups[month].push(b);
  });
  return groups;
};
