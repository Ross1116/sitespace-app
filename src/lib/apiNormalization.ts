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
  const managerRecord = toOptionalRecord(record.manager);
  const subcontractorRecord = toOptionalRecord(record.subcontractor);
  const createdByRecord = toOptionalRecord(record.created_by);
  const assetObjectId = assetRecord ? asId(assetRecord.id) : "";
  const assetObjectName = assetRecord ? asString(assetRecord.name) : "";
  const projectObjectId = projectRecord ? asId(projectRecord.id) : "";
  const projectObjectName = projectRecord ? asString(projectRecord.name) : "";
  const managerObjectId = managerRecord ? asId(managerRecord.id) : "";
  const subcontractorObjectId = subcontractorRecord
    ? asId(subcontractorRecord.id)
    : "";

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
    created_by_id: asId(record.created_by_id) || undefined,
    created_by_name: asString(record.created_by_name) || undefined,
    created_by_role: asString(record.created_by_role) || undefined,
    booked_by_name: asString(record.booked_by_name) || undefined,
    booked_by_role: asString(record.booked_by_role) || undefined,
    requested_by_name: asString(record.requested_by_name) || undefined,
    requested_by_role: asString(record.requested_by_role) || undefined,
    notes: asString(record.notes) || null,
    purpose: asString(record.purpose) || null,
    title: asString(record.title) || undefined,
    created_at: asString(record.created_at) || undefined,
    updated_at: asString(record.updated_at) || undefined,
    asset: assetObjectId && assetObjectName
      ? {
          id: assetObjectId,
          name: assetObjectName,
          asset_code: asString(assetRecord?.asset_code) || undefined,
        }
      : undefined,
    project: projectObjectId && projectObjectName
      ? {
          id: projectObjectId,
          name: projectObjectName,
        }
      : undefined,
    manager: managerObjectId
      ? {
          id: managerObjectId,
          first_name: asString(managerRecord?.first_name),
          last_name: asString(managerRecord?.last_name),
          full_name: asString(managerRecord?.full_name) || undefined,
        }
      : undefined,
    subcontractor: subcontractorObjectId
      ? {
          id: subcontractorObjectId,
          company_name: asString(subcontractorRecord?.company_name) || undefined,
          first_name: asString(subcontractorRecord?.first_name),
          last_name: asString(subcontractorRecord?.last_name),
        }
      : undefined,
    created_by: createdByRecord
      ? {
          id: asId(createdByRecord.id) || undefined,
          first_name: asString(createdByRecord.first_name) || undefined,
          last_name: asString(createdByRecord.last_name) || undefined,
          full_name: asString(createdByRecord.full_name) || undefined,
          email: asString(createdByRecord.email) || undefined,
          role: asString(createdByRecord.role) || undefined,
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
