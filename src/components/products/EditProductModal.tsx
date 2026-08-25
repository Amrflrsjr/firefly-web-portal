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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden my-8 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158] shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
              <Package className="w-5 h-5 text-[#F9B53F]" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <span className="font-mono text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Catalog Management
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight truncate">
                Edit Product Details
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/80 transition-colors cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-4 bg-slate-50/50">
            {/* Product Name Field */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <Tag className="w-3 h-3 text-[#F9B53F]" /> Product Name{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/20 transition-all shadow-2xs"
                placeholder="Enter product name..."
              />
            </div>

            {/* Description Field */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <FileText className="w-3 h-3 text-[#F9B53F]" /> Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/20 transition-all shadow-2xs resize-none"
                placeholder="Enter product description..."
              />
            </div>

            {/* Active Status Checkbox Container */}
            <div className="flex items-center gap-3.5 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
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
                <p className="text-[10px] font-normal text-slate-400 mt-0.5">
                  Inactive products won't appear when creating new estimates.
                </p>
              </label>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 shadow-sm">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {saving ? "Updating..." : "Update Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
