import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { quotationApi } from "../api/quotations";
import type {
  QuotationResponseDto,
  CreateQuotationDto,
} from "../types/quotation";
import type { Customer, CustomerContact } from "../types/customer";
import { Plus, Search, AlertCircle } from "lucide-react";
import axios from "axios";

import { QuotationTable } from "../components/quotations/QuotationTable";
import { QuotationDetailsModal } from "../components/quotations/QuotationDetailsModal";
import { CreateQuotationModal } from "../components/quotations/CreateQuotationModal";
import { EditQuotationStatusModal } from "../components/quotations/EditQuotationStatusModal";
import { EmailQuotationModal } from "../components/quotations/EmailQuotationModal";
import { AddContactModal } from "../components/customers/AddContactModal";

export const Quotations: React.FC = () => {
  const [quotations, setQuotations] = useState<QuotationResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [selectedQuotation, setSelectedQuotation] =
    useState<QuotationResponseDto | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // Contact on the fly
  const [selectedCustomerForContact, setSelectedCustomerForContact] =
    useState<Customer | null>(null);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        const data = await quotationApi.getAll();
        if (isSubscribed) {
          setQuotations(data);
          setApiError(null);
        }
      } catch (err: unknown) {
        if (isSubscribed && axios.isAxiosError(err)) {
          setApiError(
            err.response?.data?.message ||
              err.message ||
              "Failed to fetch quotations",
          );
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const reloadQuotations = async () => {
    try {
      const data = await quotationApi.getAll();
      setQuotations(data);
      setApiError(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setApiError(
          err.response?.data?.message ||
            err.message ||
            "Failed to reload quotations",
        );
      }
    }
  };

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err) && err.response?.data) {
      const data = err.response.data;

      // 1. String message
      if (typeof data === "string") return data;

      // 2. ASP.NET Validation Errors object { errors: { CustomerId: ["Error message"] } }
      if (data.errors && typeof data.errors === "object") {
        return Object.values(data.errors).flat().join(" | ");
      }

      // 3. ASP.NET ProblemDetails { title: "..." } or { message: "..." }
      if (data.title) return data.title;
      if (data.message) return data.message;
    }

    return "Failed to create quotation. Please check your inputs.";
  };

  const handleCreateQuotation = async (dto: CreateQuotationDto) => {
    setSaving(true);
    setFormError("");
    try {
      await quotationApi.create(dto);
      setIsCreateOpen(false);
      await reloadQuotations();
    } catch (err: unknown) {
      // Converts ASP.NET error object into a renderable string
      setFormError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (quotationId: number, status: string) => {
    setSaving(true);
    setFormError("");
    try {
      await quotationApi.updateStatus(quotationId, status);
      setIsStatusOpen(false);
      setSelectedQuotation(null);
      await reloadQuotations();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data || "Failed to update quotation status");
      }
    } finally {
      setSaving(false);
    }
  };

  const [contactRefreshCounter, setContactRefreshCounter] = useState(0);

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
      setContactRefreshCounter((prev) => prev + 1); // Triggers re-fetch inside CreateQuotationModal!
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data || "Failed to save contact");
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredQuotations = quotations.filter(
    (q) =>
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.contactNameSnapshot?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quotations</h1>
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
            onClick={reloadQuotations}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <QuotationTable
          loading={loading}
          quotations={filteredQuotations}
          onView={(q) => setSelectedQuotation(q)}
        />
      </div>

      {/* Details Drawer */}
      {selectedQuotation && !isStatusOpen && !isEmailOpen && (
        <QuotationDetailsModal
          quotation={selectedQuotation}
          onClose={() => setSelectedQuotation(null)}
          onEditStatus={() => {
            setFormError("");
            setIsStatusOpen(true);
          }}
          onOpenEmail={() => setIsEmailOpen(true)}
        />
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <CreateQuotationModal
          saving={saving}
          error={formError}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateQuotation}
          refreshTrigger={contactRefreshCounter}
          onTriggerAddContact={(customer) => {
            setSelectedCustomerForContact(customer);
            setIsAddContactOpen(true);
          }}
        />
      )}

      {/* Update Status Modal */}
      {isStatusOpen && selectedQuotation && (
        <EditQuotationStatusModal
          quotation={selectedQuotation}
          saving={saving}
          error={formError}
          onClose={() => setIsStatusOpen(false)}
          onSubmit={handleUpdateStatus}
        />
      )}

      {/* Email Modal */}
      {isEmailOpen && selectedQuotation && (
        <EmailQuotationModal
          quotationId={selectedQuotation.quotationId}
          onClose={() => setIsEmailOpen(false)}
          onSuccess={() => {
            setIsEmailOpen(false);
            reloadQuotations();
          }}
        />
      )}

      {/* Quick Add Contact Modal */}
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
