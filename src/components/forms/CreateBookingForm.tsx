"use client";

import { useReducer, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
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
import api from "@/lib/api";
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
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ApiAsset,
  ApiBooking,
  ApiProject,
  BookingListResponse,
  getApiErrorMessage,
} from "@/types";
import useSWR from "swr";
import { swrFetcher } from "@/lib/swr";

// ===== TYPE DEFINITIONS =====
type CreateBookingFormProps = {
  isOpen: boolean;
  onClose: () => void;
  startTime: Date | null;
  endTime: Date | null;
  onSave: (newEvent: Partial<CalendarEvent> | Partial<CalendarEvent>[]) => void;
  selectedAssetId?: string;
  bookedAssets?: string[];
  defaultAsset?: string;
  defaultAssetName?: string;
};

interface BookingCreateRequest {
  project_id?: string;
  subcontractor_id?: string;
  asset_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  purpose?: string;
}

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
};

type SubcontractorSource = Record<string, unknown>;

const getString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const getIdString = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const isAbortError = (error: unknown, signal?: AbortSignal) => {
  if (signal?.aborted) return true;
  if (error instanceof Error && error.name === "CanceledError") return true;
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ERR_CANCELED"
  ) {
    return true;
  }
  return false;
};

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
  project: ApiProject | null;
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
  | { type: "INITIALIZE"; startTime: Date; duration: string }
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
  | { type: "SET_PROJECT"; project: ApiProject }
  | { type: "SET_SUBCONTRACTORS"; subs: Subcontractor[]; loading: boolean }
  | { type: "SET_LOADING_SUBS"; loading: boolean }
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

const initialTimeState: TimeState = {
  startHour: "",
  startMinute: "",
  endHour: "",
  endMinute: "",
  duration: "60",
  customStartTime: null,
  customEndTime: null,
  selectedDate: new Date(),
};

function timeReducer(state: TimeState, action: TimeAction): TimeState {
  switch (action.type) {
    case "INITIALIZE": {
      const roundedMinutes =
        Math.round(action.startTime.getMinutes() / 15) * 15;
      const startHour = action.startTime.getHours().toString().padStart(2, "0");
      const startMinute = (roundedMinutes % 60).toString().padStart(2, "0");

      const normalizedStart = new Date(action.startTime);
      normalizedStart.setHours(
        parseInt(startHour),
        parseInt(startMinute),
        0,
        0,
      );

      const { endTime, endHour, endMinute } = computeEndTime(
        normalizedStart,
        parseInt(action.duration),
      );

      return {
        startHour,
        startMinute,
        endHour,
        endMinute,
        duration: action.duration,
        customStartTime: normalizedStart,
        customEndTime: endTime,
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
  project: null,
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
    case "SET_PROJECT":
      return { ...state, project: action.project };
    case "SET_SUBCONTRACTORS":
      return {
        ...state,
        subcontractors: action.subs,
        loadingSubcontractors: action.loading,
      };
    case "SET_LOADING_SUBS":
      return { ...state, loadingSubcontractors: action.loading };
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
  startTime = new Date(),
  onSave,
  defaultAsset,
  defaultAssetName,
  bookedAssets = [],
}: CreateBookingFormProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const isManager = user?.role === "manager" || user?.role === "admin";
  const isSubcontractor = user?.role === "subcontractor";

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
    project,
    subcontractors,
    successAlert,
    partialSuccessAlert,
  } = asyncState;

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
  };

  // ===== RESET =====
  const resetForm = useCallback(() => {
    dispatchTime({ type: "RESET" });
    dispatchForm({
      type: "RESET",
      defaultSubcontractor: isSubcontractor ? userId || "" : "",
    });
    dispatchAsset({ type: "RESET" });
    dispatchAsync({ type: "RESET" });
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

  // ===== LOAD PROJECT FROM LOCALSTORAGE =====
  useEffect(() => {
    const projectString = localStorage.getItem(`project_${userId}`);
    if (projectString) {
      try {
        dispatchAsync({
          type: "SET_PROJECT",
          project: JSON.parse(projectString) as ApiProject,
        });
      } catch (err) {
        console.error("Error parsing project:", err);
      }
    }
  }, [userId]);

  // ===== LOAD ASSETS VIA SWR =====
  const assetSwrKey = useMemo(() => {
    if (!project?.id) return null;
    return `/assets/?project_id=${project.id}&skip=0&limit=100`;
  }, [project]);

  const { data: assetsResponse, error: assetsSwrError } = useSWR<{
    assets: ApiAsset[];
  }>(assetSwrKey, swrFetcher);

  useEffect(() => {
    if (assetsResponse) {
      const normalizedAssets: AssetOption[] = (assetsResponse.assets || [])
        .filter(
          (asset) =>
            asset.status !== "maintenance" && asset.status !== "retired",
        )
        .map((asset) => ({
          ...asset,
          assetKey: asset.id,
          assetTitle: asset.name,
        }));
      dispatchAsset({ type: "SET_ASSETS", assets: normalizedAssets });
    } else if (assetsSwrError) {
      dispatchAsset({ type: "SET_ASSET_ERROR", error: true });
    }
  }, [assetsResponse, assetsSwrError]);

  // ===== LOAD SUBCONTRACTORS =====
  useEffect(() => {
    const controller = new AbortController();
    const loadSubcontractors = async (signal: AbortSignal) => {
      if (!project?.id || !isManager) return;

      dispatchAsync({ type: "SET_LOADING_SUBS", loading: true });
      try {
        const response = await api.get(`/subcontractors/my-subcontractors`, {
          params: {
            skip: 0,
            limit: 100,
            is_active: true,
            project_id: project.id,
          },
          signal,
        });

        let subsData: SubcontractorSource[] = [];
        if (Array.isArray(response.data)) {
          subsData = response.data as SubcontractorSource[];
        } else if (Array.isArray(response.data.subcontractors)) {
          subsData = response.data.subcontractors as SubcontractorSource[];
        } else if (Array.isArray(response.data.data)) {
          subsData = response.data.data as SubcontractorSource[];
        } else if (
          response.data.records &&
          Array.isArray(response.data.records)
        ) {
          subsData = response.data.records as SubcontractorSource[];
        } else {
          const values = Object.values(response.data || {});
          const arr = values.find((v) => Array.isArray(v));
          if (arr) subsData = arr as SubcontractorSource[];
        }

        const normalizedSubs: Subcontractor[] = subsData.map((sub) => {
          const name = getString(sub.name);
          return {
            id:
              getIdString(sub.id) ||
              getIdString(sub.subcontractor_id) ||
              getIdString(sub.subcontractorKey) ||
              getIdString(sub.uuid) ||
              getIdString(sub.key),
            first_name:
              getString(sub.first_name) ||
              getString(sub.firstName) ||
              (name ? name.split(" ")[0] : ""),
            last_name:
              getString(sub.last_name) ||
              getString(sub.lastName) ||
              (name ? name.split(" ").slice(1).join(" ") : ""),
            email:
              getString(sub.email) ||
              getString(sub.contractorEmail) ||
              getString(sub.contact_email),
            company_name:
              getString(sub.company_name) ||
              getString(sub.companyName) ||
              getString(sub.contractorCompany) ||
              getString(sub.employer),
            trade_specialty:
              getString(sub.trade_specialty) ||
              getString(sub.tradeSpecialty) ||
              getString(sub.contractorTrade) ||
              getString(sub.role),
          };
        });

        dispatchAsync({
          type: "SET_SUBCONTRACTORS",
          subs: normalizedSubs,
          loading: false,
        });
      } catch (err: unknown) {
        if (isAbortError(err, signal)) return;
        console.error("Error loading subcontractors:", err);
        dispatchAsync({ type: "SET_LOADING_SUBS", loading: false });
      }
    };

    if (isOpen && project) {
      loadSubcontractors(controller.signal);
      return () => controller.abort();
    }
    return undefined;
  }, [isOpen, project, isManager, userId]);

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
    if (startTime && isOpen) {
      dispatchTime({ type: "INITIALIZE", startTime, duration });
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
  const handleSubmit = async () => {
    dispatchAsync({ type: "SET_ERROR", error: null });

    if (!customStartTime || !customEndTime || selectedAssetIds.length === 0) {
      dispatchAsync({
        type: "SET_ERROR",
        error: "Please fill in all required fields",
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
    if (!project) {
      dispatchAsync({ type: "SET_ERROR", error: "No project selected" });
      return;
    }

    try {
      dispatchAsync({ type: "SET_SUBMITTING", value: true });

      const bookingDate = format(selectedDate, "yyyy-MM-dd");
      const startTimeFormatted = format(customStartTime, "HH:mm:ss");
      const endTimeFormatted = format(customEndTime, "HH:mm:ss");

      const normalizeTime = (timeValue: string) =>
        (timeValue || "").split(":").slice(0, 2).join(":");

      const targetSubcontractorId = isSubcontractor
        ? userId
        : selectedSubcontractor || undefined;

      if (targetSubcontractorId) {
        const existing = await api.get<BookingListResponse>(`/bookings/`, {
          params: {
            project_id: project.id,
            limit: 1000,
            skip: 0,
          },
        });

        const normalizedStart = normalizeTime(startTimeFormatted);
        const normalizedEnd = normalizeTime(endTimeFormatted);
        const duplicateAssetIds = new Set(
          (existing.data.bookings || [])
            .filter((booking) => {
              const status = (booking.status || "").toLowerCase();
              if (status === "cancelled" || status === "denied") return false;
              return (
                booking.subcontractor_id === targetSubcontractorId &&
                booking.booking_date === bookingDate &&
                normalizeTime(booking.start_time) === normalizedStart &&
                normalizeTime(booking.end_time) === normalizedEnd &&
                selectedAssetIds.includes(booking.asset_id)
              );
            })
            .map((booking) => booking.asset_id),
        );

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

      // Use Promise.allSettled instead of Promise.all
      const results = await Promise.allSettled(
        selectedAssetIds.map(async (assetId) => {
          const bookingData: BookingCreateRequest = {
            project_id: project.id,
            asset_id: assetId,
            booking_date: bookingDate,
            start_time: startTimeFormatted,
            end_time: endTimeFormatted,
            purpose: title,
            notes: description,
            subcontractor_id: selectedSubcontractor || undefined,
          };
          const response = await api.post<BookingDetail>(
            "/bookings/",
            bookingData,
          );
          return { ...response.data, _requestedAssetId: assetId };
        }),
      );

      // Separate successes and failures
      const succeeded: BookingDetail[] = [];
      const failed: { assetId: string; reason: string }[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          succeeded.push(result.value);
        } else {
          const assetId = selectedAssetIds[index];
          const asset = assets.find((a) => a.assetKey === assetId);
          const assetName = asset?.assetTitle || assetId;
          const reason =
            result.reason?.response?.data?.detail ||
            result.reason?.message ||
            "Unknown error";
          failed.push({ assetId: assetName, reason });
        }
      });

      // Process successful bookings
      if (succeeded.length > 0) {
        if (isManager) {
          for (const b of succeeded) {
            if (!b.status || b.status.toLowerCase() === "pending") {
              b.status = "CONFIRMED";
            }
          }
        }

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
      console.error("Error creating bookings:", err);
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
        <DialogContent className="w-full max-w-md mx-auto rounded-xl p-3 sm:p-6 bg-white shadow-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              Book Time Slot
            </DialogTitle>
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
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
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
                  <Select
                    value={startHour}
                    onValueChange={handleStartHourChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-9 w-full text-sm">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }).map((_, i) => {
                        const val = i.toString().padStart(2, "0");
                        return (
                          <SelectItem key={val} value={val} className="text-sm">
                            {formatHour(i)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <span>:</span>
                  <Select
                    value={startMinute}
                    onValueChange={handleStartMinuteChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-9 w-full text-sm">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {["00", "15", "30", "45"].map((val) => (
                        <SelectItem key={val} value={val} className="text-sm">
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  End Time <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={endHour}
                    onValueChange={handleEndHourChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-9 w-full text-sm">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }).map((_, i) => {
                        const val = i.toString().padStart(2, "0");
                        return (
                          <SelectItem key={val} value={val} className="text-sm">
                            {formatHour(i)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <span>:</span>
                  <Select
                    value={endMinute}
                    onValueChange={handleEndMinuteChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-9 w-full text-sm">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {["00", "15", "30", "45"].map((val) => (
                        <SelectItem key={val} value={val} className="text-sm">
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  {[15, 30, 45, 60, 90, 120, 180, 240, 300, 360].map((val) => (
                    <SelectItem
                      key={val}
                      value={val.toString()}
                      className="text-sm"
                    >
                      {val >= 60
                        ? `${val / 60} hour${val >= 120 ? "s" : ""}`
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
                      <div className="px-2 py-1.5 text-sm text-gray-500">
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
                          className="flex items-center space-x-2"
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
                            className={`text-sm flex-1 truncate ${
                              isBooked && !isSelected
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {asset.assetTitle}
                            {isBooked && !isSelected && (
                              <span className="ml-2 text-xs text-red-500">
                                (Booked)
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
            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !title ||
                  !customStartTime ||
                  !customEndTime ||
                  selectedAssetIds.length === 0 ||
                  isSubmitting
                }
                className="h-10 px-4 text-sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                ) : (
                  `Save Booking${selectedAssetIds.length > 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={successAlert.isOpen}
        onOpenChange={(open) => {
          if (!open) handleSuccessDismiss();
        }}
      >
        <AlertDialogContent className="bg-white">
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
              className="bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white"
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
        <AlertDialogContent className="bg-white">
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
                        <Ban className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
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
              className="bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white"
            >
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
