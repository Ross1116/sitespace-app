export const normalizeAssetStatus = (status?: string | null): string =>
  (status || "").toLowerCase().replace(/[_\s]+/g, " ").trim();

export const isAssetRetiredOrOutOfService = (
  status?: string | null,
): boolean => {
  const normalized = normalizeAssetStatus(status);
  return normalized === "retired" || normalized === "out of service";
};

export const isAssetUnavailableForBooking = (
  status?: string | null,
): boolean => {
  const normalized = normalizeAssetStatus(status);
  return (
    normalized === "maintenance" ||
    normalized === "retired" ||
    normalized === "out of service"
  );
};
