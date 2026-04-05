import { AxiosError } from "axios";

// ===== STATUS & ROLE UNIONS =====

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "denied";

export type AssetStatus =
  | "available"
  | "maintenance"
  | "retired"
  | "out of service";

export type UserRole = "admin" | "manager" | "subcontractor" | "tv";

// ===== API (BACKEND) TYPES =====

export interface ApiProject {
  id: string;
  name: string;
  location?: string;
  status?: string;
  is_active?: boolean;
  project_id?: string;
  project_name?: string;
  project_location?: string;
}

export interface ApiManager {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email?: string;
}

export interface ApiSubcontractor {
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
  created_at: string;
  updated_at: string;
}

export interface ApiAsset {
  id: string;
  asset_code: string;
  name: string;
  type?: string | null;
  canonical_type?: string | null;
  type_resolution_status?: string | null;
  type_inference_source?: string | null;
  type_inference_confidence?: number | null;
  planning_ready?: boolean;
  capacity_ready?: boolean;
  description?: string;
  status: AssetStatus | string;
  project_id?: string;
  created_at: string;
  updated_at: string;
  location?: string;
  poc?: string;
  usage_instructions?: string;
  maintenance_start_date?: string;
  maintenance_end_date?: string;
  pending_booking_capacity?: number;
  max_hours_per_day?: number | null;
}

export interface ApiBooking {
  id: string;
  project_id?: string;
  manager_id: string;
  subcontractor_id?: string | null;
  asset_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string | null;
  purpose?: string | null;
  title?: string;
  created_at?: string;
  updated_at?: string;
  source?: string | null;
  booking_group_id?: string | null;
  programme_activity_id?: string | null;
  programme_activity_name?: string | null;
  expected_asset_type?: string | null;
  is_modified?: boolean;
  asset?: {
    id: string;
    name: string;
    asset_code?: string;
    status?: string;
    canonical_type?: string | null;
    planning_ready?: boolean;
  };
  project?: { id: string; name: string };
  manager?: ApiManager;
  created_by_id?: string | null;
  created_by_name?: string | null;
  created_by_role?: string | null;
  created_by_email?: string | null;
  booked_by_name?: string | null;
  booked_by_role?: string | null;
  booked_by_email?: string | null;
  requested_by_name?: string | null;
  requested_by_role?: string | null;
  requested_by_email?: string | null;
  created_by?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email?: string;
    role?: string;
  } | null;
  subcontractor?: {
    id: string;
    company_name?: string;
    first_name: string;
    last_name: string;
  };
  competing_pending_count?: number;
}

// ===== PAGINATED RESPONSE WRAPPERS =====

export interface PaginatedResponse<T> {
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
  [key: string]: T[] | number | boolean;
}

export interface BookingListResponse {
  bookings: ApiBooking[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface AssetListResponse {
  assets: ApiAsset[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface SubcontractorListResponse {
  subcontractors: ApiSubcontractor[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

// ===== FRONTEND TRANSFORMED TYPES =====

export interface TransformedBooking {
  bookingKey: string;
  bookingTitle: string;
  bookingDescription: string;
  bookingNotes: string;
  bookingTimeDt: string;
  bookingStartTime: string;
  bookingEndTime: string;
  bookingStatus: string;
  bookingFor: string;
  bookedAssets: string[];
  assetId: string;
  assetName: string;
  assetCode: string;
  start: Date;
  end: Date;
  bookingStart: Date;
  bookingEnd: Date;
  bookingDurationMins: number;
  subcontractorId?: string;
  subcontractorName?: string;
  projectName?: string;
  managerId?: string;
  competingPendingCount?: number;
  bookingSource?: string | null;
  bookingGroupId?: string | null;
  programmeActivityId?: string | null;
  programmeActivityName?: string | null;
  expectedAssetType?: string | null;
  isModified?: boolean;
  _originalData?: ApiBooking;
}

export interface TransformedAsset {
  assetKey: string;
  assetTitle: string;
  assetDescription: string;
  assetType: string;
  assetStatus: string;
  assetLastUpdated: string;
  assetPoc: string;
  assetProject: string;
  assetLocation: string;
  maintenanceStartdt: string;
  maintenanceEnddt: string;
  usageInstructions: string;
  assetCode: string;
  pendingBookingCapacity?: number;
  maxHoursPerDay?: number | null;
  canonicalType?: string | null;
  typeResolutionStatus?: string | null;
  typeInferenceSource?: string | null;
  typeInferenceConfidence?: number | null;
  planningReady?: boolean;
  capacityReady?: boolean;
  _originalData?: ApiAsset;
}

export interface TransformedContractor {
  contractorKey: string;
  contractorName: string;
  contractorCompany: string;
  contractorTrade: string;
  contractorEmail: string;
  contractorPhone: string;
  isActive: boolean;
  suggestedTradeSpecialty?: string | null;
  tradeResolutionStatus?: string | null;
  tradeInferenceSource?: string | null;
  tradeInferenceConfidence?: number | null;
  planningReady?: boolean;
  _originalData?: ApiSubcontractor;
}

// ===== AUDIT TRAIL =====

export interface AuditEntry {
  id: string;
  booking_id: string;
  actor_id: string;
  actor_role: string;
  actor_name: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  changes: Record<string, unknown> | null;
  comment: string | null;
  created_at: string;
}

export interface AuditTrailResponse {
  booking_id: string;
  history: AuditEntry[];
}

// ===== SITE PLANS =====

export interface SitePlanFile {
  id: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  preview_url: string;
  image_url: string;
  raw_url: string;
}

export interface SitePlan {
  id: string;
  title: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  file: SitePlanFile;
  created_by: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

export interface FileUploadResponse {
  file_id: string;
  suggested_title: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  preview_url: string;
}

// ===== LOOKAHEAD / PROGRAMME =====

export type ProgrammeUploadStatus = "processing" | "committed" | "degraded";

export type DemandLevel = "low" | "medium" | "high" | "critical";

export interface LookaheadRow {
  asset_type: string;
  week_start: string;
  demand_hours: number;
  booked_hours: number;
  gap_hours: number;
  demand_level: DemandLevel;
  snapshot_date?: string;
  timezone?: string | null;
}

export interface LookaheadSnapshotResponse {
  project_id: string;
  snapshot_id?: string;
  snapshot_date?: string;
  timezone?: string | null;
  rows: LookaheadRow[];
  message?: string;
}

export interface LookaheadSnapshotHistoryEntry {
  snapshot_id?: string;
  snapshot_date?: string | null;
  timezone?: string | null;
  rows: LookaheadRow[];
  row_count?: number | null;
}

export interface LookaheadAnomalyFlags {
  demand_spike_over_100pct?: boolean;
  mapping_changes_over_40pct?: boolean;
  activity_count_delta_over_30pct?: boolean;
  mapping_change_ratio?: number;
  activity_count_delta_ratio?: number;
  [key: string]: boolean | number | undefined;
}

export interface LookaheadAlertsResponse {
  project_id: string;
  snapshot_id?: string;
  snapshot_date?: string;
  alerts: LookaheadAnomalyFlags;
}

export interface LookaheadActivityCandidate {
  activity_id: string;
  programme_upload_id?: string | null;
  activity_name: string;
  start_date?: string | null;
  end_date?: string | null;
  overlap_hours: number;
  level_name?: string | null;
  zone_name?: string | null;
  row_confidence?: number | null;
  sort_order?: number | null;
  booking_group_id?: string | null;
  linked_booking_count?: number | null;
}

export interface LookaheadActivitiesResponse {
  project_id?: string;
  week_start?: string | null;
  asset_type?: string | null;
  activities: LookaheadActivityCandidate[];
}

export interface ActivityBookingGroupSummary {
  booking_group_id?: string | null;
  booking_count?: number;
  total_booked_hours?: number;
  last_booking_at?: string | null;
}

export interface ProgrammeActivityCandidateAsset {
  id: string;
  asset_code?: string;
  name: string;
  status?: string | null;
  canonical_type?: string | null;
  planning_ready?: boolean;
  availability_status?: string | null;
  availability_reason?: string | null;
  booked_hours_in_week?: number | null;
}

export interface ProgrammeActivitySuggestedBookingDate {
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  hours?: number | null;
  demand_hours?: number | null;
  booked_hours?: number | null;
  gap_hours?: number | null;
}

export interface ProgrammeActivityBookingContextResponse {
  activity_id: string;
  activity_name: string;
  programme_upload_id?: string | null;
  expected_asset_type?: string | null;
  selected_week_start?: string | null;
  default_week_start?: string | null;
  default_booking_date?: string | null;
  default_start_time?: string | null;
  default_end_time?: string | null;
  suggested_bulk_dates: ProgrammeActivitySuggestedBookingDate[];
  linked_booking_group?: ActivityBookingGroupSummary | null;
  linked_bookings: ApiBooking[];
  candidate_assets: ProgrammeActivityCandidateAsset[];
  level_name?: string | null;
  zone_name?: string | null;
}

export interface ActivityMappingResponse {
  id: string;
  item_id?: string | null;
  activity_name?: string | null;
  source_value?: string | null;
  asset_type?: string | null;
  classification_name?: string | null;
  current_classification?: string | null;
  suggested_classification?: string | null;
  source?: string | null;
  confidence?: string | null;
  manual_correction?: boolean;
  corrected_by?: string | null;
  corrected_at?: string | null;
  level_name?: string | null;
  zone_name?: string | null;
}

export interface PlanningCompletenessTask {
  id?: string;
  title: string;
  description?: string | null;
  severity?: string | null;
  status?: string | null;
  link?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  count?: number | null;
}

export interface PlanningCompletenessCounts {
  unknown_assets?: number;
  inferred_assets?: number;
  confirmed_assets?: number;
  unknown_trades?: number;
  inferred_trades?: number;
  confirmed_trades?: number;
  blocking_assets?: number;
  blocking_trades?: number;
  blocking_total?: number;
  next_six_weeks_blocking_assets?: number;
  next_six_weeks_blocking_trades?: number;
  [key: string]: number | undefined;
}

export interface PlanningCompletenessResponse {
  score: number;
  status: string;
  window_start?: string | null;
  window_end?: string | null;
  counts: PlanningCompletenessCounts;
  actionable_tasks: PlanningCompletenessTask[];
}

export interface ProgrammeUploadDiagnostics {
  ai_quota_exhausted?: boolean;
  classification_ai_suppressed?: boolean;
  work_profile_ai_suppressed?: boolean;
  missing_fields?: string[];
  notes?: string | string[];
  unclassified_mapping_count?: number;
  non_planning_ready_asset_count?: number;
  excluded_booking_count?: number;
  ai_classification_fallback?: boolean;
  [key: string]: unknown;
}

export interface ProgrammeVersion {
  upload_id: string;
  version_number: number;
  file_name: string;
  status: ProgrammeUploadStatus;
  completeness_score: number;
  created_at: string | null;
  completeness_notes?: ProgrammeUploadDiagnostics | null;
}

export interface UploadStatusResponse {
  upload_id: string;
  status: ProgrammeUploadStatus;
  completeness_score: number;
  completeness_notes: ProgrammeUploadDiagnostics | null;
  version_number: number;
  file_name: string;
  created_at: string | null;
  ai_tokens_used?: number | null;
  ai_cost_usd?: number | null;
}

export interface UploadAcceptedResponse {
  upload_id: string;
  status: "processing";
  message: string;
}

// ===== CAPACITY DASHBOARD =====

export type CapacityStatus =
  | "idle"
  | "under_utilised"
  | "balanced"
  | "tight"
  | "over_capacity"
  | "no_capacity"
  | "review_needed";

export interface CapacityCell {
  demand_hours: number;
  booked_hours: number;
  capacity_hours: number;
  remaining_capacity_hours: number;
  uncovered_demand_hours: number;
  demand_utilization_pct: number;
  booked_utilization_pct: number;
  available_assets: number;
  status: CapacityStatus;
  is_anomalous: boolean;
}

export interface CapacityWeekSummary {
  total_demand_hours: number;
  total_booked_hours: number;
  total_capacity_hours: number;
  overall_demand_utilization_pct: number;
  overall_booked_utilization_pct: number;
  worst_status: string;
}

export interface CapacityAssetTypeSummary {
  total_demand_hours: number;
  total_booked_hours: number;
  total_capacity_hours: number;
  peak_week: string | null;
  peak_demand_utilization_pct: number;
  weeks_over_capacity: number;
  weeks_tight: number;
}

export interface CapacityDashboardDiagnostics {
  unresolved_asset_count: number;
  other_demand_hours_total: number;
  excluded_asset_types: string[];
  snapshot_id: string | null;
  snapshot_date: string | null;
  snapshot_refreshed_at: string | null;
  total_assets_evaluated: number;
  excluded_not_planning_ready: number;
  excluded_retired: number;
  capacity_computed_at: string;
  assumptions: string[];
}

export interface CapacityHeadlineSummary {
  total_demand_hours: number;
  total_capacity_hours: number;
  avg_utilization_pct: number;
  weeks_with_gaps: number;
  demand_without_capacity_hours: number;
}

export interface CapacityDashboardResponse {
  project_id: string;
  upload_id: string | null;
  start_week: string;
  weeks: string[];
  work_days_per_week: number;
  asset_types: string[];
  rows: Record<string, Record<string, CapacityCell>>;
  headline_summary: CapacityHeadlineSummary;
  summary_by_week: Record<string, CapacityWeekSummary>;
  summary_by_asset_type: Record<string, CapacityAssetTypeSummary>;
  diagnostics: CapacityDashboardDiagnostics | null;
  message: string | null;
}

// ===== ERROR HANDLING =====

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toMessageText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((entry) => toMessageText(entry))
      .filter((entry): entry is string => Boolean(entry));

    if (messages.length === 0) return null;
    return messages.join("; ");
  }

  if (isRecord(value)) {
    const loc = Array.isArray(value.loc)
      ? value.loc
          .map((part) =>
            typeof part === "string" || typeof part === "number"
              ? String(part)
              : null,
          )
          .filter((part): part is string => Boolean(part))
          .join(".")
      : null;

    const directMessage =
      toMessageText(value.detail) ||
      toMessageText(value.message) ||
      toMessageText(value.msg) ||
      toMessageText(value.error) ||
      toMessageText(value.errors);

    if (directMessage) {
      return loc && !directMessage.startsWith(loc)
        ? `${loc}: ${directMessage}`
        : directMessage;
    }
  }

  return null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    const messageFromPayload = toMessageText(data);

    if (messageFromPayload) {
      return messageFromPayload;
    }

    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  const unknownMessage = toMessageText(error);
  if (unknownMessage) {
    return unknownMessage;
  }

  return fallback;
}

export function isAxiosError(error: unknown): error is AxiosError {
  return error instanceof AxiosError;
}
