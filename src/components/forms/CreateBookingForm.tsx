"use client";

import { useReducer, useEffect, useCallback, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format, addMinutes } from "date-fns";
import { CalendarEvent } from "@/components/ui/full-calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Calendar as CalendarIcon,
  Info,
  CheckCircle,
  Ban,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ApiAsset,
  ApiBooking,
  ProgrammeActivityCandidateAsset,
  ProgrammeActivityBookingContextResponse,
  ProgrammeActivitySuggestedBookingDate,
  getApiErrorMessage,
} from "@/types";
import { isAssetUnavailableForBooking } from "@/lib/assetStatus";
import { reportError } from "@/lib/monitoring";
import { useResolvedProjectSelection } from "@/hooks/useResolvedProjectSelection";
import { useProjectAssets } from "@/hooks/useProjectAssets";
import { useProjectSubcontractors } from "@/hooks/useProjectSubcontractors";
import {
  BookingCreatePayload,
  fetchBookingsForDate,
  getCompetingPendingBookingsForAssets,
  getDuplicateAssetIdsForSubcontractor,
} from "@/hooks/bookings/api";
import { useBookingMutations } from "@/hooks/bookings/useBookingMutations";
import {
  BOOKING_DURATION_OPTIONS,
  QUARTER_HOUR_OPTIONS,
  DEFAULT_BOOKING_DURATION_MINUTES,
  HOURS_IN_DAY,
  MINUTES_PER_HOUR,
} from "@/lib/formOptions";
import {
  getSuggestedDateSlotKey,
  getSuggestedDatesWithCoverageStatus,
} from "@/components/lookahead/activityBookingCoverage";

// ===== TYPE DEFINITIONS =====
type CreateBookingFormProps = {
  isOpen: boolean;
  onClose: () => void;
  startTime: Date | null;
  endTime: Date | null;
  onSave: (newEvent: Partial<CalendarEvent> | Partial<CalendarEvent>[]) => void;
  bookedAssets?: string[];
  defaultAsset?: string;
  defaultAssetName?: string;
  activityContext?: ProgrammeActivityBookingContextResponse | null;
};

type BookingDetail = ApiBooking;

interface Subcontractor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name?: string;
  trade_specialty?: string;
}

type AssetOption = ApiAsset & {
  assetKey: string;
  assetTitle: string;
  availabilityStatus?: string | null;
  availabilityReason?: string | null;
};

function getSuggestedDateLabel(
  suggestedDate: ProgrammeActivitySuggestedBookingDate,
): string {
  const hours = suggestedDate.hours;
  if (typeof hours === "number" && Number.isFinite(hours) && hours > 0) {
    return `${suggestedDate.date} · ${hours}h remaining`;
  }
  return suggestedDate.date;
}

function toSeedDateTime(date?: string | null, time?: string | null): Date | null {
  if (!date || !time) return null;
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  const parsed = new Date(`${date}T${normalizedTime}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getSuggestedDateRemainingHours(
  suggestedDate?: ProgrammeActivitySuggestedBookingDate | null,
): number | null {
  if (!suggestedDate) return null;

  if (
    typeof suggestedDate.gap_hours === "number" &&
    Number.isFinite(suggestedDate.gap_hours) &&
    suggestedDate.gap_hours > 0
  ) {
    return suggestedDate.gap_hours;
  }

  if (
    typeof suggestedDate.hours === "number" &&
    Number.isFinite(suggestedDate.hours) &&
    suggestedDate.hours > 0
  ) {
    return suggestedDate.hours;
  }

  return null;
}

function getSuggestedDateDisplayLabel(
  suggestedDate: ProgrammeActivitySuggestedBookingDate,
): string {
  const remainingHours = getSuggestedDateRemainingHours(suggestedDate);
  if (
    typeof remainingHours === "number" &&
    Number.isFinite(remainingHours) &&
    remainingHours > 0
  ) {
    return `${suggestedDate.date} - ${remainingHours}h remaining`;
  }
  return getSuggestedDateLabel(suggestedDate);
}

function resolveSuggestedDateWindow(params: {
  bookingDate: string;
  suggestedDate?: ProgrammeActivitySuggestedBookingDate | null;
  fallbackStartTime?: string | null;
  fallbackEndTime?: string | null;
}): { start: Date | null; end: Date | null; hours: number | null } {
  const { bookingDate, suggestedDate, fallbackStartTime, fallbackEndTime } = params;
  const startTime = suggestedDate?.start_time ?? fallbackStartTime ?? null;
  const endTime = suggestedDate?.end_time ?? fallbackEndTime ?? null;
  const start = toSeedDateTime(bookingDate, startTime);
  const explicitEnd = toSeedDateTime(bookingDate, endTime);
  const remainingHours = getSuggestedDateRemainingHours(suggestedDate);

  if (start && remainingHours) {
    const resolvedEnd = addMinutes(
      new Date(start),
      Math.round(remainingHours * MINUTES_PER_HOUR),
    );
    const explicitDurationMinutes =
      explicitEnd && explicitEnd.getTime() > start.getTime()
        ? Math.round((explicitEnd.getTime() - start.getTime()) / (1000 * 60))
        : null;

    if (
      explicitDurationMinutes === null ||
      Math.abs(explicitDurationMinutes - remainingHours * MINUTES_PER_HOUR) > 1
    ) {
      return { start, end: resolvedEnd, hours: remainingHours };
    }

    return { start, end: explicitEnd, hours: remainingHours };
  }

  if (start && explicitEnd && explicitEnd.getTime() > start.getTime()) {
    return {
      start,
      end: explicitEnd,
      hours: (explicitEnd.getTime() - start.getTime()) / (1000 * 60 * 60),
    };
  }

  return {
    start,
    end: explicitEnd,
    hours: remainingHours,
  };
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

const EMPTY_SUGGESTED_BULK_DATES: ProgrammeActivitySuggestedBookingDate[] = [];
const EMPTY_LINKED_BOOKINGS: ApiBooking[] = [];
const EMPTY_CANDIDATE_ASSETS: ProgrammeActivityCandidateAsset[] = [];

// ===== CONSOLIDATED STATE =====
interface TimeState {
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  duration: string;
  customStartTime: Date | null;
  customEndTime: Date | null;
  selectedDate: Date;
}

interface FormState {
  title: string;
  description: string;
  selectedSubcontractor: string;
}

interface AssetState {
  assets: AssetOption[];
  selectedAssetIds: string[];
  assetError: boolean;
}

interface AsyncState {
  isSubmitting: boolean;
  error: string | null;
  loadingSubcontractors: boolean;
  subcontractors: Subcontractor[];
  successAlert: { isOpen: boolean; isConfirmed: boolean; count: number };
  partialSuccessAlert: {
    isOpen: boolean;
    succeededCount: number;
    failures: { assetId: string; reason: string }[];
  };
}

// ===== REDUCER ACTIONS =====
type TimeAction =
  | { type: "SET_START_TIME"; hour: string; minute: string }
  | { type: "SET_END_TIME"; hour: string; minute: string }
  | { type: "SET_DURATION"; duration: string }
  | { type: "INITIALIZE"; startTime: Date; endTime?: Date | null; duration: string }
  | { type: "SET_DATE"; date: Date }
  | { type: "RESET" };

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: string }
  | { type: "RESET"; defaultSubcontractor?: string };

type AssetAction =
  | { type: "SET_ASSETS"; assets: AssetOption[] }
  | { type: "SET_ASSET_ERROR"; error: boolean }
  | { type: "ADD_ASSET"; assetKey: string }
  | { type: "REMOVE_ASSET"; assetKey: string }
  | { type: "SET_SELECTED"; assetIds: string[] }
  | { type: "RESET" };

type AsyncAction =
  | { type: "SET_SUBMITTING"; value: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_SUBCONTRACTORS"; subs: Subcontractor[]; loading: boolean }
  | { type: "SHOW_SUCCESS"; isConfirmed: boolean; count: number }
  | { type: "DISMISS_SUCCESS" }
  | {
      type: "SHOW_PARTIAL_SUCCESS";
      succeeded: number;
      failed: { assetId: string; reason: string }[];
    }
  | { type: "DISMISS_PARTIAL_SUCCESS" }
  | { type: "RESET" };

// ===== REDUCERS =====
function computeEndTime(
  startTime: Date,
  durationMinutes: number,
): { endTime: Date; endHour: string; endMinute: string } {
  const endTime = addMinutes(startTime, durationMinutes);
  return {
    endTime,
    endHour: endTime.getHours().toString().padStart(2, "0"),
    endMinute: endTime.getMinutes().toString().padStart(2, "0"),
  };
}

function buildStartDate(
  base: Date | null,
  hour: string,
  minute: string,
): Date | null {
  if (!base || !hour || !minute) return base;
  const d = new Date(base);
  d.setHours(parseInt(hour), parseInt(minute), 0, 0);
  return d;
}

function roundToQuarterHour(date: Date): Date {
  const rounded = new Date(date);
  rounded.setMinutes(Math.round(rounded.getMinutes() / 15) * 15, 0, 0);
  return rounded;
}

const initialTimeState: TimeState = {
  startHour: "",
  startMinute: "",
  endHour: "",
  endMinute: "",
  duration: DEFAULT_BOOKING_DURATION_MINUTES.toString(),
  customStartTime: null,
  customEndTime: null,
  selectedDate: new Date(),
};

function timeReducer(state: TimeState, action: TimeAction): TimeState {
  switch (action.type) {
    case "INITIALIZE": {
      const normalizedStart = roundToQuarterHour(action.startTime);
      const startHour = normalizedStart.getHours().toString().padStart(2, "0");
      const startMinute = normalizedStart
        .getMinutes()
        .toString()
        .padStart(2, "0");

      const explicitEnd =
        action.endTime && !Number.isNaN(action.endTime.getTime())
          ? roundToQuarterHour(action.endTime)
          : null;
      const explicitDurationMinutes =
        explicitEnd && explicitEnd.getTime() > normalizedStart.getTime()
          ? Math.round(
              (explicitEnd.getTime() - normalizedStart.getTime()) /
                (1000 * 60),
            )
          : null;
      const fallbackDurationMinutes = parseInt(action.duration);
      const effectiveDurationMinutes =
        explicitDurationMinutes && explicitDurationMinutes > 0
          ? explicitDurationMinutes
          : fallbackDurationMinutes;
      const resolvedEndTime =
        explicitEnd && explicitDurationMinutes && explicitDurationMinutes > 0
          ? explicitEnd
          : computeEndTime(normalizedStart, effectiveDurationMinutes).endTime;
      const endHour = resolvedEndTime.getHours().toString().padStart(2, "0");
      const endMinute = resolvedEndTime
        .getMinutes()
        .toString()
        .padStart(2, "0");

      return {
        startHour,
        startMinute,
        endHour,
        endMinute,
        duration: effectiveDurationMinutes.toString(),
        customStartTime: normalizedStart,
        customEndTime: resolvedEndTime,
        selectedDate: new Date(action.startTime),
      };
    }

    case "SET_START_TIME": {
      const newStart = buildStartDate(
        state.customStartTime,
        action.hour,
        action.minute,
      );
      if (!newStart) {
        return { ...state, startHour: action.hour, startMinute: action.minute };
      }
      const { endTime, endHour, endMinute } = computeEndTime(
        newStart,
        parseInt(state.duration),
      );
      return {
        ...state,
        startHour: action.hour,
        startMinute: action.minute,
        customStartTime: newStart,
        customEndTime: endTime,
        endHour,
        endMinute,
      };
    }

    case "SET_END_TIME": {
      if (!state.customStartTime) {
        return { ...state, endHour: action.hour, endMinute: action.minute };
      }
      const newEnd = new Date(state.customStartTime);
      newEnd.setHours(parseInt(action.hour), parseInt(action.minute), 0, 0);
      const durationMs = newEnd.getTime() - state.customStartTime.getTime();
      const durationMinutes = durationMs / (1000 * 60);
      return {
        ...state,
        endHour: action.hour,
        endMinute: action.minute,
        customEndTime: newEnd,
        duration:
          durationMinutes > 0 ? durationMinutes.toString() : state.duration,
      };
    }

    case "SET_DURATION": {
      if (!state.customStartTime) {
        return { ...state, duration: action.duration };
      }
      const { endTime, endHour, endMinute } = computeEndTime(
        state.customStartTime,
        parseInt(action.duration),
      );
      return {
        ...state,
        duration: action.duration,
        customEndTime: endTime,
        endHour,
        endMinute,
      };
    }

    case "SET_DATE":
      return { ...state, selectedDate: action.date };

    case "RESET":
      return initialTimeState;

    default:
      return state;
  }
}

const initialFormState: FormState = {
  title: "",
  description: "",
  selectedSubcontractor: "",
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return {
        ...initialFormState,
        selectedSubcontractor: action.defaultSubcontractor || "",
      };
    default:
      return state;
  }
}

const initialAssetState: AssetState = {
  assets: [],
  selectedAssetIds: [],
  assetError: false,
};

function assetReducer(state: AssetState, action: AssetAction): AssetState {
  switch (action.type) {
    case "SET_ASSETS":
      return { ...state, assets: action.assets, assetError: false };
    case "SET_ASSET_ERROR":
      return { ...state, assetError: action.error, assets: [] };
    case "ADD_ASSET":
      return {
        ...state,
        selectedAssetIds: [...state.selectedAssetIds, action.assetKey],
      };
    case "REMOVE_ASSET":
      return {
        ...state,
        selectedAssetIds: state.selectedAssetIds.filter(
          (id) => id !== action.assetKey,
        ),
      };
    case "SET_SELECTED":
      return { ...state, selectedAssetIds: action.assetIds };
    case "RESET":
      return { ...state, selectedAssetIds: [] };
    default:
      return state;
  }
}

const initialAsyncState: AsyncState = {
  isSubmitting: false,
  error: null,
  loadingSubcontractors: false,
  subcontractors: [],
  successAlert: { isOpen: false, isConfirmed: false, count: 0 },
  partialSuccessAlert: {
    isOpen: false,
    succeededCount: 0,
    failures: [],
  },
};

function asyncReducer(state: AsyncState, action: AsyncAction): AsyncState {
  switch (action.type) {
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.value };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_SUBCONTRACTORS":
      return {
        ...state,
        subcontractors: action.subs,
        loadingSubcontractors: action.loading,
      };
    case "SHOW_SUCCESS":
      return {
        ...state,
        successAlert: {
          isOpen: true,
          isConfirmed: action.isConfirmed,
          count: action.count,
        },
      };
    case "DISMISS_SUCCESS":
      return {
        ...state,
        successAlert: { isOpen: false, isConfirmed: false, count: 0 },
      };
    case "SHOW_PARTIAL_SUCCESS":
      return {
        ...state,
        partialSuccessAlert: {
          isOpen: true,
          succeededCount: action.succeeded,
          failures: action.failed,
        },
      };
    case "DISMISS_PARTIAL_SUCCESS":
      return {
        ...state,
        partialSuccessAlert: {
          isOpen: false,
          succeededCount: 0,
          failures: [],
        },
      };
    case "RESET":
      return { ...state, error: null };
    default:
      return state;
  }
}

// ===== COMPONENT =====
export function CreateBookingForm({
  isOpen,
  onClose,
  startTime = null,
  endTime = null,
  onSave,
  defaultAsset,
  defaultAssetName,
  bookedAssets = [],
  activityContext = null,
}: CreateBookingFormProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const isManager = user?.role === "manager" || user?.role === "admin";
  const isSubcontractor = user?.role === "subcontractor";
  const { projectId, selectedProject: project } = useResolvedProjectSelection({
    userId,
  });
  const { createBookings } = useBookingMutations();

  const [timeState, dispatchTime] = useReducer(timeReducer, initialTimeState);
  const [formState, dispatchForm] = useReducer(formReducer, initialFormState);
  const [assetState, dispatchAsset] = useReducer(
    assetReducer,
    initialAssetState,
  );
  const [asyncState, dispatchAsync] = useReducer(
    asyncReducer,
    initialAsyncState,
  );
  const [useBulkDates, setUseBulkDates] = useState(false);
  const [selectedBulkDates, setSelectedBulkDates] = useState<string[]>([]);
  const [pendingConfirmAlert, setPendingConfirmAlert] = useState<{
    isOpen: boolean;
    pendingCount: number;
    assetNames: string[];
    impactedBookings: Array<{
      id: string;
      title: string;
      status: string;
      bookingDate: string;
      startTime: string;
      endTime: string;
    }>;
  }>({
    isOpen: false,
    pendingCount: 0,
    assetNames: [],
    impactedBookings: [],
  });
  const seededOpenKeyRef = useRef<string | null>(null);

  // ===== DERIVED VALUES =====
  const {
    startHour,
    startMinute,
    endHour,
    endMinute,
    duration,
    customStartTime,
    customEndTime,
    selectedDate,
  } = timeState;
  const { title, description, selectedSubcontractor } = formState;
  const { assets, selectedAssetIds, assetError } = assetState;
  const {
    isSubmitting,
    error,
    loadingSubcontractors,
    subcontractors,
    successAlert,
    partialSuccessAlert,
  } = asyncState;
  const suggestedBulkDates =
    activityContext?.suggested_bulk_dates ?? EMPTY_SUGGESTED_BULK_DATES;
  const { coveredSuggestedDates, remainingSuggestedDates } = useMemo(
    () => getSuggestedDatesWithCoverageStatus(activityContext),
    [activityContext],
  );
  const coveredSuggestedDateValues = useMemo(
    () => coveredSuggestedDates.map((entry) => getSuggestedDateSlotKey(entry)),
    [coveredSuggestedDates],
  );
  const coveredSuggestedDateSet = useMemo(
    () => new Set(coveredSuggestedDateValues),
    [coveredSuggestedDateValues],
  );
  const remainingSuggestedDateValues = useMemo(
    () => remainingSuggestedDates.map((entry) => getSuggestedDateSlotKey(entry)),
    [remainingSuggestedDates],
  );
  const suggestedBulkDateValues = useMemo(
    () => suggestedBulkDates.map((entry) => getSuggestedDateSlotKey(entry)),
    [suggestedBulkDates],
  );
  const suggestedBulkDatesKey = useMemo(
    () => suggestedBulkDateValues.join("|"),
    [suggestedBulkDateValues],
  );
  const selectedBulkDateEntries = useMemo(
    () =>
      suggestedBulkDates.filter((entry) =>
        selectedBulkDates.includes(getSuggestedDateSlotKey(entry)),
      ),
    [selectedBulkDates, suggestedBulkDates],
  );
  const linkedBookings = activityContext?.linked_bookings ?? EMPTY_LINKED_BOOKINGS;
  const candidateAssets =
    activityContext?.candidate_assets ?? EMPTY_CANDIDATE_ASSETS;
  const effectiveExpectedAssetType = activityContext?.expected_asset_type ?? null;
  const preferredSuggestedDate = remainingSuggestedDates[0] ?? suggestedBulkDates[0] ?? null;
  const activitySuggestedCoverageFullyLinked =
    suggestedBulkDates.length > 0 &&
    remainingSuggestedDates.length === 0 &&
    linkedBookings.length > 0;

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
  };

  const fallbackStartTimeValue = customStartTime
    ? format(customStartTime, "HH:mm:ss")
    : null;
  const fallbackEndTimeValue = customEndTime
    ? format(customEndTime, "HH:mm:ss")
    : null;
  const suggestedBulkDatesByDate = useMemo(
    () =>
      suggestedBulkDates.reduce(
        (map, entry) => {
          const current = map.get(entry.date) ?? [];
          current.push(entry);
          map.set(entry.date, current);
          return map;
        },
        new Map<string, ProgrammeActivitySuggestedBookingDate[]>(),
      ),
    [suggestedBulkDates],
  );
  const preferredSuggestedDateKey = useMemo(
    () =>
      preferredSuggestedDate ? getSuggestedDateSlotKey(preferredSuggestedDate) : null,
    [preferredSuggestedDate],
  );
  const effectiveBookingPlan = useMemo(
    () => {
      if (useBulkDates) {
        if (selectedBulkDateEntries.length === 0) {
          return [];
        }

        return selectedBulkDateEntries.map((suggestedDate) => {
          const bookingDate = suggestedDate.date;
          const resolvedWindow = resolveSuggestedDateWindow({
            bookingDate,
            suggestedDate,
            fallbackStartTime: fallbackStartTimeValue,
            fallbackEndTime: fallbackEndTimeValue,
          });
          return {
            bookingDate,
            suggestedDate,
            start: resolvedWindow.start,
            end: resolvedWindow.end,
            hours: resolvedWindow.hours,
          };
        });
      }

      const bookingDate = format(selectedDate, "yyyy-MM-dd");
      const matchingSuggestedDates = suggestedBulkDatesByDate.get(bookingDate) ?? [];
      const suggestedDate =
        matchingSuggestedDates.find(
          (entry) => getSuggestedDateSlotKey(entry) === preferredSuggestedDateKey,
        ) ??
        matchingSuggestedDates[0] ??
        null;
      const resolvedWindow = resolveSuggestedDateWindow({
        bookingDate,
        suggestedDate,
        fallbackStartTime: fallbackStartTimeValue,
        fallbackEndTime: fallbackEndTimeValue,
      });

      return [
        {
          bookingDate,
          suggestedDate,
          start: resolvedWindow.start,
          end: resolvedWindow.end,
          hours: resolvedWindow.hours,
        },
      ];
    },
    [
      fallbackEndTimeValue,
      fallbackStartTimeValue,
      preferredSuggestedDateKey,
      selectedBulkDateEntries,
      selectedDate,
      suggestedBulkDatesByDate,
      useBulkDates,
    ],
  );
  const effectiveBookingDates = useMemo(
    () => effectiveBookingPlan.map((plan) => plan.bookingDate),
    [effectiveBookingPlan],
  );
  const bulkWindowSummary = useMemo(() => {
    if (!customStartTime || !customEndTime) return null;
    const durationMinutes =
      (customEndTime.getTime() - customStartTime.getTime()) / (1000 * 60);
    if (durationMinutes <= 0) return null;

    const durationHours = durationMinutes / MINUTES_PER_HOUR;
    const durationLabel = Number.isInteger(durationHours)
      ? `${durationHours}h/day`
      : `${durationHours.toFixed(2).replace(/\.?0+$/, "")}h/day`;

    return `${format(customStartTime, "HH:mm")}-${format(customEndTime, "HH:mm")} · ${durationLabel}`;
  }, [customEndTime, customStartTime]);

  const startSeedMs = startTime?.getTime() ?? null;
  const endSeedMs = endTime?.getTime() ?? null;

  // ===== RESET =====
  const resetForm = useCallback(() => {
    dispatchTime({ type: "RESET" });
    dispatchForm({
      type: "RESET",
      defaultSubcontractor: isSubcontractor ? userId || "" : "",
    });
    dispatchAsset({ type: "RESET" });
    dispatchAsync({ type: "RESET" });
    setUseBulkDates(false);
    setSelectedBulkDates([]);
  }, [isSubcontractor, userId]);

  const handlePartialSuccessDismiss = useCallback(() => {
    dispatchAsync({ type: "DISMISS_PARTIAL_SUCCESS" });
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSuccessDismiss = useCallback(() => {
    dispatchAsync({ type: "DISMISS_SUCCESS" });
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // ===== LOAD ASSETS =====
  const { assets: projectAssets, error: assetsSwrError } =
    useProjectAssets(projectId);
  const {
    subcontractors: projectSubcontractors,
    error: subcontractorsError,
    isLoading: loadingProjectSubcontractors,
  } = useProjectSubcontractors({
    userRole: user?.role,
    projectId,
    enabled: Boolean(isOpen && isManager && projectId),
    limit: 100,
    scope: "managerScoped",
  });

  useEffect(() => {
    if (assetsSwrError && candidateAssets.length === 0) {
      dispatchAsset({ type: "SET_ASSET_ERROR", error: true });
      return;
    }

    const sourceAssets =
      candidateAssets.length > 0
        ? candidateAssets.map((asset) => ({
            ...asset,
            asset_code: asset.asset_code || asset.id,
            created_at: "",
            updated_at: "",
            type: asset.canonical_type,
            status: asset.status || "available",
          }))
        : projectAssets;

    const normalizedAssets: AssetOption[] = sourceAssets
      .filter((asset) => !isAssetUnavailableForBooking(asset.status))
      .map((asset) => ({
        ...asset,
        assetKey: asset.id,
        assetTitle: asset.name,
        availabilityStatus:
          "availability_status" in asset ? asset.availability_status : undefined,
        availabilityReason:
          "availability_reason" in asset ? asset.availability_reason : undefined,
      }));
    dispatchAsset({ type: "SET_ASSET_ERROR", error: false });
    dispatchAsset({ type: "SET_ASSETS", assets: normalizedAssets });
  }, [projectAssets, assetsSwrError, candidateAssets]);

  // ===== LOAD SUBCONTRACTORS =====
  useEffect(() => {
    if (!isManager || !isOpen) return;

    if (subcontractorsError) {
      reportError(
        subcontractorsError,
        "CreateBookingForm: failed to load subcontractors",
      );
      dispatchAsync({ type: "SET_SUBCONTRACTORS", subs: [], loading: false });
      return;
    }

    const normalizedSubs: Subcontractor[] = projectSubcontractors.map((sub) => ({
      id: sub.id,
      first_name: sub.first_name,
      last_name: sub.last_name,
      email: sub.email,
      company_name: sub.company_name,
      trade_specialty: sub.trade_specialty,
    }));

    dispatchAsync({
      type: "SET_SUBCONTRACTORS",
      subs: normalizedSubs,
      loading: loadingProjectSubcontractors,
    });
  }, [
    isManager,
    isOpen,
    projectSubcontractors,
    subcontractorsError,
    loadingProjectSubcontractors,
  ]);

  // ===== AUTO-SELECT SUBCONTRACTOR FOR SUB USERS =====
  useEffect(() => {
    if (isSubcontractor && userId) {
      dispatchForm({
        type: "SET_FIELD",
        field: "selectedSubcontractor",
        value: userId,
      });
    }
  }, [isSubcontractor, userId]);

  useEffect(() => {
    if (!isOpen) {
      seededOpenKeyRef.current = null;
      return;
    }

    const seedKey = [
      activityContext?.activity_id ?? "manual",
      startSeedMs ?? "auto",
      endSeedMs ?? "none",
      activityContext?.default_booking_date ?? "",
      suggestedBulkDatesKey,
      remainingSuggestedDateValues.join("|"),
    ].join("|");

    if (seededOpenKeyRef.current === seedKey) return;
    seededOpenKeyRef.current = seedKey;

    const preferredSeedDate =
      preferredSuggestedDate?.date ?? activityContext?.default_booking_date ?? null;
    const preferredSuggestedWindow = preferredSeedDate
      ? resolveSuggestedDateWindow({
          bookingDate: preferredSeedDate,
          suggestedDate: preferredSuggestedDate,
          fallbackStartTime: activityContext?.default_start_time,
          fallbackEndTime: activityContext?.default_end_time,
        })
      : null;
    const preferredSeedStartTime =
      preferredSuggestedWindow?.start ??
      (startSeedMs ? new Date(startSeedMs) : new Date());
    const preferredSeedEndTime =
      preferredSuggestedWindow?.end ??
      (endSeedMs ? new Date(endSeedMs) : null);

    dispatchTime({
      type: "INITIALIZE",
      startTime: preferredSeedStartTime,
      endTime: preferredSeedEndTime,
      duration: DEFAULT_BOOKING_DURATION_MINUTES.toString(),
    });

    if (activityContext?.activity_name) {
      dispatchForm({
        type: "SET_FIELD",
        field: "title",
        value: activityContext.activity_name,
      });
    }

    const seededBookingDate =
      preferredSuggestedDate?.date ?? activityContext?.default_booking_date;

    if (seededBookingDate) {
      const defaultDate = new Date(seededBookingDate);
      if (!Number.isNaN(defaultDate.getTime())) {
        dispatchTime({ type: "SET_DATE", date: defaultDate });
      }
    }

    if (remainingSuggestedDateValues.length > 0) {
      setSelectedBulkDates((current) =>
        areStringArraysEqual(current, remainingSuggestedDateValues)
          ? current
          : remainingSuggestedDateValues,
      );
      setUseBulkDates((current) => {
        const nextValue = remainingSuggestedDateValues.length > 1;
        return current === nextValue ? current : nextValue;
      });
      return;
    }

    setSelectedBulkDates((current) => (current.length === 0 ? current : []));
    setUseBulkDates((current) => (current ? false : current));
  }, [
    activityContext?.activity_id,
    activityContext?.activity_name,
    activityContext?.default_booking_date,
    endSeedMs,
    isOpen,
    preferredSuggestedDate?.date,
    preferredSuggestedDate?.end_time,
    preferredSuggestedDate?.start_time,
    remainingSuggestedDateValues,
    startSeedMs,
    suggestedBulkDatesKey,
  ]);

  // ===== SET DEFAULT ASSET =====
  useEffect(() => {
    if (
      defaultAssetName &&
      assets.length > 0 &&
      selectedAssetIds.length === 0
    ) {
      const assetNameWithoutPrefix = defaultAssetName.replace(
        /^[A-Z]\d{3}-/,
        "",
      );
      const matchingAsset = assets.find((asset) => {
        const assetTitle = asset.assetTitle || "";
        return (
          assetTitle.toLowerCase() === assetNameWithoutPrefix.toLowerCase() ||
          assetTitle.toLowerCase() === defaultAssetName.toLowerCase() ||
          asset.assetKey === defaultAsset
        );
      });
      if (matchingAsset) {
        dispatchAsset({
          type: "SET_SELECTED",
          assetIds: [matchingAsset.assetKey],
        });
      }
    }
  }, [defaultAssetName, defaultAsset, assets, selectedAssetIds.length]);

  // ===== INITIALIZE TIMES WHEN MODAL OPENS =====
  // Single effect replaces the old chain of: init times → compute end → sync duration
  useEffect(() => {
    if (false && startTime && isOpen) {
      void startTime;
    }
  }, [startTime, isOpen]); // intentionally exclude `duration` — init uses current duration snapshot

  // ===== HANDLERS =====
  const handleStartHourChange = (value: string) =>
    dispatchTime({ type: "SET_START_TIME", hour: value, minute: startMinute });

  const handleStartMinuteChange = (value: string) =>
    dispatchTime({ type: "SET_START_TIME", hour: startHour, minute: value });

  const handleEndHourChange = (value: string) =>
    dispatchTime({ type: "SET_END_TIME", hour: value, minute: endMinute });

  const handleEndMinuteChange = (value: string) =>
    dispatchTime({ type: "SET_END_TIME", hour: endHour, minute: value });

  const handleDurationChange = (newDuration: string) =>
    dispatchTime({ type: "SET_DURATION", duration: newDuration });

  // ===== SUBMIT =====
  // ===== SUBMIT =====
  const handleSubmit = async (skipPendingConfirmCheck = false) => {
    dispatchAsync({ type: "SET_ERROR", error: null });

    if (selectedAssetIds.length === 0) {
      dispatchAsync({
        type: "SET_ERROR",
        error: "Please select at least one asset",
      });
      return;
    }

    if (!customStartTime || !customEndTime) {
      dispatchAsync({
        type: "SET_ERROR",
        error: "Please select both start and end times",
      });
      return;
    }

    if (
      !(selectedDate instanceof Date) ||
      Number.isNaN(selectedDate.getTime())
    ) {
      dispatchAsync({
        type: "SET_ERROR",
        error: "Please select a valid booking date",
      });
      return;
    }

    const firstInvalidBookingPlan = effectiveBookingPlan.find(
      (plan) =>
        !(plan.start instanceof Date) ||
        Number.isNaN(plan.start.getTime()) ||
        !(plan.end instanceof Date) ||
        Number.isNaN(plan.end.getTime()) ||
        plan.end.getTime() <= plan.start.getTime(),
    );

    if (firstInvalidBookingPlan) {
      dispatchAsync({
        type: "SET_ERROR",
        error:
          effectiveBookingPlan.length > 1
            ? `The booking window for ${firstInvalidBookingPlan.bookingDate} is invalid.`
            : "End time must be later than start time",
      });
      return;
    }

    const firstPastBookingPlan = effectiveBookingPlan.find(
      (plan) => (plan.start?.getTime() ?? 0) < Date.now(),
    );

    if (firstPastBookingPlan) {
      dispatchAsync({
        type: "SET_ERROR",
        error:
          effectiveBookingDates.length > 1
            ? `Bookings cannot be created in the past. Remove ${firstPastBookingPlan.bookingDate} or adjust the booking window.`
            : "Bookings cannot be created in the past",
      });
      return;
    }

    if (!title.trim()) {
      dispatchAsync({
        type: "SET_ERROR",
        error: "Please enter a booking title",
      });
      return;
    }

    if (title.trim().length < 3) {
      dispatchAsync({
        type: "SET_ERROR",
        error: "Booking title must be at least 3 characters",
      });
      return;
    }

    if (useBulkDates && selectedBulkDates.length === 0) {
      dispatchAsync({
        type: "SET_ERROR",
        error: "Select at least one bulk booking date",
      });
      return;
    }

    const coveredSelectedDates = activityContext
      ? effectiveBookingPlan.filter(
          (plan) =>
            plan.suggestedDate &&
            coveredSuggestedDateSet.has(getSuggestedDateSlotKey(plan.suggestedDate)),
        )
      : [];

    if (coveredSelectedDates.length > 0) {
      const coveredLabels = coveredSelectedDates.map((plan) =>
        plan.suggestedDate
          ? getSuggestedDateDisplayLabel(plan.suggestedDate)
          : plan.bookingDate,
      );
      dispatchAsync({
        type: "SET_ERROR",
        error:
          coveredSelectedDates.length === 1
            ? `The suggested slot for ${coveredLabels[0]} is already fully linked. Adjust the existing linked booking instead of creating a duplicate.`
            : `These suggested dates are already fully linked: ${coveredLabels.join(", ")}.`,
      });
      return;
    }

    if (!projectId) {
      dispatchAsync({ type: "SET_ERROR", error: "No project selected" });
      return;
    }

    try {
      dispatchAsync({ type: "SET_SUBMITTING", value: true });

      const targetSubcontractorId = isSubcontractor
        ? userId
        : selectedSubcontractor || undefined;

      const bookingsByDate = new Map<string, ApiBooking[]>();
      const getExistingBookingsForDate = async (bookingDate: string) => {
        const cached = bookingsByDate.get(bookingDate);
        if (cached) return cached;
        const fetched = await fetchBookingsForDate({
          projectId,
          bookingDate,
          context: "CreateBookingForm",
        });
        bookingsByDate.set(bookingDate, fetched);
        return fetched;
      };

      if (isManager && !skipPendingConfirmCheck) {
        const competingPendingBookings: ApiBooking[] = [];

        for (const bookingPlan of effectiveBookingPlan) {
          if (!bookingPlan.start || !bookingPlan.end) continue;

          const bookingDate = bookingPlan.bookingDate;
          const existingBookings = await getExistingBookingsForDate(bookingDate);
          competingPendingBookings.push(
            ...getCompetingPendingBookingsForAssets({
              bookings: existingBookings,
              bookingDate,
              startTime: format(bookingPlan.start, "HH:mm:ss"),
              endTime: format(bookingPlan.end, "HH:mm:ss"),
              assetIds: selectedAssetIds,
            }),
          );
        }

        if (competingPendingBookings.length > 0) {
          const affectedAssetNames = Array.from(
            new Set(
              competingPendingBookings.map((booking) => {
                const matchedAsset = assets.find(
                  (asset) => asset.assetKey === booking.asset_id,
                );
                return (
                  matchedAsset?.assetTitle ||
                  booking.asset?.name ||
                  booking.asset_id
                );
              }),
            ),
          );

          setPendingConfirmAlert({
            isOpen: true,
            pendingCount: competingPendingBookings.length,
            assetNames: affectedAssetNames,
            impactedBookings: competingPendingBookings.map((booking) => ({
              id: booking.id,
              title:
                booking.purpose?.trim() || booking.title?.trim() || "Booking",
              status: booking.status || "pending",
              bookingDate: booking.booking_date,
              startTime: booking.start_time,
              endTime: booking.end_time,
            })),
          });
          dispatchAsync({ type: "SET_SUBMITTING", value: false });
          return;
        }
      }

      if (targetSubcontractorId) {
        const duplicateAssetIds = new Set<string>();

        for (const bookingPlan of effectiveBookingPlan) {
          if (!bookingPlan.start || !bookingPlan.end) continue;

          const bookingDate = bookingPlan.bookingDate;
          const existingBookings = await getExistingBookingsForDate(bookingDate);
          const duplicatesForDate = getDuplicateAssetIdsForSubcontractor({
            bookings: existingBookings,
            bookingDate,
            startTime: format(bookingPlan.start, "HH:mm:ss"),
            endTime: format(bookingPlan.end, "HH:mm:ss"),
            targetSubcontractorId,
            assetIds: selectedAssetIds,
          });

          duplicatesForDate.forEach((assetId) => duplicateAssetIds.add(assetId));
        }

        if (duplicateAssetIds.size > 0) {
          const blockedAssetNames = selectedAssetIds
            .filter((assetId) => duplicateAssetIds.has(assetId))
            .map(
              (assetId) =>
                assets.find((asset) => asset.assetKey === assetId)
                  ?.assetTitle || assetId,
            );

          dispatchAsync({
            type: "SET_ERROR",
            error: `Duplicate request blocked: this subcontractor already has a booking request for the same slot on ${blockedAssetNames.join(", ")}.`,
          });
          return;
        }
      }

      const bookingRequests = effectiveBookingPlan.flatMap((bookingPlan) =>
        selectedAssetIds.map((assetId) => ({
          bookingDate: bookingPlan.bookingDate,
          assetId,
          payload: {
            project_id: projectId,
            asset_id: assetId,
            booking_date: bookingPlan.bookingDate,
            start_time: bookingPlan.start
              ? format(bookingPlan.start, "HH:mm:ss")
              : fallbackStartTimeValue ?? "08:00:00",
            end_time: bookingPlan.end
              ? format(bookingPlan.end, "HH:mm:ss")
              : fallbackEndTimeValue ?? "09:00:00",
            purpose: title,
            notes: description,
            subcontractor_id: targetSubcontractorId || undefined,
            programme_activity_id: activityContext?.activity_id,
            selected_week_start:
              activityContext?.selected_week_start ??
              activityContext?.default_week_start ??
              null,
          } satisfies BookingCreatePayload,
        })),
      );

      const results = await createBookings({
        projectId,
        payloads: bookingRequests.map((request) => request.payload),
      });

      // Separate successes and failures
      const succeeded: BookingDetail[] = [];
      const failed: { assetId: string; reason: string }[] = [];

      results.forEach((result, index) => {
        const request = bookingRequests[index];
        if (result.status === "fulfilled") {
          succeeded.push(result.value);
        } else {
          const assetId = request?.assetId || "";
          const asset = assets.find((a) => a.assetKey === assetId);
          const assetName = asset?.assetTitle || assetId;
          const reason = getApiErrorMessage(result.reason, "Unknown error");
          const bookingLabel = request?.bookingDate
            ? `${assetName} on ${request.bookingDate}`
            : assetName;
          failed.push({ assetId: bookingLabel, reason });
        }
      });

      if (succeeded.length > 0) {
        // Build calendar events for successful bookings
        const events = succeeded.map((booking) => {
          const returnedAssetId = booking.asset?.id || booking.asset_id;
          const assetTitle =
            booking.asset?.name ||
            assets.find(
              (a) =>
                a.assetKey === booking.asset_id || a.id === booking.asset_id,
            )?.assetTitle ||
            booking.asset_id;

          const startDateTime = new Date(
            `${booking.booking_date}T${booking.start_time}`,
          );
          const endDateTime = new Date(
            `${booking.booking_date}T${booking.end_time}`,
          );

          return {
            id: booking.id,
            title: `${title} - ${assetTitle}`,
            description: description || title,
            start: startDateTime,
            end: endDateTime,
            color:
              booking.status?.toLowerCase() === "confirmed"
                ? "green"
                : "yellow",
            assetId: String(returnedAssetId),
            assetName: assetTitle,
            bookedAssets: [assetTitle],
            bookingKey: booking.id,
            bookingTitle: booking.purpose || title,
            bookingDescription: booking.notes || description || "",
            bookingNotes: booking.notes || "",
            bookingTimeDt: booking.booking_date,
            bookingStartTime: booking.start_time,
            bookingEndTime: booking.end_time,
            bookingStatus: booking.status?.toLowerCase() || "pending",
            status: booking.status?.toLowerCase() || "pending",
            managerId: booking.manager_id,
            subcontractorId: booking.subcontractor_id,
            projectId: booking.project_id,
            projectName: booking.project?.name || project?.name,
            bookingSource: booking.source,
            bookingGroupId: booking.booking_group_id,
            programmeActivityId: booking.programme_activity_id,
            programmeActivityName: booking.programme_activity_name,
            expectedAssetType: booking.expected_asset_type,
            isModified: booking.is_modified,
            _originalData: booking,
          } as Partial<CalendarEvent>;
        });

        // Always call onSave for successful bookings so they appear immediately
        onSave(events);
      }

      // Handle the UI response based on results
      if (failed.length === 0) {
        // All succeeded
        const firstBooking = succeeded[0];
        dispatchAsync({
          type: "SHOW_SUCCESS",
          isConfirmed: firstBooking.status?.toLowerCase() === "confirmed",
          count: succeeded.length,
        });
      } else if (succeeded.length === 0) {
        // All failed
        const failureDetails = failed
          .map((f) => `• ${f.assetId}: ${f.reason}`)
          .join("\n");
        dispatchAsync({
          type: "SET_ERROR",
          error: `All bookings failed:\n${failureDetails}`,
        });
      } else {
        // Partial success — show via a new state
        dispatchAsync({
          type: "SHOW_PARTIAL_SUCCESS",
          succeeded: succeeded.length,
          failed,
        });
      }
    } catch (err: unknown) {
      reportError(err, "CreateBookingForm: failed to create bookings");
      dispatchAsync({
        type: "SET_ERROR",
        error: getApiErrorMessage(err, "Failed to create booking"),
      });
    } finally {
      dispatchAsync({ type: "SET_SUBMITTING", value: false });
    }
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md mx-auto rounded-xl p-3 sm:p-6 bg-white shadow-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              {activityContext ? "Book Activity" : "Book Time Slot"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {activityContext
                ? "Create activity-linked bookings using the booking context returned for this programme activity."
                : "Create a booking for the selected project asset and time window."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-4">
              {error}
            </div>
          )}

          {assetError && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm mb-4 flex items-start gap-2">
              <span className="text-yellow-600 mt-0.5">⚠️</span>
              <div>
                <strong className="font-semibold">Asset Loading Error:</strong>
                <p className="text-xs mt-1">
                  Unable to load assets. Please refresh the page or contact
                  support.
                </p>
              </div>
            </div>
          )}

          {activityContext && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Linked Activity
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {activityContext.activity_name}
                  </p>
                </div>
                {effectiveExpectedAssetType && (
                  <Badge variant="secondary" className="text-xs">
                    Expected: {effectiveExpectedAssetType}
                  </Badge>
                )}
              </div>

              <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <div>
                  <span className="font-medium text-slate-800">Week:</span>{" "}
                  {activityContext.selected_week_start ||
                    activityContext.default_week_start ||
                    "Current"}
                </div>
                <div>
                  <span className="font-medium text-slate-800">
                    Linked bookings:
                  </span>{" "}
                  {linkedBookings.length}
                </div>
                {suggestedBulkDates.length > 0 && (
                  <div>
                    <span className="font-medium text-slate-800">
                      Remaining suggested dates:
                    </span>{" "}
                    {remainingSuggestedDates.length}/{suggestedBulkDates.length}
                  </div>
                )}
                {activityContext.level_name && (
                  <div>
                    <span className="font-medium text-slate-800">Level:</span>{" "}
                    {activityContext.level_name}
                  </div>
                )}
                {activityContext.zone_name && (
                  <div>
                    <span className="font-medium text-slate-800">Zone:</span>{" "}
                    {activityContext.zone_name}
                  </div>
                )}
              </div>

              {activitySuggestedCoverageFullyLinked && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-700">
                    This activity already has linked coverage for all suggested
                    dates. Use the bookings or calendar views to adjust the
                    existing linked bookings instead of creating duplicates
                    here.
                  </AlertDescription>
                </Alert>
              )}

              {!activitySuggestedCoverageFullyLinked &&
                coveredSuggestedDates.length > 0 && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-xs text-blue-700">
                    {coveredSuggestedDates.length} suggested date
                    {coveredSuggestedDates.length === 1 ? "" : "s"} already
                    have linked coverage and were excluded from the default
                    booking plan.
                  </AlertDescription>
                </Alert>
              )}

              {suggestedBulkDates.length > 1 && (
                <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Suggested bulk dates
                      </p>
                      <p className="text-xs text-slate-500">
                        Each selected date creates one linked booking using the
                        backend-suggested remaining duration for that date.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="activity-bulk-toggle"
                        checked={useBulkDates}
                        onCheckedChange={(checked) =>
                          setUseBulkDates(Boolean(checked))
                        }
                        disabled={
                          isSubmitting || remainingSuggestedDates.length === 0
                        }
                      />
                      <Label htmlFor="activity-bulk-toggle">Bulk</Label>
                    </div>
                  </div>

                  {useBulkDates && (
                    <>
                      <p className="text-xs text-slate-500">
                        Per-date `gap_hours` or `hours` from the backend drive
                        the booking duration for each selected date. The time
                        controls below only act as fallbacks when a suggested
                        date does not include its own full window.
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {suggestedBulkDates.map((bulkDate) => {
                          const slotKey = getSuggestedDateSlotKey(bulkDate);
                          const checked = selectedBulkDates.includes(slotKey);
                          const isCovered = coveredSuggestedDateSet.has(slotKey);
                          return (
                            <label
                              key={slotKey}
                              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                                isCovered
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-slate-200"
                              }`}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) => {
                                  setSelectedBulkDates((current) =>
                                    nextChecked
                                      ? Array.from(new Set([...current, slotKey]))
                                      : current.filter((value) => value !== slotKey),
                                  );
                                }}
                                disabled={isSubmitting || isCovered}
                              />
                              <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                <span>{getSuggestedDateDisplayLabel(bulkDate)}</span>
                                {isCovered && (
                                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                    Already linked
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      {selectedBulkDateEntries.length > 0 && (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Bulk booking plan
                          </p>
                          <div className="mt-2 space-y-2">
                            {effectiveBookingPlan
                              .filter(
                                (plan) =>
                                  plan.suggestedDate &&
                                  selectedBulkDates.includes(
                                    getSuggestedDateSlotKey(plan.suggestedDate),
                                  ),
                              )
                              .map((plan) => (
                                <div
                                  key={`plan-${
                                    plan.suggestedDate
                                      ? getSuggestedDateSlotKey(plan.suggestedDate)
                                      : plan.bookingDate
                                  }`}
                                  className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600"
                                >
                                  <span className="font-medium text-slate-900">
                                    {plan.bookingDate}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {typeof plan.hours === "number" &&
                                      plan.hours > 0 && (
                                        <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                                          {plan.hours}h remaining
                                        </span>
                                      )}
                                    {plan.start && plan.end ? (
                                      <span>
                                        {format(plan.start, "HH:mm")}-
                                        {format(plan.end, "HH:mm")}
                                      </span>
                                    ) : (
                                      bulkWindowSummary && <span>{bulkWindowSummary}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {linkedBookings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Existing linked bookings
                  </p>
                  <div className="space-y-2">
                    {linkedBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-900">
                            {booking.asset?.name || booking.asset_id}
                          </span>
                          <Badge variant="outline" className="capitalize">
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="mt-1">
                          {booking.booking_date} {booking.start_time}-
                          {booking.end_time}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Alert
            className={
              isManager
                ? "bg-green-50 border-green-200"
                : "bg-blue-50 border-blue-200"
            }
          >
            {isManager ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Info className="h-4 w-4 text-blue-600" />
            )}
            <AlertDescription
              className={
                isManager ? "text-green-700 text-xs" : "text-blue-700 text-xs"
              }
            >
              {isManager ? (
                <>
                  <strong>Manager Booking:</strong> Your booking will be
                  automatically confirmed.
                </>
              ) : (
                <>
                  <strong>Subcontractor Booking:</strong> Your booking will be
                  pending until approved by a manager.
                </>
              )}
            </AlertDescription>
          </Alert>

          <div className="space-y-6 mt-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Booking Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) =>
                    dispatchForm({
                      type: "SET_FIELD",
                      field: "title",
                      value: e.target.value,
                    })
                  }
                  placeholder="Enter title"
                  className="h-9"
                  disabled={isSubmitting}
                  aria-required="true"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) =>
                    dispatchForm({
                      type: "SET_FIELD",
                      field: "description",
                      value: e.target.value,
                    })
                  }
                  placeholder="Add more details..."
                  rows={3}
                  className="resize-none text-sm"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label>
                Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-9 justify-start text-left text-sm font-normal"
                    disabled={isSubmitting}
                    aria-required="true"
                    aria-label="Booking date"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="max-w-[calc(100vw-1rem)] p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) =>
                      date && dispatchTime({ type: "SET_DATE", date })
                    }
                    initialFocus
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selectors */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Select
                      value={startHour}
                      onValueChange={handleStartHourChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        className="h-9 w-full text-sm"
                        aria-required="true"
                        aria-label="Start hour"
                      >
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: HOURS_IN_DAY }).map((_, i) => {
                          const val = i.toString().padStart(2, "0");
                          return (
                            <SelectItem
                              key={val}
                              value={val}
                              className="text-sm"
                            >
                              {formatHour(i)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="shrink-0">:</span>
                  <div className="min-w-0 flex-1">
                    <Select
                      value={startMinute}
                      onValueChange={handleStartMinuteChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        className="h-9 w-full text-sm"
                        aria-required="true"
                        aria-label="Start minute"
                      >
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUARTER_HOUR_OPTIONS.map((val) => (
                          <SelectItem key={val} value={val} className="text-sm">
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  End Time <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Select
                      value={endHour}
                      onValueChange={handleEndHourChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        className="h-9 w-full text-sm"
                        aria-required="true"
                        aria-label="End hour"
                      >
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: HOURS_IN_DAY }).map((_, i) => {
                          const val = i.toString().padStart(2, "0");
                          return (
                            <SelectItem
                              key={val}
                              value={val}
                              className="text-sm"
                            >
                              {formatHour(i)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="shrink-0">:</span>
                  <div className="min-w-0 flex-1">
                    <Select
                      value={endMinute}
                      onValueChange={handleEndMinuteChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        className="h-9 w-full text-sm"
                        aria-required="true"
                        aria-label="End minute"
                      >
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUARTER_HOUR_OPTIONS.map((val) => (
                          <SelectItem key={val} value={val} className="text-sm">
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration (Quick Select)</Label>
              <Select
                value={duration}
                onValueChange={handleDurationChange}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {BOOKING_DURATION_OPTIONS.map((val) => (
                    <SelectItem
                      key={val}
                      value={val.toString()}
                      className="text-sm"
                    >
                      {val >= MINUTES_PER_HOUR
                        ? `${val / MINUTES_PER_HOUR} hour${val >= MINUTES_PER_HOUR * 2 ? "s" : ""}`
                        : `${val} minutes`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcontractor Selection */}
            {isManager && (
              <div className="space-y-2">
                <Label>
                  Assign to Subcontractor
                  <span className="text-gray-500 text-xs ml-2">(Optional)</span>
                </Label>
                <Select
                  value={selectedSubcontractor || "none"}
                  onValueChange={(value) =>
                    dispatchForm({
                      type: "SET_FIELD",
                      field: "selectedSubcontractor",
                      value: value === "none" ? "" : value,
                    })
                  }
                  disabled={isSubmitting || loadingSubcontractors}
                >
                  <SelectTrigger className="h-9 w-full text-sm">
                    <SelectValue>
                      {selectedSubcontractor
                        ? (() => {
                            const selected = subcontractors.find(
                              (s) => s.id === selectedSubcontractor,
                            );
                            if (!selected) return "None (Unassigned)";
                            const name =
                              `${selected.first_name} ${selected.last_name}`.trim();
                            return name || selected.email || "Unknown";
                          })()
                        : "None (Unassigned)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="font-normal">None (Unassigned)</span>
                    </SelectItem>
                    {loadingSubcontractors ? (
                      <div
                        className="px-2 py-1.5 text-sm text-gray-500"
                        role="status"
                        aria-live="polite"
                      >
                        Loading subcontractors...
                      </div>
                    ) : subcontractors.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        No subcontractors in this project
                      </div>
                    ) : (
                      subcontractors.map((sub) => {
                        const fullName =
                          `${sub.first_name} ${sub.last_name}`.trim();
                        const displayName = fullName || sub.email || "Unknown";
                        return (
                          <SelectItem key={sub.id} value={sub.id}>
                            <div className="flex flex-col py-1">
                              <span className="font-medium">{displayName}</span>
                              {sub.company_name &&
                                sub.company_name !== "N/A" && (
                                  <span className="text-xs text-gray-500">
                                    {sub.company_name}
                                  </span>
                                )}
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Asset Selection */}
            <div className="space-y-2">
              <Label>
                Select Assets <span className="text-red-500">*</span>
              </Label>
              {activityContext && candidateAssets.length > 0 && (
                <p className="text-xs text-slate-500">
                  Showing backend-suggested candidate assets first, including
                  planning readiness and slot availability.
                </p>
              )}
              {selectedAssetIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedAssetIds.map((assetKey) => {
                    const asset = assets.find((a) => a.assetKey === assetKey);
                    return (
                      <Badge
                        key={assetKey}
                        className="text-xs flex items-center gap-1"
                      >
                        {asset?.assetTitle || assetKey}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() =>
                            dispatchAsset({ type: "REMOVE_ASSET", assetKey })
                          }
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              <ScrollArea className="h-24 border rounded-md p-2">
                <div className="space-y-2">
                  {assets.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No assets available
                    </p>
                  ) : (
                    assets.map((asset) => {
                      const isSelected = selectedAssetIds.includes(
                        asset.assetKey,
                      );
                      const isBooked = bookedAssets.includes(asset.assetKey);
                      return (
                      <div
                        key={asset.assetKey}
                        className="flex items-start space-x-2"
                      >
                        <Checkbox
                          id={`asset-${asset.assetKey}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                dispatchAsset({
                                  type: "ADD_ASSET",
                                  assetKey: asset.assetKey,
                                });
                              } else {
                                dispatchAsset({
                                  type: "REMOVE_ASSET",
                                  assetKey: asset.assetKey,
                                });
                              }
                            }}
                            disabled={isSubmitting || (isBooked && !isSelected)}
                          />
                          <label
                            htmlFor={`asset-${asset.assetKey}`}
                            className={`text-sm flex-1 ${
                              isBooked && !isSelected
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            <span className="block truncate">
                              {asset.assetTitle}
                              {isBooked && !isSelected && (
                                <span className="ml-2 text-xs text-red-500">
                                  (Booked)
                                </span>
                              )}
                            </span>
                            {(asset.planning_ready !== undefined ||
                              asset.availabilityStatus ||
                              asset.canonical_type) && (
                              <span className="mt-1 flex flex-wrap gap-1 text-[10px]">
                                {asset.canonical_type && (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                                    {asset.canonical_type}
                                  </span>
                                )}
                                {asset.planning_ready !== undefined && (
                                  <span
                                    className={`rounded-full px-2 py-0.5 ${
                                      asset.planning_ready
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    {asset.planning_ready
                                      ? "Planning ready"
                                      : "Needs readiness review"}
                                  </span>
                                )}
                                {asset.availabilityStatus && (
                                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                                    {asset.availabilityStatus}
                                  </span>
                                )}
                              </span>
                            )}
                            {asset.availabilityReason && (
                              <span className="mt-1 block text-[10px] text-slate-500">
                                {asset.availabilityReason}
                              </span>
                            )}
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 w-full px-4 text-sm sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  void handleSubmit();
                }}
                disabled={
                  activitySuggestedCoverageFullyLinked ||
                  !title ||
                  !customStartTime ||
                  !customEndTime ||
                  (useBulkDates && selectedBulkDates.length === 0) ||
                  selectedAssetIds.length === 0 ||
                  isSubmitting
                }
                className="h-10 w-full px-4 text-sm sm:w-auto"
              >
                {isSubmitting ? (
                  <span
                    className="flex items-center"
                    role="status"
                    aria-live="polite"
                  >
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : activitySuggestedCoverageFullyLinked ? (
                  "Activity already fully linked"
                ) : (
                  `Save ${effectiveBookingPlan.length * selectedAssetIds.length} Booking${
                    effectiveBookingPlan.length * selectedAssetIds.length === 1
                      ? ""
                      : "s"
                  }`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingConfirmAlert.isOpen}
        onOpenChange={(open) =>
          setPendingConfirmAlert((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <AlertDialogContent className="w-[calc(100vw-1rem)] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Confirm Booking?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              {`Confirming this booking will auto-deny ${pendingConfirmAlert.pendingCount} other pending request${pendingConfirmAlert.pendingCount === 1 ? "" : "s"} for this time slot.`}
              {pendingConfirmAlert.assetNames.length > 0 && (
                <span className="mt-2 block text-slate-500">
                  Affected asset
                  {pendingConfirmAlert.assetNames.length === 1 ? "" : "s"}:{" "}
                  {pendingConfirmAlert.assetNames.join(", ")}.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingConfirmAlert.impactedBookings.length > 0 && (
            <div className="max-h-56 overflow-y-auto rounded-md border border-gray-200 p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-800">Impacted bookings:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {pendingConfirmAlert.impactedBookings.map((booking) => (
                  <li key={booking.id}>
                    {`${booking.title} (${booking.status}) — ${booking.bookingDate} ${booking.startTime}-${booking.endTime}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              className="w-full bg-navy text-white hover:bg-(--navy-hover) sm:w-auto"
              onClick={(e) => {
                e.preventDefault();
                setPendingConfirmAlert({
                  isOpen: false,
                  pendingCount: 0,
                  assetNames: [],
                  impactedBookings: [],
                });
                void handleSubmit(true);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={successAlert.isOpen}
        onOpenChange={(open) => {
          if (!open) handleSuccessDismiss();
        }}
      >
        <AlertDialogContent className="w-[calc(100vw-1rem)] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              {successAlert.isConfirmed
                ? "Booking Confirmed"
                : "Booking Submitted"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              {isManager
                ? successAlert.count > 1
                  ? `Your ${successAlert.count} bookings have been confirmed and added to the calendar.`
                  : "Your booking has been confirmed and added to the calendar."
                : successAlert.count > 1
                  ? `Your ${successAlert.count} bookings have been submitted and are pending approval by a manager.`
                  : "Your booking has been submitted and is pending approval by a manager."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogAction
              onClick={handleSuccessDismiss}
              className="w-full bg-navy text-white hover:bg-(--navy-hover) sm:w-auto"
            >
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Partial Success Dialog */}
      <AlertDialog
        open={partialSuccessAlert.isOpen}
        onOpenChange={(open) => {
          if (!open) handlePartialSuccessDismiss();
        }}
      >
        <AlertDialogContent className="w-[calc(100vw-1rem)] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Partial Booking Success
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-slate-600">
                <p>
                  <span className="font-semibold text-emerald-600">
                    {partialSuccessAlert.succeededCount}
                  </span>{" "}
                  booking{partialSuccessAlert.succeededCount !== 1 ? "s" : ""}{" "}
                  created successfully.
                </p>

                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="font-semibold text-red-700 text-sm mb-2">
                    {partialSuccessAlert.failures.length} booking
                    {partialSuccessAlert.failures.length !== 1 ? "s" : ""}{" "}
                    failed:
                  </p>
                  <ul className="space-y-1">
                    {partialSuccessAlert.failures.map((f, i) => (
                      <li
                        key={i}
                        className="text-sm text-red-600 flex items-start gap-1.5"
                      >
                        <Ban className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>
                          <strong>{f.assetId}</strong>: {f.reason}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-slate-500">
                  Successfully created bookings have been added to the calendar.
                  You may retry failed bookings separately.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogAction
              onClick={handlePartialSuccessDismiss}
              className="w-full bg-navy text-white hover:bg-(--navy-hover) sm:w-auto"
            >
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
