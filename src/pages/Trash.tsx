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
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  Archive,
  Layers,
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

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const fetchDeletedItems = useCallback(
    async (targetTab: TabType, search: string = "") => {
      setLoading(true);
      setApiError(null);
      try {
        // Dynamic endpoint addressing for /products/variants/deleted or standard /tab/deleted
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

  // Fetch data when activeTab or searchQuery changes (with 300ms debounce for typing)
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
          setCurrentPage(1); // Reset to page 1 on search or tab change
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

  // Pagination computed slices (10 rows per page)
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
    <div className="space-y-6 sm:space-y-8 pb-10 px-4 sm:px-0 animate-in fade-in duration-300">
      {/* Executive Command Header Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800/80">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-72 h-72 bg-slate-500/10 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Archive &amp; Trash Management</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                {today}
              </div>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Archive
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-normal leading-relaxed">
              Restore soft-deleted system records back to active workflows or
              purge them permanently from your database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-auto">
            {/* Real-time Summary Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Archive className="w-4 h-4" />
                <span>
                  {items.length} Deleted {activeTab}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Toolbar & Backend Search Input Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/60 dark:shadow-none">
        <div className="flex flex-wrap items-center gap-1.5">
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
                  setSearchQuery(""); // Clear search query when changing tabs
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? "bg-linear-to-r from-[#FFCB62] to-[#F9B53F] text-slate-900 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? "text-slate-900"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Backend Search Input Field */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search deleted ${activeTab}...`}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F] transition-colors"
          />
        </div>
      </div>

      {apiError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDeletedItems(activeTab, searchQuery)}
            className="text-xs font-bold bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-800 shadow-2xs hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-20 text-center text-slate-400 text-sm font-medium flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900">
            <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs">
              Loading archived records...
            </span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-xs font-medium flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-900">
            <Trash2 className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            <span>No deleted {activeTab} matched your search criteria.</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                    <th className="py-3.5 px-6 whitespace-nowrap">
                      Reference ID
                    </th>
                    <th className="py-3.5 px-6 whitespace-nowrap">
                      Identifier / Name
                    </th>
                    <th className="py-3.5 px-6 text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
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
                        className="hover:bg-[#FCFDFF] dark:hover:bg-slate-850 transition-colors group"
                      >
                        <td className="py-4 px-6 font-mono text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          #{id}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white group-hover:text-amber-900 dark:group-hover:text-amber-300 transition-colors">
                          {String(name || "N/A")}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setItemToRestore(id)}
                              title="Restore Record"
                              className="p-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 rounded-xl transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center hover:scale-105"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemToPurge(id)}
                              title="Delete Permanently"
                              className="p-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-xl transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center hover:scale-105"
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

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
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
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
