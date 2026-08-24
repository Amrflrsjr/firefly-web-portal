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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158]" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 flex items-center justify-center text-slate-800 shadow-2xs">
              <Receipt className="w-5 h-5 text-[#F9B53F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {invoice.invoiceNumber}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${getStatusBadgeStyle(
                    invoice.status,
                  )}`}
                >
                  {invoice.status === "PartiallyPaid"
                    ? "Partially Paid"
                    : invoice.status}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {invoice.companyName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#FCFDFF]">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200/60 shadow-2xs">
            <button
              onClick={() =>
                onPreviewPdf(invoice.invoiceId, invoice.invoiceNumber)
              }
              className="flex-1 min-w-21.25 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" /> Preview
            </button>

            <button
              onClick={() =>
                onDownloadPdf(invoice.invoiceId, invoice.invoiceNumber)
              }
              className="flex-1 min-w-21.25 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" /> PDF
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenEmail(invoice);
              }}
              className="flex-1 min-w-21.25 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-3.5 py-2 rounded-xl border border-blue-200 transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" /> Email
            </button>

            {(invoice.balanceDue ?? 0) > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPayment(invoice);
                }}
                className="flex-1 min-w-27.5 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" /> Pay
              </button>
            )}

            <button
              onClick={() => onDeleteInvoice(invoice.invoiceId)}
              className="inline-flex items-center justify-center text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 px-3.5 py-2 rounded-xl border border-rose-100 transition-all cursor-pointer"
              title="Cancel Invoice"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Payment History Section */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Payment Transactions
            </p>
            {invoice.payments?.length === 0 ? (
              <div className="p-4 text-center bg-white rounded-2xl border border-slate-200/70 text-slate-400 text-xs italic">
                No payments recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {invoice.payments?.map((p) => (
                  <div
                    key={p.paymentId}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200/70 shadow-2xs flex items-center justify-between text-sm"
                  >
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        {p.paymentMethod}
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">
                        Ref: {p.referenceNumber || "N/A"}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100 text-xs">
                      + PHP {(p.amountPaid ?? 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Totals Box */}
          <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#F4D158]">
                Remaining Balance Due
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Total unpaid balance on invoice
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs text-slate-400 mr-1.5 font-bold">
                PHP
              </span>
              <span className="text-xl font-black text-rose-400">
                {(invoice.balanceDue ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Close Bar */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
