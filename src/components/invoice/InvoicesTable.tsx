import React, { useState, useMemo, useRef, useEffect } from "react";
import type { InvoiceResponseDto } from "../../types/invoice";
import {
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
  Loader2,
  MoreVertical,
} from "lucide-react";

interface InvoicesTableProps {
  loading: boolean;
  invoices: InvoiceResponseDto[];
  sortBy: string;
  ascending: boolean;
  searchQuery?: string;
  onSort: (field: string) => void;
  onViewDetails: (inv: InvoiceResponseDto) => void;
  onViewPdf: (invoiceId: number, invoiceNumber: string) => void;
  onDownloadPdf: (invoiceId: number, invoiceNumber: string) => void;
  onOpenEmail: (invoice: InvoiceResponseDto) => void;
  onRecordPayment: (invoice: InvoiceResponseDto) => void;
  onUpdateStatus: (invoiceId: number, newStatus: string) => void;
  onDeleteInvoice: (invoiceId: number) => void;
  loadingPdfId?: number | null;
  downloadingPdfId?: number | null;
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
  searchQuery,
  onSort,
  onViewDetails,
  onViewPdf,
  onDownloadPdf,
  onOpenEmail,
  onRecordPayment,
  onUpdateStatus,
  onDeleteInvoice,
  loadingPdfId,
  downloadingPdfId,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
        setMenuCoords(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const processedInvoices = useMemo(() => {
    if (!invoices) return [];

    const sorted = [...invoices];
    const query = searchQuery?.trim().toLowerCase() || "";

    sorted.sort((a, b) => {
      if (query) {
        const matchA =
          a.invoiceNumber.toLowerCase().includes(query) ||
          (a.companyName && a.companyName.toLowerCase().includes(query)) ||
          (a.quotationNumber &&
            a.quotationNumber.toLowerCase().includes(query));
        const matchB =
          b.invoiceNumber.toLowerCase().includes(query) ||
          (b.companyName && b.companyName.toLowerCase().includes(query)) ||
          (b.quotationNumber &&
            b.quotationNumber.toLowerCase().includes(query));

        if (matchA && !matchB) return -1;
        if (!matchA && matchB) return 1;
      }

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
  }, [invoices, sortBy, ascending, searchQuery]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-xs font-medium flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="w-5 h-5 border-2 border-slate-600 dark:border-slate-300 border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          Loading invoices directory...
        </span>
      </div>
    );
  }

  if (processedInvoices.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
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
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60";
      case "partiallypaid":
      case "partially paid":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60";
      case "cancelled":
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
      case "unpaid":
      default:
        return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60";
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
      <ArrowUp className="w-3 h-3 text-slate-700 dark:text-slate-200" />
    ) : (
      <ArrowDown className="w-3 h-3 text-slate-700 dark:text-slate-200" />
    );
  };

  return (
    <div>
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
              <th
                onClick={() => onSort("invoicenumber")}
                className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Invoice #{renderSortIcon("invoicenumber")}
                </div>
              </th>
              <th
                onClick={() => onSort("customer")}
                className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Customer & Reference {renderSortIcon("customer")}
                </div>
              </th>
              <th
                onClick={() => onSort("createdat")}
                className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Date Created {renderSortIcon("createdat")}
                </div>
              </th>
              <th
                onClick={() => onSort("status")}
                className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Status {renderSortIcon("status")}
                </div>
              </th>
              <th
                onClick={() => onSort("totalamount")}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Total Amount {renderSortIcon("totalamount")}
                </div>
              </th>
              <th
                onClick={() => onSort("balancedue")}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Balance Due {renderSortIcon("balancedue")}
                </div>
              </th>
              <th className="py-3 px-4 text-right w-16 font-bold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
            {currentInvoices.map((inv) => {
              const isPdfLoading = loadingPdfId === inv.invoiceId;
              const isDownloading = downloadingPdfId === inv.invoiceId;
              const isMenuOpen = activeMenuId === inv.invoiceId;

              return (
                <tr
                  key={inv.invoiceId}
                  onClick={() => onViewDetails(inv)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {inv.invoiceNumber}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {inv.companyName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                      Quote #{inv.quotationNumber}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>

                  <td
                    className="py-3.5 px-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative inline-flex items-center">
                      <select
                        value={inv.status || "Unpaid"}
                        onChange={(e) => handleStatusChange(e, inv.invoiceId)}
                        className={`appearance-none cursor-pointer pl-2.5 pr-6 py-1 rounded-lg text-[11px] font-bold border transition-all duration-150 outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs ${getStatusBadgeStyle(
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
                      <ChevronDown className="w-3 h-3 absolute right-2 pointer-events-none opacity-60" />
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white font-mono text-xs">
                    {currency(inv.totalAmount ?? 0)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-semibold text-rose-600 dark:text-rose-400 font-mono text-xs">
                    {currency(inv.balanceDue ?? 0)}
                  </td>

                  <td className="py-3.5 px-4 text-right relative">
                    <div
                      className="flex items-center justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeMenuId === inv.invoiceId) {
                            setActiveMenuId(null);
                            setMenuCoords(null);
                          } else {
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            const menuHeight = 240;
                            const showAbove =
                              window.innerHeight - rect.bottom < menuHeight &&
                              rect.top > menuHeight;

                            setActiveMenuId(inv.invoiceId);
                            setMenuCoords({
                              top: showAbove
                                ? rect.top - menuHeight - 4
                                : rect.bottom + 4,
                              left: Math.max(12, rect.right - 180),
                            });
                          }
                        }}
                        title="Actions"
                        className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition-all duration-150 shadow-2xs cursor-pointer inline-flex items-center justify-center"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && menuCoords && (
                        <div
                          ref={menuRef}
                          style={{
                            position: "fixed",
                            top: `${menuCoords.top}px`,
                            left: `${menuCoords.left}px`,
                          }}
                          className="w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1 text-left text-xs"
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                              onViewDetails(inv);
                            }}
                            className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Details</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                              onRecordPayment(inv);
                            }}
                            className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Record Payment</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                              onViewPdf(inv.invoiceId, inv.invoiceNumber);
                            }}
                            disabled={isPdfLoading}
                            className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isPdfLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>Preview PDF</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                              onDownloadPdf(inv.invoiceId, inv.invoiceNumber);
                            }}
                            disabled={isDownloading}
                            className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>Download PDF</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                              onOpenEmail(inv);
                            }}
                            className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>Send Email</span>
                          </button>

                          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                              onDeleteInvoice(inv.invoiceId);
                            }}
                            className="w-full px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Invoice</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl">
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
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
