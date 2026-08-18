import React from "react";
import type { QuotationResponseDto } from "../../types/quotation";
import { FileText } from "lucide-react";

interface QuotationTableProps {
  loading: boolean;
  quotations: QuotationResponseDto[];
  onView: (quotation: QuotationResponseDto) => void;
}

export const QuotationTable: React.FC<QuotationTableProps> = ({
  loading,
  quotations,
  onView,
}) => {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading quotations...
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        No quotations found. Click <b>"+ Create Quotation"</b> above to generate
        one.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "sent":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "declined":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
          <th className="p-4">Quotation #</th>
          <th className="p-4">Customer</th>
          <th className="p-4">Contact</th>
          <th className="p-4">Date Created</th>
          <th className="p-4">Status</th>
          <th className="p-4 text-right">Total Amount</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {quotations.map((q) => (
          <tr
            key={q.quotationId}
            onClick={() => onView(q)}
            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
          >
            <td className="p-4 font-bold text-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFCB62]/20 text-[#F9B53F] font-bold flex items-center justify-center text-xs group-hover:bg-[#FFCB62]/40 transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs text-slate-900">
                  {q.quotationNumber}
                </span>
              </div>
            </td>
            <td className="p-4 font-semibold text-slate-800">
              {q.customerName}
            </td>
            <td className="p-4">
              <div className="font-medium text-slate-800">
                {q.contactNameSnapshot || "N/A"}
              </div>
              <div className="text-xs text-slate-400">
                {q.contactEmailSnapshot}
              </div>
            </td>
            <td className="p-4 text-xs text-slate-600 font-mono">
              {new Date(q.createdAt).toLocaleDateString()}
            </td>
            <td className="p-4">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${getStatusBadge(
                  q.status,
                )}`}
              >
                {q.status}
              </span>
            </td>
            <td className="p-4 text-right font-bold text-slate-800 font-mono text-xs">
              PHP {q.totalAmount.toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
