import React from "react";
import type { QuotationResponseDto } from "../../types/quotation";
import {
  X,
  Eye,
  Download,
  Mail,
  Edit,
  Trash2,
  Loader2,
  FileText,
} from "lucide-react";

interface QuotationDetailsModalProps {
  quotation: QuotationResponseDto;
  onClose: () => void;
  onViewPdf?: (quotationId: number, quotationNumber: string) => void;
  onDownloadPdf?: (
    e: React.MouseEvent,
    quotation: QuotationResponseDto,
  ) => void;
  onOpenEmail?: (quotation: QuotationResponseDto) => void;
  onEdit?: (quotation: QuotationResponseDto) => void;
  onDeleteQuotation?: (quotationId: number) => void;
  loadingPdfId?: number | null;
  downloadingPdfId?: number | null;
}

interface QuotationDetailView extends QuotationResponseDto {
  vatType?: string;
  VATType?: string;
  noteToCustomer?: string | null;
}

const currency = (value: number) =>
  `₱${(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const QuotationDetailsModal: React.FC<QuotationDetailsModalProps> = ({
  quotation,
  onClose,
  onViewPdf,
  onDownloadPdf,
  onOpenEmail,
  onEdit,
  onDeleteQuotation,
  loadingPdfId,
  downloadingPdfId,
}) => {
  const detail = quotation as QuotationDetailView;
  const isEditable =
    quotation.status === "Created" || quotation.status === "Draft";
  const isPdfLoading = loadingPdfId === quotation.quotationId;
  const isDownloading = downloadingPdfId === quotation.quotationId;

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "accepted":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60";
      case "sent":
        return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60";
      case "cancelled":
      case "declined":
        return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-900/60";
      default:
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60";
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-100 dark:border-slate-800 w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158] shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-[#F9B53F] dark:text-amber-400 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Quotation Overview
                </h2>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                  {quotation.quotationNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Detailed view and summary parameters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-[10px] font-extrabold px-3 py-1 rounded-full border capitalize shadow-2xs ${getStatusBadgeStyle(
                quotation.status,
              )}`}
            >
              {quotation.status || "Created"}
            </span>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-slate-50/50 dark:bg-slate-950/40">
          {/* Streamlined Action Toolbar Card */}
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEmail?.(quotation);
                }}
                className="inline-flex items-center justify-center gap-2 text-xs font-extrabold bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Mail className="w-4 h-4" /> Email Quotation
              </button>

              {isEditable ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit?.(quotation);
                  }}
                  className="inline-flex items-center justify-center gap-2 text-xs font-extrabold bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800 transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Only Created or Draft status can be edited"
                  className="inline-flex items-center justify-center gap-2 text-xs font-extrabold bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-750 cursor-not-allowed"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={isPdfLoading}
                onClick={() =>
                  onViewPdf?.(quotation.quotationId, quotation.quotationNumber)
                }
                className="inline-flex items-center justify-center gap-2 text-xs font-extrabold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPdfLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                ) : (
                  <Eye className="w-4 h-4 text-blue-500" />
                )}{" "}
                Preview PDF
              </button>

              <button
                type="button"
                disabled={isDownloading}
                onClick={(e) => onDownloadPdf?.(e, quotation)}
                className="inline-flex items-center justify-center gap-2 text-xs font-extrabold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                ) : (
                  <Download className="w-4 h-4 text-emerald-500" />
                )}{" "}
                Download
              </button>

              <button
                type="button"
                onClick={() => onDeleteQuotation?.(quotation.quotationId)}
                className="inline-flex items-center justify-center p-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200/80 dark:border-rose-900/60 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Delete Quotation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Customer
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate pt-0.5">
                {quotation.companyName || "N/A"}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Contact Person
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate pt-0.5">
                {quotation.contactNameSnapshot || "N/A"}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate font-normal">
                {quotation.contactEmailSnapshot || "No email provided"}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Date Generated
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm font-mono pt-0.5">
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
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Item Breakdown
              </h3>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200/70 dark:border-slate-800 shadow-2xs">
                {quotation.items?.length || 0} item(s)
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-extrabold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Item</th>
                    <th className="py-3.5 px-4">Variant</th>
                    <th className="py-3.5 px-4 text-center">Quantity</th>
                    <th className="py-3.5 px-4 text-right">Unit Price</th>
                    <th className="py-3.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                              {item.sku && (
                                <span className="font-mono text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 px-2 py-0.5 rounded-md">
                                  {item.sku}
                                </span>
                              )}
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {item.productName || "Custom Item"}
                              </span>
                            </div>
                            {item.description &&
                              item.description !== item.productName &&
                              !item.description.startsWith("Variant:") && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                                  {item.description}
                                </p>
                              )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                          {variantText}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          {qty}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400 font-medium">
                          {currency(price)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                          {currency(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals & Notes Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl space-y-2 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  Note / Payment Terms
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 italic mt-2 leading-relaxed">
                  {detail.noteToCustomer ||
                    "No specific terms provided for this quotation."}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Valid until review acceptance.
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl space-y-2.5 text-xs font-semibold shadow-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {currency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>VAT Calculation ({vatType}):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {currency(taxAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 dark:text-white pt-3 border-t border-slate-200 dark:border-slate-800">
                <span>Grand Total:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 text-lg">
                  {currency(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
