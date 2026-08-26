import React, { useState } from "react";
import type { InvoiceResponseDto } from "../../types/invoice";
import api from "../../api/axios";
import {
  Receipt,
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
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

interface InvoicesTableProps {
  loading: boolean;
  invoices: InvoiceResponseDto[];
  sortBy: string;
  ascending: boolean;
  onSort: (field: string) => void;
  onViewDetails: (inv: InvoiceResponseDto) => void;
  onViewPdf: (invoiceId: number, invoiceNumber: string) => void;
  onOpenEmail: (invoice: InvoiceResponseDto) => void;
  onRecordPayment: (invoice: InvoiceResponseDto) => void;
  onUpdateStatus: (invoiceId: number, newStatus: string) => void;
  onDeleteInvoice: (invoiceId: number) => void;
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  loading,
  invoices,
  sortBy,
  ascending,
  onSort,
  onViewDetails,
  onViewPdf,
  onOpenEmail,
  onRecordPayment,
  onUpdateStatus,
  onDeleteInvoice,
}) => {
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("Unpaid");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm font-medium flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="w-6 h-6 border-2 border-[#F9B53F] border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold text-slate-600">
          Loading Invoice Catalog...
        </span>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm font-medium">
        No invoices found. Convert an existing quotation to generate an invoice.
      </div>
    );
  }

  const totalPages = Math.ceil(invoices.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentInvoices = invoices.slice(startIndex, startIndex + pageSize);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "partiallypaid":
      case "partially paid":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "cancelled":
        return "bg-slate-100 text-slate-600 border-slate-200/80";
      case "unpaid":
      default:
        return "bg-rose-50 text-rose-700 border-rose-200/80";
    }
  };

  const handlePdfDownload = async (
    e: React.MouseEvent,
    inv: InvoiceResponseDto,
  ) => {
    e.stopPropagation();
    try {
      const response = await api.get(`/invoices/${inv.invoiceId}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Invoice_${inv.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF document.");
    }
  };

  const handleStartEditStatus = (
    e: React.MouseEvent,
    inv: InvoiceResponseDto,
  ) => {
    e.stopPropagation();
    setEditingStatusId(inv.invoiceId);
    setSelectedStatus(inv.status || "Unpaid");
  };

  const handleSaveStatus = (e: React.MouseEvent, invoiceId: number) => {
    e.stopPropagation();
    onUpdateStatus(invoiceId, selectedStatus);
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
                onClick={() => onSort("invoicenumber")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Invoice #{renderSortIcon("invoicenumber")}
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
              <th
                onClick={() => onSort("issuedate")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Issue Date
                  {renderSortIcon("issuedate")}
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
                onClick={() => onSort("balancedue")}
                className="py-3.5 px-6 text-right cursor-pointer hover:text-slate-700 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Balance Due
                  {renderSortIcon("balancedue")}
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
            {currentInvoices.map((inv) => {
              const isEditingStatus = editingStatusId === inv.invoiceId;

              return (
                <tr
                  key={inv.invoiceId}
                  onClick={() => !isEditingStatus && onViewDetails(inv)}
                  className="hover:bg-[#FCFDFF] transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-6 text-slate-800">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 text-[#F9B53F] font-bold flex items-center justify-center text-xs shadow-2xs group-hover:scale-105 transition-transform">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                      {inv.companyName}
                    </div>
                    <div className="text-xs text-slate-400 font-normal mt-0.5">
                      Quote #{inv.quotationNumber}
                    </div>
                  </td>

                  <td className="py-4 px-6 text-xs text-slate-600 font-mono">
                    {new Date(
                      inv.issueDate || inv.createdAt,
                    ).toLocaleDateString()}
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
                          <option value="Unpaid">Unpaid</option>
                          <option value="PartiallyPaid">Partially Paid</option>
                          <option value="Paid">Paid</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <button
                          type="button"
                          onClick={(e) => handleSaveStatus(e, inv.invoiceId)}
                          className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStatusId(null);
                          }}
                          className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2">
                        <span
                          className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${getStatusBadge(
                            inv.status,
                          )}`}
                        >
                          {inv.status === "PartiallyPaid"
                            ? "Partially Paid"
                            : inv.status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleStartEditStatus(e, inv)}
                          title="Edit Status"
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-6 text-right font-bold text-rose-600 font-mono text-xs">
                    PHP {(inv.balanceDue ?? 0).toFixed(2)}
                  </td>

                  <td className="py-4 px-6 text-right font-bold text-slate-900 font-mono text-xs">
                    PHP {(inv.totalAmount ?? 0).toFixed(2)}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onRecordPayment(inv)}
                        title="Record Payment"
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center hover:scale-105"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          onViewPdf(inv.invoiceId, inv.invoiceNumber)
                        }
                        title="Preview PDF"
                        className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center hover:scale-105"
                      >
                        <Eye className="w-4 h-4 text-blue-500" />
                      </button>

                      <button
                        onClick={(e) => handlePdfDownload(e, inv)}
                        title="Download PDF"
                        className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center hover:scale-105"
                      >
                        <Download className="w-4 h-4 text-emerald-500" />
                      </button>

                      <button
                        onClick={() => onOpenEmail(inv)}
                        title="Send Email"
                        className="p-2 bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-xl transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center hover:scale-105"
                      >
                        <Mail className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteInvoice(inv.invoiceId)}
                        title="Delete Invoice"
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
              {Math.min(startIndex + pageSize, invoices.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700">{invoices.length}</span>{" "}
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
