import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { CustomerContact } from "../../types/customer";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Add New Contact
            </h2>
            <p className="text-xs text-slate-500">{companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Contact Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Position / Role
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="addIsPrimary"
              checked={formData.isPrimary}
              onChange={(e) =>
                setFormData({ ...formData, isPrimary: e.target.checked })
              }
              className="rounded border-slate-300 text-[#F9B53F] focus:ring-[#F9B53F]"
            />
            <label
              htmlFor="addIsPrimary"
              className="text-xs font-medium text-slate-700"
            >
              Set as Primary Contact
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
