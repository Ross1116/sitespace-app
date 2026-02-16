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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import { getApiErrorMessage } from "@/types";

// ===== TYPE DEFINITIONS =====
interface AssetModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onSave: () => void;
  startTime?: Date;
  endTime?: Date;
}

interface Asset {
  assetTitle: string;
  assetCode: string;
  assetType: string;
  assetLocation: string;
  maintenanceStartdt: string;
  maintenanceEnddt: string;
  assetPoc: string;
  assetStatus: string;
  usageInstructions: string;
  assetProject: string;
}

interface AssetCreateRequest {
  asset_code: string;
  name: string;
  asset_type: string;
  description?: string;
  status: "available" | "maintenance" | "retired";
  project_id?: string;
  location?: string;
  poc?: string;
  usage_instructions?: string;
  maintenance_start_date?: string;
  maintenance_end_date?: string;
}

// ===== HELPER FUNCTIONS =====
const mapFrontendStatusToBackend = (
  status: string,
): "available" | "maintenance" | "retired" => {
  const statusMap: Record<string, "available" | "maintenance" | "retired"> = {
    Operational: "available",
    Maintenance: "maintenance",
    "Out of Service": "retired",
  };
  return statusMap[status] || "available";
};

const generateAssetCode = (assetType: string, assetTitle: string): string => {
  // Generate a simple asset code based on type and title
  const typePrefix = assetType
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  const titleSuffix = assetTitle
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const timestamp = Date.now().toString().slice(-4);
  return `${typePrefix || "AST"}-${titleSuffix || "XXX"}-${timestamp}`;
};

const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, onSave }) => {
  const [project, setProject] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const userId = user?.id;

  const [asset, setAsset] = useState<Asset>({
    assetTitle: "",
    assetCode: "",
    assetType: "",
    assetLocation: "",
    maintenanceStartdt: "",
    maintenanceEnddt: "",
    assetPoc: "",
    assetStatus: "Operational",
    usageInstructions: "",
    assetProject: "",
  });

  // Load project from localStorage
  useEffect(() => {
    const projectString = localStorage.getItem(`project_${userId}`);
    if (!projectString) {
      console.error("No project found in localStorage");
      return;
    }

    try {
      const parsedProject = JSON.parse(projectString);
      const parsedId = parsedProject.id;
      setProject(parsedId);

      setAsset((prev) => ({
        ...prev,
        assetProject: parsedId,
      }));
    } catch (error) {
      console.error("Error parsing project:", error);
    }
  }, [userId]);

  // Auto-generate asset code when type and title change
  useEffect(() => {
    if (asset.assetType && asset.assetTitle && !asset.assetCode) {
      const generatedCode = generateAssetCode(
        asset.assetType,
        asset.assetTitle,
      );
      setAsset((prev) => ({
        ...prev,
        assetCode: generatedCode,
      }));
    }
  }, [asset.assetType, asset.assetTitle]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setAsset((prev) => ({ ...prev, [name]: value }));
  };

  const handleMaintenanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAsset((prev) => {
      const updated = { ...prev, [name]: value };

      const start = updated.maintenanceStartdt;
      const end = updated.maintenanceEnddt;

      if (start && end) {
        // Both dates are present → set status to Maintenance
        updated.assetStatus = "Maintenance";
      } else if (
        prev.maintenanceStartdt &&
        prev.maintenanceEnddt &&
        (!start || !end)
      ) {
        // Previously both dates were set, now one was removed →
        // enforce both-or-none: clear both dates and reset status
        updated.maintenanceStartdt = "";
        updated.maintenanceEnddt = "";
        updated.assetStatus = "Operational";
      } else if (!start && !end && updated.assetStatus === "Maintenance") {
        // Both dates empty but status is still Maintenance → reset status
        updated.assetStatus = "Operational";
      }

      return updated;
    });
  };

  const handleStatusChange = (status: string) => {
    setAsset((prev) => ({ ...prev, assetStatus: status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!asset.assetTitle.trim()) {
      setError("Asset name is required");
      return;
    }

    if (!asset.assetType) {
      setError("Asset type is required");
      return;
    }

    if (!asset.assetCode.trim()) {
      setError("Asset code is required");
      return;
    }

    // Enforce both-or-none for maintenance dates
    const hasMaintenanceStart = !!asset.maintenanceStartdt;
    const hasMaintenanceEnd = !!asset.maintenanceEnddt;
    if (hasMaintenanceStart !== hasMaintenanceEnd) {
      setError(
        "Both maintenance start and end dates must be provided, or neither",
      );
      return;
    }

    if (
      asset.maintenanceStartdt &&
      asset.maintenanceEnddt &&
      asset.maintenanceEnddt < asset.maintenanceStartdt
    ) {
      setError("Maintenance end date must be on or after the start date");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Creating new asset...");

      // Build create request matching backend AssetCreate schema
      const createRequest: AssetCreateRequest = {
        asset_code: asset.assetCode.trim(),
        name: asset.assetTitle.trim(),
        asset_type: asset.assetType,
        description: asset.usageInstructions.trim() || undefined,
        status: mapFrontendStatusToBackend(asset.assetStatus),
        project_id: asset.assetProject || undefined,
        location: asset.assetLocation.trim() || undefined,
        poc: asset.assetPoc.trim() || undefined,
        usage_instructions: asset.usageInstructions.trim() || undefined,
      };

      // Add maintenance dates if provided
      if (asset.maintenanceStartdt) {
        createRequest.maintenance_start_date = asset.maintenanceStartdt;
      }
      if (asset.maintenanceEnddt) {
        createRequest.maintenance_end_date = asset.maintenanceEnddt;
      }

      console.log("Create request:", createRequest);

      // Use new backend endpoint
      const response = await api.post("/assets/", createRequest);

      console.log("Asset created successfully:", response.data);

      // Call onSave callback
      onSave();
      onClose(false);

      // Reset form
      setAsset({
        assetTitle: "",
        assetCode: "",
        assetType: "",
        assetLocation: "",
        maintenanceStartdt: "",
        maintenanceEnddt: "",
        assetPoc: "",
        assetStatus: "Operational",
        usageInstructions: "",
        assetProject: project,
      });
    } catch (error: unknown) {
      console.error("Error creating asset:", error);
      setError(getApiErrorMessage(error, "Failed to create asset"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Asset types (you might want to fetch these from backend or config)
  const assetTypes = [
    "Equipment",
    "Vehicle",
    "Tool",
    "Machinery",
    "Loading Zone",
    "Storage Area",
    "Crane",
    "Excavator",
    "Generator",
    "Scaffolding",
    "Other",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Asset Name */}
            <div className="space-y-2">
              <Label htmlFor="assetTitle">
                Asset Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="assetTitle"
                name="assetTitle"
                value={asset.assetTitle}
                onChange={handleChange}
                placeholder="ex. Loading Zone 1, Crane 2"
                required
              />
            </div>

            {/* Asset Type */}
            <div className="space-y-2">
              <Label htmlFor="assetType">
                Asset Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={asset.assetType}
                onValueChange={(value) =>
                  setAsset((prev) => ({ ...prev, assetType: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Asset Code */}
            <div className="space-y-2">
              <Label htmlFor="assetCode">
                Asset Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="assetCode"
                name="assetCode"
                value={asset.assetCode}
                onChange={handleChange}
                placeholder="AUTO-GEN-001"
                required
              />
              <span className="text-xs text-gray-500">
                Auto-generated, but you can modify it
              </span>
            </div>

            {/* Asset Location */}
            <div className="space-y-2">
              <Label htmlFor="assetLocation">Asset Location</Label>
              <Input
                id="assetLocation"
                name="assetLocation"
                value={asset.assetLocation}
                onChange={handleChange}
                placeholder="eg. Zone 1, Loading Zone 2"
              />
            </div>

            {/* Maintenance Dates */}
            <div className="space-y-2">
              <Label>Maintenance Dates (Optional)</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex-1">
                  <Input
                    type="date"
                    name="maintenanceStartdt"
                    value={asset.maintenanceStartdt}
                    onChange={handleMaintenanceChange}
                    placeholder="Start date"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="date"
                    name="maintenanceEnddt"
                    value={asset.maintenanceEnddt}
                    onChange={handleMaintenanceChange}
                    placeholder="End date"
                  />
                </div>
              </div>
              <span className="text-xs text-gray-500">
                Select scheduled maintenance start and end date
              </span>
            </div>

            {/* Asset Status */}
            <div className="space-y-2">
              <Label>
                Asset Status <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className={cn(
                    "px-4 py-2 rounded-md transition text-sm",
                    asset.assetStatus === "Operational"
                      ? "bg-green-100 text-green-800 font-medium border-2 border-green-500"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent",
                  )}
                  onClick={() => handleStatusChange("Operational")}
                >
                  Operational
                </button>
                <button
                  type="button"
                  className={cn(
                    "px-4 py-2 rounded-md transition text-sm",
                    asset.assetStatus === "Maintenance"
                      ? "bg-yellow-100 text-yellow-800 font-medium border-2 border-yellow-500"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent",
                  )}
                  onClick={() => handleStatusChange("Maintenance")}
                >
                  Maintenance
                </button>
                <button
                  type="button"
                  className={cn(
                    "px-4 py-2 rounded-md transition text-sm",
                    asset.assetStatus === "Out of Service"
                      ? "bg-red-100 text-red-800 font-medium border-2 border-red-500"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent",
                  )}
                  onClick={() => handleStatusChange("Out of Service")}
                >
                  Out of Service
                </button>
              </div>
            </div>

            {/* Operator Information */}
            <div className="space-y-2">
              <Label htmlFor="assetPoc">Operator/Contact Person</Label>
              <Input
                id="assetPoc"
                name="assetPoc"
                value={asset.assetPoc}
                onChange={handleChange}
                placeholder="Enter operator or contact person name"
              />
            </div>

            {/* Usage Instructions */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="usageInstructions">
                Asset Description & Instructions
              </Label>
              <Textarea
                id="usageInstructions"
                name="usageInstructions"
                value={asset.usageInstructions}
                onChange={handleChange}
                placeholder="Enter asset description, usage instructions, safety notes, etc."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Button
              type="button"
              className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300 sm:w-auto"
              onClick={() => onClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800 sm:w-auto"
              disabled={isSubmitting}
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
                "Save Asset"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssetModal;
