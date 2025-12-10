"use client";

import { Button } from "@/components/ui/button";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { X, Plus, Search, Mail, Phone, Briefcase, User, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import SubFormModal from "@/components/forms/InviteSubForm";
import { useAuth } from "@/app/context/AuthContext";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

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
    contractorCompany: backendSub.company_name || "-",
    contractorTrade: backendSub.trade_specialty || "General",
    contractorEmail: backendSub.email,
    contractorPhone: backendSub.phone || "-",
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
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 7; 
  const { user } = useAuth();
  const userId = user?.id;
  const hasFetched = useRef(false);

  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const readProjectFromStorage = (): any | null => {
    try {
      if (!userId) return null;
      const raw = typeof window !== "undefined" ? localStorage.getItem(`project_${userId}`) : null;
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  const getProjectId = (proj: any | null): string | number | null => {
    if (!proj) return null;
    return proj.id ?? proj.project_id ?? null;
  };

  useEffect(() => {
    if (!userId) return;
    const proj = readProjectFromStorage();
    setSelectedProject(proj ?? null);
    hasFetched.current = false;
    setCurrentPage(1);
  }, [userId]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (!userId) return;
      if (e.key === `project_${userId}`) {
        try {
          const newVal = e.newValue ? JSON.parse(e.newValue) : null;
          setSelectedProject(newVal);
          hasFetched.current = false;
          setCurrentPage(1);
        } catch {
          setSelectedProject(null);
        }
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    }
  }, [userId]);

  const projectIdForCache = getProjectId(selectedProject);
  const cacheKey = `subcontractors_${userId}_project_${projectIdForCache ?? "all"}`;

  const fetchSubs = async (forceRefresh = false) => {
    try {
      if (!user || (hasFetched.current && !forceRefresh)) return;

      setLoading(true);
      setError(null);

      const isAdmin = user?.role === "admin";
      const endpoint = isAdmin ? "/subcontractors/" : "/subcontractors/my-subcontractors";

      const params: Record<string, any> = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        is_active: true,
      };

      const projectId = getProjectId(selectedProject);
      if (projectId !== null && projectId !== undefined && projectId !== "") {
        params.project_id = projectId;
      }

      const response = await api.get<SubcontractorListResponse>(endpoint, { params });
      const subsData = response.data?.subcontractors || [];
      const total = response.data?.total ?? subsData.length ?? 0;
      const transformedSubs = subsData.map(transformBackendSubcontractor);

      setSubs(transformedSubs);
      setTotalSubs(total);

      try {
        localStorage.setItem(cacheKey, JSON.stringify(transformedSubs));
      } catch (e) {}

      hasFetched.current = true;
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || "Failed to fetch subcontractors";
      setError(errMsg);
      try {
        const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
        if (cached) setSubs(JSON.parse(cached));
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    try {
      const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
      if (cached) {
        setSubs(JSON.parse(cached));
        setLoading(false);
      }
    } catch (e) {}
    fetchSubs();
  }, [user, cacheKey]);

  useEffect(() => {
    if (hasFetched.current) fetchSubs(true);
  }, [currentPage]);

  useEffect(() => {
    if (!user) return;
    hasFetched.current = false;
    setCurrentPage(1);
    fetchSubs(true);
  }, [selectedProject]);

  const handlePageChange = (pageNumber: SetStateAction<number>) => {
    setCurrentPage(pageNumber);
  };

  const handleCardClick = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setSidebarOpen(true);
  };
  
  const handleSaveSubs = () => {
    setIsSubFormOpen(false);
    hasFetched.current = false;
    setCurrentPage(1);
    fetchSubs(true);
  };

  // Filter based on search
  const filteredSubs = subcontractors.filter(sub => 
    sub.contractorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.contractorCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.contractorTrade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.contractorEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalSubs / itemsPerPage);

  return (
    <div className="min-h-screen bg-[hsl(20,60%,99%)] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-screen mx-auto space-y-6">
        
        {/* --- Main Content Card --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-1 min-h-[85vh] flex flex-col relative overflow-hidden">
            
            {/* Inner Padding Container */}
            <div className="p-6 flex-1 flex flex-col">
                
                {/* Header Title Area */}
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900">Subcontractors</h1>
                        <p className="text-slate-500 text-sm mt-1 font-medium">Manage your subcontractors here</p>
                    </div>
                    <Button 
                        onClick={() => setIsSubFormOpen(true)} 
                        className="bg-[#0B1120] hover:bg-[#1a253a] text-white rounded-lg px-4 py-2 h-auto text-sm font-medium shadow-md shadow-slate-900/10"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Invite a subcontractor
                    </Button>
                </div>

                {/* Search Bar (Added) */}
                <div className="mb-4 relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search by name, company, or email..." 
                        className="pl-10 bg-slate-50 border-transparent focus:bg-white transition-all rounded-xl h-10 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Table Header - Dark Navy Gradient Pill */}
                <div className="hidden sm:grid grid-cols-12 gap-4 bg-gradient-to-r from-[#0f2a4a] to-[#0B1120] text-white py-3.5 px-6 rounded-xl text-sm font-semibold shadow-md shadow-slate-200 mb-4">
                    <div className="col-span-3">Name</div>
                    <div className="col-span-2">Company</div>
                    <div className="col-span-2">Trade</div>
                    <div className="col-span-2">Phone</div>
                    <div className="col-span-2">Email</div>
                    <div className="col-span-1 text-center">Status</div>
                </div>

                {/* Rows Area */}
                <div className="space-y-3 flex-1">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                             <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse w-full border border-slate-100" />
                        ))
                    ) : error ? (
                        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100 m-2">
                            {error}
                            <Button variant="outline" size="sm" onClick={() => fetchSubs(true)} className="ml-4">Retry</Button>
                        </div>
                    ) : filteredSubs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                            <User className="h-10 w-10 mb-2 opacity-50" />
                            <p>No subcontractors found matching your criteria.</p>
                        </div>
                    ) : (
                        filteredSubs.map((sub) => {
                            const isSelected = selectedContractor?.contractorKey === sub.contractorKey;
                            
                            return (
                                <div 
                                    key={sub.contractorKey}
                                    onClick={() => handleCardClick(sub)}
                                    className={`
                                        group relative
                                        bg-white rounded-xl p-3 sm:px-6 sm:py-3.5 
                                        border border-slate-200
                                        grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center
                                        shadow-[0_2px_8px_rgba(0,0,0,0.02)] 
                                        
                                        hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300
                                        transition-all duration-200 cursor-pointer 
                                        
                                        ${isSelected ? "bg-slate-50 border-slate-300" : ""}
                                    `}
                                >
                                    {/* Mobile Label/Value Structure */}
                                    <div className="col-span-3 font-semibold text-slate-800 text-sm flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                                            {sub.contractorName.charAt(0)}
                                        </div>
                                        {sub.contractorName}
                                    </div>
                                    
                                    <div className="col-span-2 text-slate-500 text-xs sm:text-sm font-medium">
                                        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Company</span>
                                        {sub.contractorCompany}
                                    </div>
                                    
                                    <div className="col-span-2 text-slate-500 text-xs sm:text-sm font-medium">
                                        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Trade</span>
                                        {sub.contractorTrade}
                                    </div>
                                    
                                    <div className="col-span-2 text-slate-500 text-xs sm:text-sm font-medium truncate">
                                        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Phone</span>
                                        {sub.contractorPhone}
                                    </div>

                                    <div className="col-span-2 text-slate-500 text-xs sm:text-sm font-medium truncate" title={sub.contractorEmail}>
                                        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Email</span>
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

                {/* Pagination - Bottom Center */}
                {totalSubs > 0 && (
                    <div className="mt-auto pt-6 flex justify-center items-center gap-6">
                        <Button 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="bg-[#0B1120] text-white hover:bg-[#1a253a] disabled:bg-slate-200 disabled:text-slate-400 rounded-full h-10 px-6 text-xs font-bold tracking-wide"
                        >
                            Previous
                        </Button>
                        
                        <span className="text-sm font-semibold text-slate-500">
                             Page <span className="text-slate-900">{currentPage}</span> of <span className="text-slate-900">{totalPages || 1}</span>
                        </span>

                        <Button 
                             onClick={() => handlePageChange(currentPage + 1)}
                             disabled={currentPage >= totalPages}
                             className="bg-[#0B1120] text-white hover:bg-[#1a253a] disabled:bg-slate-200 disabled:text-slate-400 rounded-full h-10 px-6 text-xs font-bold tracking-wide"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>

        {/* --- Sidebar Detail View (Redesigned) --- */}
        <div className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
            {selectedContractor && (
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-8 bg-[#0B1120] text-white flex justify-between items-start">
                         <div className="flex-1 pr-4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold border border-white/20">
                                    {selectedContractor.contractorName.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold leading-tight">{selectedContractor.contractorName}</h2>
                                    <p className="text-slate-300 text-sm mt-0.5">{selectedContractor.contractorCompany}</p>
                                </div>
                            </div>
                         </div>
                         <Button onClick={() => setSidebarOpen(false)} variant="ghost" className="text-white hover:bg-white/10 rounded-full h-8 w-8 p-0">
                            <X size={20} />
                         </Button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 p-8 overflow-y-auto bg-slate-50 space-y-6">
                        
                        {/* 1. Account Status */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Account Status</h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-600">Current State</span>
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

                        {/* 2. Contact Information */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Contact Details</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                    <Mail className="h-5 w-5 text-slate-500 mt-0.5" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Email Address</p>
                                        <p className="text-sm font-semibold text-slate-900 break-all">{selectedContractor.contractorEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                    <Phone className="h-5 w-5 text-slate-500 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Phone Number</p>
                                        <p className="text-sm font-semibold text-slate-900">{selectedContractor.contractorPhone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Business Info */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Business Profile</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Briefcase className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm font-medium text-slate-500">Company Name</span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900">{selectedContractor.contractorCompany}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Briefcase className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm font-medium text-slate-500">Trade Specialty</span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900">{selectedContractor.contractorTrade}</span>
                                </div>
                            </div>
                        </div>

                        {/* 4. Timestamps (Audit) */}
                        {selectedContractor._originalData && (
                            <div className="text-center space-y-1 py-4 pt-2 border-t border-slate-200 mt-4">
                                <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                                    <Clock size={10} />
                                    Created: {format(new Date(selectedContractor._originalData.created_at), "PPP p")}
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>

        {/* Sidebar Overlay */}
        {sidebarOpen && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Invite Modal */}
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