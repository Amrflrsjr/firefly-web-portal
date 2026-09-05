import React from "react";
import {
  X,
  CreditCard,
  Download,
  Mail,
  DollarSign,
  Trash2,
  Eye,
  Receipt,
} from "lucide-react";
import type { InvoiceResponseDto } from "../../types/invoice";

interface Props {
  invoice: InvoiceResponseDto | null;
  onClose: () => void;
  onDownloadPdf: (id: number, number: string) => void;
  onPreviewPdf: (id: number, number: string) => void;
  onOpenEmail: (inv: InvoiceResponseDto) => void;
  onOpenPayment: (inv: InvoiceResponseDto) => void;
  onDeleteInvoice: (invoiceId: number) => void;
}

const currency = (value: number) =>
  `₱${(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const InvoiceDetailsModal: React.FC<Props> = ({
  invoice,
  onClose,
  onDownloadPdf,
  onPreviewPdf,
  onOpenEmail,
  onOpenPayment,
  onDeleteInvoice,
}) => {
  if (!invoice) return null;

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "partiallypaid":
      case "partially paid":
        return "bg-amber-50 text-amber-800 border-amber-200/60";
      case "cancelled":
        return "bg-slate-100 text-slate-600 border-slate-200/60";
      case "unpaid":
      default:
        return "bg-rose-50 text-rose-700 border-rose-200/60";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/15 border border-slate-100 w-full max-w-3xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158] shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F9B53F] shadow-xs">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-black text-slate-400 uppercase tracking-wider">
                  {invoice.invoiceNumber}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border capitalize shadow-2xs ${getStatusBadgeStyle(
                    invoice.status,
                  )}`}
                >
                  {invoice.status === "PartiallyPaid"
                    ? "Partially Paid"
                    : invoice.status}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight truncate max-w-sm sm:max-w-md mt-0.5">
                {invoice.companyName}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {/* Action Toolbar Card */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                onPreviewPdf(invoice.invoiceId, invoice.invoiceNumber)
              }
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 text-xs font-extrabold bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Eye className="w-4 h-4 text-blue-500" /> Preview
            </button>

            <button
              type="button"
              onClick={() =>
                onDownloadPdf(invoice.invoiceId, invoice.invoiceNumber)
              }
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 text-xs font-extrabold bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-500" /> PDF
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEmail(invoice);
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 text-xs font-extrabold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Mail className="w-4 h-4" /> Email
            </button>

            {(invoice.balanceDue ?? 0) > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayment(invoice);
                }}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 text-xs font-extrabold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl border border-emerald-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <DollarSign className="w-4 h-4" /> Record Payment
              </button>
            )}

            <button
              type="button"
              onClick={() => onDeleteInvoice(invoice.invoiceId)}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 text-xs font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2.5 rounded-xl border border-rose-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Cancel Invoice"
            >
              <Trash2 className="w-4 h-4" />
              <span className="inline sm:hidden">Cancel Invoice</span>
            </button>
          </div>

          {/* Payment History Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Payment Transactions
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200/70 shadow-2xs">
                {invoice.payments?.length || 0} transaction(s)
              </span>
            </div>

            {invoice.payments?.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-400 text-xs italic shadow-xs">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {invoice.payments?.map((p) => (
                  <div
                    key={p.paymentId}
                    className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                  >
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-slate-800 flex items-center gap-2 text-xs sm:text-sm">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        {p.paymentMethod}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        Reference No:{" "}
                        <span className="font-mono text-slate-600 font-bold">
                          {p.referenceNumber || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="font-mono font-black text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-100 text-xs self-start sm:self-auto shadow-2xs">
                      + {currency(p.amountPaid ?? 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Totals Box */}
          <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#F4D158]">
                Remaining Balance Due
              </p>
              <p className="text-xs text-slate-300 mt-0.5 font-normal">
                Total outstanding balance pending settlement
              </p>
            </div>
            <div className="text-left sm:text-right font-mono">
              <span className="text-2xl font-black text-rose-400">
                {currency(invoice.balanceDue ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end px-6 sm:px-8 py-4 border-t border-slate-100 bg-white shrink-0 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-extrabold hover:bg-slate-100 transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
