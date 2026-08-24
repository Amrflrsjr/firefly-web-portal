import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import type {
  QuotationResponseDto,
  CreateQuotationDto,
} from "../types/quotation";
import type { Customer, CustomerContact } from "../types/customer";
import { Plus, Search, AlertCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

import { QuotationTable } from "../components/quotations/QuotationTable";
import { QuotationDetailsModal } from "../components/quotations/QuotationDetailsModal";
import { CreateQuotationModal } from "../components/quotations/CreateQuotationModal";
import { EmailQuotationModal } from "../components/quotations/EmailQuotationModal";
import { AddContactModal } from "../components/customers/AddContactModal";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { PdfPreviewModal } from "../components/common/PdfPreviewModal";

export const Quotations: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "createdat";
  const ascending = searchParams.get("ascending") !== "false";

  const [quotations, setQuotations] = useState<QuotationResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

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

  // Contact on the fly
  const [selectedCustomerForContact, setSelectedCustomerForContact] =
    useState<Customer | null>(null);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [contactRefreshCounter, setContactRefreshCounter] = useState(0);

  const loadQuotations = async (
    query = "",
    sort = "createdat",
    asc = false,
  ) => {
    try {
      setLoading(true);
      const response = await api.get<QuotationResponseDto[]>("/quotations", {
        params: { search: query, sortBy: sort, ascending: asc },
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
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQuotations(searchQuery, sortBy, ascending);
  }, [searchQuery, sortBy, ascending]);

  // Auto-open modal if there's an exact quotation number match
  const exactMatchQuotation = searchQuery
    ? quotations.find(
        (q) => q.quotationNumber.toLowerCase() === searchQuery.toLowerCase(),
      )
    : null;

  const activeQuotation = (selectedQuotation || exactMatchQuotation) ?? null;

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
      await loadQuotations(searchQuery, sortBy, ascending);
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
      await loadQuotations(searchQuery, sortBy, ascending);

      // Immediately select the newly created quotation and open the email modal
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
      await loadQuotations(searchQuery, sortBy, ascending);
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
      await loadQuotations(searchQuery, sortBy, ascending);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Quotations
          </h1>
          <p className="text-sm text-slate-500">
            Manage client proposals and estimates
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Quotation
        </button>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
          <button
            onClick={() => loadQuotations(searchQuery, sortBy, ascending)}
            className="text-xs font-bold bg-red-100 px-3 py-1.5 rounded-lg"
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
            placeholder="Search by quotation #, customer, or contact..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
            loadQuotations(searchQuery, sortBy, ascending);
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
