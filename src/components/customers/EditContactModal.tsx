import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { CustomerContact } from "../../types/customer";
import { X, User, Briefcase, Mail, Phone } from "lucide-react";

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158]" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {companyName}
            </p>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Edit Contact
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#FCFDFF]"
        >
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
              Contact Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter contact name"
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
              Position / Role
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData.position || ""}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                placeholder="e.g. Procurement Manager"
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="contact@company.com"
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="e.g. +63 912 345 6789"
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2 bg-slate-50/60 p-3 rounded-2xl border border-slate-200/60">
            <input
              type="checkbox"
              id="editIsPrimary"
              checked={formData.isPrimary}
              onChange={(e) =>
                setFormData({ ...formData, isPrimary: e.target.checked })
              }
              className="w-4 h-4 rounded border-slate-300 text-[#F9B53F] focus:ring-[#F9B53F] accent-[#F9B53F]"
            />
            <label
              htmlFor="editIsPrimary"
              className="text-xs font-bold text-slate-700 select-none cursor-pointer"
            >
              Set as Primary Contact
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
