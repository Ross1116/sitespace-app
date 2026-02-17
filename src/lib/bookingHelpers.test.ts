import { describe, expect, it } from "vitest";
import { formatTime, groupBookingsByMonth } from "@/lib/bookingHelpers";

describe("bookingHelpers", () => {
  it("formats explicit start/end times in 12-hour format", () => {
    const result = formatTime("2026-02-17", 60, "13:15:00", "15:45:00");
    expect(result).toBe("01:15 PM - 03:45 PM");
  });

  it("groups bookings by month and year", () => {
    const grouped = groupBookingsByMonth([
      { id: "1", booking_date: "2026-02-17" },
      { id: "2", booking_date: "2026-02-20" },
      { id: "3", booking_date: "2026-03-01" },
    ]);

    expect(Object.keys(grouped)).toContain("February 2026");
    expect(Object.keys(grouped)).toContain("March 2026");
    expect(grouped["February 2026"]).toHaveLength(2);
    expect(grouped["March 2026"]).toHaveLength(1);
  });
});
