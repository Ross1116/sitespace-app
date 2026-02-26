type QueryValue = string | number | null | undefined;

type BuildQueryInput = Record<string, QueryValue>;

export type BookingsListKeyParams = {
  projectId: string;
  limit?: number;
  skip?: number;
  dateFrom?: string;
  dateTo?: string;
};

export type UpcomingBookingsKeyParams = {
  projectId: string;
  limit?: number;
};

export type CalendarBookingsKeyParams = {
  projectId: string;
  dateFrom: string;
  dateTo: string;
};

const buildQuery = (params: BuildQueryInput): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
};

const getQueryParam = (key: string, param: string): string | null => {
  const queryStart = key.indexOf("?");
  if (queryStart === -1) return null;
  const search = new URLSearchParams(key.slice(queryStart + 1));
  return search.get(param);
};

export const bookingsKeys = {
  list: ({
    projectId,
    limit = 1000,
    skip = 0,
    dateFrom,
    dateTo,
  }: BookingsListKeyParams): string =>
    `/bookings/${buildQuery({
      project_id: projectId,
      limit,
      skip,
      date_from: dateFrom,
      date_to: dateTo,
    })}`,

  upcoming: ({ projectId, limit = 50 }: UpcomingBookingsKeyParams): string =>
    `/bookings/my/upcoming${buildQuery({
      limit,
      project_id: projectId,
    })}`,

  calendar: ({ projectId, dateFrom, dateTo }: CalendarBookingsKeyParams): string =>
    `/bookings/calendar${buildQuery({
      date_from: dateFrom,
      date_to: dateTo,
      project_id: projectId,
    })}`,

  detail: (bookingId: string): string => `/bookings/${bookingId}`,
};

export const isBookingsDomainKey = (key: unknown): key is string =>
  typeof key === "string" && /^\/bookings(\/|$)/.test(key);

export const isBookingsCollectionKey = (key: unknown): key is string => {
  if (!isBookingsDomainKey(key)) return false;
  return (
    key === "/bookings/" ||
    key.startsWith("/bookings/?") ||
    key.startsWith("/bookings/my/upcoming") ||
    key.startsWith("/bookings/calendar")
  );
};

export const getProjectIdFromBookingsKey = (key: unknown): string | null => {
  if (!isBookingsDomainKey(key)) return null;
  return getQueryParam(key, "project_id");
};

export const isProjectScopedBookingsKey = (
  key: unknown,
  projectId: string | null | undefined,
): key is string => {
  if (!projectId || !isBookingsCollectionKey(key)) return false;
  return getProjectIdFromBookingsKey(key) === projectId;
};
