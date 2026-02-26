import type { ApiBooking } from "@/types";

export interface CalendarDayResponse {
  date: string;
  bookings: ApiBooking[];
}
