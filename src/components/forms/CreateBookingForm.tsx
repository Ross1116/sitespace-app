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
      <DialogContent className="max-w-md w-full p-3 sm:p-4 overflow-hidden mx-auto">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl">
            Book Time Slot
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Details Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="grid gap-1 sm:gap-2">
              <label htmlFor="title" className="text-xs sm:text-sm font-medium">
                Booking Title
              </label>
              <Input
                id="title"
                placeholder="Enter booking title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 sm:h-9"
              />
            </div>

            <div className="grid gap-1 sm:gap-2">
              <label
                htmlFor="description"
                className="text-xs sm:text-sm font-medium"
              >
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Add details about this booking"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="sm:rows-3 text-sm"
              />
            </div>
          </div>

          {/* Date and Time Section */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-1.5 block">
                Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="scale-90 sm:scale-100"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selectors - use grid for mobile layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Start Time */}
              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-1.5 block">
                  Start Time
                </label>
                <div className="flex items-center gap-1">
                  <div className="w-1/2">
                    <Select
                      value={startHour}
                      onValueChange={handleStartHourChange}
                    >
                      <SelectTrigger className="h-8 sm:h-9 w-full text-xs sm:text-sm">
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent
                        className="max-h-52 sm:max-h-60"
                        position="popper"
                        sideOffset={4}
                      >
                        <ScrollArea className="h-52 sm:h-60">
                          <div className="p-1">
                            {Array.from({ length: 24 }).map((_, i) => {
                              const hourValue = i.toString().padStart(2, "0");
                              const isSelected = hourValue === startHour;

                              return (
                                <SelectItem
                                  key={`end-hour-${i}`}
                                  value={hourValue}
                                  className={`py-1 text-xs sm:text-sm ${
                                    isSelected ? "bg-accent" : ""
                                  }`}
                                  ref={(node) => {
                                    if (isSelected && node) {
                                      requestAnimationFrame(() => {
                                        node.scrollIntoView({
                                          block: "center",
                                          behavior: "auto",
                                        });
                                      });
                                    }
                                  }}
                                >
                                  {formatHour(i)}
                                </SelectItem>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>

                  <p className="text-xs sm:text-sm">:</p>

                  <div className="w-1/2">
                    <Select
                      value={startMinute}
                      onValueChange={handleStartMinuteChange}
                    >
                      <SelectTrigger className="h-8 sm:h-9 w-full text-xs sm:text-sm">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="00"
                          className="py-1 text-xs sm:text-sm"
                        >
                          00
                        </SelectItem>
                        <SelectItem
                          value="15"
                          className="py-1 text-xs sm:text-sm"
                        >
                          15
                        </SelectItem>
                        <SelectItem
                          value="30"
                          className="py-1 text-xs sm:text-sm"
                        >
                          30
                        </SelectItem>
                        <SelectItem
                          value="45"
                          className="py-1 text-xs sm:text-sm"
                        >
                          45
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* End Time */}
              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-1.5 block">
                  End Time
                </label>
                <div className="flex items-center gap-1">
                  <div className="w-1/2">
                    <Select value={endHour} onValueChange={handleEndHourChange}>
                      <SelectTrigger className="h-8 sm:h-9 w-full text-xs sm:text-sm">
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent
                        className="max-h-52 sm:max-h-60"
                        position="popper"
                        sideOffset={4}
                      >
                        <ScrollArea className="h-52 sm:h-60">
                          <div className="p-1">
                            {Array.from({ length: 24 }).map((_, i) => {
                              const hourValue = i.toString().padStart(2, "0");
                              const isSelected = hourValue === endHour;

                              return (
                                <SelectItem
                                  key={`end-hour-${i}`}
                                  value={hourValue}
                                  className={`py-1 text-xs sm:text-sm ${
                                    isSelected ? "bg-accent" : ""
                                  }`}
                                  ref={(node) => {
                                    if (isSelected && node) {
                                      requestAnimationFrame(() => {
                                        node.scrollIntoView({
                                          block: "center",
                                          behavior: "auto",
                                        });
                                      });
                                    }
                                  }}
                                >
                                  {formatHour(i)}
                                </SelectItem>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>

                  <p className="text-xs sm:text-sm">:</p>

                  <div className="w-1/2">
                    <Select
                      value={endMinute}
                      onValueChange={handleEndMinuteChange}
                    >
                      <SelectTrigger className="h-8 sm:h-9 w-full text-xs sm:text-sm">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="00"
                          className="py-1 text-xs sm:text-sm"
                        >
                          00
                        </SelectItem>
                        <SelectItem
                          value="15"
                          className="py-1 text-xs sm:text-sm"
                        >
                          15
                        </SelectItem>
                        <SelectItem
                          value="30"
                          className="py-1 text-xs sm:text-sm"
                        >
                          30
                        </SelectItem>
                        <SelectItem
                          value="45"
                          className="py-1 text-xs sm:text-sm"
                        >
                          45
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-1.5 block">
                Duration
              </label>
              <Select
                value={duration}
                onValueChange={handleDurationChange}
              >
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15" className="py-1 text-xs sm:text-sm">
                    15 minutes
                  </SelectItem>
                  <SelectItem value="30" className="py-1 text-xs sm:text-sm">
                    30 minutes
                  </SelectItem>
                  <SelectItem value="45" className="py-1 text-xs sm:text-sm">
                    45 minutes
                  </SelectItem>
                  <SelectItem value="60" className="py-1 text-xs sm:text-sm">
                    1 hour
                  </SelectItem>
                  <SelectItem value="90" className="py-1 text-xs sm:text-sm">
                    1.5 hours
                  </SelectItem>
                  <SelectItem value="120" className="py-1 text-xs sm:text-sm">
                    2 hours
                  </SelectItem>
                  <SelectItem value="180" className="py-1 text-xs sm:text-sm">
                    3 hours
                  </SelectItem>
                  <SelectItem value="240" className="py-1 text-xs sm:text-sm">
                    4 hours
                  </SelectItem>
                  <SelectItem value="300" className="py-1 text-xs sm:text-sm">
                    5 hours
                  </SelectItem>
                  <SelectItem value="360" className="py-1 text-xs sm:text-sm">
                    6 hours
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assets Section */}
          <div className="grid gap-1 sm:gap-2">
            <label className="text-xs sm:text-sm font-medium">
              Select Assets
            </label>
            {selectedAssets.length > 0 ? (
              <div className="flex flex-wrap gap-1 mb-1 sm:mb-2">
                {selectedAssets.map((assetKey) => {
                  const asset = assets.find((a) => a.assetKey === assetKey);
                  return (
                    <Badge
                      key={assetKey}
                      variant="secondary"
                      className="flex items-center gap-1 text-xs py-0.5 px-2"
                    >
                      <span className="truncate max-w-32 sm:max-w-full">
                        {asset?.assetTitle || assetKey}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-3 w-3 sm:h-4 sm:w-4 rounded-full cursor-pointer ml-1"
                        onClick={() => removeAsset(assetKey)}
                      >
                        <X className="h-2 w-2 sm:h-3 sm:w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                No assets selected
              </div>
            )}
            <div className="border rounded-md">
              <ScrollArea className="h-24 sm:h-36 p-1 sm:p-2">
                <div className="space-y-1 sm:space-y-2">
                  {assets.map((asset) => {
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
                            } else {
                              setSelectedAssets(
                                selectedAssets.filter(
                                  (key) => key !== asset.assetKey
                                )
                              );
                            }
                          }}
                          disabled={isBooked && !isSelected}
                          className="h-3 w-3 sm:h-4 sm:w-4"
                        />
                        <label
                          htmlFor={`asset-${asset.assetKey}`}
                          className={`text-xs sm:text-sm flex-1 truncate ${
                            isBooked && !isSelected
                              ? "text-muted-foreground line-through"
                              : ""
                          }`}
                        >
                          {asset.assetTitle}
                          {isBooked && !isSelected && (
                            <span className="ml-1 sm:ml-2 text-xxs sm:text-xs text-red-500">
                              (Booked)
                            </span>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={
              !title ||
              !customStartTime ||
              !customEndTime ||
              selectedAssets.length === 0
            }
            className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-10"
          >
            Save Booking{selectedAssets.length > 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
