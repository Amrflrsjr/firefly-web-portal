import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { CustomerContact } from "../../types/customer";
import { X, User, Tag, Mail, Phone, UserCheck } from "lucide-react";

interface AddContactModalProps {
  companyName: string;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (contact: CustomerContact) => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  companyName,
  saving,
  error,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CustomerContact>({
    name: "",
    department: "",
    position: "",
    email: "",
    phone: "",
    isPrimary: false,
  });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg overflow-hidden my-8 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158] shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                {companyName}
              </p>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                Add New Contact
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer shrink-0 shadow-2xs"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="add-contact-form"
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/40"
        >
          {/* Contact Name */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-[#F9B53F]" /> Contact Name{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter full name..."
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F] transition-all shadow-2xs"
            />
          </div>

          {/* Position / Role */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Tag className="w-3.5 h-3.5 text-[#F9B53F]" /> Position / Role
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value })
              }
              placeholder="e.g. Procurement Manager"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F] transition-all shadow-2xs"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Mail className="w-3.5 h-3.5 text-[#F9B53F]" /> Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="name@company.com"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F] transition-all shadow-2xs"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Phone className="w-3.5 h-3.5 text-[#F9B53F]" /> Phone Number
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+63 912 345 6789"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F] transition-all shadow-2xs"
            />
          </div>

          {/* Interactive Checkbox Row Container */}
          <div
            onClick={() =>
              setFormData({ ...formData, isPrimary: !formData.isPrimary })
            }
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer select-none"
          >
            <input
              type="checkbox"
              id="addIsPrimary"
              checked={formData.isPrimary}
              onChange={(e) =>
                setFormData({ ...formData, isPrimary: e.target.checked })
              }
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#F9B53F] focus:ring-[#F9B53F] accent-[#F9B53F] cursor-pointer"
            />
            <label
              htmlFor="addIsPrimary"
              className="text-xs font-extrabold text-slate-700 dark:text-slate-300 cursor-pointer select-none flex-1 flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-[#F9B53F]" /> Set as Primary
              Contact
            </label>
          </div>
        </form>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            form="add-contact-form"
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 text-xs font-extrabold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving..." : "Add Contact"}
          </button>
        </div>
      </div>
    </div>
  );
};
