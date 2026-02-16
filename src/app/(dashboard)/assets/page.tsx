"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  X,
  Plus,
  PencilIcon,
  TrashIcon,
  Search,
  Box,
  User,
  Clock,
  Tag,
  Briefcase,
  FileText,
  Info,
  Wrench,
  AlertTriangle,
  Calendar,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import CreateAssetForm from "@/components/forms/CreateAssetForm";
import UpdateAssetModal from "@/components/forms/UpdateAssetForm";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { swrFetcher, SWR_CONFIG } from "@/lib/swr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransformedAsset, getApiErrorMessage } from "@/types";
import { useRouter } from "next/navigation";

interface AssetFromBackend {
  id: string;
  asset_code: string;
  name: string;
  type?: string | null;
  description?: string;
  status: "available" | "maintenance" | "retired";
  project_id?: string;
  created_at: string;
  updated_at: string;
  location?: string;
  poc?: string;
  usage_instructions?: string;
  maintenance_start_date?: string;
  maintenance_end_date?: string;
  pending_booking_capacity?: number;
}

interface AssetListResponse {
  assets: AssetFromBackend[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

type Asset = TransformedAsset;

interface Project {
  id: string;
  text: string;
}

type SortField =
  | "assetTitle"
  | "assetType"
  | "assetStatus"
  | "assetDescription"
  | "assetLastUpdated";
type SortDirection = "asc" | "desc";

const transformBackendAsset = (backendAsset: AssetFromBackend): Asset => {
  const descriptionText =
    backendAsset.description ||
    backendAsset.usage_instructions ||
    "No description provided";

  return {
    assetKey: backendAsset.id,
    assetTitle: backendAsset.name,
    assetDescription: descriptionText,
    assetType: backendAsset.type || "General",
    assetStatus: capitalizeStatus(backendAsset.status),
    assetLastUpdated: backendAsset.updated_at,
    assetPoc: backendAsset.poc || "Unassigned",
    assetProject: backendAsset.project_id || "",
    assetLocation: backendAsset.location || "",
    maintenanceStartdt: backendAsset.maintenance_start_date || "",
    maintenanceEnddt: backendAsset.maintenance_end_date || "",
    usageInstructions: backendAsset.usage_instructions || "",
    assetCode: backendAsset.asset_code,
    pendingBookingCapacity: backendAsset.pending_booking_capacity,
    _originalData: backendAsset,
  };
};

const capitalizeStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    available: "Operational",
    maintenance: "Maintenance",
    retired: "Retired",
  };
  return statusMap[status] || status;
};

const formatStatusForDisplay = (status: string) => {
  const statusConfig: Record<
    string,
    {
      label: string;
      className: string;
      sidebarClassName: string;
      dotColor: string;
    }
  > = {
    Operational: {
      label: "Operational",
      className: "text-emerald-700 border-emerald-200 bg-emerald-50",
      sidebarClassName:
        "text-emerald-300 bg-emerald-500/20 border-emerald-500/30",
      dotColor: "bg-emerald-500",
    },
    Maintenance: {
      label: "Maintenance",
      className: "text-amber-700 border-amber-200 bg-amber-50",
      sidebarClassName: "text-amber-300 bg-amber-500/20 border-amber-500/30",
      dotColor: "bg-amber-500",
    },
    Retired: {
      label: "Retired",
      className: "text-red-700 border-red-200 bg-red-50",
      sidebarClassName: "text-red-300 bg-red-500/20 border-red-500/30",
      dotColor: "bg-red-500",
    },
  };

  return (
    statusConfig[status] || {
      label: status,
      className: "text-slate-700 border-slate-200 bg-slate-50",
      sidebarClassName: "text-slate-300 bg-slate-500/20 border-slate-500/30",
      dotColor: "bg-slate-500",
    }
  );
};

const safeFormatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return format(parseISO(dateString), "PPP");
  } catch {
    return dateString;
  }
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

export default function AssetsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [selectedAssetForUpdate, setSelectedAssetForUpdate] =
    useState<Asset | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  // Read project from localStorage
  const project = useMemo<Project | undefined>(() => {
    if (typeof window === "undefined" || !userId) return undefined;
    try {
      const raw = localStorage.getItem(`project_${userId}`);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      const id = parsed?.id ?? parsed?.project_id;
      if (!id) return undefined;
      return {
        id,
        text: parsed?.text ?? parsed?.name ?? parsed?.project_name ?? "",
      };
    } catch {
      return undefined;
    }
  }, [userId]);

  // --- SWR: fetch assets ---
  const swrKey = project?.id
    ? `/assets/?project_id=${project.id}&skip=0&limit=100`
    : null;

  const {
    data,
    isLoading: loading,
    error: fetchError,
    mutate,
  } = useSWR<AssetListResponse>(swrKey, swrFetcher, SWR_CONFIG);

  const allAssets = useMemo(
    () => (data?.assets || []).map(transformBackendAsset),
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

  const columnHeaders: {
    label: string;
    field: SortField;
    colSpan: string;
    extraClass?: string;
  }[] = [
    {
      label: "Asset Name",
      field: "assetTitle",
      colSpan: "col-span-3",
      extraClass: "pl-2",
    },
    { label: "Type", field: "assetType", colSpan: "col-span-2" },
    { label: "Status", field: "assetStatus", colSpan: "col-span-2" },
    { label: "Description", field: "assetDescription", colSpan: "col-span-3" },
    {
      label: "Last Updated",
      field: "assetLastUpdated",
      colSpan: "col-span-1",
    },
  ];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Client-side filtering + sorting
  const filteredAndSortedAssets = useMemo(() => {
    if (!allAssets || allAssets.length === 0) return [];

    let result = [...allAssets];

    // Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (asset) =>
          asset.assetTitle.toLowerCase().includes(term) ||
          asset.assetCode.toLowerCase().includes(term) ||
          asset.assetType.toLowerCase().includes(term),
      );
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        let aVal: string;
        let bVal: string;

        if (sortField === "assetLastUpdated") {
          // Date sort
          const aDate = a.assetLastUpdated
            ? new Date(a.assetLastUpdated).getTime()
            : 0;
          const bDate = b.assetLastUpdated
            ? new Date(b.assetLastUpdated).getTime()
            : 0;
          return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
        }

        if (sortField === "assetStatus") {
          // Custom status order: Operational > Maintenance > Retired
          const statusOrder: Record<string, number> = {
            Operational: 0,
            Maintenance: 1,
            Retired: 2,
          };
          const aOrder = statusOrder[a.assetStatus] ?? 99;
          const bOrder = statusOrder[b.assetStatus] ?? 99;
          return sortDirection === "asc" ? aOrder - bOrder : bOrder - aOrder;
        }

        aVal = (a[sortField] || "").toLowerCase();
        bVal = (b[sortField] || "").toLowerCase();

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [allAssets, searchTerm, sortField, sortDirection]);

  const paginatedAssets = useMemo(() => {
    if (!filteredAndSortedAssets || filteredAndSortedAssets.length === 0)
      return [];
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedAssets.slice(start, start + itemsPerPage);
  }, [filteredAndSortedAssets, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(
    (filteredAndSortedAssets?.length || 0) / itemsPerPage,
  );

  const maintenanceCount = (allAssets ?? []).filter(
    (a) => a.assetStatus === "Maintenance",
  ).length;

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleSaveAssets = () => {
    setIsAssetFormOpen(false);
    setCurrentPage(1);
    mutate();
  };

  const handleDeleteAsset = (assetKey: string) => {
    setDeleteConfirmKey(assetKey);
  };

  const confirmDeleteAsset = async () => {
    if (!deleteConfirmKey) return;
    try {
      await api.delete(`/assets/${deleteConfirmKey}`);
      if (selectedAsset?.assetKey === deleteConfirmKey) closeSidebar();
      mutate();
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "Failed to delete asset"));
    } finally {
      setDeleteConfirmKey(null);
    }
  };

  const handleUpdateAsset = (updatedAsset: Asset) => {
    if (selectedAsset?.assetKey === updatedAsset.assetKey) {
      setSelectedAsset({ ...selectedAsset, ...updatedAsset });
    }
    mutate();
  };

  return (
    <div className="min-h-screen bg-[var(--page-bg)] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-screen mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-1 min-h-[85vh] flex flex-col relative overflow-hidden">
          <div className="p-6 flex-1 flex flex-col">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-end mb-8 gap-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Assets
                </h1>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                  Track and manage site equipment
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="bg-[var(--navy)] text-white rounded-xl px-5 py-2 flex flex-col items-center justify-center min-w-[110px] shadow-md shadow-slate-900/10">
                    <span className="text-2xl font-bold leading-none">
                      {allAssets?.length ?? 0}
                    </span>
                    <span className="text-[10px] font-medium opacity-80 uppercase tracking-wide">
                      Total Assets
                    </span>
                  </div>
                  <div className="bg-[var(--brand-orange)] text-white rounded-xl px-5 py-2 flex flex-col items-center justify-center min-w-[110px] shadow-md shadow-orange-900/10">
                    <span className="text-2xl font-bold leading-none">
                      {maintenanceCount}
                    </span>
                    <span className="text-[10px] font-medium opacity-90 uppercase tracking-wide">
                      Maintenance
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => setIsAssetFormOpen(true)}
                  className="bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white rounded-lg px-6 py-5 h-auto text-sm font-bold shadow-md shadow-slate-900/10 w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4 stroke-[3]" /> Add Asset
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4 relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, code, or type..."
                className="pl-10 bg-slate-50 border-transparent focus:bg-white transition-all rounded-xl h-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  {filteredAndSortedAssets.length} results
                </span>
              )}
            </div>

            {/* Table Header — Sortable */}
            <div className="hidden sm:grid grid-cols-12 gap-4 bg-gradient-to-r from-[var(--navy-deep)] to-[var(--navy)] text-white py-3.5 px-6 rounded-xl text-sm font-semibold shadow-md shadow-slate-200 mb-4 select-none">
              {columnHeaders.map(({ label, field, colSpan, extraClass }) => (
                <div
                  key={field}
                  className={`${colSpan} ${extraClass || ""} group flex items-center gap-1.5 cursor-pointer transition-colors hover:text-white/80`}
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
              {/* Action column — not sortable */}
              <div className="col-span-1 text-center">Action</div>
            </div>

            {fetchError && (
              <div
                className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-sm mb-3"
                role="alert"
              >
                Failed to load assets. Please try again.
              </div>
            )}

            {/* Rows */}
            <div className="space-y-3 flex-1">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-slate-50 rounded-xl animate-pulse w-full border border-slate-100"
                  />
                ))
              ) : paginatedAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <Box className="h-10 w-10 mb-2 opacity-50" />
                  <p>
                    {searchTerm
                      ? "No assets match your search."
                      : "No assets found."}
                  </p>
                </div>
              ) : (
                paginatedAssets.map((asset) => {
                  const isSelected = selectedAsset?.assetKey === asset.assetKey;
                  const statusDisplay = formatStatusForDisplay(
                    asset.assetStatus,
                  );
                  const updatedDate = asset.assetLastUpdated
                    ? format(parseISO(asset.assetLastUpdated), "MMM d, yyyy")
                    : "N/A";

                  return (
                    <div
                      key={asset.assetKey}
                      onClick={() => handleAssetClick(asset)}
                      className={`
                        group relative bg-white rounded-xl p-3 sm:px-6 sm:py-3.5 
                        border border-slate-200 grid grid-cols-1 sm:grid-cols-12 
                        gap-2 sm:gap-4 items-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] 
                        hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300
                        transition-all duration-200 cursor-pointer 
                        ${isSelected ? "bg-slate-50 border-slate-300" : ""}
                      `}
                    >
                      <div className="col-span-3 flex items-center gap-3 overflow-hidden">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                          <Box size={16} />
                        </div>
                        <div className="flex flex-col truncate">
                          <span
                            className="font-semibold text-slate-800 text-sm truncate"
                            title={asset.assetTitle}
                          >
                            {asset.assetTitle}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {asset.assetCode}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 text-slate-600 text-xs sm:text-sm font-medium flex items-center gap-2">
                        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Type
                        </span>
                        <Wrench
                          size={14}
                          className="text-slate-400 hidden sm:block"
                        />
                        <span className="truncate capitalize">
                          {asset.assetType}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Status
                        </span>
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusDisplay.className}`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${statusDisplay.dotColor}`}
                          />
                          {statusDisplay.label}
                        </div>
                      </div>

                      <div className="col-span-3 text-xs sm:text-sm font-medium">
                        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Description
                        </span>
                        <span
                          className="text-slate-500 truncate block max-w-full"
                          title={asset.assetDescription}
                        >
                          {asset.assetDescription}
                        </span>
                      </div>

                      <div className="col-span-1 text-slate-500 text-xs sm:text-sm font-medium truncate">
                        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Updated
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="hidden sm:inline" />
                          {updatedDate}
                        </span>
                      </div>

                      <div className="col-span-1 flex justify-start sm:justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssetForUpdate(asset);
                            setIsUpdateModalOpen(true);
                          }}
                        >
                          <PencilIcon size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAsset(asset.assetKey);
                          }}
                        >
                          <TrashIcon size={14} />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {filteredAndSortedAssets.length > 0 && (
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
          className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {selectedAsset && (
            <div className="h-full flex flex-col">
              <div className="p-8 bg-[var(--navy)] text-white flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                      <Box size={20} />
                    </div>
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${formatStatusForDisplay(selectedAsset.assetStatus).sidebarClassName}`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${formatStatusForDisplay(selectedAsset.assetStatus).dotColor}`}
                      />
                      {selectedAsset.assetStatus}
                    </div>
                  </div>
                  <h2 className="text-xl font-bold leading-tight">
                    {selectedAsset.assetTitle}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-300 text-sm font-mono opacity-80">
                      {selectedAsset.assetCode}
                    </span>
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
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    Asset Identity
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-500">
                          Project
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {project?.text || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Tag className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-500">
                          Asset Type
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {selectedAsset.assetType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Info className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-500">
                          Code/Serial
                        </span>
                      </div>
                      <span className="text-sm font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {selectedAsset.assetCode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Description
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedAsset.assetDescription}
                  </p>
                </div>

                {(selectedAsset.assetStatus === "Maintenance" ||
                  selectedAsset.maintenanceStartdt ||
                  selectedAsset.maintenanceEnddt) && (
                  <div className="p-5 rounded-xl border border-amber-200 shadow-sm bg-amber-50/30">
                    <div className="flex items-center gap-2 mb-4 border-b border-amber-100 pb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                        Maintenance Schedule
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-amber-400" />
                          <span className="text-sm font-medium text-slate-500">
                            Start Date
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {safeFormatDate(selectedAsset.maintenanceStartdt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-amber-400" />
                          <span className="text-sm font-medium text-slate-500">
                            End Date
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {safeFormatDate(selectedAsset.maintenanceEnddt)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    Logistics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">
                        Last Updated
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {safeFormatDate(selectedAsset.assetLastUpdated)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">
                        Contact
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {selectedAsset.assetPoc}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedAsset._originalData && (
                  <div className="text-center space-y-1 py-2">
                    <p className="text-[10px] text-slate-400">
                      Created:{" "}
                      {safeFormatDate(selectedAsset._originalData.created_at)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Last Updated:{" "}
                      {safeFormatDate(selectedAsset._originalData.updated_at)}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
                <Button
                  className="flex-1 bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)]"
                  onClick={() => {
                    setSelectedAssetForUpdate(selectedAsset);
                    setIsUpdateModalOpen(true);
                  }}
                >
                  Edit Details
                </Button>
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

        {isAssetFormOpen && (
          <CreateAssetForm
            isOpen={isAssetFormOpen}
            onClose={() => setIsAssetFormOpen(false)}
            onSave={handleSaveAssets}
          />
        )}

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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deleteConfirmKey}
          onOpenChange={() => setDeleteConfirmKey(null)}
        >
          <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Delete Asset
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Are you sure you want to delete this asset? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmKey(null)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteAsset}
                className="w-full sm:w-auto"
              >
                Yes, Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Error Dialog */}
        <Dialog open={!!actionError} onOpenChange={() => setActionError(null)}>
          <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Error
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                {actionError}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActionError(null)}
                className="w-full sm:w-auto"
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
