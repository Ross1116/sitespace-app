"use client";

import { subcontractors } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { SetStateAction, useState } from "react";
import { Card } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import SubFormModal from "@/components/forms/InviteSubForm";

interface Contractor {
  contractorKey: string;
  contractorName: string;
  contractorCompany: string;
  contractorTrade: string;
  contractorEmail: string;
  contractorPhone: string;
  licenseNumber?: string;
  insuranceStatus?: boolean;
  lastProject?: string;
  notes?: string;
}

export default function Page() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContractor, setSelectedContractor] =
    useState<Contractor | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubFormOpen, setIsSubFormOpen] = useState(false);
  const itemsPerPage = 9;

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubcontractors = subcontractors.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(subcontractors.length / itemsPerPage);

  // Handle page changes
  const handlePageChange = (pageNumber: SetStateAction<number>) => {
    setCurrentPage(pageNumber);
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
    // fetchSubs();
  };

  return (
    <Card className="px-6 sm:my-8 mx-4 bg-stone-100">
      <div className="p-3 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
              Subcontractors
            </h1>
            <p className="text- sm:text-base text-gray-500 mt-1">
              Manage your subcontractors here
            </p>
          </div>

          {/* Desktop button */}
          <Button
            onClick={handleOnClickButton}
            className="hidden sm:flex mt-4 sm:mt-0"
          >
            Create new booking
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

        {/* Mobile-only column headers */}
        <div className="sm:hidden text-xs text-gray-500 font-medium mb-2">
          Tap on a contractor to view details
        </div>

        <div className="flex-grow overflow-x-auto rounded-lg">
          <div className="min-w-full w-full">
            {/* Header - Hidden on mobile */}
            <div className="hidden sm:grid sticky top-0 text-gray-700 uppercase text-sm grid-cols-6 px-2 border-b last:border-b-0">
              <div className="px-6 py-4 text-left">Name</div>
              <div className="px-6 py-4 text-left">Company</div>
              <div className="px-6 py-4 text-left">Trade</div>
              <div className="px-6 py-4 text-left">Email</div>
              <div className="px-6 py-4 text-left">Phone</div>
              <div className="px-6 py-4 text-center">Edit</div>
            </div>

            {/* Card Rows */}
            <div>
              {currentSubcontractors.map((contractor) => (
                <div
                  key={contractor.contractorKey}
                  onClick={() => handleCardClick(contractor)}
                >
                  <Card
                    className={`w-full p-0 cursor-pointer px-2 my-2 transition-colors duration-200 
                                ${
                                  isSelected(contractor.contractorKey)
                                    ? "bg-orange-400"
                                    : "hover:bg-orange-100"
                                }`}
                  >
                    {/* Desktop view */}
                    <div className="hidden sm:grid grid-cols-6 w-full py-6">
                      <div className="px-6">{contractor.contractorName}</div>
                      <div className="px-6">{contractor.contractorCompany}</div>
                      <div className="px-6">{contractor.contractorTrade}</div>
                      <div className="px-6">{contractor.contractorEmail}</div>
                      <div className="px-6">{contractor.contractorPhone}</div>
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
                        <div className="font-medium">
                          {contractor.contractorName}
                        </div>
                        <Button
                          className="bg-transparent text-gray-700 hover:bg-amber-100 rounded-full shadow-md hover:cursor-pointer h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ...
                        </Button>
                      </div>
                      <div className="text-sm text-gray-500">
                        {contractor.contractorCompany}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contractor.contractorTrade}
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
              ))}
            </div>
          </div>
        </div>

        {/* Pagination */}
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
                        <p className="text-sm text-gray-500">Trade</p>
                        <p className="font-medium">
                          {selectedContractor.contractorTrade}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-orange-600">
                          {selectedContractor.contractorEmail}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">
                          {selectedContractor.contractorPhone}
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
                        <p className="text-sm text-gray-500">License Number</p>
                        <p className="font-medium">
                          {selectedContractor.licenseNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Insurance Status
                        </p>
                        <div className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded-full mr-2 ${
                              selectedContractor.insuranceStatus
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          <p className="font-medium">
                            {selectedContractor.insuranceStatus
                              ? "Valid"
                              : "Expired"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Project</p>
                        <p className="font-medium">
                          {selectedContractor.lastProject || "None"}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Notes
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-700 mb-3">
                    Notes
                  </h3>
                  <Card className="p-4">
                    <p className="text-gray-600">
                      {selectedContractor.notes ||
                        "No notes available for this subcontractor."}
                    </p>
                  </Card>
                </div> */}
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
