import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import axios from "axios";
import {
  Search,
  Plus,
  AlertCircle,
  Filter,
  X,
  Sparkles,
  ArrowUpRight,
  Receipt,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { InvoiceResponseDto } from "../types/invoice";
import type { QuotationResponseDto } from "../types/quotation";
import toast from "react-hot-toast";

import { InvoicesTable } from "../components/invoice/InvoicesTable";
import { ConvertQuotationModal } from "../components/invoice/ConvertQuotationModal";
import { RecordPaymentModal } from "../components/invoice/RecordPaymentModal";
import { InvoiceDetailsModal } from "../components/invoice/InvoiceDetailsModal";
import { SendInvoiceEmailModal } from "../components/invoice/SendInvoiceEmailModal";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { PdfPreviewModal } from "../components/common/PdfPreviewModal";

export const Invoices: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "all";
  const startDateFilter = searchParams.get("startDate") || "";
  const endDateFilter = searchParams.get("endDate") || "";
  const sortBy = searchParams.get("sortBy") || "createdat";
  const ascending = searchParams.get("ascending") === "true";

  const [invoices, setInvoices] = useState<InvoiceResponseDto[]>([]);
  const [quotations, setQuotations] = useState<QuotationResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Mobile filter dropdown toggle state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] =
    useState<InvoiceResponseDto | null>(null);
  const [selectedInvoice, setSelectedInvoice] =
    useState<InvoiceResponseDto | null>(null);
  const [emailInvoice, setEmailInvoice] = useState<InvoiceResponseDto | null>(
    null,
  );

  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewFilename, setPreviewFilename] = useState("");

  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const loadData = useCallback(
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
        const [invRes, quoteRes] = await Promise.all([
          api.get<InvoiceResponseDto[]>("/invoices", {
            params: {
              search: query,
              status: status !== "all" ? status : undefined,
              startDate: startDate || undefined,
              endDate: endDate || undefined,
              sortBy: sort,
              ascending: asc,
            },
          }),
          api.get<QuotationResponseDto[]>("/quotations"),
        ]);
        setInvoices(invRes.data);
        setQuotations(quoteRes.data);
        setApiError(null);
      } catch (err: unknown) {
        console.error("Failed to fetch data:", err);
        if (axios.isAxiosError(err)) {
          setApiError(
            err.response?.data?.message ||
              err.message ||
              "Failed to connect to API",
          );
        } else {
          setApiError("An unexpected error occurred while loading data");
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
      loadData(
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
      loadData(
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
    loadData,
  ]);

  // Compute live breakdown stats for header indicators
  const totalCount = invoices.length;
  const paidCount = useMemo(
    () => invoices.filter((i) => i.status?.toLowerCase() === "paid").length,
    [invoices],
  );
  const unpaidCount = useMemo(
    () =>
      invoices.filter(
        (i) =>
          i.status?.toLowerCase() === "unpaid" ||
          i.status?.toLowerCase() === "partiallypaid",
      ).length,
    [invoices],
  );

  const exactMatchInvoice = searchQuery
    ? invoices.find(
        (i) => i.invoiceNumber.toLowerCase() === searchQuery.toLowerCase(),
      )
    : null;

  const activeInvoice = (selectedInvoice || exactMatchInvoice) ?? null;

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

  const handleSortChange = (field: string) => {
    const newAscending = sortBy === field ? !ascending : true;
    updateQueryParams({ sortBy: field, ascending: String(newAscending) });
  };

  const handleDownloadPdf = async (
    invoiceId: number,
    invoiceNumber: string,
  ) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Invoice_${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF", err);
      setApiError("Failed to download PDF document.");
    }
  };

  const handleUpdateStatus = async (invoiceId: number, status: string) => {
    try {
      await api.patch(`/invoices/${invoiceId}/status`, { status });
      toast.success("Invoice status updated successfully!");
      loadData(
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
          err.response?.data?.message ||
            err.response?.data ||
            "Failed to update invoice status",
        );
      } else {
        toast.error("Failed to update invoice status");
      }
    }
  };

  const handleDeleteInvoice = (invoiceId: number) => {
    setInvoiceToDelete(invoiceId);
  };

  const executeDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setSaving(true);
    try {
      await api.delete(`/invoices/${invoiceToDelete}`);
      toast.success("Invoice moved to trash successfully!");
      setSelectedInvoice(null);
      setInvoiceToDelete(null);
      loadData(
        searchQuery,
        statusFilter,
        startDateFilter,
        endDateFilter,
        sortBy,
        ascending,
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to delete invoice");
      } else {
        toast.error("Failed to delete invoice");
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewPdf = async (invoiceId: number, invoiceNumber: string) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setPreviewTitle(`Invoice #${invoiceNumber}`);
      setPreviewFilename(`Invoice_${invoiceNumber}.pdf`);
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
      <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800/80">
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
                <span>Billing &amp; Payments Hub</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                {today}
              </div>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Invoices &amp; Payments
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-normal leading-relaxed">
              Convert approved estimates to invoices, dispatch PDFs, and record
              customer remittances efficiently.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Real-time Summary Indicators */}
            <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Receipt className="w-4 h-4" />
                <span>{totalCount} Total</span>
              </div>
              <span className="text-slate-500">•</span>
              <div className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{unpaidCount} Pending</span>
              </div>
              <span className="text-slate-500">•</span>
              <div className="flex items-center gap-1 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{paidCount} Settled</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsConvertOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 text-xs font-extrabold shadow-lg shadow-amber-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <Plus className="w-4 h-4 stroke-3" />
              <span>Convert Quotation</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-4 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
          <button
            onClick={() =>
              loadData(
                searchQuery,
                statusFilter,
                startDateFilter,
                endDateFilter,
                sortBy,
                ascending,
              )
            }
            className="text-xs font-bold bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 px-4 py-2 rounded-xl shadow-2xs hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Professional UI/UX Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/60 dark:shadow-none space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Enhanced Search Input & Mobile Filter Toggle Button */}
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search by invoice number, customer name or quotation number..."
                value={searchQuery}
                onChange={(e) => updateQueryParams({ search: e.target.value })}
                className="w-full bg-slate-50/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#F9B53F] focus:bg-white dark:focus:bg-slate-800 transition-all shadow-2xs"
              />
            </div>

            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className={`lg:hidden flex items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                isMobileFiltersOpen || hasActiveFilters
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750"
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
                className="w-full sm:w-auto bg-slate-50/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-3 py-2.5 lg:py-1 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#F9B53F] focus:bg-white dark:focus:bg-slate-800 transition-all cursor-pointer shadow-2xs"
              >
                <option value="all">All Statuses</option>
                <option value="Unpaid">Unpaid</option>
                <option value="PartiallyPaid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Start Date (From) */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-3.5 py-2 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                From
              </span>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) =>
                  updateQueryParams({ startDate: e.target.value })
                }
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>

            {/* End Date (To) */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-3.5 py-2 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                To
              </span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => updateQueryParams({ endDate: e.target.value })}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchParams({}, { replace: true });
                  setIsMobileFiltersOpen(false);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 px-4 py-3 lg:py-2.5 rounded-2xl transition-all cursor-pointer shadow-2xs"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/60 dark:shadow-none overflow-hidden">
        <InvoicesTable
          invoices={invoices}
          loading={loading}
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSortChange}
          onViewDetails={setSelectedInvoice}
          onViewPdf={handlePreviewPdf}
          onOpenEmail={setEmailInvoice}
          onUpdateStatus={handleUpdateStatus}
          onDeleteInvoice={handleDeleteInvoice}
          onRecordPayment={setPaymentInvoice}
        />
      </div>

      {/* Modals */}
      <ConvertQuotationModal
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        quotations={quotations}
        onSuccess={() => {
          setIsConvertOpen(false);
          loadData(
            searchQuery,
            statusFilter,
            startDateFilter,
            endDateFilter,
            sortBy,
            ascending,
          );
        }}
      />

      {paymentInvoice && (
        <RecordPaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSuccess={() => {
            setPaymentInvoice(null);
            loadData(
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

      <InvoiceDetailsModal
        invoice={activeInvoice}
        onClose={() => {
          setSelectedInvoice(null);
          if (searchQuery) setSearchParams({}, { replace: true });
        }}
        onDownloadPdf={handleDownloadPdf}
        onPreviewPdf={handlePreviewPdf}
        onOpenEmail={setEmailInvoice}
        onOpenPayment={setPaymentInvoice}
        onDeleteInvoice={handleDeleteInvoice}
      />

      <PdfPreviewModal
        isOpen={previewPdfUrl !== null}
        pdfUrl={previewPdfUrl}
        title={previewTitle}
        filename={previewFilename}
        onClose={handleClosePreview}
      />

      <ConfirmModal
        isOpen={invoiceToDelete !== null}
        title="Move Invoice to Trash"
        message="Are you sure you want to move this invoice to the trash? You can restore it later from the archive view if needed."
        confirmText="Yes, Move to Trash"
        isDanger={true}
        loading={saving}
        onConfirm={executeDeleteInvoice}
        onClose={() => setInvoiceToDelete(null)}
      />

      <SendInvoiceEmailModal
        invoice={emailInvoice}
        onClose={() => setEmailInvoice(null)}
        onSuccess={() => {
          setEmailInvoice(null);
          loadData(
            searchQuery,
            statusFilter,
            startDateFilter,
            endDateFilter,
            sortBy,
            ascending,
          );
        }}
      />
    </div>
  );
};
