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
  const startDate = new Date(booking.bookingTimeDt);
  const endDate = new Date(
    startDate.getTime() + booking.bookingDurationMins * 60000
  );

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
    if (booking.bookedAssets && Array.isArray(booking.bookedAssets)) {
      booking.bookedAssets.forEach((assetId: string) => {
        if (!assetId || typeof assetId !== 'string') {
          console.warn('Invalid assetId found in booking:', booking.bookingKey, 'assetId:', assetId);
          return;
        }

        const assetIdPart = assetId.includes(" - ") ? assetId.split(" - ")[0] : assetId;

        if (!acc[assetIdPart]) {
          acc[assetIdPart] = {
            id: assetIdPart,
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
