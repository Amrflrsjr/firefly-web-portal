import React from "react";
import type { QuotationResponseDto } from "../../types/quotation";
import { quotationApi } from "../../api/quotations";
import {
  X,
  Pencil,
  Download,
  Mail,
  Trash2,
  Eye,
  FileText,
  Calendar,
  User,
  Building2,
} from "lucide-react";

interface QuotationDetailsModalProps {
  quotation: QuotationResponseDto;
  onClose: () => void;
  onEditStatus: () => void;
  onDeleteQuotation: (quotationId: number) => void;
  onOpenEmail: () => void;
  onPreviewPdf: (quotationId: number, quotationNumber: string) => void;
}

export const QuotationDetailsModal: React.FC<QuotationDetailsModalProps> = ({
  quotation,
  onClose,
  onEditStatus,
  onDeleteQuotation,
  onOpenEmail,
  onPreviewPdf,
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

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "sent":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "cancelled":
      case "declined":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-amber-50 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Accent Gradient/Bar using Brand Palette */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158]" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-brrom-[#FFCB62]/30 to-[#F4D158]/30 flex items-center justify-center text-slate-800 shadow-xs">
              <FileText className="w-5 h-5 text-[#F9B53F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {quotation.quotationNumber}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${getStatusBadgeStyle(
                    quotation.status,
                  )}`}
                >
                  {quotation.status || "Created"}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Quotation Overview
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

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FCFDFF]">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200/60 shadow-2xs">
            <button
              onClick={onEditStatus}
              className="flex-1 min-w-22.5 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-400" /> Status
            </button>

            <button
              onClick={() =>
                onPreviewPdf(quotation.quotationId, quotation.quotationNumber)
              }
              className="flex-1 min-w-22.5 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" /> Preview
            </button>

            <button
              onClick={handlePdfDownload}
              className="flex-1 min-w-22.5 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" /> PDF
            </button>

            <button
              onClick={onOpenEmail}
              className="flex-1 min-w-22.5 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" /> Email
            </button>

            <button
              onClick={() => onDeleteQuotation(quotation.quotationId)}
              className="inline-flex items-center justify-center text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 px-3.5 py-2 rounded-xl border border-rose-100 transition-all cursor-pointer"
              title="Cancel Quotation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-[#F9B53F]" /> Customer
              </div>
              <p className="font-bold text-slate-800 text-sm truncate">
                {quotation.companyName || "N/A"}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-[#F9B53F]" /> Contact Person
              </div>
              <p className="font-bold text-slate-800 text-sm truncate">
                {quotation.contactNameSnapshot || "N/A"}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {quotation.contactEmailSnapshot || "No email provided"}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-[#F9B53F]" /> Date Created
              </div>
              <p className="font-bold text-slate-800 text-sm font-mono">
                {quotation.createdAt
                  ? new Date(quotation.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Item Breakdown
            </h3>
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/75 text-slate-500 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3.5">SKU / Item</th>
                    <th className="p-3.5">Variant</th>
                    <th className="p-3.5 text-center">Qty</th>
                    <th className="p-3.5 text-right">Unit Price</th>
                    <th className="p-3.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotation.items?.map((item, idx) => {
                    const qty = item.quantity ?? 1;
                    const price = item.unitPrice ?? 0;
                    const total = item.lineTotal ?? qty * price;

                    return (
                      <tr
                        key={item.quotationItemId || idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            {item.sku && (
                              <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-md">
                                {item.sku}
                              </span>
                            )}
                            <span className="font-semibold text-slate-800">
                              {item.productName ||
                                item.variantDescription ||
                                "Custom Item"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">
                          {item.variantDescription || "N/A"}
                        </td>
                        <td className="p-3.5 text-center font-medium text-slate-700">
                          {qty}
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-600">
                          PHP {price.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          PHP {total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary Box */}
          <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#F4D158]">
                Grand Total Amount
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Includes applicable local calculations & tax rules
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs text-slate-400 mr-1.5 font-bold">
                PHP
              </span>
              <span className="text-xl font-black text-[#FFCB62]">
                {(quotation.totalAmount ?? 0).toFixed(2)}
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
