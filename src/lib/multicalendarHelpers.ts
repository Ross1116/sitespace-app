// import { monthEventVariants } from "@/components/ui/full-calendar/calendar-utils";
import {
  CalendarEvent as BaseCalendarEvent,
  AssetCalendar as BaseAssetCalendar,
} from "@/components/ui/full-calendar/calendar-context";
import { ApiAsset, ApiBooking } from "@/types";

export type VariantProps<Component extends (...args: unknown[]) => unknown> =
  Omit<OmitUndefined<Parameters<Component>[0]>, "class" | "className">;
export type OmitUndefined<T> = T extends undefined ? never : T;

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const getString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const getId = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

type BookingInput = Partial<CalendarEvent> & {
  _originalData?: ApiBooking | UnknownRecord;
};

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
  isBookedByMe?: boolean;
  isAssignedToMe?: boolean;
  _originalData?: ApiBooking | UnknownRecord;
}

export interface AssetCalendar extends Omit<BaseAssetCalendar, "events"> {
  events: CalendarEvent[];
  asset?: ApiAsset | { id: string; name: string; asset_code?: string };
}

// Global debug flag (Module level variable instead of window)
let hasLoggedDiagnostic = false;

// --- CONVERSION ---

export function convertBookingToCalendarEvent(
  booking: BookingInput,
): CalendarEvent {
  const raw = isRecord(booking._originalData) ? booking._originalData : booking;

  // --- ASSET EXTRACTION ---
  let assetId = "unknown";
  let assetName = "Unknown Asset";
  let assetCode = "";

  const rawAsset = isRecord(raw.asset) ? raw.asset : undefined;

  if (rawAsset) {
    assetId = getId(rawAsset.id) || getId(raw.asset_id) || assetId;
    assetCode =
      getString(rawAsset.asset_code) || getString(rawAsset.code) || assetCode;
    const rawAssetName = getString(rawAsset.name);
    if (rawAssetName) assetName = rawAssetName;
  } else if (raw.asset_id) {
    assetId = getId(raw.asset_id) || assetId;
    // If booking already has an assetName (from cache or create-time), preserve it
    const bookingAssetName = getString(booking.assetName);
    if (bookingAssetName && bookingAssetName !== "Unknown Asset") {
      assetName = bookingAssetName;
    } else {
      const rawAssetName = getString(raw.asset_name);
      if (rawAssetName) assetName = rawAssetName;
    }
  }

  if (assetName === "Unknown Asset" && assetId !== "unknown") {
    if (assetCode) assetName = `Asset ${assetCode}`;
    else assetName = `Asset ${String(assetId).slice(0, 6)}...`;
  }

  // --- MANAGER / SUBCONTRACTOR NAMES ---
  const manager = isRecord(raw.manager) ? raw.manager : undefined;
  const subcontractor = isRecord(raw.subcontractor)
    ? raw.subcontractor
    : undefined;
  const managerName =
    [getString(manager?.first_name), getString(manager?.last_name)]
      .filter(Boolean)
      .join(" ")
      .trim() || "Manager";
  const subName = [
    getString(subcontractor?.first_name),
    getString(subcontractor?.last_name),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const subcontractorId = getId(raw.subcontractor_id);

  const createdBy = isRecord(raw.created_by) ? raw.created_by : undefined;
  const createdByName =
    getString(raw.created_by_name) ||
    getString(raw.booked_by_name) ||
    getString(raw.requested_by_name) ||
    getString(createdBy?.full_name) ||
    [getString(createdBy?.first_name), getString(createdBy?.last_name)]
      .filter(Boolean)
      .join(" ")
      .trim();
  const createdById = getId(raw.created_by_id) || getId(createdBy?.id);

  let bookedFor = "";
  if (createdByName) {
    bookedFor = createdByName;
  } else if (createdById && createdById === subcontractorId && subName) {
    bookedFor = subName;
  } else if (createdById && createdById === getId(raw.manager_id)) {
    bookedFor = managerName;
  } else if (subcontractorId && subName) {
    bookedFor = subName;
  } else {
    bookedFor = managerName;
  }

  // --- TITLE & DESCRIPTION LOGIC (Matches BookingsPage) ---
  const rawPurpose = getString(raw.purpose);
  const rawNotes = getString(raw.notes);
  let baseTitle = "";
  let baseDescription = "No description provided";

  // 1. Determine Title: Purpose > Notes > Fallback
  if (
    rawPurpose &&
    typeof rawPurpose === "string" &&
    rawPurpose.trim() !== ""
  ) {
    baseTitle = rawPurpose;
  } else if (
    rawNotes &&
    typeof rawNotes === "string" &&
    rawNotes.trim() !== ""
  ) {
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
    (booking.start instanceof Date ? booking.start : null) ||
    (raw.start instanceof Date ? raw.start : null) ||
    (raw.booking_date && raw.start_time
      ? parseTimeToDate(getString(raw.booking_date), getString(raw.start_time))
      : null) ||
    new Date();

  const end =
    (booking.end instanceof Date ? booking.end : null) ||
    (raw.end instanceof Date ? raw.end : null) ||
    (raw.booking_date && raw.end_time
      ? parseTimeToDate(getString(raw.booking_date), getString(raw.end_time))
      : null) ||
    new Date(new Date(start).getTime() + 60 * 60 * 1000); // fallback 1 hour

  // --- STATUS & COLOR ---
  const status = (
    getString(booking.status) ||
    getString(raw.status) ||
    getString(raw.booking_status) ||
    "pending"
  ).toLowerCase();
  const statusColorMap: Record<string, CalendarEvent["color"]> = {
    pending: "yellow",
    confirmed: "green",
    in_progress: "blue",
    completed: "purple",
    cancelled: "pink",
    denied: "pink", // Added denied
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
      getId(raw.id) ||
      `${assetId}_${getString(raw.booking_date)}_${getString(raw.start_time)}`,
    start,
    end,
    title: finalTitle,
    description: baseDescription,
    color,
    bookingKey: booking.id || getId(raw.id),

    // Normalized Fields
    bookingTitle: baseTitle,
    bookingDescription: baseDescription,
    bookingNotes: rawNotes || "",

    bookingTimeDt: getString(raw.booking_date) || getString(raw.date),
    bookingStartTime: getString(raw.start_time),
    bookingEndTime: getString(raw.end_time),
    bookingStatus: status,
    bookingFor: bookedFor,

    assetId,
    assetName,
    assetCode,
    assetType: getString(raw.assetType) || undefined,
    bookedAssets: [assetName],

    status,
    managerId: getId(raw.manager_id) || undefined,
    managerName: managerName || undefined,
    subcontractorId: subcontractorId || undefined,
    isBookedByMe:
      typeof booking.isBookedByMe === "boolean"
        ? booking.isBookedByMe
        : undefined,
    isAssignedToMe:
      typeof booking.isAssignedToMe === "boolean"
        ? booking.isAssignedToMe
        : undefined,
    subcontractorName: subName || undefined,
    projectId: getId(raw.project_id) || undefined,
    projectName: isRecord(raw.project)
      ? getString(raw.project.name) || undefined
      : undefined,
    projectLocation: isRecord(raw.project)
      ? getString(raw.project.location) || undefined
      : undefined,

    _originalData: isRecord(booking._originalData)
      ? booking._originalData
      : raw,
  };
}

// --- GROUPING ---

export function groupBookingsByAsset(
  bookings: BookingInput[],
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
