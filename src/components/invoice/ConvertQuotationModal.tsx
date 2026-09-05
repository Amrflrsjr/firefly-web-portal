import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import axios from "axios";
import { X, Search, FileText, CheckCircle2, AlertCircle } from "lucide-react";
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
        const errorMessage =
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message ||
              "An active invoice has already been generated for this quotation. Please cancel the existing invoice before generating a new one.";
        setFormError(errorMessage);
      } else {
        setFormError(
          "An unexpected error occurred while converting the quotation.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Convert Quotation to Invoice
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Select an approved proposal to generate a billing statement
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-4 rounded-2xl flex items-start gap-3 shadow-2xs animate-in slide-in-from-top-2 duration-150">
            <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="text-xs font-semibold leading-relaxed">
              {formError}
            </span>
          </div>
        )}

        <form onSubmit={handleConvert} className="space-y-4">
          {/* Backend search filter input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by quotation # or customer name..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F] transition-all"
            />
          </div>

          {/* Scrollable list of backend-filtered quotation cards */}
          <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {loading ? (
              <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-xs font-medium flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Searching quotations...</span>
              </div>
            ) : quotations.length === 0 ? (
              <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                No matching quotations found.
              </div>
            ) : (
              quotations.map((q) => {
                const isSelected = selectedQuotationId === q.quotationId;
                return (
                  <div
                    key={q.quotationId}
                    onClick={() => setSelectedQuotationId(q.quotationId)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-amber-50/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-1 ring-amber-300/50 dark:ring-amber-800/50 shadow-2xs"
                        : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-[#FCFDFF] dark:hover:bg-slate-850"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${
                          isSelected
                            ? "bg-[#FFCB62] text-slate-900 shadow-2xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold font-mono text-slate-900 dark:text-white truncate">
                          {q.quotationNumber}
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                          {q.companyName || "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                          PHP {(q.totalAmount ?? 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? "bg-[#F9B53F] border-[#F9B53F] text-slate-900"
                            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedQuotationId}
              className="px-5 py-2.5 text-xs font-extrabold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Generating..." : "Generate Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
