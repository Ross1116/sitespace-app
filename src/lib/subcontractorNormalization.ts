export type NormalizedSubcontractor = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  trade_specialty?: string;
  phone?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type RawSubcontractor = Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const asId = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const extractRawSubcontractors = (payload: unknown): RawSubcontractor[] => {
  const toRecords = (arr: unknown[]): RawSubcontractor[] =>
    arr.filter((item): item is RawSubcontractor => isRecord(item));

  if (Array.isArray(payload)) {
    return toRecords(payload);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const prioritizedKeys = [
    "subcontractors",
    "data",
    "records",
    "items",
    "results",
  ];
  for (const key of prioritizedKeys) {
    const candidate = payload[key];
    if (Array.isArray(candidate)) {
      return toRecords(candidate);
    }
  }

  const firstArrayValue = Object.values(payload).find((value) =>
    Array.isArray(value),
  );
  return Array.isArray(firstArrayValue) ? toRecords(firstArrayValue) : [];
};

export function normalizeSubcontractorList(
  payload: unknown,
): NormalizedSubcontractor[] {
  return extractRawSubcontractors(payload).map((sub) => {
    const name = asString(sub.name);

    const firstName =
      asString(sub.first_name) ||
      asString(sub.firstName) ||
      (name ? name.split(" ")[0] : "");
    const lastName =
      asString(sub.last_name) ||
      asString(sub.lastName) ||
      (name ? name.split(" ").slice(1).join(" ") : "");

    return {
      id:
        asId(sub.id) ||
        asId(sub.subcontractor_id) ||
        asId(sub.subcontractorKey) ||
        asId(sub.uuid) ||
        asId(sub.key),
      first_name: firstName,
      last_name: lastName,
      email:
        asString(sub.email) ||
        asString(sub.contractorEmail) ||
        asString(sub.contact_email),
      company_name:
        asString(sub.company_name) ||
        asString(sub.companyName) ||
        asString(sub.contractorCompany) ||
        asString(sub.employer) ||
        undefined,
      trade_specialty:
        asString(sub.trade_specialty) ||
        asString(sub.tradeSpecialty) ||
        asString(sub.contractorTrade) ||
        asString(sub.role) ||
        undefined,
      phone: asString(sub.phone) || asString(sub.contractorPhone) || undefined,
      is_active: asBoolean(sub.is_active) ?? true,
      created_at: asString(sub.created_at) || undefined,
      updated_at: asString(sub.updated_at) || undefined,
    };
  });
}

export function getSubcontractorCount(payload: unknown): number {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "total" in payload &&
    typeof (payload as { total?: unknown }).total === "number"
  ) {
    return (payload as { total: number }).total;
  }

  return normalizeSubcontractorList(payload).length;
}
