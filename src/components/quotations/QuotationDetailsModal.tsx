import React from "react";
import type { QuotationResponseDto } from "../../types/quotation";
import {
  X,
  FileText,
  Calendar,
  User,
  Building2,
  Receipt,
  ShieldCheck,
} from "lucide-react";

interface QuotationDetailsModalProps {
  quotation: QuotationResponseDto;
  onClose: () => void;
}

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
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "sent":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "cancelled":
      case "declined":
        return "bg-rose-50 text-rose-700 border-rose-200/60";
      default:
        return "bg-amber-50 text-amber-800 border-amber-200/60";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-100 w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158] shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F9B53F] shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-black text-slate-400 uppercase tracking-wider">
                  {quotation.quotationNumber}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border capitalize shadow-2xs ${getStatusBadgeStyle(
                    quotation.status,
                  )}`}
                >
                  {quotation.status || "Created"}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                Quotation Overview
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/70 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-[#F9B53F]" /> Customer
                Entity
              </div>
              <p className="font-extrabold text-slate-800 text-sm truncate">
                {quotation.companyName || "N/A"}
              </p>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/70 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-[#F9B53F]" /> Contact Person
              </div>
              <p className="font-extrabold text-slate-800 text-sm truncate">
                {quotation.contactNameSnapshot || "N/A"}
              </p>
              <p className="text-xs text-slate-400 truncate font-medium">
                {quotation.contactEmailSnapshot || "No email provided"}
              </p>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/70 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-[#F9B53F]" /> Date
                Generated
              </div>
              <p className="font-extrabold text-slate-800 text-sm font-mono">
                {quotation.createdAt
                  ? new Date(quotation.createdAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Line Items Table Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Item Breakdown
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200/70 shadow-2xs">
                {quotation.items?.length || 0} item(s)
              </span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-extrabold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">SKU / Item</th>
                    <th className="py-3.5 px-4">Variant</th>
                    <th className="py-3.5 px-4 text-center">Qty</th>
                    <th className="py-3.5 px-4 text-right">Unit Price</th>
                    <th className="py-3.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotation.items?.map((item, idx) => {
                    const qty = item.quantity ?? 1;
                    const price = item.unitPrice ?? 0;
                    const total = item.totalAmount ?? qty * price;

                    let variantText = "—";
                    if (item.color && item.size) {
                      variantText = `${item.color} / ${item.size}`;
                    } else if (item.color) {
                      variantText = item.color;
                    } else if (item.size) {
                      variantText = item.size;
                    }

                    return (
                      <tr
                        key={item.quotationItemId || idx}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {item.sku && (
                              <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md shadow-2xs">
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
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {variantText}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {qty}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600 font-medium">
                          ₱{price.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-2 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F9B53F]" /> Note /
                  Payment Terms
                </span>
                <p className="text-xs text-slate-600 italic mt-2 leading-relaxed">
                  {detail.noteToCustomer ||
                    "No specific terms provided for this quotation."}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                Valid until review acceptance.
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-2.5 text-xs font-semibold shadow-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">
                  ₱{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-amber-500" /> VAT
                  Calculation ({vatType}):
                </span>
                <span className="font-mono font-bold text-slate-900">
                  ₱{taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-3 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono text-amber-600 text-lg">
                  ₱{grandTotal.toFixed(2)}
                </span>
              </div>
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
