import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import axios from "axios";
import { X, Search, FileText, CheckCircle2 } from "lucide-react";
import type { QuotationResponseDto } from "../../types/quotation";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quotations: QuotationResponseDto[]; // Initial fallback list
  onSuccess: () => void;
}

export const ConvertQuotationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  quotations: initialQuotations,
  onSuccess,
}) => {
  const [quotations, setQuotations] =
    useState<QuotationResponseDto[]>(initialQuotations);
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(
    null,
  );
  const [searchFilter, setSearchFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch quotations from the backend whenever the search filter changes (with debounce)
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await api.get<QuotationResponseDto[]>("/quotations", {
          params: { search: searchFilter },
        });
        setQuotations(response.data);
      } catch (err) {
        console.error("Failed to fetch filtered quotations", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchFilter, isOpen]);

  if (!isOpen) return null;

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotationId) return;

    setSaving(true);
    setFormError("");

    try {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);

      await api.post("/invoices/from-quotation", {
        quotationId: selectedQuotationId,
        dueDate: defaultDueDate.toISOString(),
        notes:
          "Thank you for your business. Please remit payment by the due date.",
      });

      setSelectedQuotationId(null);
      setSearchFilter("");
      toast.success("Invoice generated successfully!");
      onSuccess();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data || "Failed to convert quotation");
      } else {
        setFormError("An unexpected error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Convert Quotation to Invoice
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an approved proposal to generate a billing statement
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3.5 rounded-xl font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleConvert} className="space-y-4">
          {/* Backend search filter input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by quotation # or customer name..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F] transition-all"
            />
          </div>

          {/* Scrollable list of backend-filtered quotation cards */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                Searching quotations...
              </div>
            ) : quotations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No matching quotations found.
              </div>
            ) : (
              quotations.map((q) => {
                const isSelected = selectedQuotationId === q.quotationId;
                return (
                  <div
                    key={q.quotationId}
                    onClick={() => setSelectedQuotationId(q.quotationId)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-amber-50/60 border-[#F9B53F] shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
                          isSelected
                            ? "bg-[#FFCB62] text-slate-900 shadow-2xs"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold font-mono text-slate-900">
                          {q.quotationNumber}
                        </div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                          {q.companyName || "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-slate-900">
                          PHP {(q.totalAmount ?? 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-[#F9B53F] border-[#F9B53F] text-slate-900"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedQuotationId}
              className="px-5 py-2.5 text-sm font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Converting..." : "Generate Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
