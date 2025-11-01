"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Plus, PencilIcon, TrashIcon } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import CreateAssetForm from "@/components/forms/CreateAssetForm";
import UpdateAssetModal from "@/components/forms/UpdateAssetForm";
import { format } from "date-fns";

// ===== TYPE DEFINITIONS =====
interface AssetFromBackend {
  id: string;
  asset_code: string;
  name: string;
  asset_type: string;
  description?: string;
  status: "available" | "in_use" | "maintenance" | "retired";
  project_id?: string;
  created_at: string;
  updated_at: string;
  // Additional fields from detail endpoint
  location?: string;
  poc?: string;
  usage_instructions?: string;
  maintenance_start_date?: string;
  maintenance_end_date?: string;
}

interface AssetListResponse {
  assets: AssetFromBackend[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

interface Asset {
  assetKey: string;
  assetTitle: string;
  assetLocation: string;
  assetType: string;
  assetStatus: string;
  assetPoc: string;
  assetProject: string;
  maintanenceStartdt: string;
  maintanenceEnddt: string;
  usageInstructions: string;
  assetCode: string;
  // Keep original data
  _originalData?: AssetFromBackend;
}

interface Project {
  id: string;
  text: string;
}

// ===== HELPER FUNCTIONS =====
const transformBackendAsset = (backendAsset: AssetFromBackend): Asset => {
  return {
    assetKey: backendAsset.id,
    assetTitle: backendAsset.name,
    assetLocation: backendAsset.location || backendAsset.description || "",
    assetType: backendAsset.asset_type,
    assetStatus: capitalizeStatus(backendAsset.status),
    assetPoc: backendAsset.poc || "Not specified",
    assetProject: backendAsset.project_id || "",
    maintanenceStartdt: backendAsset.maintenance_start_date || "",
    maintanenceEnddt: backendAsset.maintenance_end_date || "",
    usageInstructions: backendAsset.usage_instructions || backendAsset.description || "",
    assetCode: backendAsset.asset_code,
    _originalData: backendAsset,
  };
};

const capitalizeStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    available: "Operational",
    in_use: "In Use",
    maintenance: "Maintenance",
    retired: "Retired",
  };
  return statusMap[status] || status;
};

const formatStatusForDisplay = (status: string): {
  label: string;
  className: string;
} => {
  const statusConfig: Record<
    string,
    { label: string; className: string }
  > = {
    available: {
      label: "Operational",
      className: "bg-green-100 text-green-800",
    },
    in_use: {
      label: "In Use",
      className: "bg-blue-100 text-blue-800",
    },
    maintenance: {
      label: "Maintenance",
      className: "bg-yellow-100 text-yellow-800",
    },
    retired: {
      label: "Retired",
      className: "bg-red-100 text-red-800",
    },
    Operational: {
      label: "Operational",
      className: "bg-green-100 text-green-800",
    },
    "In Use": {
      label: "In Use",
      className: "bg-blue-100 text-blue-800",
    },
    Maintenance: {
      label: "Maintenance",
      className: "bg-yellow-100 text-yellow-800",
    },
    Retired: {
      label: "Retired",
      className: "bg-red-100 text-red-800",
    },
  };

  return (
    statusConfig[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    }
  );
};

export default function AssetsTable() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [project, setProject] = useState<Project>();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [selectedAssetForUpdate, setSelectedAssetForUpdate] =
    useState<Asset | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [totalAssets, setTotalAssets] = useState(0);
  const itemsPerPage = 10;
  const hasFetched = useRef(false);
  const { user } = useAuth();
  const userId = user?.id;
  const initialLoadComplete = useRef(false);

  // Load project from localStorage
  useEffect(() => {
    const projectString = localStorage.getItem(`project_${userId}`);
    if (!projectString) {
      console.log("No project found in localStorage");
      return;
    }

    try {
      const parsedProject = JSON.parse(projectString);
      setProject(parsedProject);
    } catch (error) {
      console.log("Error parsing project:", error);
    }
  }, [userId]);

  // Fetch assets from new backend API
  const fetchAssets = async (forceRefresh = false) => {
    try {
      if (!user || (initialLoadComplete.current && !forceRefresh)) {
        return;
      }

      if (!project) {
        console.log("No project selected");
        return;
      }

      console.log("Fetching assets from new backend...");
      setLoading(true);

      // Use new backend endpoint
      const response = await api.get<AssetListResponse>("/assets/", {
        params: {
          project_id: project.id,
          skip: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage,
        },
      });

      const assetsData = response.data?.assets || [];
      const total = response.data?.total || 0;

      console.log("Assets fetched:", assetsData.length);

      // Transform backend data to frontend format
      const transformedAssets = assetsData.map(transformBackendAsset);
      
      setAssets(transformedAssets);
      setTotalAssets(total);

      // Cache the data
      localStorage.setItem(
        `assets_${userId}`,
        JSON.stringify(transformedAssets)
      );

      initialLoadComplete.current = true;
    } catch (error: any) {
      console.error("Error fetching assets:", error);
      
      // Try to use cached data on error
      const cachedAssets = localStorage.getItem(`assets_${userId}`);
      if (cachedAssets) {
        try {
          const parsedAssets = JSON.parse(cachedAssets);
          setAssets(parsedAssets);
        } catch (e) {
          console.error("Error parsing cached assets:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load and cache check
  useEffect(() => {
    if (!user || hasFetched.current || !project) return;

    const storageKey = `assets_${userId}`;
    const cachedAssets = localStorage.getItem(storageKey);

    // Load cached data first for instant display
    if (cachedAssets) {
      try {
        const parsedAssets = JSON.parse(cachedAssets);
        if (Array.isArray(parsedAssets)) {
          setAssets(parsedAssets);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error parsing cached assets:", error);
        localStorage.removeItem(storageKey);
      }
    }

    // Fetch fresh data
    fetchAssets();
    hasFetched.current = true;
  }, [user, project]);

  // Refetch when page changes
  useEffect(() => {
    if (initialLoadComplete.current && project) {
      fetchAssets(true);
    }
  }, [currentPage]);

  // Calculate pagination
  const totalPages = Math.ceil(totalAssets / itemsPerPage);

  // Handle page changes
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle asset click
  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setSidebarOpen(true);
  };

  // Close sidebar
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleOnClickButton = () => {
    setIsAssetFormOpen(true);
  };

  const handleSaveAssets = () => {
    setIsAssetFormOpen(false);
    setCurrentPage(1);
    fetchAssets(true);
  };

  // Delete asset using new backend
  const handleDeleteAsset = async (assetKey: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) {
      return;
    }

    try {
      console.log("Deleting asset:", assetKey);
      
      // Use new backend endpoint
      await api.delete(`/assets/${assetKey}`);
      
      console.log("Asset deleted successfully");
      
      // Close sidebar if the deleted asset was selected
      if (selectedAsset?.assetKey === assetKey) {
        closeSidebar();
      }
      
      // Refresh the list
      fetchAssets(true);
    } catch (error: any) {
      console.error("Error deleting asset:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to delete asset";
      alert(errorMessage);
    }
  };

  // Update the assets list with the updated asset
  const handleUpdateAsset = (updatedAsset: Asset) => {
    setAssets((prevAssets) =>
      prevAssets.map((a) =>
        a.assetKey === updatedAsset.assetKey ? updatedAsset : a
      )
    );
    
    // Update selected asset if it's the one being updated
    if (selectedAsset?.assetKey === updatedAsset.assetKey) {
      setSelectedAsset(updatedAsset);
    }
    
    fetchAssets(true);
  };

  // Check if an asset is selected
  const isSelected = (assetKey: string) => {
    return sidebarOpen && selectedAsset?.assetKey === assetKey;
  };

  return (
    <Card className="px-6 sm:my-8 mx-4 bg-stone-100">
      <div className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
              Assets
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Find all asset related information here
              {totalAssets > 0 && ` (${totalAssets} total)`}
            </p>
          </div>

          {/* Desktop button */}
          <Button
            onClick={handleOnClickButton}
            className="hidden sm:flex mt-4 sm:mt-0 cursor-pointer"
          >
            Create new asset
          </Button>

          {/* Mobile button - icon only */}
          <Button
            onClick={handleOnClickButton}
            className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-10"
            size="icon"
          >
            <Plus size={24} />
          </Button>
        </div>

        {isAssetFormOpen && (
          <CreateAssetForm
            isOpen={isAssetFormOpen}
            onClose={() => setIsAssetFormOpen(false)}
            onSave={handleSaveAssets}
          />
        )}

        {/* Mobile-only hint */}
        <div className="sm:hidden text-xs text-gray-500 font-medium px-2 mb-2">
          Tap on an asset to view details
        </div>

        <div className="flex-grow overflow-x-auto rounded-lg">
          <div className="min-w-full w-full">
            {/* Header - Hidden on mobile */}
            <div className="hidden sm:grid sticky top-0 text-gray-700 uppercase text-sm grid-cols-6 px-2 border-b last:border-b-0">
              <div className="px-6 py-4 text-left">Title</div>
              <div className="px-6 py-4 text-left">Type</div>
              <div className="px-6 py-4 text-left">Status</div>
              <div className="px-6 py-4 text-left">Contact Person</div>
              <div className="px-6 py-4 text-left">Code</div>
              <div className="px-6 py-4 text-center">Actions</div>
            </div>

            {/* Card Rows */}
            <div>
              {loading ? (
                // Skeleton loaders
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index}>
                    <Card className="w-full p-0 px-2 my-2 bg-stone-50">
                      {/* Desktop skeleton */}
                      <div className="hidden sm:grid grid-cols-6 w-full py-6 animate-pulse">
                        <div className="px-6">
                          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="px-6">
                          <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="px-6">
                          <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                        </div>
                        <div className="px-6">
                          <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                        </div>
                        <div className="px-6">
                          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="px-6 text-center">
                          <div className="h-6 w-6 bg-gray-200 rounded-full mx-auto"></div>
                        </div>
                      </div>

                      {/* Mobile skeleton */}
                      <div className="sm:hidden p-4 animate-pulse">
                        <div className="flex justify-between items-center mb-2">
                          <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mt-2"></div>
                        <div className="h-5 bg-gray-200 rounded-full w-20 mt-2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                      </div>
                    </Card>
                  </div>
                ))
              ) : assets.length > 0 ? (
                assets.map((asset) => {
                  const statusDisplay = formatStatusForDisplay(asset.assetStatus);
                  
                  return (
                    <div
                      key={asset.assetKey}
                      onClick={() => handleAssetClick(asset)}
                    >
                      <Card
                        className={`w-full p-0 cursor-pointer px-2 my-2 transition-colors duration-200 
                        ${
                          isSelected(asset.assetKey)
                            ? "bg-orange-400 hover:bg-orange-100"
                            : "bg-stone-50 hover:bg-orange-100"
                        }`}
                      >
                        {/* Desktop view */}
                        <div className="hidden sm:grid grid-cols-6 w-full py-6">
                          <div className="px-6 font-medium">{asset.assetTitle}</div>
                          <div className="px-6 text-gray-600">{asset.assetType}</div>
                          <div className="px-6">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${statusDisplay.className}`}
                            >
                              {statusDisplay.label}
                            </span>
                          </div>
                          <div className="px-6">{asset.assetPoc}</div>
                          <div className="px-6 text-sm text-gray-600 font-mono">
                            {asset.assetCode}
                          </div>
                          <div
                            className="px-6 py-0 -my-1 text-center flex items-center justify-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              className="bg-transparent text-gray-700 hover:bg-amber-100 rounded-full shadow-md hover:cursor-pointer h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAssetForUpdate(asset);
                                setIsUpdateModalOpen(true);
                              }}
                              title="Edit asset"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              className="bg-transparent text-red-500 hover:bg-red-100 rounded-full shadow-md hover:cursor-pointer h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAsset(asset.assetKey);
                              }}
                              title="Delete asset"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Mobile view */}
                        <div className="sm:hidden p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">{asset.assetTitle}</div>
                            <div
                              className="flex gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                className="bg-transparent text-gray-700 hover:bg-amber-100 rounded-full shadow-md hover:cursor-pointer h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAssetForUpdate(asset);
                                  setIsUpdateModalOpen(true);
                                }}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                className="bg-transparent text-red-500 hover:bg-red-100 rounded-full shadow-md hover:cursor-pointer h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAsset(asset.assetKey);
                                }}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            {asset.assetType}
                          </div>
                          <div className="mt-1 mb-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${statusDisplay.className}`}
                            >
                              {statusDisplay.label}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {asset.assetPoc}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-1">
                            {asset.assetCode}
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-lg mb-2">No assets found</p>
                  <p className="text-sm">
                    Create your first asset to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination - only show if there are assets */}
        {totalAssets > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center mt-4 space-x-1 sm:space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-2 sm:px-3 py-1 rounded text-sm ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-orange-200 text-gray-700 hover:bg-orange-300"
              }`}
            >
              Prev
            </button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 7) {
                pageNumber = i + 1;
              } else if (currentPage <= 4) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNumber = totalPages - 6 + i;
              } else {
                pageNumber = currentPage - 3 + i;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-2 sm:px-3 py-1 rounded text-sm ${
                    currentPage === pageNumber
                      ? "bg-orange-400 text-white"
                      : "bg-orange-200 text-gray-700 hover:bg-orange-300"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-2 sm:px-3 py-1 rounded text-sm ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-orange-200 text-gray-700 hover:bg-orange-300"
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* Page info */}
        {totalAssets > 0 && (
          <div className="text-center mt-2 text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalAssets)} of {totalAssets}{" "}
            assets
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-1/3 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedAsset && (
          <div className="h-full flex flex-col p-6 py-16 px-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Asset Details
              </h2>
              <Button
                onClick={closeSidebar}
                className="p-1 rounded-full hover:bg-gray-100"
                variant="ghost"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex-grow overflow-y-auto">
              <div className="space-y-6">
                {/* Asset Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3">
                    Asset Information
                  </h3>
                  <Card className="p-4 bg-amber-50">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Title</p>
                        <p className="font-medium">{selectedAsset.assetTitle}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Asset Code</p>
                        <p className="font-medium font-mono">
                          {selectedAsset.assetCode}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-medium">{selectedAsset.assetType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">
                          {selectedAsset.assetLocation || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <div className="flex items-center mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              formatStatusForDisplay(selectedAsset.assetStatus)
                                .className
                            }`}
                          >
                            {
                              formatStatusForDisplay(selectedAsset.assetStatus)
                                .label
                            }
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact Person</p>
                        <p className="font-medium">{selectedAsset.assetPoc}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Additional Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3">
                    Additional Details
                  </h3>
                  <Card className="p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Project</p>
                        <p className="font-medium">
                          {project?.text || "Not assigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Usage Instructions
                        </p>
                        <p className="font-medium">
                          {selectedAsset.usageInstructions ||
                            "No instructions available"}
                        </p>
                      </div>
                      {selectedAsset.maintanenceStartdt &&
                        selectedAsset.maintanenceEnddt && (
                          <div>
                            <p className="text-sm text-gray-500">
                              Maintenance Dates
                            </p>
                            <p className="font-medium">
                              {format(
                                new Date(selectedAsset.maintanenceStartdt),
                                "dd-MMM-yyyy"
                              )}{" "}
                              to{" "}
                              {format(
                                new Date(selectedAsset.maintanenceEnddt),
                                "dd-MMM-yyyy"
                              )}
                            </p>
                          </div>
                        )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
                onClick={() => {
                  setSelectedAssetForUpdate(selectedAsset);
                  setIsUpdateModalOpen(true);
                }}
              >
                Edit Details
              </Button>
              <Button
                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                onClick={closeSidebar}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 sm:block hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Update Modal */}
      {selectedAssetForUpdate && (
        <UpdateAssetModal
          isOpen={isUpdateModalOpen}
          onClose={() => {
            setIsUpdateModalOpen(false);
            setSelectedAssetForUpdate(null);
          }}
          onSave={handleUpdateAsset}
          assetData={selectedAssetForUpdate}
        />
      )}
    </Card>
  );
}