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
import { ApiAsset, TransformedAsset, getApiErrorMessage } from "@/types";

// ===== TYPE DEFINITIONS (Matching AssetsTable.tsx exactly) =====
interface Project {
  id: string;
  text: string;
}

interface AssetModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onSave: (asset: Asset) => void | Promise<void>;
  assetData: Asset;
}

type Asset = TransformedAsset;

interface AssetUpdateRequest {
  name?: string;
  asset_type?: string;
  description?: string;
  status?: "available" | "maintenance" | "retired";
  project_id?: string;
  location?: string;
  poc?: string;
  usage_instructions?: string;
  maintenance_start_date?: string | null;
  maintenance_end_date?: string | null;
  pending_booking_capacity?: number;
}

// ===== HELPER FUNCTIONS =====
const mapFrontendStatusToBackend = (
  status: string,
): "available" | "maintenance" | "retired" => {
  const statusMap: Record<string, "available" | "maintenance" | "retired"> = {
    Operational: "available",
    Maintenance: "maintenance",
    "Out of Service": "retired",
    Retired: "retired",
    available: "available",
    maintenance: "maintenance",
    retired: "retired",
  };
  return statusMap[status] || "available";
};

const mapBackendStatusToFrontend = (status: string): string => {
  const statusMap: Record<string, string> = {
    available: "Operational",
    maintenance: "Maintenance",
    retired: "Out of Service",
  };
  return statusMap[status] || status;
};

const UpdateAssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  assetData,
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const userId = user?.id;

  //  Initialize with all required fields (assetProject is a string)
  const [asset, setAsset] = useState<Asset>({
    assetKey: "",
    assetTitle: "",
    assetDescription: "",
    assetLocation: "",
    assetType: "",
    maintenanceStartdt: "",
    maintenanceEnddt: "",
    assetPoc: "",
    assetStatus: "Operational",
    assetLastUpdated: "",
    usageInstructions: "",
    assetProject: "", //  Just a string
    assetCode: "",
  });

  // Asset types
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

  // Load asset data when modal opens or assetData changes
  useEffect(() => {
    if (assetData) {
      console.log("Loading asset data:", assetData);
      setAsset({
        ...assetData,
        pendingBookingCapacity:
          assetData.pendingBookingCapacity ??
          assetData._originalData?.pending_booking_capacity ??
          5,
      });
    }
  }, [assetData]);

  // Load project from localStorage
  useEffect(() => {
    const projectString = localStorage.getItem(`project_${userId}`);
    if (!projectString) {
      console.error("No project found in localStorage");
      return;
    }

    try {
      const parsedProject = JSON.parse(projectString);
      setProject(parsedProject);

      // Update assetProject if not already set
      if (!asset.assetProject && parsedProject) {
        setAsset((prev) => ({
          ...prev,
          assetProject: parsedProject.id, //  Just the ID string
        }));
      }
    } catch (error) {
      console.error("Error parsing project:", error);
    }
  }, [userId]);

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

      const start = updated.maintenanceStartdt?.split("T")[0] || "";
      const end = updated.maintenanceEnddt?.split("T")[0] || "";

      if (start && end) {
        // Both dates are present → set status to Maintenance
        updated.assetStatus = "Maintenance";
      } else if (
        prev.maintenanceStartdt?.split("T")[0] &&
        prev.maintenanceEnddt?.split("T")[0] &&
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
    setAsset((prev) => {
      const updates: Partial<Asset> = { assetStatus: status };
      // Operational = explicitly available, clear any scheduled maintenance
      // Out of Service = retired, backend rejects maintenance dates on retired assets
      if (status === "Operational" || status === "Out of Service") {
        updates.maintenanceStartdt = "";
        updates.maintenanceEnddt = "";
      }
      return { ...prev, ...updates };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!asset.assetKey) {
      setError("Asset ID is missing");
      return;
    }

    if (
      asset.maintenanceStartdt &&
      asset.maintenanceEnddt &&
      asset.maintenanceEnddt.split("T")[0] <
        asset.maintenanceStartdt.split("T")[0]
    ) {
      setError("Maintenance end date must be on or after the start date");
      return;
    }

    try {
      setIsSubmitting(true);

      // Enforce both-or-none for maintenance dates before sending the request
      const startDateVal = asset.maintenanceStartdt?.split("T")[0] || "";
      const endDateVal = asset.maintenanceEnddt?.split("T")[0] || "";
      const hasStart = !!startDateVal;
      const hasEnd = !!endDateVal;

      let effectiveStatus = asset.assetStatus;
      let effectiveMaintenanceStart = asset.maintenanceStartdt;
      let effectiveMaintenanceEnd = asset.maintenanceEnddt;
      const pendingBookingCapacity = Math.min(
        20,
        Math.max(1, Number(asset.pendingBookingCapacity ?? 5)),
      );

      if (hasStart && hasEnd) {
        // Both present → keep / set Maintenance status
        effectiveStatus = "Maintenance";
      } else if (hasStart !== hasEnd) {
        // Exactly one date is present (partial) → clear both and reset status
        effectiveMaintenanceStart = "";
        effectiveMaintenanceEnd = "";
        if (effectiveStatus === "Maintenance") {
          effectiveStatus = "Operational";
        }
      }

      //  assetProject is already a string, no need to check type
      const projectId = asset.assetProject;

      // Build update request
      const updateRequest: AssetUpdateRequest = {
        name: asset.assetTitle,
        asset_type: asset.assetType,
        description: asset.usageInstructions,
        status: mapFrontendStatusToBackend(effectiveStatus),
        project_id: projectId,
        location: asset.assetLocation,
        poc: asset.assetPoc,
        usage_instructions: asset.usageInstructions,
        pending_booking_capacity: pendingBookingCapacity,
      };

      // Always send maintenance dates — null explicitly clears them on the
      // backend so stale windows don't linger after the user removes them.
      updateRequest.maintenance_start_date = effectiveMaintenanceStart
        ? effectiveMaintenanceStart.split("T")[0]
        : null;
      updateRequest.maintenance_end_date = effectiveMaintenanceEnd
        ? effectiveMaintenanceEnd.split("T")[0]
        : null;

      console.log("Updating asset:", asset.assetKey, updateRequest);

      // Use new backend endpoint
      const response = await api.put<ApiAsset>(
        `/assets/${asset.assetKey}`,
        updateRequest,
      );

      console.log("Asset updated successfully:", response.data);

      //  Transform response - assetProject is always a string
      const responseAssetType =
        response.data.type ||
        (response.data as { asset_type?: string }).asset_type ||
        "";
      const descriptionText =
        response.data.description ||
        response.data.usage_instructions ||
        "No description provided";

      const updatedAsset: Asset = {
        assetKey: response.data.id,
        assetTitle: response.data.name,
        assetDescription: descriptionText,
        assetLocation: response.data.location || "",
        assetType: responseAssetType,
        maintenanceStartdt: response.data.maintenance_start_date || "",
        maintenanceEnddt: response.data.maintenance_end_date || "",
        assetPoc: response.data.poc || "",
        assetStatus: mapBackendStatusToFrontend(response.data.status),
        assetLastUpdated: response.data.updated_at || "",
        usageInstructions:
          response.data.usage_instructions || response.data.description || "",
        assetProject: response.data.project_id || projectId, //  Always a string
        assetCode: response.data.asset_code,
        pendingBookingCapacity:
          response.data.pending_booking_capacity ?? pendingBookingCapacity,
        _originalData: response.data,
      };

      // Call onSave with properly formatted data
      onSave(updatedAsset);

      // Close modal
      onClose(false);
    } catch (error: unknown) {
      console.error("Error updating asset:", error);
      setError(getApiErrorMessage(error, "Failed to update asset"));
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Update Asset
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Modify asset details for the construction site
          </p>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
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

            {/* Asset Code (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="assetCode">Asset Code</Label>
              <Input
                id="assetCode"
                name="assetCode"
                value={asset.assetCode}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <span className="text-xs text-gray-500">
                Asset code cannot be changed
              </span>
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
              <Label>Maintenance Dates</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex-1">
                  <Input
                    type="date"
                    name="maintenanceStartdt"
                    value={
                      asset.maintenanceStartdt
                        ? asset.maintenanceStartdt.split("T")[0]
                        : ""
                    }
                    onChange={handleMaintenanceChange}
                    placeholder="Start date"
                    disabled={
                      asset.assetStatus === "Out of Service" ||
                      asset.assetStatus === "Retired"
                    }
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="date"
                    name="maintenanceEnddt"
                    value={
                      asset.maintenanceEnddt
                        ? asset.maintenanceEnddt.split("T")[0]
                        : ""
                    }
                    onChange={handleMaintenanceChange}
                    placeholder="End date"
                    disabled={
                      asset.assetStatus === "Out of Service" ||
                      asset.assetStatus === "Retired"
                    }
                  />
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {asset.assetStatus === "Out of Service" ||
                asset.assetStatus === "Retired"
                  ? "Maintenance dates are not applicable for out-of-service assets"
                  : "Select scheduled maintenance start and end date"}
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
                    asset.assetStatus === "Out of Service" ||
                      asset.assetStatus === "Retired"
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
                placeholder="Enter operator or contact person"
              />
            </div>

            {/* Pending Booking Capacity */}
            <div className="space-y-2">
              <Label htmlFor="pendingBookingCapacity">
                Pending Request Capacity
              </Label>
              <Input
                id="pendingBookingCapacity"
                name="pendingBookingCapacity"
                type="number"
                min={1}
                max={20}
                value={asset.pendingBookingCapacity ?? 5}
                onChange={(e) => {
                  const rawValue = Number(e.target.value);
                  const safeValue = Number.isNaN(rawValue)
                    ? 5
                    : Math.min(20, Math.max(1, rawValue));
                  setAsset((prev) => ({
                    ...prev,
                    pendingBookingCapacity: safeValue,
                  }));
                }}
              />
              <span className="text-xs text-gray-500">
                Maximum pending requests allowed per slot (1-20)
              </span>
            </div>

            {/* Usage Instructions */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="usageInstructions">
                Asset Description & Instructions
              </Label>
              <Textarea
                id="usageInstructions"
                name="usageInstructions"
                value={asset.usageInstructions || ""}
                onChange={handleChange}
                placeholder="Enter asset description, usage instructions, safety notes, etc."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
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
                "Update Asset"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateAssetModal;
