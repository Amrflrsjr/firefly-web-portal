import React, { useState, useMemo } from "react";
import type { InvoiceResponseDto } from "../../types/invoice";
import api from "../../api/axios";
import {
  Receipt,
  Eye,
  Download,
  Mail,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CreditCard,
  ChevronDown,
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

const currency = (value: number) =>
  `₱${(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const processedInvoices = useMemo(() => {
    if (!invoices) return [];

    const sorted = [...invoices];
    sorted.sort((a, b) => {
      if (sortBy?.toLowerCase() === "createdat" || !sortBy) {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        if (timeA !== timeB) {
          return ascending ? timeA - timeB : timeB - timeA;
        }
        return ascending
          ? a.invoiceId - b.invoiceId
          : b.invoiceId - a.invoiceId;
      }

      const valA = a[sortBy as keyof InvoiceResponseDto];
      const valB = b[sortBy as keyof InvoiceResponseDto];

      if (typeof valA === "string" && typeof valB === "string") {
        return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      const numA = Number(valA || 0);
      const numB = Number(valB || 0);
      return ascending ? numA - numB : numB - numA;
    });

    return sorted;
  }, [invoices, sortBy, ascending]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-sm font-medium flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="w-6 h-6 border-2 border-[#F9B53F] border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          Loading Invoice Catalog...
        </span>
      </div>
    );
  }

  if (processedInvoices.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm font-medium">
        No invoices found. Convert an existing quotation to generate an invoice.
      </div>
    );
  }

  const totalPages = Math.ceil(processedInvoices.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentInvoices = processedInvoices.slice(
    startIndex,
    startIndex + pageSize,
  );

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50";
      case "partiallypaid":
      case "partially paid":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/80 dark:hover:bg-amber-900/50";
      case "cancelled":
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-750";
      case "unpaid":
      default:
        return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 hover:bg-rose-100/80 dark:hover:bg-rose-900/50";
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

  const handleStatusChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    invoiceId: number,
  ) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    onUpdateStatus(invoiceId, newStatus);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
      );
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
            <tr className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
              <th
                onClick={() => onSort("invoicenumber")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Invoice #{renderSortIcon("invoicenumber")}
                </div>
              </th>
              <th
                onClick={() => onSort("customer")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Customer {renderSortIcon("customer")}
                </div>
              </th>
              <th
                onClick={() => onSort("createdat")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Date Created {renderSortIcon("createdat")}
                </div>
              </th>
              <th
                onClick={() => onSort("status")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Status {renderSortIcon("status")}
                </div>
              </th>
              <th
                onClick={() => onSort("totalamount")}
                className="py-3.5 px-6 text-right cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Total Amount {renderSortIcon("totalamount")}
                </div>
              </th>
              <th
                onClick={() => onSort("balancedue")}
                className="py-3.5 px-6 text-right cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Balance Due {renderSortIcon("balancedue")}
                </div>
              </th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
            {currentInvoices.map((inv) => {
              return (
                <tr
                  key={inv.invoiceId}
                  onClick={() => onViewDetails(inv)}
                  className="hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-6 text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 text-[#F9B53F] dark:text-amber-400 font-bold flex items-center justify-center text-xs shadow-2xs group-hover:scale-105 transition-transform">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-900 dark:group-hover:text-amber-300 transition-colors">
                      {inv.companyName}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                      Quote #{inv.quotationNumber}
                    </div>
                  </td>

                  <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>

                  <td
                    className="py-4 px-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative inline-flex items-center">
                      <select
                        value={inv.status || "Unpaid"}
                        onChange={(e) => handleStatusChange(e, inv.invoiceId)}
                        className={`appearance-none cursor-pointer pl-3 pr-7 py-1 rounded-full text-xs font-bold border transition-all duration-200 outline-none focus:ring-2 focus:ring-amber-400/40 shadow-xs ${getStatusBadgeStyle(
                          inv.status,
                        )}`}
                      >
                        <option
                          value="Unpaid"
                          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
                        >
                          Unpaid
                        </option>
                        <option
                          value="PartiallyPaid"
                          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
                        >
                          Partially Paid
                        </option>
                        <option
                          value="Paid"
                          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
                        >
                          Paid
                        </option>
                        <option
                          value="Cancelled"
                          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
                        >
                          Cancelled
                        </option>
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-2.5 pointer-events-none opacity-60" />
                    </div>
                  </td>

                  <td className="py-4 px-6 text-right font-bold text-slate-900 dark:text-white font-mono text-xs">
                    {currency(inv.totalAmount ?? 0)}
                  </td>

                  <td className="py-4 px-6 text-right font-bold text-rose-600 dark:text-rose-400 font-mono text-xs">
                    {currency(inv.balanceDue ?? 0)}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onRecordPayment(inv)}
                        title="Record Payment"
                        className="p-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl transition-all duration-150 shadow-2xs active:scale-95 cursor-pointer inline-flex items-center justify-center"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          onViewPdf(inv.invoiceId, inv.invoiceNumber)
                        }
                        title="Preview PDF"
                        className="p-2 bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handlePdfDownload(e, inv)}
                        title="Download PDF"
                        className="p-2 bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenEmail(inv)}
                        title="Send Email"
                        className="p-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-medium rounded-xl transition-all duration-150 shadow-2xs hover:shadow-amber-500/20 active:scale-95 cursor-pointer inline-flex items-center justify-center"
                      >
                        <Mail className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteInvoice(inv.invoiceId)}
                        title="Delete Invoice"
                        className="p-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100/80 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 rounded-xl transition-all duration-150 shadow-2xs active:scale-95 cursor-pointer inline-flex items-center justify-center"
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {Math.min(startIndex + pageSize, processedInvoices.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {processedInvoices.length}
            </span>{" "}
            results
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
