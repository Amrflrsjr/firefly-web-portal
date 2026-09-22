import React, { useState } from "react";
import api from "../../api/axios";
import axios from "axios";
import { X, Loader2 } from "lucide-react";
import type { InvoiceResponseDto, RecordPaymentDto } from "../../types/invoice";
import toast from "react-hot-toast";

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
  const balanceDue = invoice?.balanceDue ?? 0;

  const [paymentData, setPaymentData] = useState<RecordPaymentDto>({
    amountPaid: balanceDue,
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
      toast.success("Payment recorded successfully!");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Flat Modal Header matching Quotation/Invoice Details Modals */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Record Payment
              </h2>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                {invoice.invoiceNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Log customer remittance and update invoice balance
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="mx-6 mt-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-3 rounded-lg flex items-start gap-2.5 shadow-2xs">
            <span className="text-xs font-semibold leading-relaxed">
              {formError}
            </span>
          </div>
        )}

        <form
          onSubmit={handleRecordPayment}
          className="p-6 overflow-y-auto flex-1 space-y-4"
        >
          {/* Balance Display Box */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Outstanding Balance
              </div>
              <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                ₱{balanceDue.toFixed(2)}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setPaymentData({ ...paymentData, amountPaid: balanceDue })
              }
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              Pay Full Balance
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Payment Amount (PHP) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">
                ₱
              </span>
              <input
                type="number"
                step="0.01"
                max={balanceDue}
                required
                value={paymentData.amountPaid}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    amountPaid: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3.5 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Payment Method *
            </label>
            <select
              value={paymentData.paymentMethod}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  paymentMethod: e.target.value,
                })
              }
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-400 transition-all cursor-pointer shadow-2xs"
            >
              <option value="Bank Transfer">
                Bank Transfer (GCash / Maya / BDO)
              </option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
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
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || paymentData.amountPaid <= 0}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Recording..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
