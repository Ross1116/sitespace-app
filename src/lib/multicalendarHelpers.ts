// import { monthEventVariants } from "@/components/ui/full-calendar/calendar-utils";
import {
  CalendarEvent as BaseCalendarEvent,
  AssetCalendar as BaseAssetCalendar,
} from "@/components/ui/full-calendar/calendar-context";

export type VariantProps<Component extends (...args: any) => any> = Omit<
  OmitUndefined<Parameters<Component>[0]>,
  "class" | "className"
>;
export type OmitUndefined<T> = T extends undefined ? never : T;

// --- INTERFACES ---

export interface CalendarEvent extends BaseCalendarEvent {
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
  assetCode?: string;
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
  _originalData?: any;
}

export interface AssetCalendar extends Omit<BaseAssetCalendar, "events"> {
  events: CalendarEvent[];
  asset?: {
    id: string;
    name: string;
    asset_code?: string;
    [key: string]: any;
  };
}

// Global debug flag (Module level variable instead of window)
let hasLoggedDiagnostic = false;

// --- CONVERSION ---

export function convertBookingToCalendarEvent(booking: any): CalendarEvent {
  const raw = booking._originalData || booking;

  // --- ASSET EXTRACTION ---
  let assetId = "unknown";
  let assetName = "Unknown Asset";
  let assetCode = "";

  if (raw.asset && typeof raw.asset === "object") {
    assetId = raw.asset.id || raw.asset_id || assetId;
    assetCode = raw.asset.asset_code || raw.asset.code || assetCode;
    if (raw.asset.name) assetName = raw.asset.name;
  } else if (raw.asset_id) {
    assetId = raw.asset_id;
    // If booking already has an assetName (from cache or create-time), preserve it
    if (booking.assetName && booking.assetName !== "Unknown Asset") {
      assetName = booking.assetName;
    } else if (raw.asset_name) {
      assetName = raw.asset_name;
    }
  }

  if (assetName === "Unknown Asset" && assetId !== "unknown") {
    if (assetCode) assetName = `Asset ${assetCode}`;
    else assetName = `Asset ${String(assetId).slice(0, 6)}...`;
  }

  // --- MANAGER / SUBCONTRACTOR NAMES ---
  const managerName = raw.manager?.first_name || "Manager";
  const subName =
    raw.subcontractor?.company_name || raw.subcontractor?.first_name || "";
  const bookedFor = raw.subcontractor_id ? subName : managerName;

  // --- TITLE & DESCRIPTION LOGIC (Matches BookingsPage) ---
  const rawPurpose = raw.purpose;
  const rawNotes = raw.notes;
  let baseTitle = "";
  let baseDescription = "No description provided";

  // 1. Determine Title: Purpose > Notes > Fallback
  if (rawPurpose && typeof rawPurpose === "string" && rawPurpose.trim() !== "") {
    baseTitle = rawPurpose;
  } else if (rawNotes && typeof rawNotes === "string" && rawNotes.trim() !== "") {
    baseTitle = rawNotes;
  } else {
    baseTitle = `Booking for ${bookedFor}`;
  }

  // 2. Determine Description: Notes > (Purpose if unused) > Fallback
  if (rawNotes && typeof rawNotes === "string" && rawNotes.trim() !== "") {
    // If we used notes as title, don't repeat in desc unless distinct
    if (baseTitle === rawNotes) {
       baseDescription = "No additional details";
    } else {
       baseDescription = rawNotes;
    }
  } else if (
    rawPurpose &&
    typeof rawPurpose === "string" &&
    rawPurpose.trim() !== "" &&
    baseTitle !== rawPurpose
  ) {
    baseDescription = rawPurpose;
  }

  // Append Asset Name to title for Calendar View context (optional, usually helpful in grids)
  const finalTitle = assetName ? `${baseTitle} - ${assetName}` : baseTitle;

  // --- START / END TIMES (tolerant) ---
  const start =
    booking.start ||
    raw.start ||
    (raw.booking_date && raw.start_time
      ? parseTimeToDate(raw.booking_date, raw.start_time)
      : null) ||
    new Date();

  const end =
    booking.end ||
    raw.end ||
    (raw.booking_date && raw.end_time
      ? parseTimeToDate(raw.booking_date, raw.end_time)
      : null) ||
    new Date(new Date(start).getTime() + 60 * 60 * 1000); // fallback 1 hour

  // --- STATUS & COLOR ---
  const status = (
    booking.status || raw.status || raw.booking_status || "pending"
  ).toLowerCase();
  const statusColorMap: Record<string, any> = {
    pending: "yellow",
    confirmed: "green",
    in_progress: "blue",
    completed: "purple",
    cancelled: "pink",
    denied: "red", // Added denied
  };
  let color = statusColorMap[status] || "default";

  // Emergency override
  if (
    (rawNotes && rawNotes.toLowerCase().includes("emergency")) ||
    (rawPurpose && rawPurpose.toLowerCase().includes("emergency"))
  ) {
    color = "purple";
  }

  return {
    id:
      booking.id ||
      raw.id ||
      `${assetId}_${raw.booking_date}_${raw.start_time}`,
    start,
    end,
    title: finalTitle,
    description: baseDescription,
    color,
    bookingKey: booking.id || raw.id,
    
    // Normalized Fields
    bookingTitle: baseTitle,
    bookingDescription: baseDescription,
    bookingNotes: rawNotes || "",
    
    bookingTimeDt: raw.booking_date || raw.date || "",
    bookingStartTime: raw.start_time || "",
    bookingEndTime: raw.end_time || "",
    bookingStatus: status,
    bookingFor: bookedFor,

    assetId,
    assetName,
    assetCode,
    assetType: raw.assetType,
    bookedAssets: [assetName],

    status,
    managerId: raw.manager_id,
    managerName: raw.manager?.first_name,
    subcontractorId: raw.subcontractor_id,
    subcontractorName: raw.subcontractor?.company_name,
    projectId: raw.project_id,
    projectName: raw.project?.name,
    projectLocation: raw.project?.location,

    _originalData: raw,
  };
}

// --- GROUPING ---

export function groupBookingsByAsset(
  bookings: any[]
): Record<string, AssetCalendar> {
  const grouped: Record<string, AssetCalendar> = {};

  bookings.forEach((booking) => {
    const event = convertBookingToCalendarEvent(booking);
    const assetId = event.assetId;

    if (!assetId || assetId === "unknown") return;

    if (!grouped[assetId]) {
      grouped[assetId] = {
        id: assetId,
        name: event.assetName,
        asset: {
          id: assetId,
          name: event.assetName,
          asset_code: event.assetCode,
        },
        events: [],
      };
    } else {
      // Self-Healing Logic
      const current = grouped[assetId].name;
      const newer = event.assetName;
      const isBad = current === "Unknown Asset" || current.startsWith("Asset ");
      const isGood = newer !== "Unknown Asset" && !newer.startsWith("Asset ");

      if (isBad && isGood) {
        grouped[assetId].name = newer;
        if (grouped[assetId].asset) grouped[assetId].asset!.name = newer;
      }
    }
    grouped[assetId].events.push(event);
  });

  return grouped;
}

function parseTimeToDate(dateStr: string, timeStr: string): Date {
  try {
    if (!dateStr || !timeStr) return new Date();
    const dateOnly = dateStr.split("T")[0];
    const timeParts = timeStr.split(":");
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    return new Date(new Date(dateOnly).setHours(hours, minutes, 0, 0));
  } catch {
    return new Date();
  }
}
