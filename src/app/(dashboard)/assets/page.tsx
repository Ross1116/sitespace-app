"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import api from "@/lib/api";

interface Asset {
  assetKey: string;
  assetTitle: string;
  assetLocation: string;
  assetStatus: string;
  assetPoc: string;
  assetProject: string;
  // Additional fields that might be in your API response
  assetDescription?: string;
  assetValue?: number;
  assetPurchaseDate?: string;
}

interface Project {
  projectKey: string;
  projectTitle: string;
}

export default function AssetsTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  // const [selectedProject, setSelectedProject] = useState("ALL");
  const selectedProject = "ALL";
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const itemsPerPage = 10;

  // Fetch assets from API
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const assetProject = "P001";

        const response = await api.get("api/auth/Asset/getAssetList", {
          params: {
            assetProject,
          },
        });

        // Extract assets from response
        const assetsData = response.data?.assetlist || [];
        setAssets(assetsData);
      } catch (error) {
        console.error("Error fetching assets:", error);
        setError("Failed to load assets. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  // Project data for the dropdown - extracted from asset data
  const projectSet = new Set(assets.map((asset) => asset.assetProject));
  const projects: Project[] = [
    { projectKey: "ALL", projectTitle: "All Projects" },
    ...Array.from(projectSet).map((projectKey) => {
      // This would normally come from your projects data
      const projectTitles: Record<string, string> = {
        PRJ001: "High-Rise Office Building",
        PRJ002: "Residential Complex",
        PRJ003: "Shopping Mall",
        PRJ004: "Hospital Wing",
        PRJ005: "School Campus",
      };
      return {
        projectKey,
        projectTitle: projectTitles[projectKey as string] || projectKey,
      };
    }),
  ];

  // Filter assets by selected project
  const filteredAssets =
    selectedProject === "ALL"
      ? assets
      : assets.filter((asset) => asset.assetProject === selectedProject);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAssets = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  // // Handle project selection change
  // const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   setSelectedProject(e.target.value);
  //   setCurrentPage(1); // Reset to first page when changing projects
  // };

  // Handle page changes
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
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

  // Check if an asset is selected
  const isSelected = (assetKey: string) => {
    return sidebarOpen && selectedAsset?.assetKey === assetKey;
  };

  if (error) {
    return (
      <div className="flex flex-col h-screen w-full p-4 pt-8 items-center justify-center">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="px-6 sm:my-8 mx-4 bg-stone-100">
      <div className="p-3 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
          Assets
        </h1>

        {/* <div className="flex items-center mb-6">
          <label htmlFor="projectSelect" className="mr-2 text-gray-700">
            Project:
          </label>
          <select
            id="projectSelect"
            value={selectedProject}
            onChange={handleProjectChange}
            className="bg-white border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
          >
            {projects.map((project) => (
              <option key={project.projectKey} value={project.projectKey}>
                {project.projectTitle}
              </option>
            ))}
          </select>
        </div> */}

        {/* Mobile-only column headers */}
        <div className="sm:hidden text-xs text-gray-500 font-medium px-2 mb-2">
          Tap on an asset to view details
        </div>

        <div className="flex-grow overflow-x-auto rounded-lg">
          <div className="min-w-full w-full">
            {/* Header - Hidden on mobile */}
            <div className="hidden sm:grid sticky top-0 text-gray-700 uppercase text-sm grid-cols-6 px-2 border-b last:border-b-0">
              <div className="px-6 py-4 text-left">Title</div>
              <div className="px-6 py-4 text-left">Location</div>
              <div className="px-6 py-4 text-left">Status</div>
              <div className="px-6 py-4 text-left">Contact Person</div>
              <div className="px-6 py-4 text-left">Project</div>
              <div className="px-6 py-4 text-center">Edit</div>
            </div>

            {/* Card Rows */}
            <div>
              {loading ? (
                // Skeleton loaders for assets
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
              ) : currentAssets.length > 0 ? (
                currentAssets.map((asset) => (
                  <div
                    key={asset.assetKey}
                    onClick={() => handleAssetClick(asset)}
                  >
                    <Card
                      className={`w-full p-0 cursor-pointer px-2 my-2 transition-colors duration-200 
            ${
              isSelected(asset.assetKey)
                ? "bg-orange-200 hover:bg-orange-300"
                : "hover:bg-orange-100"
            }`}
                    >
                      {/* Desktop view */}
                      <div className="hidden sm:grid grid-cols-6 w-full py-6">
                        <div className="px-6">{asset.assetTitle}</div>
                        <div className="px-6">{asset.assetLocation}</div>
                        <div className="px-6">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold 
                  ${
                    asset.assetStatus === "Active"
                      ? "bg-green-100 text-green-800"
                      : asset.assetStatus === "Maintenance"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                          >
                            {asset.assetStatus}
                          </span>
                        </div>
                        <div className="px-6">{asset.assetPoc}</div>
                        <div className="px-6">
                          {projects.find(
                            (p) => p.projectKey === asset.assetProject
                          )?.projectTitle || asset.assetProject}
                        </div>
                        <div
                          className="px-6 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button className="bg-transparent text-gray-700 hover:bg-amber-100 rounded-full shadow-md hover:cursor-pointer h-0">
                            ...
                          </Button>
                        </div>
                      </div>

                      {/* Mobile view */}
                      <div className="sm:hidden p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">{asset.assetTitle}</div>
                          <Button
                            className="bg-transparent text-gray-700 hover:bg-amber-100 rounded-full shadow-md hover:cursor-pointer h-6 w-6 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            ...
                          </Button>
                        </div>
                        <div className="text-sm text-gray-500">
                          {asset.assetLocation}
                        </div>
                        <div className="mt-1 mb-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold 
                  ${
                    asset.assetStatus === "Active"
                      ? "bg-green-100 text-green-800"
                      : asset.assetStatus === "Maintenance"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                          >
                            {asset.assetStatus}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          {asset.assetPoc}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No assets found for this project.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination - only show if there are assets */}
        {filteredAssets.length > 0 && (
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

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-2 sm:px-3 py-1 rounded text-sm ${
                  currentPage === page
                    ? "bg-orange-400 text-white"
                    : "bg-orange-200 text-gray-700 hover:bg-orange-300"
                }`}
              >
                {page}
              </button>
            ))}

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
                        <p className="font-medium">
                          {selectedAsset.assetTitle}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">
                          {selectedAsset.assetLocation}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <div className="flex items-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold 
                              ${
                                selectedAsset.assetStatus === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : selectedAsset.assetStatus === "Maintenance"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                          >
                            {selectedAsset.assetStatus}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact Person</p>
                        <p className="font-medium">{selectedAsset.assetPoc}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Project</p>
                        <p className="font-medium">
                          {projects.find(
                            (p) => p.projectKey === selectedAsset.assetProject
                          )?.projectTitle || selectedAsset.assetProject}
                        </p>
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
                        <p className="text-sm text-gray-500">Description</p>
                        <p className="font-medium">
                          {selectedAsset.assetDescription ||
                            "No description available"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Purchase Date</p>
                        <p className="font-medium">
                          {selectedAsset.assetPurchaseDate || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Value</p>
                        <p className="font-medium">
                          {selectedAsset.assetValue
                            ? `$${selectedAsset.assetValue.toLocaleString()}`
                            : "Not specified"}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => {
                  /* Handle edit action */
                }}
              >
                Edit Details
              </Button>
              <Button
                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
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
    </Card>
  );
}
