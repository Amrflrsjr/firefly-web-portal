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

  const isPersonal = customer.customerType === "Individual";

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast.error(
        isPersonal ? "Customer Name is required." : "Company Name is required.",
      );
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header matching Quotation and Customer modals */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-2xs shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                Customer Management
              </p>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                Edit Customer
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="edit-customer-form"
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/50"
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isPersonal ? "Customer Full Name *" : "Company Name *"}
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                placeholder={
                  isPersonal ? "Enter customer name" : "Enter company name"
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
              />
            </div>
          </div>

          {!isPersonal && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Tax ID (TIN)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={formData.tin}
                  onChange={(e) =>
                    setFormData({ ...formData, tin: e.target.value })
                  }
                  placeholder="e.g. 123-456-789-000"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isPersonal
                ? "Residential / Shipping Address"
                : "Business Address"}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
              <textarea
                rows={2}
                value={formData.companyAddress}
                onChange={(e) =>
                  setFormData({ ...formData, companyAddress: e.target.value })
                }
                placeholder="Enter address"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs resize-none"
              />
            </div>
          </div>
        </form>

        {/* Modal Actions Footer matching Quotation style */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs active:scale-95 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            form="edit-customer-form"
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update Customer"}
          </button>
        </div>
      </div>
    </div>
  );
};
