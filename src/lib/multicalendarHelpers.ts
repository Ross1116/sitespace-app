// lib/multicalendarHelpers.ts
import { monthEventVariants } from "@/components/ui/full-calendar/calendar-utils";
import { 
  CalendarEvent as BaseCalendarEvent, 
  AssetCalendar as BaseAssetCalendar 
} from "@/components/ui/full-calendar/calendar-context";

export type VariantProps<Component extends (...args: any) => any> = Omit<
  OmitUndefined<Parameters<Component>[0]>,
  "class" | "className"
>;
export type OmitUndefined<T> = T extends undefined ? never : T;

// ✅ Extended CalendarEvent with all booking fields
export interface CalendarEvent extends BaseCalendarEvent {
  // Booking-specific fields
  bookingKey: string;
  bookingTitle: string;
  bookingDescription?: string;
  bookingNotes?: string;
  bookingTimeDt: string;
  bookingStartTime: string;
  bookingEndTime: string;
  bookingStatus: string;
  bookingFor?: string;
  assetId: string;
  assetName: string;
  assetType?: string;
  bookedAssets: string[];
  status: string;
  managerId?: string;
  managerName?: string;
  subcontractorId?: string;
  subcontractorName?: string;
  projectId?: string;
  projectName?: string;
  projectLocation?: string;
  bookingData?: any;
}

// ✅ Extended AssetCalendar (uses extended CalendarEvent)
export interface AssetCalendar extends Omit<BaseAssetCalendar, 'events'> {
  events: CalendarEvent[];
}

// ✅ Rest of your helper functions stay the same...
export function convertBookingToCalendarEvent(booking: any): CalendarEvent {
  const startDate = booking.start || parseTimeToDate(
    booking.bookingTimeDt || booking.booking_date, 
    booking.bookingStartTime || booking.start_time
  );
  const endDate = booking.end || parseTimeToDate(
    booking.bookingTimeDt || booking.booking_date, 
    booking.bookingEndTime || booking.end_time
  );

  const status = booking.status || booking.bookingStatus || "pending";
  const statusColorMap: Record<string, VariantProps<typeof monthEventVariants>["variant"]> = {
    "pending": "yellow",
    "confirmed": "green",
    "in_progress": "blue",
    "completed": "purple",
    "cancelled": "pink",
  };
  
  let color = statusColorMap[status] || "default";
  
  const notes = booking.bookingNotes || booking.notes || "";
  if (notes.toLowerCase().includes("emergency")) {
    color = "purple";
  }

  return {
    // Base calendar fields (from BaseCalendarEvent)
    id: booking.id || booking.bookingKey,
    start: startDate,
    end: endDate,
    title: booking.title || booking.bookingTitle || "Booking",
    description: booking.description || booking.bookingDescription || booking.notes,
    color: color,
    
    // Extended booking fields
    bookingKey: booking.id || booking.bookingKey,
    bookingTitle: booking.title || booking.bookingTitle || "Booking",
    bookingDescription: booking.description || booking.bookingDescription || booking.notes || "",
    bookingNotes: booking.notes || booking.bookingNotes || "",
    bookingTimeDt: booking.bookingTimeDt || booking.booking_date,
    bookingStartTime: booking.bookingStartTime || booking.start_time,
    bookingEndTime: booking.bookingEndTime || booking.end_time,
    bookingStatus: status,
    bookingFor: booking.bookingFor || booking.managerName || "Manager",
    assetId: booking.assetId || booking.asset_id,
    assetName: booking.assetName || "Unknown Asset",
    assetType: booking.assetType,
    bookedAssets: booking.bookedAssets || (booking.assetName ? [booking.assetName] : []),
    status: status,
    managerId: booking.managerId || booking.manager_id,
    managerName: booking.managerName,
    subcontractorId: booking.subcontractorId || booking.subcontractor_id,
    subcontractorName: booking.subcontractorName,
    projectId: booking.projectId || booking.project_id,
    projectName: booking.projectName,
    projectLocation: booking.projectLocation,
    bookingData: booking.bookingData || booking,
  };
}

function parseTimeToDate(dateStr: string, timeStr: string): Date {
  try {
    const dateOnly = dateStr.split('T')[0];
    const timeParts = timeStr.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
    
    const date = new Date(dateOnly);
    date.setHours(hours, minutes, seconds, 0);
    
    return date;
  } catch (error) {
    console.error("Error parsing time:", { dateStr, timeStr, error });
    return new Date();
  }
}

export function groupBookingsByAsset(bookings: any[]): Record<string, AssetCalendar> {
  console.log("📦 Grouping bookings by asset:", bookings.length, "bookings");
  
  const grouped: Record<string, AssetCalendar> = {};

  bookings.forEach((booking, index) => {
    const assetId = booking.assetId || booking.asset_id;
    const assetName = booking.assetName || booking.asset?.name || `Asset ${assetId?.slice(0, 8)}...`;
    
    if (!assetId) {
      console.warn(`⚠️  Booking ${index} has no asset ID:`, booking);
      return;
    }

    if (!grouped[assetId]) {
      grouped[assetId] = {
        id: assetId,
        name: assetName,
        events: [],
      };
      console.log(`✅ Created calendar for: ${assetName} (${assetId.slice(0, 8)}...)`);
    }

    const calendarEvent = convertBookingToCalendarEvent(booking);
    grouped[assetId].events.push(calendarEvent);
  });

  const summary = Object.entries(grouped).map(([id, calendar]) => ({
    id: id.slice(0, 8) + '...',
    name: calendar.name,
    eventCount: calendar.events.length,
  }));
  
  console.log("📊 Grouped result:", {
    totalAssets: Object.keys(grouped).length,
    assets: summary,
  });

  return grouped;
}

// Optional helper functions
export function filterEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dateStr = date.toISOString().split('T')[0];
  
  return events.filter(event => {
    const eventDateStr = event.bookingTimeDt.split('T')[0];
    return eventDateStr === dateStr;
  });
}

export function getAssetCalendar(
  groupedCalendars: Record<string, AssetCalendar>,
  assetId: string
): AssetCalendar | undefined {
  return groupedCalendars[assetId];
}

export function getAllEvents(groupedCalendars: Record<string, AssetCalendar>): CalendarEvent[] {
  return Object.values(groupedCalendars).flatMap(calendar => calendar.events);
}

// ✅ Helper to convert extended events back to base events (for calendar component)
export function toBaseCalendarEvent(event: CalendarEvent): BaseCalendarEvent {
  return {
    id: event.id,
    start: event.start,
    end: event.end,
    title: event.title,
    description: event.description,
    color: event.color,
  };
}