import type { ApiAsset, ApiBooking, ApiProject } from "@/types";

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

const asOptionalString = (value: unknown): string | undefined => {
  const normalized = asString(value).trim();
  return normalized.length > 0 ? normalized : undefined;
};

const asId = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

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
    created_by_name: asOptionalString(record.created_by_name) || undefined,
    created_by_role: asOptionalString(record.created_by_role) || undefined,
    created_by_email: asOptionalString(record.created_by_email) || undefined,
    booked_by_name: asOptionalString(record.booked_by_name) || undefined,
    booked_by_role: asOptionalString(record.booked_by_role) || undefined,
    booked_by_email: asOptionalString(record.booked_by_email) || undefined,
    requested_by_name: asOptionalString(record.requested_by_name) || undefined,
    requested_by_role: asOptionalString(record.requested_by_role) || undefined,
    requested_by_email: asOptionalString(record.requested_by_email) || undefined,
    notes: asOptionalString(record.notes) || null,
    purpose: asOptionalString(record.purpose) || null,
    title: asOptionalString(record.title) || undefined,
    created_at: asOptionalString(record.created_at) || undefined,
    updated_at: asOptionalString(record.updated_at) || undefined,
    source: asOptionalString(record.source) || null,
    booking_group_id: asOptionalString(record.booking_group_id) || null,
    programme_activity_id:
      asOptionalString(record.programme_activity_id) || null,
    programme_activity_name:
      asOptionalString(record.programme_activity_name) || null,
    expected_asset_type: asOptionalString(record.expected_asset_type) || null,
    is_modified: asBoolean(record.is_modified),
    asset:
      assetObjectId && assetObjectName
        ? {
            id: assetObjectId,
            name: assetObjectName,
            asset_code: asOptionalString(assetRecord?.asset_code),
            status: asOptionalString(assetRecord?.status),
            canonical_type: asOptionalString(assetRecord?.canonical_type) ?? null,
            planning_ready: asBoolean(assetRecord?.planning_ready),
          }
        : undefined,
    project:
      projectObjectId && projectObjectName
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
          full_name: asOptionalString(managerRecord?.full_name),
          email: asOptionalString(managerRecord?.email),
        }
      : undefined,
    subcontractor: subcontractorObjectId
      ? {
          id: subcontractorObjectId,
          company_name: asOptionalString(subcontractorRecord?.company_name),
          first_name: asString(subcontractorRecord?.first_name),
          last_name: asString(subcontractorRecord?.last_name),
        }
      : undefined,
    created_by: createdByRecord
      ? {
          id: asId(createdByRecord.id) || undefined,
          first_name: asOptionalString(createdByRecord.first_name),
          last_name: asOptionalString(createdByRecord.last_name),
          full_name: asOptionalString(createdByRecord.full_name),
          email: asOptionalString(createdByRecord.email),
          role: asOptionalString(createdByRecord.role),
        }
      : undefined,
    competing_pending_count: asNumber(record.competing_pending_count),
  };
};

const toApiAsset = (record: UnknownRecord): ApiAsset | null => {
  const id = asId(record.id);
  const assetCode = asString(record.asset_code);
  const name = asString(record.name);
  const createdAt = asString(record.created_at);
  const updatedAt = asString(record.updated_at);
  const status = asString(record.status);

  if (!id || !assetCode || !name || !createdAt || !updatedAt || !status) {
    return null;
  }

  return {
    id,
    asset_code: assetCode,
    name,
    type: asOptionalString(record.type) ?? null,
    canonical_type: asOptionalString(record.canonical_type) ?? null,
    type_resolution_status:
      asOptionalString(record.type_resolution_status) ?? null,
    type_inference_source: asOptionalString(record.type_inference_source) ?? null,
    type_inference_confidence: asNumber(record.type_inference_confidence) ?? null,
    planning_ready: asBoolean(record.planning_ready),
    description: asOptionalString(record.description),
    status,
    project_id: asOptionalString(record.project_id),
    created_at: createdAt,
    updated_at: updatedAt,
    location: asOptionalString(record.location),
    poc: asOptionalString(record.poc),
    usage_instructions: asOptionalString(record.usage_instructions),
    maintenance_start_date: asOptionalString(record.maintenance_start_date),
    maintenance_end_date: asOptionalString(record.maintenance_end_date),
    pending_booking_capacity: asNumber(record.pending_booking_capacity),
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
        asOptionalString(project.location) ||
        asOptionalString(project.project_location) ||
        undefined,
      status: asOptionalString(project.status) || statusFromFlag,
      is_active: asBoolean(project.is_active),
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

export function normalizeAssetList(payload: unknown): ApiAsset[] {
  return extractList(payload, [
    "assets",
    "data",
    "records",
    "items",
    "results",
  ])
    .map((asset) => toApiAsset(asset))
    .filter((asset): asset is ApiAsset => asset !== null);
}
