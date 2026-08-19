import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Product } from "../../types/product";
import { X, Package, Tag, FileText } from "lucide-react";

interface EditProductModalProps {
  product: Product;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    isActive: boolean;
  }) => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  saving,
  error,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || "",
    isActive: product.isActive,
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Product Name is required.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158]" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 flex items-center justify-center text-slate-800 shadow-2xs">
              <Package className="w-5 h-5 text-[#F9B53F]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Catalog Management
              </p>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Edit Product Details
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#FCFDFF]">
          {/* Product Name Field */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-[#F9B53F]" /> Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/20 transition-all shadow-2xs"
              placeholder="Enter product name..."
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-[#F9B53F]" /> Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/20 transition-all shadow-2xs resize-none"
              placeholder="Enter product description..."
            />
          </div>

          {/* Active Status Checkbox Container */}
          <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/70 rounded-2xl shadow-2xs">
            <input
              type="checkbox"
              id="productIsActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4 rounded border-slate-300 text-[#F9B53F] focus:ring-[#F9B53F] cursor-pointer"
            />
            <label
              htmlFor="productIsActive"
              className="text-xs font-bold text-slate-700 cursor-pointer select-none flex-1"
            >
              Active in Catalog
              <p className="text-[10px] font-normal text-slate-400">
                Inactive products won't appear when creating new estimates.
              </p>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
