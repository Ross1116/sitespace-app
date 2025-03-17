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
import { Checkbox } from "@/components/ui/checkbox";
import { format, addMinutes } from "date-fns";
import { CalendarEvent } from "@/components/ui/full-calendar";
import { assets } from "@/lib/data";
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

type BookingFromCalendar = {
  isOpen: boolean;
  onClose: () => void;
  startTime: Date | null;
  endTime: Date | null;
  onSave: (event: Partial<CalendarEvent>) => void;
  selectedAssetId?: string;
  bookedAssets?: string[];
};

export function BookingFromCalendar({
  isOpen,
  onClose,
  startTime,
  endTime,
  onSave,
  selectedAssetId,
  bookedAssets = [],
}: BookingFromCalendar) {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<string[]>(
    selectedAssetId ? [selectedAssetId] : []
  );
  const [duration, setDuration] = useState("60");
  const [activeTab, setActiveTab] = useState("time");

  // Time state
  const [customStartTime, setCustomStartTime] = useState<Date | null>(
    startTime
  );
  const [customEndTime, setCustomEndTime] = useState<Date | null>(null);
  const [startTimeString, setStartTimeString] = useState("");
  const [endTimeString, setEndTimeString] = useState("");

  // Initialize times
  useEffect(() => {
    if (startTime) {
      setCustomStartTime(startTime);
      setStartTimeString(format(startTime, "HH:mm"));

      const calculatedEndTime = addMinutes(startTime, parseInt(duration));
      setCustomEndTime(calculatedEndTime);
      setEndTimeString(format(calculatedEndTime, "HH:mm"));
    }
  }, [startTime, isOpen]);

  // Update end time when duration changes
  useEffect(() => {
    if (customStartTime) {
      const calculatedEndTime = addMinutes(customStartTime, parseInt(duration));
      setCustomEndTime(calculatedEndTime);
      setEndTimeString(format(calculatedEndTime, "HH:mm"));
    }
  }, [duration, customStartTime]);

  // Format for display
  const formattedDate = customStartTime
    ? format(customStartTime, "EEE, MMM d, yyyy")
    : "";

  // Handle start time change
  const handleStartTimeChange = (value: string) => {
    setStartTimeString(value);

    if (value && customStartTime) {
      try {
        const [hours, minutes] = value.split(":").map(Number);
        const newStartTime = new Date(customStartTime);
        newStartTime.setHours(hours, minutes);
        setCustomStartTime(newStartTime);

        const calculatedEndTime = addMinutes(newStartTime, parseInt(duration));
        setCustomEndTime(calculatedEndTime);
        setEndTimeString(format(calculatedEndTime, "HH:mm"));
      } catch (error) {
        console.error("Invalid time format");
      }
    }
  };

  // Handle end time change
  const handleEndTimeChange = (value: string) => {
    setEndTimeString(value);

    if (value && customStartTime) {
      try {
        const [hours, minutes] = value.split(":").map(Number);
        const newEndTime = new Date(customStartTime);
        newEndTime.setHours(hours, minutes);
        setCustomEndTime(newEndTime);

        const durationInMinutes =
          (newEndTime.getTime() - customStartTime.getTime()) / (1000 * 60);

        if (durationInMinutes === 30) setDuration("30");
        else if (durationInMinutes === 60) setDuration("60");
        else if (durationInMinutes === 90) setDuration("90");
        else if (durationInMinutes === 120) setDuration("120");
        else if (durationInMinutes === 180) setDuration("180");
        else if (durationInMinutes === 240) setDuration("240");
        else setDuration(durationInMinutes.toString());
      } catch (error) {
        console.error("Invalid time format");
      }
    }
  };

  // Handle asset selection
  const toggleAsset = (assetKey: string) => {
    setSelectedAssets((prev) => {
      if (prev.includes(assetKey)) {
        return prev.filter((key) => key !== assetKey);
      } else {
        return [...prev, assetKey];
      }
    });
  };

  // Remove an asset from selection
  const removeAsset = (assetKey: string) => {
    setSelectedAssets((prev) => prev.filter((key) => key !== assetKey));
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!customStartTime || !customEndTime || selectedAssets.length === 0)
      return;

    // Get asset names for the description
    const assetNames = selectedAssets
      .map((assetKey) => {
        const asset = assets.find((a) => a.assetKey === assetKey);
        return asset?.assetTitle || assetKey;
      })
      .join(", ");

    // Create a base description
    const baseDesc = description
      ? `${description}\n\nAssets: ${assetNames}`
      : `Assets: ${assetNames}`;

    // Create an event for the first asset
    const primaryEvent: Partial<CalendarEvent> = {
      title,
      description: baseDesc,
      start: customStartTime,
      end: customEndTime,
      color: "blue",
      id: Math.random().toString(36).substring(2, 11),
    };

    // Save the primary event
    onSave(primaryEvent);

    // Create events for additional assets
    if (selectedAssets.length > 1) {
      selectedAssets.slice(1).forEach((assetKey) => {
        const linkedEvent: Partial<CalendarEvent> = {
          title: `${title} (${assetKey})`,
          description: baseDesc,
          start: customStartTime,
          end: customEndTime,
          color: "green",
          id: Math.random().toString(36).substring(2, 11),
        };

        onSave(linkedEvent);
      });
    }

    resetForm();
    onClose();
  };

  // Reset form fields
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDuration("60");
    setCustomStartTime(null);
    setCustomEndTime(null);
    setStartTimeString("");
    setEndTimeString("");
    setSelectedAssets(selectedAssetId ? [selectedAssetId] : []);
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
            <div className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {formattedDate}
            </div>

            <div className="grid gap-2">
              <label htmlFor="startTime" className="text-sm font-medium">
                Start Time
              </label>
              <Input
                id="startTime"
                type="time"
                value={startTimeString}
                onChange={(e) => handleStartTimeChange(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="endTime" className="text-sm font-medium">
                End Time
              </label>
              <Input
                id="endTime"
                type="time"
                value={endTimeString}
                onChange={(e) => handleEndTimeChange(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="duration" className="text-sm font-medium">
                Duration
              </label>
              <Select
                value={duration}
                onValueChange={(value) => setDuration(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  {parseInt(duration) > 0 &&
                    ![30, 60, 90, 120, 180, 240].includes(
                      parseInt(duration)
                    ) && (
                      <SelectItem value={duration}>
                        {parseInt(duration)} minutes (custom)
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
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
                    const asset = assets.find((a) => a.assetKey === assetKey);
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
                    {assets.map((asset) => {
                      const isSelected = selectedAssets.includes(
                        asset.assetKey
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
                  {startTimeString} - {endTimeString} ({duration} min)
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
                      const asset = assets.find((a) => a.assetKey === assetKey);
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
