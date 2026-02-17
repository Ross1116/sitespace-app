import type { ApiBooking, ApiProject } from "@/types";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const toRecords = (value: unknown): UnknownRecord[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is UnknownRecord => isRecord(item));
};

const extractList = (payload: unknown, keys: string[]): UnknownRecord[] => {
  if (Array.isArray(payload)) {
    return toRecords(payload);
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of keys) {
    const candidate = payload[key];
    if (Array.isArray(candidate)) {
      return toRecords(candidate);
    }
  }

  const firstArrayValue = Object.values(payload).find((value) =>
    Array.isArray(value),
  );
  return toRecords(firstArrayValue);
};

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const asId = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const toOptionalRecord = (
  value: unknown,
): Record<string, unknown> | undefined => (isRecord(value) ? value : undefined);

const toApiBooking = (record: UnknownRecord): ApiBooking | null => {
  const id = asId(record.id);
  const managerId = asId(record.manager_id);
  const assetId = asId(record.asset_id);
  const bookingDate = asString(record.booking_date);
  const startTime = asString(record.start_time);
  const endTime = asString(record.end_time);
  const status = asString(record.status);

  if (!id || !managerId || !assetId || !bookingDate || !startTime || !endTime) {
    return null;
  }

  const assetRecord = toOptionalRecord(record.asset);
  const projectRecord = toOptionalRecord(record.project);

  return {
    id,
    project_id: asId(record.project_id) || undefined,
    manager_id: managerId,
    subcontractor_id: asId(record.subcontractor_id) || null,
    asset_id: assetId,
    booking_date: bookingDate,
    start_time: startTime,
    end_time: endTime,
    status: status || "pending",
    notes: asString(record.notes) || null,
    purpose: asString(record.purpose) || null,
    title: asString(record.title) || undefined,
    created_at: asString(record.created_at) || undefined,
    updated_at: asString(record.updated_at) || undefined,
    asset: assetRecord
      ? {
          id: asId(assetRecord.id),
          name: asString(assetRecord.name),
          asset_code: asString(assetRecord.asset_code) || undefined,
        }
      : undefined,
    project: projectRecord
      ? {
          id: asId(projectRecord.id),
          name: asString(projectRecord.name),
        }
      : undefined,
    competing_pending_count:
      typeof record.competing_pending_count === "number"
        ? record.competing_pending_count
        : undefined,
  };
};

export function normalizeProjectList(payload: unknown): ApiProject[] {
  const normalizedProjects: ApiProject[] = [];

  for (const project of extractList(payload, [
    "projects",
    "data",
    "records",
    "items",
    "results",
  ])) {
    const id = asId(project.id) || asId(project.project_id);
    if (!id) continue;

    const statusFromFlag =
      typeof project.is_active === "boolean"
        ? project.is_active
          ? "active"
          : "inactive"
        : undefined;

    normalizedProjects.push({
      id,
      name:
        asString(project.name) ||
        asString(project.project_name) ||
        "Selected Project",
      location:
        asString(project.location) ||
        asString(project.project_location) ||
        undefined,
      status: asString(project.status) || statusFromFlag,
    });
  }

  return normalizedProjects;
}

export function normalizeBookingList(payload: unknown): ApiBooking[] {
  return extractList(payload, [
    "bookings",
    "data",
    "records",
    "items",
    "results",
  ])
    .map((booking) => toApiBooking(booking))
    .filter((booking): booking is ApiBooking => booking !== null);
}
