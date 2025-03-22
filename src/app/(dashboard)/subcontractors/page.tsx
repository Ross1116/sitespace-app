"use client";

import { subcontractors } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Page() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubcontractors = subcontractors.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(subcontractors.length / itemsPerPage);

  // Handle page  changes
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="flex flex-col h-screen w-full p-4 pt-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Subcontractors</h1>
      <div className="flex-grow overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full w-full h-full bg-amber-50">
          <thead>
            <tr className="sticky top-0 text-left bg-orange-200 text-gray-700 uppercase text-sm">
              <th className="sticky top-0 py-6 px-6 text-left">Name</th>
              <th>Company</th>
              <th>Trade</th>
              <th>Email</th>
              <th>Phone</th>
              <th className="text-center">Edit</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 divide-y divide-gray-200">
            {currentSubcontractors.map((contractor) => (
              <tr
                key={contractor.contractorKey}
                className="hover:bg-orange-100"
              >
                <td className="py-4 px-6">{contractor.contractorName}</td>
                <td className="py-4 px-6">{contractor.contractorCompany}</td>
                <td className="py-4 px-6">{contractor.contractorTrade}</td>
                <td className="py-4 px-6">{contractor.contractorEmail}</td>
                <td className="py-4 px-6">{contractor.contractorPhone}</td>
                <td className="py-4 px-6 text-center">
                  <Button className="bg-transparent text-gray-700 hover:bg-amber-100 rounded-full shadow-2xl hover:cursor-pointer">
                    ...
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
    </div>
  );
}
