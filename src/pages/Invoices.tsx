import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import axios from "axios";
import { Search, Plus, AlertCircle } from "lucide-react";
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
  const sortBy = searchParams.get("sortBy") || "createdat";
  const ascending = searchParams.get("ascending") !== "false";

  const [invoices, setInvoices] = useState<InvoiceResponseDto[]>([]);
  const [quotations, setQuotations] = useState<QuotationResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

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

  const loadData = async (query = "", sort = "createdat", asc = false) => {
    try {
      setLoading(true);
      const [invRes, quoteRes] = await Promise.all([
        api.get<InvoiceResponseDto[]>("/invoices", {
          params: { search: query, sortBy: sort, ascending: asc },
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
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(searchQuery, sortBy, ascending);
  }, [searchQuery, sortBy, ascending]);

  const exactMatchInvoice = searchQuery
    ? invoices.find(
        (i) => i.invoiceNumber.toLowerCase() === searchQuery.toLowerCase(),
      )
    : null;

  const activeInvoice = (selectedInvoice || exactMatchInvoice) ?? null;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const params: Record<string, string> = {};
    if (val) params.search = val;
    if (sortBy) params.sortBy = sortBy;
    if (!ascending) params.ascending = "false";
    setSearchParams(params, { replace: true });
  };

  const handleSortChange = (field: string) => {
    const newAscending = sortBy === field ? !ascending : true;
    const params: Record<string, string> = {
      sortBy: field,
      ascending: String(newAscending),
    };
    if (searchQuery) params.search = searchQuery;
    setSearchParams(params, { replace: true });
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
      await api.put(`/invoices/${invoiceId}/status`, { status });
      toast.success("Invoice status updated successfully!");
      await loadData(searchQuery, sortBy, ascending);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data || "Failed to update invoice status");
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
      toast.success("Invoice cancelled successfully!");
      setSelectedInvoice(null);
      setInvoiceToDelete(null);
      loadData(searchQuery, sortBy, ascending);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to cancel invoice");
      } else {
        toast.error("Failed to cancel invoice");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Invoices & Payments
          </h1>
          <p className="text-sm text-slate-500">
            Convert approved estimates to invoices and record customer payments
          </p>
        </div>
        <button
          onClick={() => setIsConvertOpen(true)}
          className="inline-flex items-center gap-2 bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Convert Quotation to Invoice
        </button>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
          <button
            onClick={() => loadData(searchQuery, sortBy, ascending)}
            className="text-xs font-bold bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number or customer name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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

      <ConvertQuotationModal
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        quotations={quotations}
        onSuccess={() => {
          setIsConvertOpen(false);
          loadData(searchQuery, sortBy, ascending);
        }}
      />

      {paymentInvoice && (
        <RecordPaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSuccess={() => {
            setPaymentInvoice(null);
            loadData(searchQuery, sortBy, ascending);
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
        title="Cancel Invoice"
        message="Are you sure you want to cancel this invoice? This will set its status to Cancelled and remove it from active financial tracking."
        confirmText="Yes, Cancel"
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
          loadData(searchQuery, sortBy, ascending);
        }}
      />
    </div>
  );
};
