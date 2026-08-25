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
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "partiallypaid":
      case "partially paid":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "cancelled":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "unpaid":
      default:
        return "bg-rose-50 text-rose-700 border-rose-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden my-8 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-2xs">
              <Receipt className="w-5 h-5 text-[#F9B53F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-slate-400 uppercase tracking-wider">
                  {invoice.invoiceNumber}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border capitalize ${getStatusBadgeStyle(
                    invoice.status,
                  )}`}
                >
                  {invoice.status === "PartiallyPaid"
                    ? "Partially Paid"
                    : invoice.status}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight truncate max-w-md">
                {invoice.companyName}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/80 transition-colors cursor-pointer shadow-2xs"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {/* Action Toolbar Card */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <button
              onClick={() =>
                onPreviewPdf(invoice.invoiceId, invoice.invoiceNumber)
              }
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Eye className="w-4 h-4 text-blue-500" /> Preview
            </button>

            <button
              onClick={() =>
                onDownloadPdf(invoice.invoiceId, invoice.invoiceNumber)
              }
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-500" /> PDF
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenEmail(invoice);
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Mail className="w-4 h-4" /> Email
            </button>

            {(invoice.balanceDue ?? 0) > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPayment(invoice);
                }}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl border border-emerald-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <DollarSign className="w-4 h-4" /> Pay
              </button>
            )}

            <button
              onClick={() => onDeleteInvoice(invoice.invoiceId)}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2.5 rounded-xl border border-rose-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Cancel Invoice"
            >
              <Trash2 className="w-4 h-4" />
              <span className="inline sm:hidden">Cancel Invoice</span>
            </button>
          </div>

          {/* Payment History Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Payment Transactions
            </h3>
            {invoice.payments?.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-400 text-xs italic shadow-2xs">
                No payments recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {invoice.payments?.map((p) => (
                  <div
                    key={p.paymentId}
                    className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                  >
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-slate-800 flex items-center gap-2 text-xs sm:text-sm">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        {p.paymentMethod}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        Ref: {p.referenceNumber || "N/A"}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 text-xs self-start sm:self-auto">
                      + PHP {(p.amountPaid ?? 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Totals Box */}
          <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#F4D158]">
                Remaining Balance Due
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Total unpaid balance on invoice
              </p>
            </div>
            <div className="text-left sm:text-right font-mono">
              <span className="text-xs text-slate-400 mr-1.5 font-bold">
                PHP
              </span>
              <span className="text-xl font-black text-rose-400">
                {(invoice.balanceDue ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-white shrink-0 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
