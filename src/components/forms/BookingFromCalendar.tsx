"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarEvent } from "@/components/ui/full-calendar";
import { assets } from "@/lib/data";

type BookingFromCalendar = {
  isOpen: boolean;
  onClose: () => void;
  startTime: Date | null;
  endTime: Date | null;
  onSave: (event: Partial<CalendarEvent>) => void;
  selectedAssetId?: string;
};

export function BookingFromCalendar({ 
  isOpen, 
  onClose, 
  startTime, 
  endTime, 
  onSave,
  selectedAssetId
}: BookingFromCalendar) {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(selectedAssetId || "");
  const [duration, setDuration] = useState("60"); // Default 60 minutes
  
  // Calculate formatted times for display
  const formattedStartTime = startTime ? format(startTime, "EEEE, MMMM d, yyyy 'at' h:mm a") : "";
  const formattedEndTime = endTime ? format(endTime, "h:mm a") : "";

  // Handle form submission
  const handleSubmit = () => {
    if (!startTime) return;
    
    // Calculate end time based on duration
    const calculatedEndTime = new Date(startTime);
    calculatedEndTime.setMinutes(calculatedEndTime.getMinutes() + parseInt(duration));
    
    // Create event object
    const newEvent: Partial<CalendarEvent> = {
      title,
      description,
      start: startTime,
      end: calculatedEndTime,
      color: "blue", // Default color
      id: Math.random().toString(36).substring(2, 11), // Simple random ID
    };
    
    onSave(newEvent);
    resetForm();
    onClose();
  };
  
  // Reset form fields
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDuration("60");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Time Slot</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="time" className="text-sm font-medium">Time Slot</label>
            <div id="time" className="text-sm text-muted-foreground">
              {formattedStartTime} - {formattedEndTime}
            </div>
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">Booking Title</label>
            <Input
              id="title"
              placeholder="Enter booking title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              placeholder="Add details about this booking"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="asset" className="text-sm font-medium">Asset</label>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger>
                <SelectValue placeholder="Select an asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.assetKey} value={asset.assetKey}>
                    {asset.assetTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="duration" className="text-sm font-medium">Duration</label>
            <Select value={duration} onValueChange={setDuration}>
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
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Booking</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}