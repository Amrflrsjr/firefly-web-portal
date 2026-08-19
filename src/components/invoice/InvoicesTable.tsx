import React from "react";
import { Eye, Receipt } from "lucide-react";
import type { InvoiceResponseDto } from "../../types/invoice";

interface InvoicesTableProps {
  loading: boolean;
  invoices: InvoiceResponseDto[];
  onViewDetails: (inv: InvoiceResponseDto) => void;
  onViewPdf: (invoiceId: number, invoiceNumber: string) => void;
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  loading,
  invoices,
  onViewDetails,
  onViewPdf,
}) => {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading invoices...
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        No invoices found. Convert an existing quotation to generate an invoice.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "partiallypaid":
      case "partially paid":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-slate-50 text-slate-700 border-slate-200";
      case "unpaid":
      default:
        return "bg-red-50 text-red-700 border-red-200";
    }
  };

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
          <th className="p-4">Invoice #</th>
          <th className="p-4">Customer</th>
          <th className="p-4">Issue Date</th>
          <th className="p-4">Status</th>
          <th className="p-4 text-right">Balance Due</th>
          <th className="p-4 text-right">Total Amount</th>
          <th className="p-4 text-center">Preview</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {invoices.map((inv) => (
          <tr
            key={inv.invoiceId}
            onClick={() => onViewDetails(inv)}
            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
          >
            <td className="p-4 font-bold text-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFCB62]/20 text-[#F9B53F] font-bold flex items-center justify-center text-xs group-hover:bg-[#FFCB62]/40 transition-colors">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs text-slate-900">
                  {inv.invoiceNumber}
                </span>
              </div>
            </td>
            <td className="p-4">
              <div className="font-semibold text-slate-800">
                {inv.companyName}
              </div>
              <div className="text-xs text-slate-400">
                Quote #{inv.quotationNumber}
              </div>
            </td>
            <td className="p-4 text-xs text-slate-600 font-mono">
              {new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}
            </td>
            <td className="p-4">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(
                  inv.status,
                )}`}
              >
                {inv.status === "PartiallyPaid" ? "Partially Paid" : inv.status}
              </span>
            </td>
            <td className="p-4 text-right font-bold text-red-600 font-mono text-xs">
              PHP {(inv.balanceDue ?? 0).toFixed(2)}
            </td>
            <td className="p-4 text-right font-bold text-slate-800 font-mono text-xs">
              PHP {(inv.totalAmount ?? 0).toFixed(2)}
            </td>
            <td className="p-4 text-center">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevents row's onViewDetails from firing
                  onViewPdf(inv.invoiceId, inv.invoiceNumber);
                }}
                title="Preview PDF"
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                <Eye className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
