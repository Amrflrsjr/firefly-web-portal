import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { CustomerContact } from "../../types/customer";
import { X, User, Tag, Mail, Phone, UserCheck } from "lucide-react";

interface EditContactModalProps {
  contact: CustomerContact;
  companyName: string;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (updatedContact: CustomerContact) => void;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  contact,
  companyName,
  saving,
  error,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CustomerContact>({ ...contact });

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Contact Name is required.");
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
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                {companyName}
              </p>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                Edit Contact
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="edit-contact-form"
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/50"
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Contact Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter contact name"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Position / Role
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={formData.position || ""}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                placeholder="e.g. Procurement Manager"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="contact@company.com"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="e.g. +63 912 345 6789"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Interactive Checkbox Row */}
          <div
            onClick={() =>
              setFormData({ ...formData, isPrimary: !formData.isPrimary })
            }
            className="flex items-center gap-2.5 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer select-none"
          >
            <input
              type="checkbox"
              id="editIsPrimary"
              checked={formData.isPrimary}
              onChange={(e) =>
                setFormData({ ...formData, isPrimary: e.target.checked })
              }
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-400 cursor-pointer"
            />
            <label
              htmlFor="editIsPrimary"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none flex-1 flex items-center gap-2"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-500" /> Set as
              Primary Contact
            </label>
          </div>
        </form>

        {/* Modal Footer Actions Bar matching Quotation style */}
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
            form="edit-contact-form"
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update Contact"}
          </button>
        </div>
      </div>
    </div>
  );
};
