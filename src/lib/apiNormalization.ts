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
  ]).map((booking) => booking as unknown as ApiBooking);
}
