import React, { useState } from "react";
import api from "../../api/axios";
import axios from "axios";
import { X, CreditCard } from "lucide-react";
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-600 font-bold flex items-center justify-center text-xs shadow-2xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Record Payment
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Display Pill */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Outstanding Balance
            </div>
            <div className="text-base font-extrabold font-mono text-slate-900 mt-0.5">
              PHP {balanceDue.toFixed(2)}
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setPaymentData({ ...paymentData, amountPaid: balanceDue })
            }
            className="text-xs font-bold text-[#d99723] hover:text-[#b37a18] bg-amber-50 hover:bg-amber-100 border border-amber-200/60 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            Pay Full Balance
          </button>
        </div>

        {formError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3.5 rounded-xl font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Payment Amount (PHP) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
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
                className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
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
              className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/20 transition-all cursor-pointer"
            >
              <option value="Bank Transfer">
                Bank Transfer (GCash / Maya / BDO)
              </option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
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
              className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/20 transition-all"
            />
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
              disabled={saving || paymentData.amountPaid <= 0}
              className="px-5 py-2.5 text-sm font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? "Recording..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
