import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import type {
  QuotationResponseDto,
  CreateQuotationDto,
} from "../types/quotation";
import type { Customer, CustomerContact } from "../types/customer";
import {
  Plus,
  Search,
  AlertCircle,
  Filter,
  X,
  Sparkles,
  ArrowUpRight,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

import { QuotationTable } from "../components/quotations/QuotationTable";
import { QuotationDetailsModal } from "../components/quotations/QuotationDetailsModal";
import { CreateQuotationModal } from "../components/quotations/CreateQuotationModal";
import { EmailQuotationModal } from "../components/quotations/EmailQuotationModal";
import { AddContactModal } from "../components/customers/AddContactModal";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { PdfPreviewModal } from "../components/common/PdfPreviewModal";
import { EditQuotationModal } from "../components/quotations/EditQuotationModal";

export const Quotations: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "all";
  const startDateFilter = searchParams.get("startDate") || "";
  const endDateFilter = searchParams.get("endDate") || "";
  const sortBy = searchParams.get("sortBy") || "createdat";
  const ascending = searchParams.get("ascending") !== "false";

  const [quotations, setQuotations] = useState<QuotationResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Mobile filter dropdown toggle state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Modals state
  const [selectedQuotation, setSelectedQuotation] =
    useState<QuotationResponseDto | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // PDF Preview states
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewFilename, setPreviewFilename] = useState("");

  // Confirm modal state for cancellation
  const [quotationToDelete, setQuotationToDelete] = useState<number | null>(
    null,
  );

  const [editingQuotation, setEditingQuotation] =
    useState<QuotationResponseDto | null>(null);

  // Contact on the fly
  const [selectedCustomerForContact, setSelectedCustomerForContact] =
    useState<Customer | null>(null);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [contactRefreshCounter, setContactRefreshCounter] = useState(0);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const loadQuotations = useCallback(
    async (
      query = "",
      status = "all",
      startDate = "",
      endDate = "",
      sort = "createdat",
      asc = false,
    ) => {
      try {
        setLoading(true);
        const response = await api.get<QuotationResponseDto[]>("/quotations", {
          params: {
            search: query,
            status: status !== "all" ? status : undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            sortBy: sort,
            ascending: asc,
          },
        });
        setQuotations(response.data);
        setApiError(null);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setApiError(
            err.response?.data?.message ||
              err.message ||
              "Failed to fetch quotations",
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Use a ref to track if it's the initial mount
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadQuotations(
        searchQuery,
        statusFilter,
        startDateFilter,
        endDateFilter,
        sortBy,
        ascending,
      );
      return;
    }

    const timer = setTimeout(() => {
      loadQuotations(
        searchQuery,
        statusFilter,
        startDateFilter,
        endDateFilter,
        sortBy,
        ascending,
      );
    }, 0);

    return () => clearTimeout(timer);
  }, [
    searchQuery,
    statusFilter,
    startDateFilter,
    endDateFilter,
    sortBy,
    ascending,
    loadQuotations,
  ]);

  // Compute breakdown stats for header indicators
  const totalCount = quotations.length;
  const approvedCount = useMemo(
    () =>
      quotations.filter((q) => q.status?.toLowerCase() === "approved").length,
    [quotations],
  );
  const activeCount = useMemo(
    () =>
      quotations.filter(
        (q) =>
          q.status?.toLowerCase() === "created" ||
          q.status?.toLowerCase() === "sent" ||
          q.status?.toLowerCase() === "draft",
      ).length,
    [quotations],
  );

  // Auto-open modal if there's an exact quotation number match
  const exactMatchQuotation = searchQuery
    ? quotations.find(
        (q) => q.quotationNumber.toLowerCase() === searchQuery.toLowerCase(),
      )
    : null;

  const activeQuotation = (selectedQuotation || exactMatchQuotation) ?? null;

  const updateQueryParams = (updates: Record<string, string>) => {
    const params: Record<string, string> = {
      search: searchQuery,
      status: statusFilter,
      startDate: startDateFilter,
      endDate: endDateFilter,
      sortBy: sortBy,
      ascending: String(ascending),
      ...updates,
    };
    Object.keys(params).forEach((key) => {
      if (!params[key] || params[key] === "all") delete params[key];
    });
    setSearchParams(params, { replace: true });
  };

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err) && err.response?.data) {
      const data = err.response.data;
      if (typeof data === "string") return data;
      if (data.errors && typeof data.errors === "object") {
        return Object.values(data.errors).flat().join(" | ");
      }
      if (data.title) return data.title;
      if (data.message) return data.message;
    }
    return "Failed to create quotation. Please check your inputs.";
  };

  const handleCreateQuotation = async (dto: CreateQuotationDto) => {
    setSaving(true);
    setFormError("");
    try {
      await api.post("/quotations", dto);
      toast.success("Quotation created successfully!");
      setIsCreateOpen(false);
      await loadQuotations(
        searchQuery,
        statusFilter,
        startDateFilter,
        endDateFilter,
        sortBy,
        ascending,
      );
    } catch (err: unknown) {
      setFormError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndSendQuotation = async (dto: CreateQuotationDto) => {
    setSaving(true);
    setFormError("");
    try {
      const response = await api.post<QuotationResponseDto>("/quotations", dto);
      toast.success("Quotation created successfully!");
      setIsCreateOpen(false);
      await loadQuotations(
        searchQuery,
        statusFilter,
        startDateFilter,
        endDateFilter,
        sortBy,
        ascending,
      );

      if (response.data) {
        setSelectedQuotation(response.data);
        setIsEmailOpen(true);
      }
    } catch (err: unknown) {
      setFormError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (quotationId: number, status: string) => {
    try {
      await api.patch(`/quotations/${quotationId}/status`, { status });
      toast.success("Quotation status updated successfully!");
      await loadQuotations(
        searchQuery,
        statusFilter,
        startDateFilter,
        endDateFilter,
        sortBy,
        ascending,
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data || "Failed to update quotation status");
      } else {
        toast.error("Failed to update quotation status");
      }
    }
  };

  const handleSaveContactOnTheFly = async (contact: CustomerContact) => {
    if (!selectedCustomerForContact) return;
    setSaving(true);
    setFormError("");
    try {
      await api.post(
        `/customers/${selectedCustomerForContact.customerId}/contacts`,
        contact,
      );
      setIsAddContactOpen(false);
      setSelectedCustomerForContact(null);
      setContactRefreshCounter((prev) => prev + 1);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data || "Failed to save contact");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSortChange = (field: string) => {
    const newAscending = sortBy === field ? !ascending : true;
    updateQueryParams({ sortBy: field, ascending: String(newAscending) });
  };

  const handleDeleteQuotation = (quotationId: number) => {
    setQuotationToDelete(quotationId);
  };

  const executeDeleteQuotation = async () => {
    if (!quotationToDelete) return;
    setSaving(true);
    try {
      await api.delete(`/quotations/${quotationToDelete}`);
      toast.success("Quotation cancelled successfully!");
      setSelectedQuotation(null);
      setQuotationToDelete(null);
      await loadQuotations(
        searchQuery,
        statusFilter,
        startDateFilter,
        endDateFilter,
        sortBy,
        ascending,
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Failed to cancel quotation",
        );
      } else {
        toast.error("Failed to cancel quotation");
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewPdf = async (
    quotationId: number,
    quotationNumber: string,
  ) => {
    try {
      const response = await api.get(`/quotations/${quotationId}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      setPreviewPdfUrl(url);
      setPreviewTitle(`Quotation #${quotationNumber}`);
      setPreviewFilename(`Quotation_${quotationNumber}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF preview", err);
      toast.error("Failed to generate PDF preview");
    }
  };

  const handleClosePreview = () => {
    if (previewPdfUrl) {
      window.URL.revokeObjectURL(previewPdfUrl);
    }
    setPreviewPdfUrl(null);
  };

  const hasActiveFilters =
    statusFilter !== "all" || startDateFilter || endDateFilter || searchQuery;

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 px-4 sm:px-0 animate-in fade-in duration-300">
      {/* Executive Header Banner matching Dashboard style */}
      <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-72 h-72 bg-slate-500/10 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quotations &amp; Proposals Hub</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                {today}
              </div>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Quotations & Proposals
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-normal leading-relaxed">
              Create, manage, and dispatch official client proposals and
              estimates seamlessly across your catalog.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Real-time Summary Indicators */}
            <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <FileText className="w-4 h-4" />
                <span>{totalCount} Total</span>
              </div>
              <span className="text-slate-500">•</span>
              <div className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{activeCount} Active</span>
              </div>
              <span className="text-slate-500">•</span>
              <div className="flex items-center gap-1 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{approvedCount} Approved</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFormError("");
                setIsCreateOpen(true);
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 text-xs font-extrabold shadow-lg shadow-amber-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <Plus className="w-4 h-4 stroke-3" />
              <span>Create Quotation</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
          <button
            onClick={() =>
              loadQuotations(
                searchQuery,
                statusFilter,
                startDateFilter,
                endDateFilter,
                sortBy,
                ascending,
              )
            }
            className="text-xs font-bold bg-white border border-rose-200 px-4 py-2 rounded-xl shadow-2xs hover:bg-rose-100 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Professional UI/UX Filter & Search Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Enhanced Search Input & Mobile Filter Toggle Button */}
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by quotation #, customer, or contact..."
                value={searchQuery}
                onChange={(e) => updateQueryParams({ search: e.target.value })}
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className={`lg:hidden flex items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                isMobileFiltersOpen || hasActiveFilters
                  ? "bg-amber-50 border-amber-300 text-amber-800"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
              title="Toggle Filters"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Filters Group */}
          <div
            className={`flex-wrap items-center gap-2.5 ${
              isMobileFiltersOpen ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="hidden lg:flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-wider px-2">
              <Filter className="w-3.5 h-3.5 text-amber-500" /> Filters:
            </div>

            {/* Status Select */}
            <div className="w-full sm:w-auto">
              <label className="block lg:hidden text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => updateQueryParams({ status: e.target.value })}
                className="w-full sm:w-auto bg-slate-50/80 border border-slate-200/80 rounded-2xl px-3 py-2.5 lg:py-1 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all cursor-pointer shadow-2xs"
              >
                <option value="all">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Created">Created</option>
                <option value="Sent">Sent</option>
                <option value="Approved">Approved</option>
                <option value="Declined">Declined</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Start Date (From) */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50/80 border border-slate-200/80 rounded-2xl px-3.5 py-2 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                From
              </span>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) =>
                  updateQueryParams({ startDate: e.target.value })
                }
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              />
            </div>

            {/* End Date (To) */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50/80 border border-slate-200/80 rounded-2xl px-3.5 py-2 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                To
              </span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => updateQueryParams({ endDate: e.target.value })}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchParams({}, { replace: true });
                  setIsMobileFiltersOpen(false);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 border border-amber-200/60 px-4 py-3 lg:py-2.5 rounded-2xl transition-all cursor-pointer shadow-2xs"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 overflow-hidden">
        <QuotationTable
          loading={loading}
          quotations={quotations}
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSortChange}
          onView={(q) => setSelectedQuotation(q)}
          onViewPdf={handlePreviewPdf}
          onOpenEmail={(q) => {
            setSelectedQuotation(q);
            setIsEmailOpen(true);
          }}
          onUpdateStatus={handleUpdateStatus}
          onDeleteQuotation={handleDeleteQuotation}
          onEdit={(q) => setEditingQuotation(q)}
        />
      </div>

      {activeQuotation && !isEmailOpen && (
        <QuotationDetailsModal
          quotation={activeQuotation}
          onClose={() => {
            setSelectedQuotation(null);
            if (searchQuery) setSearchParams({}, { replace: true });
          }}
        />
      )}

      <PdfPreviewModal
        isOpen={previewPdfUrl !== null}
        pdfUrl={previewPdfUrl}
        title={previewTitle}
        filename={previewFilename}
        onClose={handleClosePreview}
      />

      <ConfirmModal
        isOpen={quotationToDelete !== null}
        title="Cancel Quotation"
        message="Are you sure you want to cancel this quotation? This will set its status to Cancelled and hide it from active listings."
        confirmText="Yes, Cancel"
        isDanger={true}
        loading={saving}
        onConfirm={executeDeleteQuotation}
        onClose={() => setQuotationToDelete(null)}
      />

      {editingQuotation && (
        <EditQuotationModal
          quotation={editingQuotation}
          onClose={() => setEditingQuotation(null)}
          onSuccess={() => {
            setEditingQuotation(null);
            loadQuotations(
              searchQuery,
              statusFilter,
              startDateFilter,
              endDateFilter,
              sortBy,
              ascending,
            );
          }}
        />
      )}

      {isCreateOpen && (
        <CreateQuotationModal
          saving={saving}
          error={formError}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateQuotation}
          onSubmitAndSend={handleCreateAndSendQuotation}
          refreshTrigger={contactRefreshCounter}
          onTriggerAddContact={(customer) => {
            setSelectedCustomerForContact(customer);
            setIsAddContactOpen(true);
          }}
        />
      )}

      {isEmailOpen && activeQuotation && (
        <EmailQuotationModal
          quotationId={activeQuotation.quotationId}
          onClose={() => setIsEmailOpen(false)}
          onSuccess={() => {
            setIsEmailOpen(false);
            loadQuotations(
              searchQuery,
              statusFilter,
              startDateFilter,
              endDateFilter,
              sortBy,
              ascending,
            );
          }}
        />
      )}

      {isAddContactOpen && selectedCustomerForContact && (
        <AddContactModal
          companyName={selectedCustomerForContact.companyName}
          saving={saving}
          error={formError}
          onClose={() => setIsAddContactOpen(false)}
          onSubmit={handleSaveContactOnTheFly}
        />
      )}
    </div>
  );
};
