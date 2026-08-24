import React, { useState } from "react";
import type { QuotationResponseDto } from "../../types/quotation";
import { quotationApi } from "../../api/quotations";
import {
  FileText,
  Eye,
  Download,
  Mail,
  Trash2,
  Check,
  X,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import toast from "react-hot-toast";

interface QuotationTableProps {
  loading: boolean;
  quotations: QuotationResponseDto[];
  sortBy: string;
  ascending: boolean;
  onSort: (field: string) => void;
  onView: (quotation: QuotationResponseDto) => void;
  onViewPdf: (quotationId: number, quotationNumber: string) => void;
  onOpenEmail: (quotation: QuotationResponseDto) => void;
  onUpdateStatus: (quotationId: number, newStatus: string) => void;
  onDeleteQuotation: (quotationId: number) => void;
}

export const QuotationTable: React.FC<QuotationTableProps> = ({
  loading,
  quotations,
  sortBy,
  ascending,
  onSort,
  onView,
  onViewPdf,
  onOpenEmail,
  onUpdateStatus,
  onDeleteQuotation,
}) => {
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("Draft");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm font-medium">
        Loading quotations directory...
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm font-medium">
        No quotations found. Click{" "}
        <b className="text-slate-700">"+ Create Quotation"</b> above to generate
        one.
      </div>
    );
  }

  const totalPages = Math.ceil(quotations.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentQuotations = quotations.slice(startIndex, startIndex + pageSize);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "sent":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "declined":
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      default:
        return "bg-amber-50 text-amber-800 border-amber-200/80";
    }
  };

  const handlePdfDownload = async (
    e: React.MouseEvent,
    q: QuotationResponseDto,
  ) => {
    e.stopPropagation();
    try {
      await quotationApi.downloadPdf(q.quotationId, q.quotationNumber);
    } catch {
      toast.error("Failed to download PDF document.");
    }
  };

  const handleStartEditStatus = (
    e: React.MouseEvent,
    q: QuotationResponseDto,
  ) => {
    e.stopPropagation();
    setEditingStatusId(q.quotationId);
    setSelectedStatus(q.status || "Draft");
  };

  const handleSaveStatus = (e: React.MouseEvent, quotationId: number) => {
    e.stopPropagation();
    onUpdateStatus(quotationId, selectedStatus);
    setEditingStatusId(null);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400" />;
    }
    return ascending ? (
      <ArrowUp className="w-3 h-3 text-[#F9B53F]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#F9B53F]" />
    );
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              <th
                onClick={() => onSort("quotationnumber")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Quotation #{renderSortIcon("quotationnumber")}
                </div>
              </th>
              <th
                onClick={() => onSort("customer")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Customer
                  {renderSortIcon("customer")}
                </div>
              </th>
              <th className="py-3.5 px-6">Contact</th>
              <th
                onClick={() => onSort("createdat")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Date Created
                  {renderSortIcon("createdat")}
                </div>
              </th>
              <th
                onClick={() => onSort("status")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Status
                  {renderSortIcon("status")}
                </div>
              </th>
              <th
                onClick={() => onSort("totalamount")}
                className="py-3.5 px-6 text-right cursor-pointer hover:text-slate-700 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Total Amount
                  {renderSortIcon("totalamount")}
                </div>
              </th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-medium">
            {currentQuotations.map((q) => {
              const isEditingStatus = editingStatusId === q.quotationId;

              return (
                <tr
                  key={q.quotationId}
                  onClick={() => !isEditingStatus && onView(q)}
                  className="hover:bg-[#FCFDFF] transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-6 text-slate-800">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 text-[#F9B53F] font-bold flex items-center justify-center text-xs shadow-2xs group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {q.quotationNumber}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-6 font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                    {q.companyName || "N/A"}
                  </td>

                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-800">
                      {q.contactNameSnapshot || "N/A"}
                    </div>
                    <div className="text-xs text-slate-400 font-normal mt-0.5">
                      {q.contactEmailSnapshot || "No email provided"}
                    </div>
                  </td>

                  <td className="py-4 px-6 text-xs text-slate-600 font-mono">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-4 px-6">
                    {isEditingStatus ? (
                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="bg-white border border-slate-300 rounded-xl px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Sent">Sent</option>
                          <option value="Approved">Approved</option>
                          <option value="Declined">Declined</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <button
                          type="button"
                          onClick={(e) => handleSaveStatus(e, q.quotationId)}
                          className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStatusId(null);
                          }}
                          className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2">
                        <span
                          className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border capitalize shadow-2xs ${getStatusBadge(
                            q.status,
                          )}`}
                        >
                          {q.status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleStartEditStatus(e, q)}
                          title="Edit Status"
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-6 text-right font-bold text-slate-900 font-mono text-xs">
                    PHP {q.totalAmount.toFixed(2)}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          onViewPdf(q.quotationId, q.quotationNumber)
                        }
                        title="Preview PDF"
                        className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center hover:scale-105"
                      >
                        <Eye className="w-4 h-4 text-blue-500" />
                      </button>

                      <button
                        onClick={(e) => handlePdfDownload(e, q)}
                        title="Download PDF"
                        className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center hover:scale-105"
                      >
                        <Download className="w-4 h-4 text-emerald-500" />
                      </button>

                      <button
                        onClick={() => onOpenEmail(q)}
                        title="Send Email"
                        className="p-2 bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-xl transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center hover:scale-105"
                      >
                        <Mail className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteQuotation(q.quotationId)}
                        title="Delete Quotation"
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center hover:scale-105"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/80 bg-white">
          <p className="text-xs text-slate-500 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-700">{startIndex + 1}</span>{" "}
            to{" "}
            <span className="font-bold text-slate-700">
              {Math.min(startIndex + pageSize, quotations.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700">
              {quotations.length}
            </span>{" "}
            results
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
