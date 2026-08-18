import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { CreateProductDto, ProductVariant } from "../../types/product";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <h2 className="text-lg font-bold text-slate-800">Add New Product</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Die-Cut Vinyl Stickers"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief details or specifications"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F]"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">
                Variants & Pricing
              </h3>
              <button
                type="button"
                onClick={addVariantField}
                className="text-xs font-semibold text-[#F9B53F] hover:underline cursor-pointer"
              >
                + Add Another Variant
              </button>
            </div>

            {formData.variants.map((variant, index) => (
              <div
                key={index}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 mb-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    Variant #{index + 1}
                  </span>
                  {formData.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariantField(index)}
                      className="text-xs text-red-500 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      SKU *
                    </label>
                    <input
                      type="text"
                      required
                      value={variant.sku}
                      onChange={(e) =>
                        handleVariantChange(index, "sku", e.target.value)
                      }
                      placeholder="SKU-101"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-800 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Price (PHP) *
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
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Initial Stock
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
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Size / Option
                    </label>
                    <input
                      type="text"
                      value={variant.size}
                      onChange={(e) =>
                        handleVariantChange(index, "size", e.target.value)
                      }
                      placeholder="Glossy / Matte"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-800"
                    />
                  </div>
                </div>
              </div>
            ))}
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
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
