import { AxiosError } from "axios";

// ===== STATUS & ROLE UNIONS =====

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "denied";

export type AssetStatus = "available" | "maintenance" | "retired";

export type UserRole = "admin" | "manager" | "subcontractor";

// ===== API (BACKEND) TYPES =====

export interface ApiProject {
  id: string;
  name: string;
  location?: string;
  status?: string;
  is_active?: boolean;
  // Subcontractor project assignments have these alternate keys
  project_id?: string;
  project_name?: string;
  project_location?: string;
}

export interface ApiManager {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

export interface ApiSubcontractor {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  trade_specialty?: string;
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
  description?: string;
  status: AssetStatus;
  project_id?: string;
  created_at: string;
  updated_at: string;
  location?: string;
  poc?: string;
  usage_instructions?: string;
  maintenance_start_date?: string;
  maintenance_end_date?: string;
  pending_booking_capacity?: number;
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
  asset?: { id: string; name: string; asset_code?: string };
  project?: { id: string; name: string };
  manager?: ApiManager;
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
  [key: string]: T[] | number | boolean; // e.g. bookings, assets, subcontractors
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

// ===== ERROR HANDLING =====

/** Safely extract an error message from an unknown catch value (works with Axios errors). */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.detail || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

/** Type guard: is this an AxiosError? */
export function isAxiosError(error: unknown): error is AxiosError {
  return error instanceof AxiosError;
}
