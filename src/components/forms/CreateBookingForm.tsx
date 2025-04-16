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
import { Label } from "../ui/label"


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
  const [selectedAssets, setSelectedAssets] = useState<string[]>(
    defaultAssetName ? [defaultAssetName] : []
  );
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(
    defaultAsset ? [defaultAsset] : []
  );
  const [duration, setDuration] = useState("60");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();
  const userId = user?.userId;

  // Time state
  const [customStartTime, setCustomStartTime] = useState<Date | null>(
    startTime
  );
  const [customEndTime, setCustomEndTime] = useState<Date | null>(null);

  // Split time state into hour and minute components
  const [startHour, setStartHour] = useState<string>("");
  const [startMinute, setStartMinute] = useState<string>("");
  const [endHour, setEndHour] = useState<string>("");
  const [endMinute, setEndMinute] = useState<string>("");

  // Add state for assets
  const [assets, setAssets] = useState<any[]>([]);
  const [assetError, setAssetError] = useState<boolean>(false);

  // Add this handler for duration changes
  const handleDurationChange = (newDuration: any) => {
    setDuration(newDuration);

    // Parse the new duration to minutes
    const durationMinutes = parseInt(newDuration, 10);

    // Only if we have a valid start time, calculate a new end time
    if (customStartTime) {
      // Clone the start time date object
      const newEndTime = new Date(customStartTime);

      // Add the duration in minutes to the start time
      newEndTime.setMinutes(newEndTime.getMinutes() + durationMinutes);

      // Update the end time state
      setCustomEndTime(newEndTime);

      // Update the end hour and minute selectors to match
      setEndHour(newEndTime.getHours().toString().padStart(2, "0"));
      setEndMinute(newEndTime.getMinutes().toString().padStart(2, "0"));
    }
  };

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
      console.log(assetError);
    }
  }, [userId]);

  // Update end time when duration changes
  useEffect(() => {
    if (startHour && startMinute && customStartTime) {
      // Create a new date object without updating customStartTime
      const newStartTime = new Date(customStartTime);
      newStartTime.setHours(parseInt(startHour), parseInt(startMinute));

      // Calculate end time without updating customStartTime
      const calculatedEndTime = addMinutes(newStartTime, parseInt(duration));
      setEndHour(calculatedEndTime.getHours().toString().padStart(2, "0"));
      setEndMinute(calculatedEndTime.getMinutes().toString().padStart(2, "0"));

      // Only update the end time, not the start time
      setCustomEndTime(calculatedEndTime);
    }
  }, [duration, startHour, startMinute, customStartTime]);

  useEffect(() => {
    if (customStartTime && startHour && startMinute) {
      // Only update customStartTime when time inputs change directly
      const currentHours = customStartTime.getHours();
      const currentMinutes = customStartTime.getMinutes();

      if (
        currentHours !== parseInt(startHour) ||
        currentMinutes !== parseInt(startMinute)
      ) {
        const updatedStartTime = new Date(customStartTime);
        updatedStartTime.setHours(parseInt(startHour), parseInt(startMinute));
        setCustomStartTime(updatedStartTime);
      }
    }
  }, [startHour, startMinute, customStartTime]);

  // Initialize times
  useEffect(() => {
    if (startTime) {
      const hours = startTime.getHours().toString().padStart(2, "0");
      // Round minutes to nearest 15
      const roundedMinutes = Math.round(startTime.getMinutes() / 15) * 15;
      const minutes = (roundedMinutes % 60).toString().padStart(2, "0");

      setStartHour(hours);
      setStartMinute(minutes);

      // Calculate end time based on duration
      const endTime = addMinutes(startTime, parseInt(duration));
      setEndHour(endTime.getHours().toString().padStart(2, "0"));
      setEndMinute(endTime.getMinutes().toString().padStart(2, "0"));

      // Set the full date objects only during initialization
      setCustomStartTime(startTime);
      setCustomEndTime(endTime);
    }
  }, [startTime, isOpen, duration]);

  // Format hour for display (12-hour format with AM/PM)
  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${displayHour} ${period}`;
  };

  // Handle start hour change
  const handleStartHourChange = (value: string): void => {
    setStartHour(value);
    updateStartTime(value, startMinute);
  };

  // Handle start minute change
  const handleStartMinuteChange = (value: string): void => {
    setStartMinute(value);
    updateStartTime(startHour, value);
  };

  // Update start time and recalculate end time
  const updateStartTime = (hour: string, minute: string): void => {
    if (hour && minute && customStartTime) {
      const newStartTime = new Date(customStartTime);
      newStartTime.setHours(parseInt(hour), parseInt(minute));
      setCustomStartTime(newStartTime);

      // Update end time based on new start time and current duration
      const calculatedEndTime = addMinutes(newStartTime, parseInt(duration));
      setCustomEndTime(calculatedEndTime);
      setEndHour(calculatedEndTime.getHours().toString().padStart(2, "0"));
      setEndMinute(calculatedEndTime.getMinutes().toString().padStart(2, "0"));
    }
  };

  // Handle end hour change
  const handleEndHourChange = (value: string): void => {
    setEndHour(value);
    updateEndTime(value, endMinute);
  };

  // Handle end minute change
  const handleEndMinuteChange = (value: string): void => {
    setEndMinute(value);
    updateEndTime(endHour, value);
  };

  // Update end time and recalculate duration
  const updateEndTime = (hour: string, minute: string): void => {
    if (hour && minute && customStartTime) {
      const newEndTime = new Date(customStartTime);
      newEndTime.setHours(parseInt(hour), parseInt(minute));
      setCustomEndTime(newEndTime);

      // Calculate new duration based on start and end times
      const durationInMinutes =
        (newEndTime.getTime() - customStartTime.getTime()) / (1000 * 60);

      // Round to nearest standard option if possible
      if (durationInMinutes === 15) setDuration("15");
      else if (durationInMinutes === 30) setDuration("30");
      else if (durationInMinutes === 45) setDuration("45");
      else if (durationInMinutes === 60) setDuration("60");
      else if (durationInMinutes === 90) setDuration("90");
      else if (durationInMinutes === 120) setDuration("120");
      else if (durationInMinutes === 180) setDuration("180");
      else if (durationInMinutes === 240) setDuration("240");
      else setDuration(durationInMinutes.toString());
    }
  };

  // Initialize times
  useEffect(() => {
    if (startTime) {
      const hours = startTime.getHours().toString().padStart(2, "0");
      // Round minutes to nearest 15
      const roundedMinutes = Math.round(startTime.getMinutes() / 15) * 15;
      const minutes = (roundedMinutes % 60).toString().padStart(2, "0");

      setStartHour(hours);
      setStartMinute(minutes);

      // Calculate end time based on duration
      const endTime = addMinutes(startTime, parseInt(duration));
      setEndHour(endTime.getHours().toString().padStart(2, "0"));
      setEndMinute(endTime.getMinutes().toString().padStart(2, "0"));

      // Set the full date objects only during initialization
      setCustomStartTime(startTime);
      setCustomEndTime(endTime);
    }
  }, [startTime, isOpen, duration]);


  // Remove an asset from selection
  const removeAsset = (assetId: string) => {
    setSelectedAssets((prev) => prev.filter((key) => key !== assetId));

    const asset = assets.find(
      (a: { assetKey: string }) => a.assetKey === assetId
    );
    if (asset) {
      setSelectedAssets((prev) =>
        prev.filter((name) => name !== asset.assetTitle)
      );
    }
  };

  // Handle form submission
  // Modified handleSubmit function to make API call
  const handleSubmit = async () => {
    if (!customStartTime || !customEndTime || selectedAssetIds.length === 0)
      return;

    try {
      // Calculate duration in minutes
      const durationMins = differenceInMinutes(customEndTime, customStartTime);

      // Format date for API
      const bookingTimeDt = format(customStartTime, "yyyy-MM-dd'T'HH:mm:ss");

      // Get the current user info
      const projectString = localStorage.getItem(`project_${userId}`);
      if (!projectString) {
        console.error("No project found in localStorage");
        return;
      }
      const project = JSON.parse(projectString);

      // Create booking payload - use selectedAssetIds directly
      const bookingData = {
        bookedAssets: selectedAssetIds,
        bookingCreatedBy: userId,
        bookingDescription: description || "No description provided",
        bookingDurationMins: durationMins,
        bookingFor: userId,
        bookingNotes: "",
        bookingProject: project.id || "P001",
        bookingStatus: "Pending",
        bookingTimeDt: bookingTimeDt,
        bookingTitle: title,
      };

      let responseData: { ID: any };

      try {
        const response = await api.post(
          "/api/auth/slotBooking/saveSlotBooking",
          bookingData
        );
        console.log("Booking saved successfully:", response.data);
        responseData = response.data;
      } catch (error) {
        console.error("Error posting bookings:", error);
      }

      // When creating events, use asset titles for display but keep IDs for backend
      const events = selectedAssetIds.map((assetId) => {
        const asset = assets.find(
          (a: { assetKey: string }) => a.assetKey === assetId
        );
        const assetTitle = asset?.assetTitle || assetId;

        return {
          title: `${title} - ${assetTitle}`,
          description: description
            ? `${description}\n\nAssets: ${assetTitle}`
            : `Assets: ${assetTitle}`,
          start: customStartTime,
          end: customEndTime,
          id: responseData.ID || `local-${assetId}-${Date.now()}`,
        } as Partial<CalendarEvent>;
      });

      onSave(events); // Pass the events array to onSave
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error saving booking:", error);
      // Fallback error handling remains similar
    }
  };

  // Reset form fields
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
    setSelectedAssetIds(selectedAssetId ? [selectedAssetId] : []);
    setSelectedAssets(
      selectedAssetId
        ? [
          assets.find(
            (a: { assetKey: string }) => a.assetKey === selectedAssetId
          )?.assetTitle || "",
        ]
        : []
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-auto rounded-xl p-3 sm:p-6 bg-white shadow-lg">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            Book Time Slot
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title + Description */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Booking Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className="h-9"
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
              />
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-9 justify-start text-left text-sm font-normal"
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
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Select */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <div className="flex items-center gap-2">
                <Select value={startHour} onValueChange={handleStartHourChange}>
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
                <Select value={startMinute} onValueChange={handleStartMinuteChange}>
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
              <Label>End Time</Label>
              <div className="flex items-center gap-2">
                <Select value={endHour} onValueChange={handleEndHourChange}>
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
                <Select value={endMinute} onValueChange={handleEndMinuteChange}>
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
            <Label>Duration</Label>
            <Select value={duration} onValueChange={handleDurationChange}>
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {[15, 30, 45, 60, 90, 120, 180, 240, 300, 360].map((val) => (
                  <SelectItem key={val} value={val.toString()} className="text-sm">
                    {val >= 60 ? `${val / 60} hour${val >= 120 ? "s" : ""}` : `${val} minutes`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assets */}
          <div className="space-y-2">
            <Label>Select Assets</Label>
            {selectedAssets.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedAssets.map((key) => {
                  const asset = assets.find((a) => a.assetKey === key);
                  return (
                    <Badge key={key} className="text-xs flex items-center gap-1">
                      {asset?.assetTitle || key}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4"
                        onClick={() => removeAsset(key)}
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
                {assets.map((asset) => {
                  const isSelected = selectedAssets.includes(asset.assetKey);
                  const isBooked = bookedAssets.includes(asset.assetKey);
                  return (
                    <div key={asset.assetKey} className="flex items-center space-x-2">
                      <Checkbox
                        id={`asset-${asset.assetKey}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAssets([...selectedAssets, asset.assetKey]);
                          } else {
                            setSelectedAssets(
                              selectedAssets.filter((k) => k !== asset.assetKey)
                            );
                          }
                        }}
                        disabled={isBooked && !isSelected}
                      />
                      <label
                        htmlFor={`asset-${asset.assetKey}`}
                        className={`text-sm flex-1 truncate ${isBooked && !isSelected ? "line-through text-muted-foreground" : ""
                          }`}
                      >
                        {asset.assetTitle}
                        {isBooked && !isSelected && (
                          <span className="ml-2 text-xs text-red-500">(Booked)</span>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={
                !title || !customStartTime || !customEndTime || selectedAssets.length === 0
              }
              className="h-10 px-4 text-sm"
            >
              Save Booking{selectedAssets.length > 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
