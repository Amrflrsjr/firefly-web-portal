import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Customer } from "../../types/customer";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Edit Customer</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              TIN
            </label>
            <input
              type="text"
              value={formData.tin}
              onChange={(e) =>
                setFormData({ ...formData, tin: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.companyAddress}
              onChange={(e) =>
                setFormData({ ...formData, companyAddress: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
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
              {saving ? "Updating..." : "Update Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
