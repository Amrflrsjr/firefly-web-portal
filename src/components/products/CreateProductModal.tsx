import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { CreateProductDto, ProductVariant } from "../../types/product";
import { X, PackagePlus, Layers, Plus, Trash2, Calculator } from "lucide-react";

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
    variants: [],
  });

  const [submittingAction, setSubmittingAction] = useState<
    "create" | "draft" | null
  >(null);

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
    const updatedVariants = [...(formData.variants || [])];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setFormData({ ...formData, variants: updatedVariants });
  };

  const addVariantField = () => {
    setFormData({
      ...formData,
      variants: [
        ...(formData.variants || []),
        {
          sku: "",
          color: "",
          size: "",
          unitPrice: 0,
          stock: 0,
          isActive: true,
        },
      ],
    });
    toast.success("Variant field added.");
  };

  const removeVariantField = (index: number) => {
    const updatedVariants = (formData.variants || []).filter(
      (_, i) => i !== index,
    );
    setFormData({ ...formData, variants: updatedVariants });
    toast.success("Variant removed.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Product Name is required.");
      return;
    }

    // Filter out completely empty variant rows so they don't get saved as "Standard Option"
    const validVariants = (formData.variants || []).filter((v) => {
      const hasSku = v.sku && v.sku.trim() !== "";
      const hasColor = v.color && v.color.trim() !== "";
      const hasSize = v.size && v.size.trim() !== "";
      const hasPrice = Number(v.unitPrice) > 0;
      const hasStock = Number(v.stock) > 0;

      // Keep variant only if at least one meaningful field has data
      return hasSku || hasColor || hasSize || hasPrice || hasStock;
    });

    // Validate remaining active variants
    for (let i = 0; i < validVariants.length; i++) {
      const v = validVariants[i];
      const hasIdentifier =
        (v.sku && v.sku.trim() !== "") ||
        (v.color && v.color.trim() !== "") ||
        (v.size && v.size.trim() !== "");

      if (!hasIdentifier) {
        toast.error(
          `Variant #${i + 1}: Please provide at least a SKU, Color, or Size option.`,
        );
        return;
      }
    }

    const payload: CreateProductDto = {
      ...formData,
      variants: validVariants,
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Modal Shell with reduced max-width for smaller appearance on large screens */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
        {/* Flat Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Add New Product
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Build items and manage SKU variants across active catalog
              inventory
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden sm:inline">
              {formData.variants?.length || 0}{" "}
              {formData.variants?.length === 1 ? "variant" : "variants"}
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body - 9 / 3 Split Ratio Layout */}
        <form
          id="create-product-form"
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/50 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6"
        >
          {/* Expanded Main Column (9 Cols) */}
          <div className="lg:col-span-9 space-y-5">
            {/* Main Product Info Card */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center gap-2">
                <PackagePlus className="w-4 h-4 text-slate-400" /> General
                Details
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Die-Cut Vinyl Stickers"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief details, material specifications, or notes..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 resize-none transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Variants & Pricing Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Variants &amp; Pricing{" "}
                    <span className="text-[10px] font-normal lowercase opacity-75">
                      (Optional)
                    </span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={addVariantField}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" /> Add Variant
                  Option
                </button>
              </div>

              {!formData.variants || formData.variants.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic shadow-2xs">
                  No variants added. This product will be created as a
                  standalone item without sub-variants. Click{" "}
                  <b className="text-slate-700 dark:text-slate-300">
                    "+ Add Variant Option"
                  </b>{" "}
                  if you need specific configuration options (e.g. size/color).
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.variants.map((variant, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3 shadow-2xs relative group"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
                            {index + 1}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Variant Option Configuration
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariantField(index)}
                          className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-500 dark:text-rose-400 rounded-lg transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/60"
                          title="Remove Variant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                        <div className="lg:col-span-3 space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                            SKU Code
                          </label>
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) =>
                              handleVariantChange(index, "sku", e.target.value)
                            }
                            placeholder="e.g. SKU-001"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                          />
                        </div>

                        <div className="lg:col-span-3 space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                            Color / Variant
                          </label>
                          <input
                            type="text"
                            value={variant.color}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                "color",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. Matte Black"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                          />
                        </div>

                        <div className="sm:col-span-2 lg:col-span-3 space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                            Size / Format
                          </label>
                          <input
                            type="text"
                            value={variant.size}
                            onChange={(e) =>
                              handleVariantChange(index, "size", e.target.value)
                            }
                            placeholder="e.g. A4 / Large"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 lg:col-span-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block whitespace-nowrap">
                              Price (₱)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={variant.unitPrice}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 text-right font-mono focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              Stock
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={variant.stock}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  "stock",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 text-center font-mono focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Compact Right Sidebar Column (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Catalog Info Summary Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Calculator className="w-3.5 h-3.5 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Catalog Summary
                </h3>
              </div>

              <div className="space-y-2 text-xs font-medium">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Total Variants</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {formData.variants?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Total Initial Stock</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {formData.variants?.reduce(
                      (acc, v) => acc + (Number(v.stock) || 0),
                      0,
                    ) || 0}{" "}
                    units
                  </span>
                </div>
              </div>
            </div>

            {/* Standardized Button Hierarchy */}
            <div className="space-y-2 pt-1">
              <button
                form="create-product-form"
                type="submit"
                onClick={() => setSubmittingAction("create")}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-white rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <PackagePlus className="w-4 h-4" />
                {saving && submittingAction === "create"
                  ? "Saving..."
                  : "Save Product"}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
