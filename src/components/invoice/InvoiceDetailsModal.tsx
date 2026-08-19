import React from "react";
import {
  X,
  CreditCard,
  Download,
  Mail,
  DollarSign,
  Trash2,
  Eye,
} from "lucide-react";
import type { InvoiceResponseDto } from "../../types/invoice";

interface Props {
  invoice: InvoiceResponseDto | null;
  onClose: () => void;
  onDownloadPdf: (id: number, number: string) => void;
  onPreviewPdf: (id: number, number: string) => void; // Added Preview PDF prop
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

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {invoice.invoiceNumber}
            </h2>
            <p className="text-xs text-slate-500">{invoice.companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-2 py-2">
          <button
            onClick={() =>
              onPreviewPdf(invoice.invoiceId, invoice.invoiceNumber)
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" /> Preview PDF
          </button>

          <button
            onClick={() =>
              onDownloadPdf(invoice.invoiceId, invoice.invoiceNumber)
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>

          <button
            onClick={() => {
              onClose(); // Close details modal when opening email modal
              onOpenEmail(invoice);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4" /> Send Email
          </button>

          {(invoice.balanceDue ?? 0) > 0 && (
            <button
              onClick={() => {
                onClose(); // Close details modal when opening payment modal
                onOpenPayment(invoice);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <DollarSign className="w-4 h-4" /> Record Payment
            </button>
          )}
          <button
            onClick={() => onDeleteInvoice(invoice.invoiceId)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Cancel Invoice
          </button>
        </div>

        {/* Payment History */}
        <div className="pt-2">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">
            Payment Transactions
          </p>
          {invoice.payments?.length === 0 ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
              No payments recorded yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {invoice.payments?.map((p) => (
                <div
                  key={p.paymentId}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-sm"
                >
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      {p.paymentMethod}
                    </div>
                    <div className="text-xs text-slate-400">
                      Ref: {p.referenceNumber || "N/A"}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-emerald-700">
                    + PHP {(p.amountPaid ?? 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Totals */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
          <span className="font-bold text-slate-700">
            Remaining Balance Due:
          </span>
          <span className="font-mono text-base font-bold text-red-600">
            PHP {(invoice.balanceDue ?? 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
