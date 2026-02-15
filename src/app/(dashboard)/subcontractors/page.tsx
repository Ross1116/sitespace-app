"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState, useMemo } from "react";
import {
  X,
  Plus,
  Search,
  Mail,
  Phone,
  Briefcase,
  User,
  Clock,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import SubFormModal from "@/components/forms/InviteSubForm";
import { useAuth } from "@/app/context/AuthContext";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ApiProject } from "@/types";
import useSWR from "swr";
import { swrFetcher, SWR_CONFIG } from "@/lib/swr";
import { useRouter } from "next/navigation";

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

type SortField =
  | "contractorName"
  | "contractorCompany"
  | "contractorTrade"
  | "contractorPhone"
  | "contractorEmail"
  | "isActive";
type SortDirection = "asc" | "desc";

const transformBackendSubcontractor = (
  backendSub: SubcontractorFromBackend,
): Contractor => {
  return {
    contractorKey: backendSub.id,
    contractorName: `${backendSub.first_name} ${backendSub.last_name}`.trim(),
    contractorCompany: backendSub.company_name || "-",
    contractorTrade: backendSub.trade_specialty || "General",
    contractorEmail: backendSub.email,
    contractorPhone: backendSub.phone || "-",
    isActive: backendSub.is_active,
    _originalData: backendSub,
  };
};

const SortIcon = ({
  field,
  currentSort,
  currentDirection,
}: {
  field: SortField;
  currentSort: SortField | null;
  currentDirection: SortDirection;
}) => {
  if (currentSort !== field) {
    return (
      <ChevronsUpDown className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
    );
  }
  return currentDirection === "asc" ? (
    <ChevronUp className="h-3 w-3 text-white/90" />
  ) : (
    <ChevronDown className="h-3 w-3 text-white/90" />
  );
};

export default function SubcontractorsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContractor, setSelectedContractor] =
    useState<Contractor | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubFormOpen, setIsSubFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const itemsPerPage = 7;
  const { user } = useAuth();
  const router = useRouter();
  const userId = user?.id;

  useEffect(() => {
    if (user?.role === "subcontractor") {
      router.replace("/home");
    }
  }, [user?.role, router]);

  if (user?.role === "subcontractor") {
    return null;
  }

  // Re-read project on cross-tab changes
  const [projectVersion, setProjectVersion] = useState(0);
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (!userId || e.key !== `project_${userId}`) return;
      setProjectVersion((v) => v + 1);
      setCurrentPage(1);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [userId]);

  // Build project-aware memo (recomputes when projectVersion bumps)
  const projectId = useMemo(() => {
    if (!userId) return null;
    try {
      const raw = localStorage.getItem(`project_${userId}`);
      if (!raw) return null;
      const proj: ApiProject = JSON.parse(raw);
      return proj.id ?? proj.project_id ?? null;
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, projectVersion]);

  // SWR — role-based endpoint
  const swrKey = useMemo(() => {
    if (!user || user.role === "subcontractor") return null;
    const endpoint = user.role === "admin"
      ? "/subcontractors/"
      : "/subcontractors/my-subcontractors";
    const params = new URLSearchParams({ skip: "0", limit: "1000", is_active: "true" });
    if (projectId) params.set("project_id", projectId);
    return `${endpoint}?${params.toString()}`;
  }, [user, projectId]);

  const { data, isLoading: loading, error: fetchError, mutate } = useSWR<SubcontractorListResponse>(
    swrKey,
    swrFetcher,
    SWR_CONFIG,
  );

  const allSubs = useMemo(
    () => (data?.subcontractors || []).map(transformBackendSubcontractor),
    [data],
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Client-side filtering + sorting
  const filteredAndSortedSubs = useMemo(() => {
    if (!allSubs || allSubs.length === 0) return [];

    let result = [...allSubs];

    // Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (sub) =>
          sub.contractorName.toLowerCase().includes(term) ||
          sub.contractorCompany.toLowerCase().includes(term) ||
          sub.contractorTrade.toLowerCase().includes(term) ||
          sub.contractorEmail.toLowerCase().includes(term),
      );
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        let aVal: string | boolean;
        let bVal: string | boolean;

        if (sortField === "isActive") {
          aVal = a.isActive;
          bVal = b.isActive;
          // Active first when ascending
          if (aVal === bVal) return 0;
          if (sortDirection === "asc") return aVal ? -1 : 1;
          return aVal ? 1 : -1;
        }

        aVal = (a[sortField] || "").toLowerCase();
        bVal = (b[sortField] || "").toLowerCase();

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [allSubs, searchTerm, sortField, sortDirection]);

  // Client-side pagination
  const paginatedSubs = useMemo(() => {
    if (!filteredAndSortedSubs || filteredAndSortedSubs.length === 0) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedSubs.slice(start, start + itemsPerPage);
  }, [filteredAndSortedSubs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(
    (filteredAndSortedSubs?.length || 0) / itemsPerPage,
  );

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleCardClick = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setSidebarOpen(true);
  };

  const handleSaveSubs = async () => {
    setIsSubFormOpen(false);
    setCurrentPage(1);
    await mutate();
  };

  const columnHeaders: {
    label: string;
    field: SortField;
    colSpan: string;
  }[] = [
    { label: "Name", field: "contractorName", colSpan: "col-span-3" },
    { label: "Company", field: "contractorCompany", colSpan: "col-span-2" },
    { label: "Trade", field: "contractorTrade", colSpan: "col-span-2" },
    { label: "Phone", field: "contractorPhone", colSpan: "col-span-2" },
    { label: "Email", field: "contractorEmail", colSpan: "col-span-2" },
  ];

  return (
    <div className="min-h-screen bg-[var(--page-bg)] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-screen mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-1 min-h-[85vh] flex flex-col relative overflow-hidden">
          <div className="p-6 flex-1 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-end mb-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Subcontractors
                </h1>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                  Manage your subcontractors here
                </p>
              </div>
              {user?.role !== "subcontractor" && (
                <Button
                  onClick={() => setIsSubFormOpen(true)}
                  className="bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white rounded-lg px-4 py-2 h-auto text-sm font-medium shadow-md shadow-slate-900/10"
                >
                  <Plus className="mr-2 h-4 w-4" /> Invite a subcontractor
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="mb-4 relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, company, or email..."
                className="pl-10 bg-slate-50 border-transparent focus:bg-white transition-all rounded-xl h-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  {filteredAndSortedSubs.length} results
                </span>
              )}
            </div>

            {/* Table Header — Sortable */}
            <div className="hidden sm:grid grid-cols-12 gap-4 bg-gradient-to-r from-[var(--navy-deep)] to-[var(--navy)] text-white py-3.5 px-6 rounded-xl text-sm font-semibold shadow-md shadow-slate-200 mb-4 select-none">
              {columnHeaders.map(({ label, field, colSpan }) => (
                <div
                  key={field}
                  className={`${colSpan} group flex items-center gap-1.5 cursor-pointer transition-colors hover:text-white/80`}
                  onClick={() => handleSort(field)}
                >
                  <span
                    className={`${
                      sortField === field
                        ? "underline underline-offset-4 decoration-2 decoration-white/60"
                        : ""
                    }`}
                  >
                    {label}
                  </span>
                  <SortIcon
                    field={field}
                    currentSort={sortField}
                    currentDirection={sortDirection}
                  />
                </div>
              ))}
              {/* Status column */}
              <div
                className="col-span-1 group flex items-center justify-center gap-1.5 cursor-pointer transition-colors hover:text-white/80"
                onClick={() => handleSort("isActive")}
              >
                <span
                  className={`${
                    sortField === "isActive"
                      ? "underline underline-offset-4 decoration-2 decoration-white/60"
                      : ""
                  }`}
                >
                  Status
                </span>
                <SortIcon
                  field="isActive"
                  currentSort={sortField}
                  currentDirection={sortDirection}
                />
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-3 flex-1">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-slate-50 rounded-xl animate-pulse w-full border border-slate-100"
                  />
                ))
              ) : fetchError ? (
                <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100 m-2">
                  Failed to load subcontractors.
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mutate()}
                    className="ml-4"
                  >
                    Retry
                  </Button>
                </div>
              ) : paginatedSubs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <User className="h-10 w-10 mb-2 opacity-50" />
                  <p>
                    {searchTerm
                      ? "No subcontractors match your search."
                      : "No subcontractors found."}
                  </p>
                </div>
              ) : (
                paginatedSubs.map((sub) => {
                  const isSelected =
                    selectedContractor?.contractorKey === sub.contractorKey;

                  return (
                    <div
                      key={sub.contractorKey}
                      onClick={() => handleCardClick(sub)}
                      className={`
                        group relative bg-white rounded-xl p-3 sm:px-6 sm:py-3.5 
                        border border-slate-200 grid grid-cols-1 sm:grid-cols-12 
                        gap-2 sm:gap-4 items-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] 
                        hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300
                        transition-all duration-200 cursor-pointer 
                        ${isSelected ? "bg-slate-50 border-slate-300" : ""}
                      `}
                    >
                      <div className="col-span-3 font-semibold text-slate-800 text-sm flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                          {sub.contractorName.charAt(0)}
                        </div>
                        {sub.contractorName}
                      </div>

                      <div className="col-span-2 text-slate-500 text-xs sm:text-sm font-medium">
                        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Company
                        </span>
                        {sub.contractorCompany}
                      </div>

                      <div className="col-span-2 text-slate-500 text-xs sm:text-sm font-medium">
                        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Trade
                        </span>
                        {sub.contractorTrade}
                      </div>

                      <div className="col-span-2 text-slate-500 text-xs sm:text-sm font-medium truncate">
                        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Phone
                        </span>
                        {sub.contractorPhone}
                      </div>

                      <div
                        className="col-span-2 text-slate-500 text-xs sm:text-sm font-medium truncate"
                        title={sub.contractorEmail}
                      >
                        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Email
                        </span>
                        {sub.contractorEmail}
                      </div>

                      <div className="col-span-1 flex justify-start sm:justify-center">
                        {sub.isActive ? (
                          <span className="text-[10px] font-bold text-emerald-600 tracking-wide uppercase">
                            Accepted
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-orange-500 tracking-wide uppercase">
                            Waiting
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {filteredAndSortedSubs.length > 0 && (
              <div className="mt-auto pt-6 flex justify-center items-center gap-6">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] disabled:bg-slate-200 disabled:text-slate-400 rounded-full h-10 px-6 text-xs font-bold tracking-wide"
                >
                  Previous
                </Button>

                <span className="text-sm font-semibold text-slate-500">
                  Page <span className="text-slate-900">{currentPage}</span> of{" "}
                  <span className="text-slate-900">{totalPages || 1}</span>
                </span>

                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] disabled:bg-slate-200 disabled:text-slate-400 rounded-full h-10 px-6 text-xs font-bold tracking-wide"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {selectedContractor && (
            <div className="h-full flex flex-col">
              <div className="p-8 bg-[var(--navy)] text-white flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold border border-white/20">
                      {selectedContractor.contractorName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold leading-tight">
                        {selectedContractor.contractorName}
                      </h2>
                      <p className="text-slate-300 text-sm mt-0.5">
                        {selectedContractor.contractorCompany}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setSidebarOpen(false)}
                  variant="ghost"
                  className="text-white hover:bg-white/10 rounded-full h-8 w-8 p-0"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="flex-1 p-8 overflow-y-auto bg-slate-50 space-y-6">
                {/* Account Status */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    Account Status
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-600">
                        Current State
                      </span>
                    </div>
                    {selectedContractor.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        Waiting / Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    Contact Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Mail className="h-5 w-5 text-slate-500 mt-0.5" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">
                          Email Address
                        </p>
                        <p className="text-sm font-semibold text-slate-900 break-all">
                          {selectedContractor.contractorEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Phone className="h-5 w-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">
                          Phone Number
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedContractor.contractorPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Info */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    Business Profile
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-500">
                          Company Name
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {selectedContractor.contractorCompany}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-500">
                          Trade Specialty
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {selectedContractor.contractorTrade}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                {selectedContractor._originalData && (
                  <div className="text-center space-y-1 py-4 pt-2 border-t border-slate-200 mt-4">
                    <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <Clock size={10} />
                      Created:{" "}
                      {format(
                        new Date(selectedContractor._originalData.created_at),
                        "PPP p",
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {isSubFormOpen && (
          <SubFormModal
            isOpen={isSubFormOpen}
            onClose={() => setIsSubFormOpen(false)}
            onSave={handleSaveSubs}
          />
        )}
      </div>
    </div>
  );
}

