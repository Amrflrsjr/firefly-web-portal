import React, { useState } from "react";
import api from "../../api/axios";
import axios from "axios";
import { X } from "lucide-react";
import type { InvoiceResponseDto, RecordPaymentDto } from "../../types/invoice";

interface Props {
  invoice: InvoiceResponseDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<Props> = ({
  invoice,
  onClose,
  onSuccess,
}) => {
  // Initialize state directly from the prop. No useEffect needed!
  const [paymentData, setPaymentData] = useState<RecordPaymentDto>({
    amountPaid: invoice?.balanceDue ?? 0,
    paymentDate: new Date().toISOString(),
    paymentMethod: "Bank Transfer",
    referenceNumber: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  if (!invoice) return null;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      await api.post(`/invoices/${invoice.invoiceId}/payments`, paymentData);
      onSuccess();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data || "Failed to record payment");
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
          <div>
            <h2 className="text-lg font-bold text-slate-800">Record Payment</h2>
            <p className="text-xs text-slate-500">
              {invoice.invoiceNumber} • Balance: PHP{" "}
              {(invoice.balanceDue ?? 0).toFixed(2)}
            </p>
          </div>
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

        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Payment Amount (PHP) *
            </label>
            <input
              type="number"
              step="0.01"
              max={invoice.balanceDue}
              required
              value={paymentData.amountPaid}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  amountPaid: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:border-[#F9B53F]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Payment Method
            </label>
            <select
              value={paymentData.paymentMethod}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  paymentMethod: e.target.value,
                })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F]"
            >
              <option value="Bank Transfer">
                Bank Transfer (GCash / Maya / BDO)
              </option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Reference # / Transaction ID
            </label>
            <input
              type="text"
              placeholder="e.g. GCash Ref #1029384"
              value={paymentData.referenceNumber}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  referenceNumber: e.target.value,
                })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F]"
            />
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
              disabled={saving || paymentData.amountPaid <= 0}
              className="px-5 py-2 text-sm font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? "Recording..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
