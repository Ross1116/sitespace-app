"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { assets } from "@/lib/data";
import api from "@/lib/api";
import { useEffect } from "react";

export default function AssetsTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<any[]>([]);

 // Fetch bookings from API
 useEffect(() => {
  const fetchAssets = async () => {
    try {
      setLoading(true);
      // Get current project ID from localStorage or context
      // const projectId = localStorage.getItem('projectId') || '';
      const assetProject = "P001";

      const response = await api.get(
        "api/auth/Asset/getAssetList",
        {
          params: {
            assetProject,
          },
        }
      );

      // Extract bookings from response based on the structure
      const assetsData = response.data?.assetlist || [];
      setAssets(assetsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Failed to load bookings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  console.log(error)
    fetchAssets();
  }, []);


  // Project data for the dropdown - extracted from asset data
  const projectSet = new Set(assets.map((asset) => asset.assetProject));
  const projects = [
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
        projectTitle: projectTitles[projectKey] || projectKey,
      };
    }),
  ];
  

  const [selectedProject, setSelectedProject] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Handle project selection change
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProject(e.target.value);
    setCurrentPage(1); // Reset to first page when changing projects
  };

  // Handle page changes
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="flex flex-col h-screen w-full p-4 pt-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Assets</h1>

        <div className="flex items-center">
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
        </div>
      </div>

      <div className="flex overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full w-full h-full bg-amber-50">
          <thead>
            <tr className="sticky top-0 text-left bg-orange-200 text-gray-700 uppercase text-sm">
              <th className="py-6 px-6">Title</th>
              <th>Location</th>
              <th>Status</th>
              <th>
                Contact Person
              </th>
              <th className="sticky top-0 py-3 px-6 text-center">Edit</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 divide-y divide-gray-200">
            {currentAssets.length > 0 ? (
              currentAssets.map((asset) => (
                <tr key={asset.assetKey} className="hover:bg-orange-100">
                  <td className="py-4 px-6">{asset.assetTitle}</td>
                  <td className="py-4 px-6">{asset.assetLocation}</td>
                  <td className="py-4 px-6">
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
                  </td>
                  <td className="py-4 px-6">{asset.assetPoc}</td>
                  <td className="py-4 px-6 text-center">
                    <Button className="bg-transparent text-gray-700 hover:bg-amber-100 rounded-full shadow-2xl hover:cursor-pointer">
                      ...
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No assets found for this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - only show if there are assets */}
      {filteredAssets.length > 0 && (
        <div className="flex justify-center items-center mt-4 space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${
              currentPage === 1
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-orange-200 text-gray-700 hover:bg-orange-300"
            }`}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded ${
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
            className={`px-3 py-1 rounded ${
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
  );
}
