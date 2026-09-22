import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import axios from "axios";
import {
  X,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { QuotationResponseDto } from "../../types/quotation";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quotations: QuotationResponseDto[];
  onSuccess: () => void;
  onQuotationConverted?: (quotationId: number) => void;
}

export const ConvertQuotationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  onQuotationConverted,
}) => {
  const [availableQuotations, setAvailableQuotations] = useState<
    QuotationResponseDto[]
  >([]);
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(
    null,
  );
  const [searchFilter, setSearchFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const sortQuotationsNewestFirst = (data: QuotationResponseDto[]) => {
    return [...data].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return b.quotationId - a.quotationId;
    });
  };

  const fetchUnbilledQuotations = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setFormError("");

      const response = await api.get<QuotationResponseDto[]>("/quotations", {
        params: { search: query, unbilledOnly: true },
      });

      setAvailableQuotations(sortQuotationsNewestFirst(response.data));
    } catch (err) {
      console.error("Failed to load eligible quotations", err);
      setFormError("Failed to fetch unbilled quotations from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    const timer = setTimeout(async () => {
      if (!isCancelled) {
        await fetchUnbilledQuotations(searchFilter);
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchFilter, isOpen, fetchUnbilledQuotations]);

  const handleModalClose = () => {
    setSearchFilter("");
    setAvailableQuotations([]);
    setSelectedQuotationId(null);
    setFormError("");
    onClose();
  };

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
          "Thank you for choosing us! We appreciate your business and kindly ask that you settle this invoice by the due date.",
      });

      try {
        await api.put(`/quotations/${selectedQuotationId}/status`, {
          status: "Approved",
        });
      } catch {
        try {
          await api.put(
            `/quotations/${selectedQuotationId}/status`,
            "Approved",
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (statusErr) {
          console.error(
            "Failed to update quotation status automatically on backend",
            statusErr,
          );
        }
      }

      if (onQuotationConverted) {
        onQuotationConverted(selectedQuotationId);
      }

      setSelectedQuotationId(null);
      setSearchFilter("");
      toast.success(
        "Invoice generated successfully and quotation marked as approved!",
      );
      onSuccess();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage =
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message ||
              "An active invoice has already been generated for this quotation.";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Flat Modal Header matching Quotation/Invoice Details Modals */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Convert Quotation to Invoice
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select an approved proposal without an existing billing statement
            </p>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="mx-6 mt-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-3 rounded-lg flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="text-xs font-semibold leading-relaxed">
              {formError}
            </span>
          </div>
        )}

        <form
          onSubmit={handleConvert}
          className="p-6 flex flex-col flex-1 overflow-hidden space-y-4"
        >
          <div className="relative shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by quotation # or customer name..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
            />
          </div>

          <div className="max-h-80 sm:max-h-96 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar flex-1">
            {loading ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs font-medium flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 text-slate-600 dark:text-slate-300 animate-spin" />
                <span>Loading eligible quotations...</span>
              </div>
            ) : availableQuotations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                No available quotations found for conversion.
              </div>
            ) : (
              availableQuotations.map((q) => {
                const isSelected = selectedQuotationId === q.quotationId;
                return (
                  <div
                    key={q.quotationId}
                    onClick={() => setSelectedQuotationId(q.quotationId)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 shadow-2xs"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0 border border-slate-200 dark:border-slate-700">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold font-mono text-slate-900 dark:text-white truncate">
                          {q.quotationNumber}
                        </div>
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate mt-0.5">
                          {q.companyName || "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-semibold font-mono text-slate-900 dark:text-white">
                          ₱
                          {(q.totalAmount ?? 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {q.createdAt
                            ? new Date(q.createdAt).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? "bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900"
                            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedQuotationId}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Generating..." : "Generate Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
