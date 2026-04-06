export type NormalizedSubcontractor = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  trade_specialty?: string;
  suggested_trade_specialty?: string | null;
  trade_resolution_status?: string | null;
  trade_inference_source?: string | null;
  trade_inference_confidence?: number | null;
  planning_ready?: boolean;
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

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

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
  return extractRawSubcontractors(payload).reduce<NormalizedSubcontractor[]>(
    (normalized, sub) => {
      const resolvedId = (
        asId(sub.id) ||
        asId(sub.subcontractor_id) ||
        asId(sub.subcontractorKey) ||
        asId(sub.uuid) ||
        asId(sub.key)
      ).trim();

      if (!resolvedId) {
        return normalized;
      }

      const name = asString(sub.name);

      const firstName =
        asString(sub.first_name) ||
        asString(sub.firstName) ||
        (name ? name.split(" ")[0] : "");
      const lastName =
        asString(sub.last_name) ||
        asString(sub.lastName) ||
        (name ? name.split(" ").slice(1).join(" ") : "");

      normalized.push({
        id: resolvedId,
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
        suggested_trade_specialty:
          asString(sub.suggested_trade_specialty) ||
          asString(sub.suggestedTradeSpecialty) ||
          undefined,
        trade_resolution_status:
          asString(sub.trade_resolution_status) ||
          asString(sub.tradeResolutionStatus) ||
          undefined,
        trade_inference_source:
          asString(sub.trade_inference_source) ||
          asString(sub.tradeInferenceSource) ||
          undefined,
        trade_inference_confidence:
          asNumber(sub.trade_inference_confidence) ??
          asNumber(sub.tradeInferenceConfidence) ??
          null,
        planning_ready:
          asBoolean(sub.planning_ready) ?? asBoolean(sub.planningReady),
        phone:
          asString(sub.phone) || asString(sub.contractorPhone) || undefined,
        is_active: asBoolean(sub.is_active) ?? true,
        created_at: asString(sub.created_at) || undefined,
        updated_at: asString(sub.updated_at) || undefined,
      });

      return normalized;
    },
    [],
  );
}

export function getSubcontractorCount(payload: unknown): number {
  return normalizeSubcontractorList(payload).length;
}
