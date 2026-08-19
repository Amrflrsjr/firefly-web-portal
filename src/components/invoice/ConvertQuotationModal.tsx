import React, { useState } from "react";
import api from "../../api/axios";
import axios from "axios";
import { X } from "lucide-react";
import type { QuotationResponseDto } from "../../types/quotation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quotations: QuotationResponseDto[];
  onSuccess: () => void;
}

export const ConvertQuotationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  quotations,
  onSuccess,
}) => {
  const [selectedQuotationId, setSelectedQuotationId] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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

      setSelectedQuotationId(0);
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
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            Convert Quotation to Invoice
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
            {formError}
          </div>
        )}

        <form onSubmit={handleConvert} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Select Quotation *
            </label>
            <select
              required
              value={selectedQuotationId}
              onChange={(e) => setSelectedQuotationId(parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F]"
            >
              <option value={0}>-- Select Quotation --</option>
              {quotations.map((q) => (
                <option key={q.quotationId} value={q.quotationId}>
                  {q.quotationNumber} - {q.companyName} (PHP{" "}
                  {(q.totalAmount ?? 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedQuotationId}
              className="px-5 py-2 text-sm font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? "Converting..." : "Generate Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
