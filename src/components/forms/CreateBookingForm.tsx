"use client";

import { useState, useEffect } from "react";
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
import { differenceInMinutes, format, addMinutes } from "date-fns";
import { CalendarEvent } from "@/components/ui/full-calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import api from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "../ui/label";

// ===== TYPE DEFINITIONS =====
type CreateBookingForm = {
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
  booking_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  notes?: string;
}

interface BookingDetail {
  id: string;
  project_id?: string;
  manager_id: string;
  subcontractor_id?: string;
  asset_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function CreateBookingForm({
  isOpen,
  onClose,
  startTime = new Date(),
  onSave,
  defaultAsset,
  defaultAssetName,
  selectedAssetId,
  bookedAssets = [],
}: CreateBookingForm) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [duration, setDuration] = useState("60");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const userId = user?.id;

  const [customStartTime, setCustomStartTime] = useState<Date | null>(startTime);
  const [customEndTime, setCustomEndTime] = useState<Date | null>(null);

  const [startHour, setStartHour] = useState<string>("");
  const [startMinute, setStartMinute] = useState<string>("");
  const [endHour, setEndHour] = useState<string>("");
  const [endMinute, setEndMinute] = useState<string>("");

  const [assets, setAssets] = useState<any[]>([]);
  const [assetError, setAssetError] = useState<boolean>(false);
  const [project, setProject] = useState<any>(null);

  const handleDurationChange = (newDuration: string) => {
    setDuration(newDuration);
    const durationMinutes = parseInt(newDuration, 10);

    if (customStartTime) {
      const newEndTime = new Date(customStartTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + durationMinutes);
      setCustomEndTime(newEndTime);
      setEndHour(newEndTime.getHours().toString().padStart(2, "0"));
      setEndMinute(newEndTime.getMinutes().toString().padStart(2, "0"));
    }
  };

  // Load project from localStorage
  useEffect(() => {
    const projectString = localStorage.getItem(`project_${userId}`);
    if (projectString) {
      try {
        const parsedProject = JSON.parse(projectString);
        setProject(parsedProject);
      } catch (error) {
        console.error("Error parsing project:", error);
      }
    }
  }, [userId]);

  // Load assets from localStorage
  useEffect(() => {
    const assetString = localStorage.getItem(`assets_${userId}`);
    if (!assetString) {
      console.error("No assets found in localStorage");
      setAssetError(true);
      return;
    }

    try {
      const parsedAssets = JSON.parse(assetString);
      setAssets(parsedAssets);
    } catch (error) {
      console.error("Error parsing assets:", error);
      setAssetError(true);
    }
  }, [userId]);

  // Set default asset if provided
  useEffect(() => {
    if (defaultAssetName && assets.length > 0 && selectedAssets.length === 0) {
      const assetNameWithoutPrefix = defaultAssetName.replace(/^[A-Z]\d{3}-/, "");

      const matchingAsset = assets.find((asset) => {
        const assetTitle = asset.assetTitle || "";
        return (
          assetTitle.toLowerCase() === assetNameWithoutPrefix.toLowerCase() ||
          assetTitle.toLowerCase() === defaultAssetName.toLowerCase() ||
          asset.assetKey === defaultAsset
        );
      });

      if (matchingAsset) {
        setSelectedAssets([matchingAsset.assetKey]);
        setSelectedAssetIds([matchingAsset.assetKey]);
      }
    }
  }, [defaultAssetName, defaultAsset, assets]);

  // Update end time when duration or start time changes
  useEffect(() => {
    if (startHour && startMinute && customStartTime) {
      const newStartTime = new Date(customStartTime);
      newStartTime.setHours(parseInt(startHour), parseInt(startMinute));

      const calculatedEndTime = addMinutes(newStartTime, parseInt(duration));
      setEndHour(calculatedEndTime.getHours().toString().padStart(2, "0"));
      setEndMinute(calculatedEndTime.getMinutes().toString().padStart(2, "0"));

      setCustomEndTime(calculatedEndTime);
    }
  }, [duration, startHour, startMinute, customStartTime]);

  // Initialize times when modal opens
  useEffect(() => {
    if (startTime) {
      const hours = startTime.getHours().toString().padStart(2, "0");
      const roundedMinutes = Math.round(startTime.getMinutes() / 15) * 15;
      const minutes = (roundedMinutes % 60).toString().padStart(2, "0");

      setStartHour(hours);
      setStartMinute(minutes);

      const endTime = addMinutes(startTime, parseInt(duration));
      setEndHour(endTime.getHours().toString().padStart(2, "0"));
      setEndMinute(endTime.getMinutes().toString().padStart(2, "0"));

      setCustomStartTime(startTime);
      setCustomEndTime(endTime);
    }
  }, [startTime, isOpen, duration]);

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
  };

  const handleStartHourChange = (value: string): void => {
    setStartHour(value);
    updateStartTime(value, startMinute);
  };

  const handleStartMinuteChange = (value: string): void => {
    setStartMinute(value);
    updateStartTime(startHour, value);
  };

  const updateStartTime = (hour: string, minute: string): void => {
    if (hour && minute && customStartTime) {
      const newStartTime = new Date(customStartTime);
      newStartTime.setHours(parseInt(hour), parseInt(minute));
      setCustomStartTime(newStartTime);

      const calculatedEndTime = addMinutes(newStartTime, parseInt(duration));
      setCustomEndTime(calculatedEndTime);
      setEndHour(calculatedEndTime.getHours().toString().padStart(2, "0"));
      setEndMinute(calculatedEndTime.getMinutes().toString().padStart(2, "0"));
    }
  };

  const handleEndHourChange = (value: string): void => {
    setEndHour(value);
    updateEndTime(value, endMinute);
  };

  const handleEndMinuteChange = (value: string): void => {
    setEndMinute(value);
    updateEndTime(endHour, value);
  };

  const updateEndTime = (hour: string, minute: string): void => {
    if (hour && minute && customStartTime) {
      const newEndTime = new Date(customStartTime);
      newEndTime.setHours(parseInt(hour), parseInt(minute));
      setCustomEndTime(newEndTime);

      const durationInMinutes =
        (newEndTime.getTime() - customStartTime.getTime()) / (1000 * 60);

      if (durationInMinutes > 0) {
        setDuration(durationInMinutes.toString());
      }
    }
  };

  const removeAsset = (assetId: string) => {
    setSelectedAssets((prev) => prev.filter((key) => key !== assetId));
    setSelectedAssetIds((prev) => prev.filter((id) => id !== assetId));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!customStartTime || !customEndTime || selectedAssetIds.length === 0) {
      setError("Please fill in all required fields");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a booking title");
      return;
    }

    if (!project) {
      setError("No project selected");
      return;
    }

    try {
      setIsSubmitting(true);

      // Format date and times for backend
      const bookingDate = format(selectedDate, "yyyy-MM-dd");
      const startTimeFormatted = format(customStartTime, "HH:mm:ss");
      const endTimeFormatted = format(customEndTime, "HH:mm:ss");

      console.log("Creating bookings for assets:", selectedAssetIds);

      // Create one booking per asset
      const bookingPromises = selectedAssetIds.map(async (assetId) => {
        const bookingData: BookingCreateRequest = {
          project_id: project.id,
          asset_id: assetId,
          booking_date: bookingDate,
          start_time: startTimeFormatted,
          end_time: endTimeFormatted,
          notes: description || title,
        };

        console.log("Creating booking:", bookingData);

        const response = await api.post<BookingDetail>("/bookings/", bookingData);
        return response.data;
      });

      const createdBookings = await Promise.all(bookingPromises);
      console.log("Bookings created successfully:", createdBookings);

      // Transform to calendar events
      const events = createdBookings.map((booking) => {
        const asset = assets.find((a) => a.assetKey === booking.asset_id);
        const assetTitle = asset?.assetTitle || booking.asset_id;

        // Combine booking date and times to create full Date objects
        const startDateTime = new Date(
          `${booking.booking_date}T${booking.start_time}`
        );
        const endDateTime = new Date(`${booking.booking_date}T${booking.end_time}`);

        return {
          id: booking.id,
          title: `${title} - ${assetTitle}`,
          description: description || title,
          start: startDateTime,
          end: endDateTime,
          status: booking.status,
          bookingData: booking,
        } as Partial<CalendarEvent>;
      });

      onSave(events);
      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Error creating bookings:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to create booking";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDuration("60");
    setCustomStartTime(null);
    setCustomEndTime(null);
    setStartHour("");
    setStartMinute("");
    setEndHour("");
    setEndMinute("");
    setSelectedAssetIds([]);
    setSelectedAssets([]);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-auto rounded-xl p-3 sm:p-6 bg-white shadow-lg">
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

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Booking Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                onChange={(e) => setDescription(e.target.value)}
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
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                  <SelectItem key={val} value={val.toString()} className="text-sm">
                    {val >= 60
                      ? `${val / 60} hour${val >= 120 ? "s" : ""}`
                      : `${val} minutes`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Asset Selection */}
          <div className="space-y-2">
            <Label>
              Select Assets <span className="text-red-500">*</span>
            </Label>
            {selectedAssets.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedAssets.map((assetKey) => {
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
                        onClick={() => removeAsset(assetKey)}
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
                    const isSelected = selectedAssets.includes(asset.assetKey);
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
                              setSelectedAssets([
                                ...selectedAssets,
                                asset.assetKey,
                              ]);
                              setSelectedAssetIds([
                                ...selectedAssetIds,
                                asset.assetKey,
                              ]);
                            } else {
                              setSelectedAssets(
                                selectedAssets.filter((k) => k !== asset.assetKey)
                              );
                              setSelectedAssetIds(
                                selectedAssetIds.filter(
                                  (id) => id !== asset.assetKey
                                )
                              );
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
                selectedAssets.length === 0 ||
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                `Save Booking${selectedAssets.length > 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}