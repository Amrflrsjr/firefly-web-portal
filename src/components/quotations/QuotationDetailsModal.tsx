import React from "react";
import type { QuotationResponseDto } from "../../types/quotation";
import { quotationApi } from "../../api/quotations";
import { X, Pencil, Download, Mail } from "lucide-react";

interface QuotationDetailsModalProps {
  quotation: QuotationResponseDto;
  onClose: () => void;
  onEditStatus: () => void;
  onOpenEmail: () => void;
}

export const QuotationDetailsModal: React.FC<QuotationDetailsModalProps> = ({
  quotation,
  onClose,
  onEditStatus,
  onOpenEmail,
}) => {
  const handlePdfDownload = async () => {
    try {
      await quotationApi.downloadPdf(
        quotation.quotationId,
        quotation.quotationNumber,
      );
    } catch {
      alert("Failed to download PDF document.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <span className="font-mono text-xs text-slate-400 font-bold uppercase">
              {quotation.quotationNumber}
            </span>
            <h2 className="text-xl font-bold text-slate-800">
              Quotation Details
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEditStatus}
              className="inline-flex items-center gap-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" /> Status
            </button>
            <button
              onClick={handlePdfDownload}
              className="inline-flex items-center gap-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={onOpenEmail}
              className="inline-flex items-center gap-1 text-xs font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" /> Email
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <p className="font-bold text-slate-400 uppercase">Customer</p>
            <p className="font-semibold text-slate-800 text-sm mt-0.5">
              {quotation.customerName}
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-400 uppercase">Contact</p>
            <p className="font-semibold text-slate-800 mt-0.5">
              {quotation.contactNameSnapshot || "N/A"}
            </p>
            <p className="text-slate-500">{quotation.contactEmailSnapshot}</p>
          </div>
          <div>
            <p className="font-bold text-slate-400 uppercase">Created At</p>
            <p className="font-semibold text-slate-800 mt-0.5">
              {quotation.createdAt
                ? new Date(quotation.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-2 mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase">
            Line Items
          </p>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">SKU / Item</th>
                  <th className="p-3">Variant</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotation.items?.map((item, idx) => {
                  const qty = item.quantity ?? 1;
                  const price = item.unitPrice ?? 0;
                  const total = item.lineTotal ?? qty * price;

                  return (
                    <tr key={item.quotationItemId || idx}>
                      <td className="p-3">
                        {item.sku && (
                          <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded mr-1.5">
                            {item.sku}
                          </span>
                        )}
                        <span className="font-medium text-slate-800">
                          {item.productName || "Custom Item"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {item.variantDescription || "N/A"}
                      </td>
                      <td className="p-3 text-center">{qty}</td>
                      <td className="p-3 text-right font-mono">
                        PHP {price.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        PHP {total.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="border-t border-slate-100 pt-4 flex justify-end">
          <div className="w-full max-w-xs space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
              <span>Total Amount:</span>
              <span>PHP {(quotation.totalAmount ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
