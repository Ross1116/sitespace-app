import { reportError } from "@/lib/monitoring";

export type StoredProject = {
  id: string;
  name?: string;
  location?: string;
  status?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStoredProject = (value: unknown): StoredProject | null => {
  if (!isRecord(value)) return null;

  const source = value;
  const rawId = source.id ?? source.project_id;
  const id =
    typeof rawId === "string"
      ? rawId
      : typeof rawId === "number"
        ? String(rawId)
        : "";

  if (!id) return null;

  const rawName = source.name ?? source.project_name;
  const rawLocation = source.location ?? source.project_location;
  const rawStatus = source.status;

  const status =
    typeof rawStatus === "string"
      ? rawStatus
      : typeof source.is_active === "boolean"
        ? source.is_active
          ? "active"
          : "inactive"
        : undefined;

  return {
    id,
    name: typeof rawName === "string" ? rawName : undefined,
    location: typeof rawLocation === "string" ? rawLocation : undefined,
    status,
  };
};

const getProjectStorageKey = (userId?: string | number) => `project_${userId}`;

export const saveStoredProject = (
  userId: string | number | undefined,
  project: unknown,
): void => {
  if (typeof window === "undefined" || !userId) return;

  const normalized = toStoredProject(project);
  if (!normalized) return;

  localStorage.setItem(
    getProjectStorageKey(userId),
    JSON.stringify(normalized),
  );
};

export const readStoredProject = (
  userId: string | number | undefined,
): StoredProject | null => {
  if (typeof window === "undefined" || !userId) return null;

  const storageKey = getProjectStorageKey(userId);
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const normalized = toStoredProject(parsed);
    if (!normalized) {
      localStorage.removeItem(storageKey);
      return null;
    }

    localStorage.setItem(storageKey, JSON.stringify(normalized));
    return normalized;
  } catch (error) {
    reportError(
      error,
      "projectStorage: failed to parse stored project payload",
    );
    localStorage.removeItem(storageKey);
    return null;
  }
};

export const removeStoredProject = (
  userId: string | number | undefined,
): void => {
  if (typeof window === "undefined" || !userId) return;
  localStorage.removeItem(getProjectStorageKey(userId));
};
