import React from "react";
import type { QuotationResponseDto } from "../../types/quotation";
import { X, FileText, Calendar, User, Building2, Receipt } from "lucide-react";

interface QuotationDetailsModalProps {
  quotation: QuotationResponseDto;
  onClose: () => void;
}

// Extended interface to safely access backend properties not in the base DTO
interface QuotationDetailView extends QuotationResponseDto {
  vatType?: string;
  VATType?: string;
  noteToCustomer?: string | null;
}

export const QuotationDetailsModal: React.FC<QuotationDetailsModalProps> = ({
  quotation,
  onClose,
}) => {
  const detail = quotation as QuotationDetailView;

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

  const rawSubtotal =
    quotation.items?.reduce(
      (acc, item) =>
        acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0,
    ) ?? 0;

  const vatType = detail.vatType || detail.VATType || "Exclusive";

  let subtotal: number;
  let taxAmount: number;
  let grandTotal: number;

  if (vatType === "Inclusive" || vatType === "VAT Inclusive") {
    grandTotal = rawSubtotal;
    subtotal = Math.round((rawSubtotal / 1.12) * 100) / 100;
    taxAmount = Math.round((grandTotal - subtotal) * 100) / 100;
  } else if (vatType === "Exclusive" || vatType === "VAT Exclusive") {
    subtotal = rawSubtotal;
    taxAmount = Math.round(rawSubtotal * 0.12 * 100) / 100;
    grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;
  } else {
    subtotal = rawSubtotal;
    taxAmount = 0;
    grandTotal = rawSubtotal;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden my-8 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-2xs">
              <FileText className="w-5 h-5 text-[#F9B53F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-slate-400 uppercase tracking-wider">
                  {quotation.quotationNumber}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border capitalize ${getStatusBadgeStyle(
                    quotation.status,
                  )}`}
                >
                  {quotation.status || "Created"}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Quotation Overview
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/80 transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-[#F9B53F]" /> Customer
              </div>
              <p className="font-extrabold text-slate-800 text-sm truncate">
                {quotation.companyName || "N/A"}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-[#F9B53F]" /> Contact Person
              </div>
              <p className="font-extrabold text-slate-800 text-sm truncate">
                {quotation.contactNameSnapshot || "N/A"}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {quotation.contactEmailSnapshot || "No email provided"}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-[#F9B53F]" /> Date Created
              </div>
              <p className="font-extrabold text-slate-800 text-sm font-mono">
                {quotation.createdAt
                  ? new Date(quotation.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Line Items Table Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Item Breakdown
            </h3>
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
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
                    const total = item.totalAmount ?? qty * price;
                    const variantText =
                      item.color && item.size
                        ? `${item.color} / ${item.size}`
                        : "N/A";

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
                            <span className="font-bold text-slate-800">
                              {item.productName ||
                                item.description ||
                                "Custom Item"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">
                          {variantText}
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-700">
                          {qty}
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-600 font-medium">
                          ₱{price.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-slate-900">
                          ₱{total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals & Tax Computation Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-1 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Note / Payment Terms
              </span>
              <p className="text-xs text-slate-600 italic">
                {detail.noteToCustomer || "No specific terms provided."}
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-2 text-xs font-semibold shadow-2xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">
                  ₱{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-amber-500" /> VAT (
                  {vatType}):
                </span>
                <span className="font-mono font-bold text-slate-900">
                  ₱{taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono text-amber-600 text-base">
                  ₱{grandTotal.toFixed(2)}
                </span>
              </div>
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
