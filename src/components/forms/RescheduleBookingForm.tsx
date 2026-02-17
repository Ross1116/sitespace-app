"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { format, addMinutes, parse, differenceInMinutes } from "date-fns";
import { CalendarIcon, Clock, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage } from "@/types";
import { reportError } from "@/lib/monitoring";
import {
  BOOKING_DURATION_OPTIONS,
  QUARTER_HOUR_OPTIONS,
  DEFAULT_BOOKING_DURATION_MINUTES,
  HOURS_IN_DAY,
  MINUTES_PER_HOUR,
} from "@/lib/formOptions";

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

interface RescheduleBookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onSave: () => void;
}

export default function RescheduleBookingForm({
  isOpen,
  onClose,
  bookingId,
  onSave,
}: RescheduleBookingFormProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [assetName, setAssetName] = useState("");
  const [assetCode, setAssetCode] = useState("");

  // Time State
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  const [duration, setDuration] = useState(
    DEFAULT_BOOKING_DURATION_MINUTES.toString(),
  );

  // Fetch Booking Details on Open
  useEffect(() => {
    const controller = new AbortController();
    if (isOpen && bookingId) {
      fetchBookingDetails(controller.signal);
    }
    return () => controller.abort();
  }, [isOpen, bookingId]);

  const fetchBookingDetails = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/bookings/${bookingId}`, { signal });
      if (signal?.aborted) return;
      const booking = response.data;

      // 1. Set Basic Info
      setTitle(booking.purpose || booking.notes?.split("\n")[0] || "Booking");
      setNotes(booking.notes || "");

      if (booking.asset) {
        setAssetName(booking.asset.name);
        setAssetCode(booking.asset.asset_code);
      }

      // 2. Set Date
      const dateObj = new Date(booking.booking_date);
      setSelectedDate(dateObj);

      // 3. Parse Times (Backend sends "HH:mm:ss")
      const startDate = parse(booking.start_time, "HH:mm:ss", new Date());
      const endDate = parse(booking.end_time, "HH:mm:ss", new Date());

      setStartHour(format(startDate, "HH"));
      setStartMinute(format(startDate, "mm"));

      setEndHour(format(endDate, "HH"));
      setEndMinute(format(endDate, "mm"));

      // 4. Calculate Duration
      const diff = differenceInMinutes(endDate, startDate);
      setDuration(diff.toString());
    } catch (err: unknown) {
      if (isAbortError(err, signal)) return;
      reportError(
        err,
        "RescheduleBookingForm: failed to fetch booking details",
      );
      setError(
        getApiErrorMessage(
          err,
          "Failed to load booking details. Please try again.",
        ),
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  // --- Time Logic Handlers ---

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
  };

  const calculateEndTime = (sHour: string, sMinute: string, dur: string) => {
    if (!sHour || !sMinute) return;

    const baseDate = new Date();
    baseDate.setHours(parseInt(sHour), parseInt(sMinute), 0);

    const endDate = addMinutes(baseDate, parseInt(dur));

    setEndHour(format(endDate, "HH"));
    setEndMinute(format(endDate, "mm"));
  };

  const handleStartHourChange = (val: string) => {
    setStartHour(val);
    calculateEndTime(val, startMinute, duration);
  };

  const handleStartMinuteChange = (val: string) => {
    setStartMinute(val);
    calculateEndTime(startHour, val, duration);
  };

  const handleDurationChange = (val: string) => {
    setDuration(val);
    calculateEndTime(startHour, startMinute, val);
  };

  const handleEndHourChange = (val: string) => setEndHour(val);
  const handleEndMinuteChange = (val: string) => setEndMinute(val);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      // Validation
      if (
        !selectedDate ||
        !startHour ||
        !startMinute ||
        !endHour ||
        !endMinute
      ) {
        throw new Error("Please fill in all date and time fields");
      }

      // Prepare Payload
      const payload = {
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: `${startHour}:${startMinute}:00`,
        end_time: `${endHour}:${endMinute}:00`,
        purpose: title,
        notes: notes,
      };

      // Call Update API
      await api.put(`/bookings/${bookingId}`, payload);

      onSave(); // Refresh parent list
      onClose(); // Close modal
    } catch (err: unknown) {
      reportError(err, "RescheduleBookingForm: failed to update booking");
      setError(getApiErrorMessage(err, "Failed to reschedule booking"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md bg-white max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Reschedule Booking
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex gap-2 items-start">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div
            className="flex justify-center py-8"
            role="status"
            aria-live="polite"
            aria-label="Loading booking details"
          >
            <div
              className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"
              aria-hidden="true"
            ></div>
            <span className="sr-only">Loading booking details</span>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-5 mt-2">
            {/* Read-Only Asset Info */}
            <div className="bg-stone-50 p-3 rounded-md border border-stone-200">
              <Label className="text-xs text-gray-500 uppercase">Asset</Label>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-sm">
                  {assetName || "Unknown Asset"}
                </span>
                <Badge variant="outline" className="text-xs bg-white">
                  {assetCode}
                </Badge>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="title">Booking Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-20 resize-none"
                />
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>New Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-[calc(100vw-1rem)] p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Start Time */}
              <div className="space-y-2">
                <Label>Start Time</Label>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Select
                      value={startHour}
                      onValueChange={handleStartHourChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: HOURS_IN_DAY }).map((_, i) => (
                          <SelectItem
                            key={i}
                            value={i.toString().padStart(2, "0")}
                          >
                            {formatHour(i)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Select
                      value={startMinute}
                      onValueChange={handleStartMinuteChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUARTER_HOUR_OPTIONS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label>End Time</Label>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Select value={endHour} onValueChange={handleEndHourChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: HOURS_IN_DAY }).map((_, i) => (
                          <SelectItem
                            key={i}
                            value={i.toString().padStart(2, "0")}
                          >
                            {formatHour(i)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Select
                      value={endMinute}
                      onValueChange={handleEndMinuteChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUARTER_HOUR_OPTIONS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration Quick Select */}
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={handleDurationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent>
                  {BOOKING_DURATION_OPTIONS.map((val) => (
                    <SelectItem key={val} value={val.toString()}>
                      {val >= MINUTES_PER_HOUR
                        ? `${val / MINUTES_PER_HOUR} hr${val > MINUTES_PER_HOUR ? "s" : ""}`
                        : `${val} min`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-6 flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || loading}
                className="w-full bg-orange-600 hover:bg-orange-700 sm:w-auto"
              >
                {submitting ? "Saving..." : "Update Booking"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
