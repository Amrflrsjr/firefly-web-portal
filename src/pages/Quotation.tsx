import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import type {
  QuotationResponseDto,
  CreateQuotationDto,
} from "../types/quotation";
import type {
  CreateCustomerDto,
  Customer,
  CustomerContact,
} from "../types/customer";
import { Plus, Search, AlertCircle, Filter, X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

import { QuotationTable } from "../components/quotations/QuotationTable";
import { QuotationDetailsModal } from "../components/quotations/QuotationDetailsModal";
import { CreateQuotationModal } from "../components/quotations/CreateQuotationModal";
import { EmailQuotationModal } from "../components/quotations/EmailQuotationModal";
import { ConvertQuotationModal } from "../components/invoice/ConvertQuotationModal";
import { AddContactModal } from "../components/customers/AddContactModal";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { PdfPreviewModal } from "../components/common/PdfPreviewModal";
import { EditQuotationModal } from "../components/quotations/EditQuotationModal";
import { CreateCustomerModal } from "../components/customers/CreateCustomerModal";
import { quotationApi } from "../api/quotations";

export const Quotations: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "all";
  const startDateFilter = searchParams.get("startDate") || "";
  const endDateFilter = searchParams.get("endDate") || "";
  const sortBy = searchParams.get("sortBy") || "createdat";
  const ascending = searchParams.get("ascending") === "true";

  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [quotations, setQuotations] = useState<QuotationResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [selectedQuotation, setSelectedQuotation] =
    useState<QuotationResponseDto | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);

  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewFilename, setPreviewFilename] = useState("");
  const [loadingPdfId, setLoadingPdfId] = useState<number | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);

  const [quotationToDelete, setQuotationToDelete] = useState<number | null>(
    null,
  );

  const [editingQuotation, setEditingQuotation] =
    useState<QuotationResponseDto | null>(null);

  const [selectedCustomerForContact, setSelectedCustomerForContact] =
    useState<Customer | null>(null);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [contactRefreshCounter, setContactRefreshCounter] = useState(0);

  const handleCreateCustomerFromModal = async (dto: CreateCustomerDto) => {
    setSaving(true);
    try {
      const response = await api.post<Customer>("/customers", dto);
      toast.success("Customer created successfully!");
      setIsCreateCustomerOpen(false);

      if (response.data) {
        setContactRefreshCounter((prev) => prev + 1);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to create customer");
      }
    } finally {
      setSaving(false);
    }
  };

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

  const activeQuotation = selectedQuotation;

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
      setLoadingPdfId(quotationId);
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
    } finally {
      setLoadingPdfId(null);
    }
  };

  const handleDownloadPdf = async (
    quotationId: number,
    quotationNumber: string,
  ) => {
    try {
      setDownloadingPdfId(quotationId);
      await quotationApi.downloadPdf(quotationId, quotationNumber);
      toast.success("PDF downloaded successfully!");
    } catch {
      toast.error("Failed to download PDF document.");
    } finally {
      setDownloadingPdfId(null);
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
    <div className="space-y-6 pb-10 px-4 sm:px-0">
      {/* Flat Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Quotations & Proposals
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Create, manage, and dispatch official client proposals and estimates
            seamlessly.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError("");
            setIsCreateOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create Quotation</span>
        </button>
      </div>

      {apiError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
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
            className="text-xs font-bold bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 px-3.5 py-1.5 rounded-xl shadow-2xs hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search quotations, customers..."
                value={searchQuery}
                onChange={(e) => updateQueryParams({ search: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all shadow-2xs"
              />
            </div>

            <button
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className={`lg:hidden flex items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                isMobileFiltersOpen || hasActiveFilters
                  ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
              title="Toggle Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div
            className={`flex-wrap items-center gap-2.5 ${
              isMobileFiltersOpen ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => updateQueryParams({ status: e.target.value })}
                className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-400 transition-all cursor-pointer shadow-2xs"
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

            <div className="w-full sm:w-auto flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                From
              </span>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) =>
                  updateQueryParams({ startDate: e.target.value })
                }
                className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                To
              </span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => updateQueryParams({ endDate: e.target.value })}
                className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchParams({}, { replace: true });
                  setIsMobileFiltersOpen(false);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <QuotationTable
          loading={loading}
          quotations={quotations}
          sortBy={sortBy}
          ascending={ascending}
          searchQuery={searchQuery}
          onSort={handleSortChange}
          onView={(q: QuotationResponseDto) => setSelectedQuotation(q)}
          onViewPdf={handlePreviewPdf}
          onDownloadPdf={(id: number, num: string) =>
            handleDownloadPdf(id, num)
          }
          onOpenEmail={(q: QuotationResponseDto) => {
            setSelectedQuotation(q);
            setIsEmailOpen(true);
          }}
          onUpdateStatus={handleUpdateStatus}
          onDeleteQuotation={handleDeleteQuotation}
          onEdit={(q: QuotationResponseDto) => setEditingQuotation(q)}
          loadingPdfId={loadingPdfId}
          downloadingPdfId={downloadingPdfId}
          onConvertToInvoice={async (q: QuotationResponseDto) => {
            try {
              const defaultDueDate = new Date();
              defaultDueDate.setDate(defaultDueDate.getDate() + 30);

              await api.post("/invoices/from-quotation", {
                quotationId: q.quotationId,
                dueDate: defaultDueDate.toISOString(),
                notes:
                  "We truly appreciate your partnership! Kindly process your payment at your earliest convenience before the due date.",
              });

              toast.success(
                `Invoice successfully generated for quotation ${q.quotationNumber}!`,
              );
              navigate("/invoices");
            } catch (err: unknown) {
              if (axios.isAxiosError(err)) {
                const errorMessage =
                  typeof err.response?.data === "string"
                    ? err.response.data
                    : err.response?.data?.message ||
                      "An active invoice has already been generated for this quotation.";
                toast.error(errorMessage);
              } else {
                toast.error(
                  "An unexpected error occurred while converting the quotation.",
                );
              }
            }
          }}
        />
      </div>

      {activeQuotation && !isEmailOpen && (
        <QuotationDetailsModal
          quotation={activeQuotation}
          onClose={() => {
            setSelectedQuotation(null);
            if (searchQuery) setSearchParams({}, { replace: true });
          }}
          onViewPdf={(id, number) => handlePreviewPdf(id, number)}
          onDownloadPdf={async (_e, q) => {
            await handleDownloadPdf(q.quotationId, q.quotationNumber);
          }}
          onOpenEmail={(q) => {
            setSelectedQuotation(q);
            setIsEmailOpen(true);
          }}
          onEdit={(q) => {
            setSelectedQuotation(null);
            setEditingQuotation(q);
          }}
          onDeleteQuotation={(id) => {
            setSelectedQuotation(null);
            handleDeleteQuotation(id);
          }}
          loadingPdfId={loadingPdfId}
          downloadingPdfId={downloadingPdfId}
        />
      )}

      <ConvertQuotationModal
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        quotations={quotations}
        onSuccess={() => {
          setIsConvertOpen(false);
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

      <PdfPreviewModal
        isOpen={previewPdfUrl !== null}
        pdfUrl={previewPdfUrl}
        title={previewTitle}
        filename={previewFilename}
        onClose={handleClosePreview}
      />

      <ConfirmModal
        isOpen={quotationToDelete !== null}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action will move it to the archive trash bin. You can restore it later if needed."
        confirmText="Yes, Delete"
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
          onTriggerAddCustomer={() => setIsCreateCustomerOpen(true)}
          onTriggerAddContact={(customer) => {
            setSelectedCustomerForContact(customer);
            setIsAddContactOpen(true);
          }}
        />
      )}

      {isCreateCustomerOpen && (
        <CreateCustomerModal
          saving={saving}
          error={formError}
          onClose={() => setIsCreateCustomerOpen(false)}
          onSubmit={handleCreateCustomerFromModal}
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
