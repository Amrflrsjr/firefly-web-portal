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
} from "lucide-react";
import axios from "axios";
import { ConfirmModal } from "../components/common/ConfirmModal";

type TabType = "products" | "customers" | "quotations" | "invoices";

interface DeletedItem {
  productId?: number;
  customerId?: number;
  quotationId?: number;
  invoiceId?: number;
  name?: string;
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

  // Modal tracking states
  const [itemToRestore, setItemToRestore] = useState<number | null>(null);
  const [itemToPurge, setItemToPurge] = useState<number | null>(null);

  const fetchDeletedItems = useCallback(async (targetTab: TabType) => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await api.get(`/${targetTab}/deleted`);
      setItems(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setApiError(
          err.response?.data?.message || `Failed to fetch deleted ${targetTab}`,
        );
      } else {
        setApiError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const response = await api.get(`/${activeTab}/deleted`);
        if (isMounted) {
          setItems(response.data);
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

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleConfirmRestore = async () => {
    if (itemToRestore === null) return;
    setActionLoading(true);
    try {
      await api.post(`/${activeTab}/${itemToRestore}/restore`);
      toast.success("Item restored successfully!");
      setItemToRestore(null);
      fetchDeletedItems(activeTab);
    } catch {
      toast.error("Failed to restore item");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (itemToPurge === null) return;
    setActionLoading(true);
    try {
      await api.delete(`/${activeTab}/${itemToPurge}/permanent`);
      toast.success("Item permanently deleted!");
      setItemToPurge(null);
      fetchDeletedItems(activeTab);
    } catch {
      toast.error("Failed to permanently delete item");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Recently Deleted
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Restore soft-deleted records back to active operations or delete them
          permanently.
        </p>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex border-b border-slate-200/80 gap-6">
        {[
          { key: "products", label: "Products", icon: Package },
          { key: "customers", label: "Customers", icon: Building2 },
          { key: "quotations", label: "Quotations", icon: FileText },
          { key: "invoices", label: "Invoices", icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`flex items-center gap-2 pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? "border-[#F9B53F] text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? "text-[#F9B53F]" : "text-slate-400"}`}
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {apiError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
          <button
            onClick={() => fetchDeletedItems(activeTab)}
            className="text-xs font-bold bg-white px-3 py-1.5 rounded-xl border border-rose-200 shadow-2xs cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">
            Loading archive directory...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">
            No deleted {activeTab} found in the trash.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                <th className="py-3.5 px-6">Reference ID</th>
                <th className="py-3.5 px-6">Identifier / Name</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {items.map((item) => {
                const id =
                  item.productId ||
                  item.customerId ||
                  item.quotationId ||
                  item.invoiceId;
                const name =
                  item.name ||
                  item.companyName ||
                  item.quotationNumber ||
                  item.invoiceNumber;

                if (!id) return null;

                return (
                  <tr key={id} className="hover:bg-[#FCFDFF] transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-bold text-slate-700">
                      #{id}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {String(name || "N/A")}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => setItemToRestore(id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200/60 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restore
                      </button>
                      <button
                        onClick={() => setItemToPurge(id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200/60 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
