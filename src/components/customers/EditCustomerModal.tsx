import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import type { Customer } from "../../types/customer";
import { X, Building, FileText, MapPin } from "lucide-react";

interface EditCustomerModalProps {
  customer: Customer;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (data: {
    companyName: string;
    companyAddress: string;
    tin: string;
    notes: string;
  }) => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  customer,
  saving,
  error,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    companyName: customer.companyName,
    companyAddress: customer.companyAddress || "",
    tin: customer.tin || "",
    notes: customer.notes || "",
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast.error("Company Name is required.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158]" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 dark:from-[#FFCB62]/20 dark:to-[#F4D158]/20 flex items-center justify-center text-slate-800 dark:text-slate-200 shadow-2xs">
              <Building className="w-5 h-5 text-[#F9B53F]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Customer Management
              </p>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Edit Customer
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#FCFDFF] dark:bg-slate-950/40"
        >
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1">
              Company Name *
            </label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                placeholder="Enter company name"
                className="w-full bg-slate-50/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F] focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1">
              Tax ID (TIN)
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={formData.tin}
                onChange={(e) =>
                  setFormData({ ...formData, tin: e.target.value })
                }
                placeholder="e.g. 123-456-789-000"
                className="w-full bg-slate-50/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F9B53F] focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1">
              Business Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <textarea
                rows={2}
                value={formData.companyAddress}
                onChange={(e) =>
                  setFormData({ ...formData, companyAddress: e.target.value })
                }
                placeholder="Enter business address"
                className="w-full bg-slate-50/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F] focus:bg-white dark:focus:bg-slate-800 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
