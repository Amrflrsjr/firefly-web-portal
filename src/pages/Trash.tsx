import React, { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  Trash2,
  RotateCcw,
  AlertCircle,
  Package,
  Building2,
  FileText,
  Receipt,
  Search,
  Layers,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import { ConfirmModal } from "../components/common/ConfirmModal";

type TabType =
  | "products"
  | "variants"
  | "customers"
  | "quotations"
  | "invoices";

interface DeletedItem {
  productId?: number;
  productVariantId?: number;
  variantId?: number;
  customerId?: number;
  quotationId?: number;
  invoiceId?: number;
  name?: string;
  sku?: string;
  color?: string;
  size?: string;
  companyName?: string;
  quotationNumber?: string;
  invoiceNumber?: string;
  [key: string]: unknown;
}

export const Trash: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("products");
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Backend search state
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state (10 rows per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal tracking states
  const [itemToRestore, setItemToRestore] = useState<number | null>(null);
  const [itemToPurge, setItemToPurge] = useState<number | null>(null);

  const fetchDeletedItems = useCallback(
    async (targetTab: TabType, search: string = "") => {
      setLoading(true);
      setApiError(null);
      try {
        const endpoint =
          targetTab === "variants"
            ? "/products/variants/deleted"
            : `/${targetTab}/deleted`;

        const response = await api.get(endpoint, {
          params: { search: search.trim() ? search : undefined },
        });
        setItems(response.data);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setApiError(
            err.response?.data?.message ||
              `Failed to fetch deleted ${targetTab}`,
          );
        } else {
          setApiError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const endpoint =
          activeTab === "variants"
            ? "/products/variants/deleted"
            : `/${activeTab}/deleted`;

        const response = await api.get(endpoint, {
          params: { search: searchQuery.trim() ? searchQuery : undefined },
        });
        if (isMounted) {
          setItems(response.data);
          setCurrentPage(1);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (axios.isAxiosError(err)) {
            setApiError(
              err.response?.data?.message ||
                `Failed to fetch deleted ${activeTab}`,
            );
          } else {
            setApiError("An unexpected error occurred");
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(() => {
      loadData();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [activeTab, searchQuery]);

  const handleConfirmRestore = async () => {
    if (itemToRestore === null) return;
    setActionLoading(true);
    try {
      const endpoint =
        activeTab === "variants"
          ? `/products/variants/${itemToRestore}/restore`
          : `/${activeTab}/${itemToRestore}/restore`;

      await api.post(endpoint);
      toast.success("Item restored successfully!");
      setItemToRestore(null);
      fetchDeletedItems(activeTab, searchQuery);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage =
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message || "Failed to restore item";
        toast.error(errorMessage);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (itemToPurge === null) return;
    setActionLoading(true);
    try {
      const endpoint =
        activeTab === "variants"
          ? `/products/variants/${itemToPurge}/permanent`
          : `/${activeTab}/${itemToPurge}/permanent`;

      await api.delete(endpoint);
      toast.success("Item permanently deleted!");
      setItemToPurge(null);
      fetchDeletedItems(activeTab, searchQuery);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage =
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message ||
              "Failed to permanently delete item";
        toast.error(errorMessage);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Pagination computed slices
  const totalPages = Math.ceil(items.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getTabIcon = (key: TabType) => {
    switch (key) {
      case "products":
        return Package;
      case "variants":
        return Layers;
      case "customers":
        return Building2;
      case "quotations":
        return FileText;
      case "invoices":
        return Receipt;
    }
  };

  const formatVariantName = (item: DeletedItem) => {
    if (activeTab !== "variants") return null;
    const parts = [item.sku, item.color, item.size].filter(
      (p) => p && String(p).trim() !== "",
    );
    return parts.length > 0 ? parts.join(" / ") : "Unnamed Variant";
  };

  return (
    <div className="space-y-6 pb-10 px-4 sm:px-0 animate-in fade-in duration-300">
      {/* Flat Page Header matching Quotations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Archive &amp; Trash
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Restore soft-deleted records back to active workflows or purge them
            permanently.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 shadow-2xs">
            {items.length} Deleted {activeTab}
          </span>
        </div>
      </div>

      {/* Retention Policy Guidance Banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs font-medium shadow-2xs">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>Data Lifecycle Notice:</strong> Soft-deleted items remain
          securely stored in the archive. You can restore records anytime or
          purge them permanently when no longer required.
        </span>
      </div>

      {/* Filter & Search Toolbar matching Quotations */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Tabs Toolbar Group */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {(
              [
                { key: "products", label: "Products" },
                { key: "variants", label: "Variants" },
                { key: "customers", label: "Customers" },
                { key: "quotations", label: "Quotations" },
                { key: "invoices", label: "Invoices" },
              ] as const
            ).map((tab) => {
              const Icon = getTabIcon(tab.key);
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSearchQuery("");
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive
                        ? "text-white dark:text-slate-900"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Backend Search Input Field */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search deleted ${activeTab}...`}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {apiError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDeletedItems(activeTab, searchQuery)}
            className="text-xs font-bold bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 px-3.5 py-1.5 rounded-xl shadow-2xs hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table Container matching QuotationTable style */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs font-medium flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900">
            <div className="w-7 h-7 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Loading archived records...
            </span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-xs font-medium flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                No deleted {activeTab} matched your search criteria.
              </p>
              <p className="text-slate-400 text-xs">
                {searchQuery
                  ? "Try adjusting your search query or clear the filter to view all archived records."
                  : `There are currently no items in the ${activeTab} trash bin.`}
              </p>
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-2 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl font-semibold text-xs transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                    <th className="py-3 px-5 whitespace-nowrap">
                      Reference ID
                    </th>
                    <th className="py-3 px-5 whitespace-nowrap">
                      Identifier / Name
                    </th>
                    <th className="py-3 px-5 text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                  {paginatedItems.map((item) => {
                    const id =
                      item.productVariantId ||
                      item.variantId ||
                      item.invoiceId ||
                      item.quotationId ||
                      item.productId ||
                      item.customerId;

                    const name =
                      formatVariantName(item) ||
                      item.invoiceNumber ||
                      item.quotationNumber ||
                      item.companyName ||
                      item.name;

                    if (!id) return null;

                    return (
                      <tr
                        key={id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors group"
                      >
                        <td className="py-3.5 px-5 font-mono font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          #{id}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                          {String(name || "N/A")}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setItemToRestore(id)}
                              title="Restore Record"
                              className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 rounded-lg transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemToPurge(id)}
                              title="Delete Permanently"
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer matching QuotationTable style */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Showing{" "}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {startIndex + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {Math.min(startIndex + pageSize, items.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {items.length}
                  </span>{" "}
                  results
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={itemToRestore !== null}
        title="Restore Record"
        message="Are you sure you want to restore this item back to active system operations?"
        confirmText="Yes, Restore"
        loading={actionLoading}
        onConfirm={handleConfirmRestore}
        onClose={() => setItemToRestore(null)}
      />

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={itemToPurge !== null}
        title="Permanently Delete Record"
        message="Warning: This action cannot be undone. This record and its associated components will be wiped from the database forever."
        confirmText="Delete Forever"
        isDanger={true}
        loading={actionLoading}
        onConfirm={handleConfirmPermanentDelete}
        onClose={() => setItemToPurge(null)}
      />
    </div>
  );
};
