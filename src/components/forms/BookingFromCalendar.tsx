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
// import { assets } from "@/lib/data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  X,
  Clock,
  Calendar as CalendarIcon,
  AlignLeft,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import api from "@/lib/api";

type BookingFromCalendar = {
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

export function BookingFromCalendar({
  isOpen,
  onClose,
  startTime = new Date(), // Provide default value
  onSave,
  defaultAsset,
  defaultAssetName,
  selectedAssetId,
  bookedAssets = [],
}: BookingFromCalendar) {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<string[]>(
    defaultAssetName ? [defaultAssetName] : []
  );
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(
    defaultAsset ? [defaultAsset] : []
  );
  const [duration, setDuration] = useState("60");
  const [activeTab, setActiveTab] = useState("time");
  const { user } = useAuth();
  const userId = user?.userId || "SM001";

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

  // Format for display
  const formattedDate = customStartTime
    ? format(customStartTime, "EEE, MMM d, yyyy")
    : "";

  // Format duration in hours and minutes
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      if (remainingMinutes === 0) {
        return hours === 1 ? `1 hour` : `${hours} hours`;
      } else {
        return `${hours} ${
          hours === 1 ? "hour" : "hours"
        } ${remainingMinutes} min`;
      }
    }
  };

  // Format time for display (e.g., "09:15" to "9:15 AM")
  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Handle asset selection
  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds((prev) => {
      if (prev.includes(assetId)) {
        return prev.filter((id) => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });

    // Also update the asset names for display
    const asset = assets.find(
      (a: { assetKey: string }) => a.assetKey === assetId
    );
    if (asset) {
      setSelectedAssets((prev) => {
        if (prev.includes(asset.assetTitle)) {
          return prev.filter((name) => name !== asset.assetTitle);
        } else {
          return [...prev, asset.assetTitle];
        }
      });
    }
  };

  // Remove an asset from selection
  const removeAsset = (assetId: string) => {
    setSelectedAssetIds((prev) => prev.filter((id) => id !== assetId));

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
    setActiveTab("time");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Book Time Slot</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full rounded-none border-b">
            <TabsTrigger value="time" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Time</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-1">
              <AlignLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Details</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Assets</span>
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Review</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="time" className="p-4 space-y-4 m-0">
            <div className="text-sm font-medium flex items-center gap-2 mb-3">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              {formattedDate}
            </div>

            {/* Time selection with improved layout */}
            <div className="space-y-4">
              {/* Start Time - more compact layout */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Start Time
                </label>
                <div className="flex items-center gap-1">
                  <div className="w-1/2">
                    <Select
                      value={startHour}
                      onValueChange={handleStartHourChange}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent
                        className="max-h-60"
                        position="popper"
                        sideOffset={4}
                      >
                        <ScrollArea className="h-60">
                          <div className="p-1">
                            {Array.from({ length: 24 }).map((_, i) => {
                              const hourValue = i.toString().padStart(2, "0");
                              const isSelected = hourValue === startHour;

                              return (
                                <SelectItem
                                  key={`end-hour-${i}`}
                                  value={hourValue}
                                  className={`py-1.5 ${
                                    isSelected ? "bg-accent" : ""
                                  }`}
                                  // This ref will scroll the selected item into view
                                  ref={(node) => {
                                    if (isSelected && node) {
                                      // Use requestAnimationFrame to ensure the scroll happens after render
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

                  <p>:</p>

                  <div className="w-1/2">
                    <Select
                      value={startMinute}
                      onValueChange={handleStartMinuteChange}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="00" className="py-1">
                          00
                        </SelectItem>
                        <SelectItem value="15" className="py-1">
                          15
                        </SelectItem>
                        <SelectItem value="30" className="py-1">
                          30
                        </SelectItem>
                        <SelectItem value="45" className="py-1">
                          45
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* End Time - more compact layout */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  End Time
                </label>
                <div className="flex items-center gap-1">
                  <div className="w-1/2">
                    <Select value={endHour} onValueChange={handleEndHourChange}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent
                        className="max-h-60"
                        position="popper"
                        sideOffset={4}
                      >
                        <ScrollArea className="h-60">
                          <div className="p-1">
                            {Array.from({ length: 24 }).map((_, i) => {
                              const hourValue = i.toString().padStart(2, "0");
                              const isSelected = hourValue === endHour;

                              return (
                                <SelectItem
                                  key={`end-hour-${i}`}
                                  value={hourValue}
                                  className={`py-1.5 ${
                                    isSelected ? "bg-accent" : ""
                                  }`}
                                  // This ref will scroll the selected item into view
                                  ref={(node) => {
                                    if (isSelected && node) {
                                      // Use requestAnimationFrame to ensure the scroll happens after render
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

                  <p>:</p>

                  <div className="w-1/2">
                    <Select
                      value={endMinute}
                      onValueChange={handleEndMinuteChange}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="00" className="py-1">
                          00
                        </SelectItem>
                        <SelectItem value="15" className="py-1">
                          15
                        </SelectItem>
                        <SelectItem value="30" className="py-1">
                          30
                        </SelectItem>
                        <SelectItem value="45" className="py-1">
                          45
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Duration - simplified */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Duration
                </label>
                <Select
                  value={duration}
                  onValueChange={(value) => setDuration(value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15" className="py-1">
                      15 minutes
                    </SelectItem>
                    <SelectItem value="30" className="py-1">
                      30 minutes
                    </SelectItem>
                    <SelectItem value="45" className="py-1">
                      45 minutes
                    </SelectItem>
                    <SelectItem value="60" className="py-1">
                      1 hour
                    </SelectItem>
                    <SelectItem value="90" className="py-1">
                      1.5 hours
                    </SelectItem>
                    <SelectItem value="120" className="py-1">
                      2 hours
                    </SelectItem>
                    <SelectItem value="180" className="py-1">
                      3 hours
                    </SelectItem>
                    <SelectItem value="240" className="py-1">
                      4 hours
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setActiveTab("details")}>Next</Button>
            </div>
          </TabsContent>

          <TabsContent value="details" className="p-4 space-y-4 m-0">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Booking Title
              </label>
              <Input
                id="title"
                placeholder="Enter booking title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Add details about this booking"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("time")}>
                Back
              </Button>
              <Button onClick={() => setActiveTab("assets")}>Next</Button>
            </div>
          </TabsContent>

          <TabsContent value="assets" className="p-4 space-y-4 m-0">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Selected Assets</label>
              {selectedAssets.length > 0 ? (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedAssets.map((assetKey) => {
                    const asset = assets.find(
                      (a: { assetKey: string }) => a.assetKey === assetKey
                    );
                    return (
                      <Badge
                        key={assetKey}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {asset?.assetTitle || assetKey}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 rounded-full"
                          onClick={() => removeAsset(assetKey)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground mb-2">
                  No assets selected
                </div>
              )}

              <div className="border rounded-md">
                <ScrollArea className="h-36 p-2">
                  <div className="space-y-2">
                    {assets.map((asset: any) => {
                      const isSelected = selectedAssets.includes(
                        asset.assetTitle
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
                            onCheckedChange={() => toggleAsset(asset.assetKey)}
                            disabled={isBooked && !isSelected}
                          />
                          <label
                            htmlFor={`asset-${asset.assetKey}`}
                            className={`text-sm flex-1 ${
                              isBooked && !isSelected
                                ? "text-muted-foreground line-through"
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
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("details")}>
                Back
              </Button>
              <Button onClick={() => setActiveTab("review")}>Next</Button>
            </div>
          </TabsContent>

          <TabsContent value="review" className="p-4 space-y-4 m-0">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Date & Time</h3>
                <p className="text-sm">{formattedDate}</p>
                <p className="text-sm">
                  {startHour && startMinute
                    ? formatTimeDisplay(`${startHour}:${startMinute}`)
                    : ""}{" "}
                  -{" "}
                  {endHour && endMinute
                    ? formatTimeDisplay(`${endHour}:${endMinute}`)
                    : ""}{" "}
                  ({formatDuration(parseInt(duration))})
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Title</h3>
                <p className="text-sm">{title || "Not specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Description</h3>
                <p className="text-sm whitespace-pre-wrap">
                  {description || "Not specified"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Assets</h3>
                {selectedAssets.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedAssets.map((assetKey) => {
                      const asset = assets.find(
                        (a: { assetKey: string }) => a.assetKey === assetKey
                      );
                      return (
                        <Badge key={assetKey} variant="secondary">
                          {asset?.assetTitle || assetKey}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No assets selected
                  </p>
                )}
              </div>
            </div>

            {selectedAssets.length > 1 && (
              <div className="bg-yellow-50 p-2 rounded border border-yellow-200 text-xs text-yellow-800">
                <p>
                  Multiple assets selected. This will create{" "}
                  {selectedAssets.length} separate booking events.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("assets")}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !title ||
                  !customStartTime ||
                  !customEndTime ||
                  selectedAssets.length === 0
                }
              >
                Save Booking{selectedAssets.length > 1 ? "s" : ""}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
