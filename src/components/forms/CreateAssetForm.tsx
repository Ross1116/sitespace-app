"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import { format } from "date-fns";

interface AssetModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onSave: () => void;
}

interface Asset {
  assetTitle: string;
  assetLocation: string;
  maintenanceStartdt: string;
  maintenanceEnddt: string;
  assetPoc: string;
  assetStatus: string;
  usageInstructions: string;
  assetKey?: string;
  assetProject: string;
}

const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, onSave }) => {
  const [project, setProject] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const userId = user?.userId;

  const [asset, setAsset] = useState<Asset>({
    assetTitle: "",
    assetLocation: "",
    maintenanceStartdt: "",
    maintenanceEnddt: "",
    assetPoc: "",
    assetStatus: "Operational",
    usageInstructions: "",
    assetProject: project,
  });

  // Load project from localStorage when component mounts or userId changes
  useEffect(() => {
    const projectString = localStorage.getItem(`project_${userId}`);
    if (!projectString) {
      console.error("No project found in localStorage");
      return;
    }

    try {
      const parsedProjects = JSON.parse(projectString);
      const parsedId = parsedProjects.id;
      setProject(parsedId);

      // Only update the assetProject if it's not already set
      if (!asset.assetProject) {
        setAsset((prev) => ({
          ...prev,
          assetProject: parsedId, // Only use the ID
        }));
      }
    } catch (error) {
      console.error("Error parsing project:", error);
    }
  }, [userId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setAsset((prev) => ({ ...prev, [name]: value }));
  };

  const handleMaintenanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAsset((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (status: "Operational" | "Out of Service") => {
    setAsset((prev) => ({ ...prev, assetStatus: status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("submit works");
    try {
      setIsSubmitting(true);

      // Map camelCase state keys to snake_case payload keys required by the API
      const snakeCasePayload = {
        asset_project: asset.assetProject,
        asset_title: asset.assetTitle,
        asset_location: asset.assetLocation,
        // Convert status to snake_case string (e.g., "Operational" -> "operational", "Out of Service" -> "out_of_service")
        asset_status: asset.assetStatus.toLowerCase().replace(/\s/g, "_"),
        asset_poc: asset.assetPoc,
        // Apply date formatting and key conversion
        maintenance_start_dt: asset.maintenanceStartdt
          ? format(new Date(asset.maintenanceStartdt), "yyyy-MM-dd'T'HH:mm:ss")
          : "",
        maintenance_end_dt: asset.maintenanceEnddt
          ? format(new Date(asset.maintenanceEnddt), "yyyy-MM-dd'T'HH:mm:ss")
          : "",
        usage_instructions: asset.usageInstructions,
        asset_key: asset.assetKey || undefined,
      };

      console.log("About to make API call");
      const response = await api.post(
        "/api/Asset/saveAsset",
        snakeCasePayload
      );

      const data = response.data;
      console.log(data)
      console.log("onsave called")
      onSave();
      onClose(false);

      // Reset form
      setAsset({
        assetTitle: "",
        assetLocation: "",
        maintenanceStartdt: "",
        maintenanceEnddt: "",
        assetPoc: "",
        assetStatus: "Operational",
        usageInstructions: "",
        assetProject: project,
      });
    } catch (error) {
      console.error("Error saving asset:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center mb-2">
          <div className="inline-flex items-center bg-gray-100 px-3 py-1 rounded-full">
            <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
            <span className="text-gray-700 text-sm">Asset Master</span>
          </div>
        </div>

        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-semibold">
            Define Assets
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Add and manage assets for the construction site
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="assetTitle">Asset Name</Label>
              <Input
                id="assetTitle"
                name="assetTitle"
                value={asset.assetTitle}
                onChange={handleChange}
                placeholder="ex. Loading Zone 1, Crane 2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetLocation">Asset Location</Label>
              <Input
                id="assetLocation"
                name="assetLocation"
                value={asset.assetLocation}
                onChange={handleChange}
                placeholder="eg. Zone 1, Loading Zone 2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Maintenance Dates</Label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  name="maintenanceStartdt"
                  value={asset.maintenanceStartdt}
                  onChange={handleMaintenanceChange}
                />
                <Input
                  type="date"
                  name="maintenanceEnddt"
                  value={asset.maintenanceEnddt}
                  onChange={handleMaintenanceChange}
                />
              </div>
              <span className="text-xs text-gray-500">
                Select scheduled maintenance start and end date
              </span>
            </div>

            <div className="space-y-2">
              <Label>Asset Status</Label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  className={cn(
                    "px-4 py-2 rounded-md flex-1 transition",
                    asset.assetStatus === "Operational"
                      ? "bg-green-100 text-green-800 font-medium"
                      : "bg-gray-100 hover:bg-gray-200"
                  )}
                  onClick={() => handleStatusChange("Operational")}
                >
                  Operational
                </button>
                <button
                  type="button"
                  className={cn(
                    "px-4 py-2 rounded-md flex-1 transition",
                    asset.assetStatus === "Out of Service"
                      ? "bg-red-100 text-red-800 font-medium"
                      : "bg-gray-100 hover:bg-gray-200"
                  )}
                  onClick={() => handleStatusChange("Out of Service")}
                >
                  Out of Service
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetPoc">Operator Information</Label>
              <Input
                id="assetPoc"
                name="assetPoc"
                value={asset.assetPoc}
                onChange={handleChange}
                placeholder="Enter operator information"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usageInstructions">
                Asset Description & Instructions
              </Label>
              <Textarea
                id="usageInstructions"
                name="usageInstructions"
                value={asset.usageInstructions}
                onChange={handleChange}
                placeholder="Enter asset description and instructions"
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              type="submit"
              className="bg-black text-white hover:bg-gray-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssetModal;