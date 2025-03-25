import { monthEventVariants } from "@/components/ui/full-calendar/calendar-utils";

export type VariantProps<Component extends (...args: any) => any> = Omit<
  OmitUndefined<Parameters<Component>[0]>,
  "class" | "className"
>;
export type OmitUndefined<T> = T extends undefined ? never : T;

export interface CalendarEvent {
  id: string;
  start: Date;
  end: Date;
  title: string;
  description?: string;
  color?: VariantProps<typeof monthEventVariants>["variant"];
}

export interface AssetCalendar {
  id: string;
  name: string;
  events: CalendarEvent[];
}

export function convertBookingToCalendarEvent(booking: any): CalendarEvent {
    // Calculate end time by adding duration in minutes to start time
    const startDate = new Date(booking.bookingTimeDt);
    const endDate = new Date(
      startDate.getTime() + booking.bookingDurationMins * 60000
    );
  
    // Determine color based on booking type or status
    let color: VariantProps<typeof monthEventVariants>["variant"] = "default";
    if (booking.bookingFor === "Equipment") color = "blue";
    if (booking.bookingStatus === "Pending") color = "yellow";
    if (booking.bookingStatus === "Confirmed") color = "green";
    if (booking.bookingNotes?.includes("Emergency")) color = "pink";
  
    return {
      id: booking.bookingKey,
      start: startDate,
      end: endDate,
      title: booking.bookingTitle,
      description: booking.bookingDescription,
      color: color,
    };
  }
  
  export function groupBookingsByAsset(bookings: any[]): Record<string, AssetCalendar> {
    return bookings.reduce<Record<string, AssetCalendar>>((acc, booking) => {
      // Check if booking.bookedAssets exists and is an array
      if (booking.bookedAssets && Array.isArray(booking.bookedAssets)) {
        booking.bookedAssets.forEach((assetId: string) => {
          // Extract just the asset ID from the string (e.g., "A003 - Crane2" -> "A003")
          const assetIdPart = assetId.split(" - ")[0];
  
          if (!acc[assetIdPart]) {
            acc[assetIdPart] = {
              id: assetIdPart,
              // Use the full asset string as the name
              name: assetId,
              events: [],
            };
          }
          acc[assetIdPart].events.push(
            convertBookingToCalendarEvent(booking)
          );
        });
      }
      return acc;
    }, {});
  }