import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { CreateProductDto, ProductVariant } from "../../types/product";
import {
  X,
  PackagePlus,
  Tag,
  FileText,
  Layers,
  Plus,
  Trash2,
  DollarSign,
  Box,
  Sliders,
} from "lucide-react";

interface CreateProductModalProps {
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (dto: CreateProductDto) => void;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  saving,
  error,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateProductDto>({
    name: "",
    description: "",
    variants: [
      {
        sku: "",
        color: "Standard",
        size: "Standard",
        unitPrice: 0,
        stock: 0,
        isActive: true,
      },
    ],
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleVariantChange = (
    index: number,
    field: keyof ProductVariant,
    value: string | number | boolean,
  ) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setFormData({ ...formData, variants: updatedVariants });
  };

  const addVariantField = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          sku: "",
          color: "Standard",
          size: "Standard",
          unitPrice: 0,
          stock: 0,
          isActive: true,
        },
      ],
    });
    toast.success("New variant field added.");
  };

  const removeVariantField = (index: number) => {
    const updatedVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updatedVariants });
    toast.success("Variant field removed.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Product Name is required.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-8 max-h-[92vh]">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158]" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 flex items-center justify-center text-slate-800 shadow-2xs">
              <PackagePlus className="w-5 h-5 text-[#F9B53F]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Catalog Management
              </p>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Add New Product
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
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto flex-1 bg-[#FCFDFF]"
        >
          {/* Main Product Info Fields */}
          <div className="space-y-4">
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
                placeholder="e.g. Die-Cut Vinyl Stickers"
                className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/20 transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-[#F9B53F]" /> Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief details or specifications..."
                className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/20 transition-all shadow-2xs resize-none"
              />
            </div>
          </div>

          {/* Variants Section */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Variants & Pricing
                </h3>
              </div>
              <button
                type="button"
                onClick={addVariantField}
                className="inline-flex items-center gap-1 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Variant
              </button>
            </div>

            <div className="space-y-3">
              {formData.variants.map((variant, index) => (
                <div
                  key={index}
                  className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 transition-all hover:border-slate-300"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center text-[10px]">
                        {index + 1}
                      </span>
                      Variant Config
                    </span>
                    {formData.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariantField(index)}
                        className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer p-1 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase mb-1">
                        <Tag className="w-3 h-3 text-[#F9B53F]" /> SKU *
                      </label>
                      <input
                        type="text"
                        required
                        value={variant.sku}
                        onChange={(e) =>
                          handleVariantChange(index, "sku", e.target.value)
                        }
                        placeholder="SKU-101"
                        className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 uppercase focus:outline-none focus:border-[#F9B53F] focus:ring-1 focus:ring-[#FFCB62]"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase mb-1">
                        <DollarSign className="w-3 h-3 text-[#F9B53F]" /> Price
                        (PHP) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={variant.unitPrice}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "unitPrice",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-1 focus:ring-[#FFCB62]"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase mb-1">
                        <Box className="w-3 h-3 text-[#F9B53F]" /> Initial Stock
                      </label>
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "stock",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-1 focus:ring-[#FFCB62]"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase mb-1">
                        <Sliders className="w-3 h-3 text-[#F9B53F]" /> Size /
                        Option
                      </label>
                      <input
                        type="text"
                        value={variant.size}
                        onChange={(e) =>
                          handleVariantChange(index, "size", e.target.value)
                        }
                        placeholder="Glossy / Matte"
                        className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-1 focus:ring-[#FFCB62]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
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
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
