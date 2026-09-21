import React, { useState, useMemo, useRef, useEffect } from "react";
import type { QuotationResponseDto } from "../../types/quotation";
import {
  Eye,
  Download,
  Mail,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Receipt,
  Loader2,
  MoreVertical,
} from "lucide-react";

interface QuotationTableProps {
  loading: boolean;
  quotations: QuotationResponseDto[];
  sortBy: string;
  ascending: boolean;
  searchQuery?: string;
  onSort: (field: string) => void;
  onView: (quotation: QuotationResponseDto) => void;
  onViewPdf: (quotationId: number, quotationNumber: string) => void;
  onDownloadPdf: (quotationId: number, quotationNumber: string) => void;
  onOpenEmail: (quotation: QuotationResponseDto) => void;
  onUpdateStatus: (quotationId: number, newStatus: string) => void;
  onDeleteQuotation: (quotationId: number) => void;
  onEdit: (quotation: QuotationResponseDto) => void;
  onConvertToInvoice?: (quotation: QuotationResponseDto) => void;
  loadingPdfId?: number | null;
  downloadingPdfId?: number | null;
}

const currency = (value: number) =>
  `₱${(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const QuotationTable: React.FC<QuotationTableProps> = ({
  loading,
  quotations,
  sortBy,
  ascending,
  searchQuery,
  onSort,
  onView,
  onViewPdf,
  onDownloadPdf,
  onOpenEmail,
  onUpdateStatus,
  onDeleteQuotation,
  onEdit,
  onConvertToInvoice,
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

  const processedQuotations = useMemo(() => {
    if (!quotations) return [];

    const sorted = [...quotations];
    const query = searchQuery?.trim().toLowerCase() || "";

    sorted.sort((a, b) => {
      if (query) {
        const matchA =
          a.quotationNumber.toLowerCase().includes(query) ||
          (a.companyName && a.companyName.toLowerCase().includes(query));
        const matchB =
          b.quotationNumber.toLowerCase().includes(query) ||
          (b.companyName && b.companyName.toLowerCase().includes(query));

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
          ? a.quotationId - b.quotationId
          : b.quotationId - a.quotationId;
      }

      const valA = a[sortBy as keyof QuotationResponseDto];
      const valB = b[sortBy as keyof QuotationResponseDto];

      if (typeof valA === "string" && typeof valB === "string") {
        return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      const numA = Number(valA || 0);
      const numB = Number(valB || 0);
      return ascending ? numA - numB : numB - numA;
    });

    return sorted;
  }, [quotations, sortBy, ascending, searchQuery]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-sm font-medium flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="w-6 h-6 border-2 border-[#F9B53F] border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          Loading quotations directory...
        </span>
      </div>
    );
  }

  if (processedQuotations.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm font-medium">
        No quotations found. Click{" "}
        <b className="text-slate-700 dark:text-slate-300">
          "+ Create Quotation"
        </b>{" "}
        above to generate one.
      </div>
    );
  }

  const totalPages = Math.ceil(processedQuotations.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentQuotations = processedQuotations.slice(
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
      case "approved":
      case "accepted":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50";
      case "sent":
        return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60 hover:bg-blue-100/80 dark:hover:bg-blue-900/50";
      case "declined":
      case "cancelled":
        return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 hover:bg-rose-100/80 dark:hover:bg-rose-900/50";
      case "draft":
      case "created":
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-750";
    }
  };

  const handleStatusChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    quotationId: number,
  ) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    onUpdateStatus(quotationId, newStatus);
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
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
              <th
                onClick={() => onSort("quotationnumber")}
                className="py-4 px-6 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Quotation #{renderSortIcon("quotationnumber")}
                </div>
              </th>
              <th
                onClick={() => onSort("customer")}
                className="py-4 px-6 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Customer & Contact
                  {renderSortIcon("customer")}
                </div>
              </th>
              <th
                onClick={() => onSort("createdat")}
                className="py-4 px-6 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Date Created
                  {renderSortIcon("createdat")}
                </div>
              </th>
              <th
                onClick={() => onSort("status")}
                className="py-4 px-6 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Status
                  {renderSortIcon("status")}
                </div>
              </th>
              <th
                onClick={() => onSort("totalamount")}
                className="py-4 px-6 text-right cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Total Amount
                  {renderSortIcon("totalamount")}
                </div>
              </th>
              <th className="py-4 px-6 text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
            {currentQuotations.map((q) => {
              const isEditable = q.status === "Created" || q.status === "Draft";
              const isPdfLoading = loadingPdfId === q.quotationId;
              const isDownloading = downloadingPdfId === q.quotationId;
              const isMenuOpen = activeMenuId === q.quotationId;

              return (
                <tr
                  key={q.quotationId}
                  onClick={() => onView(q)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-6 text-slate-800 dark:text-slate-200">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                      {q.quotationNumber}
                    </span>
                  </td>

                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                      {q.companyName || "N/A"}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {q.contactNameSnapshot || "N/A"}
                      </span>
                      <span>•</span>
                      <span className="truncate max-w-50">
                        {q.contactEmailSnapshot || "No email provided"}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </td>

                  <td
                    className="py-4 px-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative inline-flex items-center">
                      <select
                        value={
                          q.status
                            ? q.status.charAt(0).toUpperCase() +
                              q.status.slice(1).toLowerCase()
                            : "Draft"
                        }
                        onChange={(e) => handleStatusChange(e, q.quotationId)}
                        className={`appearance-none cursor-pointer pl-3 pr-7 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 outline-none focus:ring-2 focus:ring-amber-400/40 shadow-2xs ${getStatusBadgeStyle(
                          q.status,
                        )}`}
                      >
                        <option
                          value="Draft"
                          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
                        >
                          Draft
                        </option>
                        <option
                          value="Sent"
                          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
                        >
                          Sent
                        </option>
                        <option
                          value="Approved"
                          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
                        >
                          Approved
                        </option>
                        <option
                          value="Declined"
                          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
                        >
                          Declined
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
                    {currency(q.totalAmount)}
                  </td>

                  <td className="py-4 px-6 text-right relative">
                    <div
                      className="flex items-center justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeMenuId === q.quotationId) {
                            setActiveMenuId(null);
                            setMenuCoords(null);
                          } else {
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            const menuHeight = 280;
                            const showAbove =
                              window.innerHeight - rect.bottom < menuHeight &&
                              rect.top > menuHeight;

                            setActiveMenuId(q.quotationId);
                            setMenuCoords({
                              top: showAbove
                                ? rect.top - menuHeight - 4
                                : rect.bottom + 4,
                              left: Math.max(12, rect.right - 192),
                            });
                          }
                        }}
                        title="Actions"
                        className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center"
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
                          className="w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-1.5 text-left text-xs animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                              onView(q);
                            }}
                            className="w-full px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Details</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                              onViewPdf(q.quotationId, q.quotationNumber);
                            }}
                            disabled={isPdfLoading}
                            className="w-full px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isPdfLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                            )}
                            <span>Preview PDF</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                              onDownloadPdf(q.quotationId, q.quotationNumber);
                            }}
                            disabled={isDownloading}
                            className="w-full px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                            <span>Download PDF</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                              onOpenEmail(q);
                            }}
                            className="w-full px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 text-amber-500" />
                            <span>Send Email</span>
                          </button>

                          {onConvertToInvoice && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setMenuCoords(null);
                                onConvertToInvoice(q);
                              }}
                              className="w-full px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Convert to Invoice</span>
                            </button>
                          )}

                          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                          {isEditable ? (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setMenuCoords(null);
                                onEdit(q);
                              }}
                              className="w-full px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-amber-600" />
                              <span>Edit Quotation</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full px-4 py-2 text-slate-300 dark:text-slate-600 flex items-center gap-2.5 cursor-not-allowed"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit (Locked)</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                              onDeleteQuotation(q.quotationId);
                            }}
                            className="w-full px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Quotation</span>
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-3xl">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {Math.min(startIndex + pageSize, processedQuotations.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {processedQuotations.length}
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
