"use client";

import { Button } from "@/components/ui/button";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import SubFormModal from "@/components/forms/InviteSubForm";
import { useAuth } from "@/app/context/AuthContext";
import api from "@/lib/api";

// ===== TYPE DEFINITIONS =====
interface SubcontractorFromBackend {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  trade_specialty?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SubcontractorListResponse {
  subcontractors: SubcontractorFromBackend[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

interface Contractor {
  contractorKey: string;
  contractorName: string;
  contractorCompany: string;
  contractorTrade: string;
  contractorEmail: string;
  contractorPhone: string;
  isActive: boolean;
  _originalData?: SubcontractorFromBackend;
}

// ===== HELPER FUNCTIONS =====
const transformBackendSubcontractor = (
  backendSub: SubcontractorFromBackend
): Contractor => {
  return {
    contractorKey: backendSub.id,
    contractorName: `${backendSub.first_name} ${backendSub.last_name}`.trim(),
    contractorCompany: backendSub.company_name || "N/A",
    contractorTrade: backendSub.trade_specialty || "General",
    contractorEmail: backendSub.email,
    contractorPhone: backendSub.phone || "N/A",
    isActive: backendSub.is_active,
    _originalData: backendSub,
  };
};

export default function Page() {
  const [currentPage, setCurrentPage] = useState(1);
  const [subcontractors, setSubs] = useState<Contractor[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubFormOpen, setIsSubFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalSubs, setTotalSubs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;
  const { user } = useAuth();
  const userId = user?.id;
  const hasFetched = useRef(false);

  // Fetch subcontractors from new backend
  const fetchSubs = async (forceRefresh = false) => {
    try {
      if (!user || (hasFetched.current && !forceRefresh)) {
        return;
      }

      console.log("Fetching subcontractors from new backend...");
      setLoading(true);
      setError(null);

      // Determine which endpoint to use based on user role
      const isAdmin = user?.role === "admin";
      const endpoint = isAdmin ? "/subcontractors/" : "/subcontractors/my-subcontractors";

      // Use pagination
      const response = await api.get<SubcontractorListResponse>(endpoint, {
        params: {
          skip: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage,
          is_active: true, // Only show active subcontractors
        },
      });

      const subsData = response.data?.subcontractors || [];
      const total = response.data?.total || 0;

      console.log("Subcontractors fetched:", subsData.length);

      // Transform to frontend format
      const transformedSubs = subsData.map(transformBackendSubcontractor);
      
      setSubs(transformedSubs);
      setTotalSubs(total);

      // Cache the data
      localStorage.setItem(
        `subcontractors_${userId}`,
        JSON.stringify(transformedSubs)
      );

      hasFetched.current = true;
    } catch (error: any) {
      console.error("Error fetching subcontractors:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to fetch subcontractors";
      setError(errorMessage);

      // Try to use cached data on error
      const cachedSubs = localStorage.getItem(`subcontractors_${userId}`);
      if (cachedSubs) {
        try {
          const parsedSubs = JSON.parse(cachedSubs);
          setSubs(parsedSubs);
        } catch (e) {
          console.error("Error parsing cached subcontractors:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load and cache check
  useEffect(() => {
    if (!user || hasFetched.current) return;

    // Load cached data first for instant display
    const cachedSubs = localStorage.getItem(`subcontractors_${userId}`);
    if (cachedSubs) {
      try {
        const parsedSubs = JSON.parse(cachedSubs);
        setSubs(parsedSubs);
        setLoading(false);
      } catch (error) {
        console.error("Error parsing cached subcontractors:", error);
      }
    }

    // Fetch fresh data
    fetchSubs();
  }, [user]);

  // Refetch when page changes
  useEffect(() => {
    if (hasFetched.current) {
      fetchSubs(true);
    }
  }, [currentPage]);

  // Calculate pagination
  const totalPages = Math.ceil(totalSubs / itemsPerPage);

  // Handle page changes
  const handlePageChange = (pageNumber: SetStateAction<number>) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle card click
  const handleCardClick = (contractor: SetStateAction<Contractor | null>) => {
    setSelectedContractor(contractor);
    setSidebarOpen(true);
  };

  // Close sidebar
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Check if card is selected
  const isSelected = (contractorKey: string) => {
    return sidebarOpen && selectedContractor?.contractorKey === contractorKey;
  };

  const handleOnClickButton = () => {
    setIsSubFormOpen(true);
  };

  const handleSaveSubs = () => {
    setIsSubFormOpen(false);
    hasFetched.current = false;
    setCurrentPage(1);
    fetchSubs(true);
  };

  // Error state UI
  if (error && !loading && subcontractors.length === 0) {
    return (
      <Card className="px-6 sm:my-8 mx-4 bg-stone-100">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Subcontractors
          </h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">Error loading subcontractors</p>
            <p className="text-sm mt-1">{error}</p>
            <Button
              onClick={() => fetchSubs(true)}
              className="mt-3"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="px-6 sm:my-8 mx-4 bg-stone-100">
      <div className="p-3 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
              Subcontractors
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Manage your subcontractors here
              {totalSubs > 0 && ` (${totalSubs} total)`}
            </p>
          </div>

          {/* Desktop button */}
          <Button
            onClick={handleOnClickButton}
            className="hidden sm:flex mt-4 sm:mt-0 cursor-pointer"
          >
            Invite a subcontractor
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

        {isSubFormOpen && (
          <SubFormModal
            isOpen={isSubFormOpen}
            onClose={() => setIsSubFormOpen(false)}
            onSave={handleSaveSubs}
          />
        )}

        {/* Mobile-only hint */}
        <div className="sm:hidden text-xs text-gray-500 font-medium mb-2">
          Tap on a contractor to view details
        </div>

        <div className="flex-grow overflow-x-auto rounded-lg">
          <div className="min-w-full w-full">
            {/* Header - Hidden on mobile */}
            <div className="hidden sm:grid sticky top-0 text-gray-700 uppercase text-sm grid-cols-5 px-2 border-b last:border-b-0">
              <div className="px-6 py-4 text-left">Name</div>
              <div className="px-6 py-4 text-left">Company</div>
              <div className="px-6 py-4 text-left">Trade</div>
              <div className="px-6 py-4 text-left">Email</div>
              <div className="px-6 py-4 text-left">Phone</div>
            </div>

            {/* Card Rows */}
            <div>
              {loading ? (
                // Skeleton loaders
                Array.from({ length: 5 }).map((_, index) => (
                  <Card key={index} className="w-full p-0 px-2 my-2 bg-stone-50">
                    {/* Desktop skeleton */}
                    <div className="hidden sm:grid grid-cols-5 w-full py-6 animate-pulse">
                      <div className="px-6">
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="px-6">
                        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="px-6">
                        <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      <div className="px-6">
                        <div className="h-5 bg-gray-200 rounded w-full"></div>
                      </div>
                      <div className="px-6">
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>

                    {/* Mobile skeleton */}
                    <div className="sm:hidden p-4 animate-pulse">
                      <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mt-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mt-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
                    </div>
                  </Card>
                ))
              ) : subcontractors.length > 0 ? (
                subcontractors.map((contractor) => (
                  <div
                    key={contractor.contractorKey}
                    onClick={() => handleCardClick(contractor)}
                  >
                    <Card
                      className={`w-full p-0 cursor-pointer px-2 my-2 transition-colors duration-200 
                        ${
                          isSelected(contractor.contractorKey)
                            ? "bg-orange-400 hover:bg-orange-100"
                            : "bg-stone-50 hover:bg-orange-100"
                        }`}
                    >
                      {/* Desktop view */}
                      <div className="hidden sm:grid grid-cols-5 w-full py-6">
                        <div className="px-6 font-medium">
                          {contractor.contractorName}
                          {!contractor.isActive && (
                            <span className="ml-2 text-xs text-red-500">
                              (Inactive)
                            </span>
                          )}
                        </div>
                        <div className="px-6">{contractor.contractorCompany}</div>
                        <div className="px-6">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {contractor.contractorTrade}
                          </span>
                        </div>
                        <div className="px-6 text-sm text-gray-600">
                          {contractor.contractorEmail}
                        </div>
                        <div className="px-6">{contractor.contractorPhone}</div>
                      </div>

                      {/* Mobile view */}
                      <div className="sm:hidden p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">
                            {contractor.contractorName}
                            {!contractor.isActive && (
                              <span className="ml-2 text-xs text-red-500">
                                (Inactive)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {contractor.contractorCompany}
                        </div>
                        <div className="mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {contractor.contractorTrade}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          {contractor.contractorEmail}
                        </div>
                        <div className="text-xs text-gray-600">
                          {contractor.contractorPhone}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-lg mb-2">No subcontractors found</p>
                  <p className="text-sm">
                    Invite your first subcontractor to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination - only show if there are multiple pages */}
        {totalSubs > 0 && totalPages > 1 && (
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
        {totalSubs > 0 && (
          <div className="text-center mt-2 text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalSubs)} of {totalSubs}{" "}
            subcontractors
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-1/3 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedContractor && (
          <div className="h-full flex flex-col p-6 py-16 px-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Subcontractor Details
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
                {/* Status Badge */}
                {!selectedContractor.isActive && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-700 font-medium">
                      This subcontractor is currently inactive
                    </p>
                  </div>
                )}

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3">
                    Contact Information
                  </h3>
                  <Card className="p-4 bg-amber-50">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">
                          {selectedContractor.contractorName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Company</p>
                        <p className="font-medium">
                          {selectedContractor.contractorCompany}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Trade Specialty</p>
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mt-1">
                          {selectedContractor.contractorTrade}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <a
                          href={`mailto:${selectedContractor.contractorEmail}`}
                          className="font-medium text-orange-600 hover:text-orange-700"
                        >
                          {selectedContractor.contractorEmail}
                        </a>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <a
                          href={`tel:${selectedContractor.contractorPhone}`}
                          className="font-medium text-orange-600 hover:text-orange-700"
                        >
                          {selectedContractor.contractorPhone}
                        </a>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
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