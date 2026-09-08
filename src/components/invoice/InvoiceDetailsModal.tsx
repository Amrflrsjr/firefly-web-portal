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
  Calendar,
  User,
  Building2,
  ShieldCheck,
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

interface InvoiceDetailView extends Omit<
  InvoiceResponseDto,
  "vatType" | "VATType"
> {
  vatType?: string;
  VATType?: string;
  noteToCustomer?: string | null;
}

interface ExtendedInvoiceItem {
  invoiceItemId?: number;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  color?: string;
  size?: string;
  sku?: string;
  productName?: string;
  description?: string;
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

  const detail = invoice as InvoiceDetailView;

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60";
      case "partiallypaid":
      case "partially paid":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60";
      case "cancelled":
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700";
      case "unpaid":
      default:
        return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-900/60";
    }
  };

  const rawSubtotal =
    invoice.items?.reduce(
      (acc, item) =>
        acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0,
    ) ??
    invoice.totalAmount ??
    0;

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
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-900/15 border border-slate-100 dark:border-slate-800 w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158] shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-[#F9B53F] dark:text-amber-400 shadow-xs">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {invoice.invoiceNumber}
                </span>
                {invoice.quotationNumber && (
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                    Quote #{invoice.quotationNumber}
                  </span>
                )}
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
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-sm sm:max-w-md mt-0.5">
                {invoice.companyName}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-slate-50/50 dark:bg-slate-950/40">
          {/* Action Toolbar Card */}
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                onPreviewPdf(invoice.invoiceId, invoice.invoiceNumber)
              }
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 text-xs font-extrabold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Eye className="w-4 h-4 text-blue-500 dark:text-blue-400" />{" "}
              Preview
            </button>

            <button
              type="button"
              onClick={() =>
                onDownloadPdf(invoice.invoiceId, invoice.invoiceNumber)
              }
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 text-xs font-extrabold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />{" "}
              PDF
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
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-4 py-2.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <DollarSign className="w-4 h-4" /> Record Payment
              </button>
            )}

            <button
              type="button"
              onClick={() => onDeleteInvoice(invoice.invoiceId)}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 text-xs font-extrabold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Cancel Invoice"
            >
              <Trash2 className="w-4 h-4" />
              <span className="inline sm:hidden">Cancel Invoice</span>
            </button>
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-[#F9B53F]" /> Customer
                Entity
              </div>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm truncate">
                {invoice.companyName || "N/A"}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-[#F9B53F]" /> Contact Person
              </div>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm truncate">
                {invoice.contactNameSnapshot || "N/A"}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate font-medium">
                {invoice.contactEmailSnapshot || "No email provided"}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-[#F9B53F]" /> Date
                Generated
              </div>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm font-mono">
                {invoice.createdAt
                  ? new Date(invoice.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
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
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200/70 dark:border-slate-800 shadow-2xs">
                {invoice.items?.length || 0} item(s)
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-extrabold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">SKU / Item</th>
                    <th className="py-3.5 px-4">Variant</th>
                    <th className="py-3.5 px-4 text-center">Qty</th>
                    <th className="py-3.5 px-4 text-right">Unit Price</th>
                    <th className="py-3.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoice.items?.map((rawItem, idx) => {
                    const item = rawItem as ExtendedInvoiceItem;
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
                        key={item.invoiceItemId || idx}
                        className="hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {item.sku && (
                              <span className="font-mono text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 px-2 py-0.5 rounded-md shadow-2xs">
                                {item.sku}
                              </span>
                            )}
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {item.productName ||
                                item.description ||
                                "Custom Item"}
                            </span>
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

          {/* Financial Totals & Tax Computation Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl space-y-2 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F9B53F]" /> Note /
                  Payment Terms
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 italic mt-2 leading-relaxed">
                  {detail.noteToCustomer ||
                    "No specific terms provided for this invoice."}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Standard payment terms apply.
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
                <span className="inline-flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-amber-500" /> VAT
                  Calculation ({vatType}):
                </span>
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

          {/* Payment History Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Payment Transactions
              </h3>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200/70 dark:border-slate-800 shadow-2xs">
                {invoice.payments?.length || 0} transaction(s)
              </span>
            </div>

            {invoice.payments?.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs italic shadow-xs">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {invoice.payments?.map((p) => (
                  <div
                    key={p.paymentId}
                    className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                  >
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-xs sm:text-sm">
                        <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        {p.paymentMethod}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        Reference No:{" "}
                        <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                          {p.referenceNumber || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="font-mono font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60 text-xs self-start sm:self-auto shadow-2xs">
                      + {currency(p.amountPaid ?? 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Totals Box */}
          <div className="bg-linear-to-br from-slate-900 to-slate-800 dark:from-slate-850 dark:to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800/80">
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
