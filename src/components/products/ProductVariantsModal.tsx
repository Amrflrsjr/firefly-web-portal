import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Product, ProductVariant } from "../../types/product";
import {
  X,
  Plus,
  Package,
  Layers,
  Tag,
  DollarSign,
  Box,
  Check,
  Edit2,
  FileText,
} from "lucide-react";

interface ProductVariantsModalProps {
  product: Product;
  saving: boolean;
  error: string;
  onClose: () => void;
  onAddVariant: (productId: number, variant: ProductVariant) => void;
  onUpdateVariantStock?: (
    productId: number,
    variantId: number,
    newStock: number,
  ) => Promise<void>;
}

export const ProductVariantsModal: React.FC<ProductVariantsModalProps> = ({
  product,
  saving,
  error,
  onClose,
  onAddVariant,
  onUpdateVariantStock,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariant, setNewVariant] = useState<ProductVariant>({
    sku: "",
    color: "Standard",
    size: "Standard",
    unitPrice: 0,
    stock: 0,
    isActive: true,
  });

  // Inline stock editing states for modal variants
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const [savingStock, setSavingStock] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariant.sku.trim()) {
      toast.error("SKU is required.");
      return;
    }
    onAddVariant(product.productId, newVariant);
    setShowAddForm(false);
    setNewVariant({
      sku: "",
      color: "Standard",
      size: "Standard",
      unitPrice: 0,
      stock: 0,
      isActive: true,
    });
  };

  const handleSaveVariantStock = async (variantId: number | undefined) => {
    if (!onUpdateVariantStock || variantId === undefined) return;

    try {
      setSavingStock(true);
      await onUpdateVariantStock(product.productId, variantId, tempStock);
      setEditingVariantId(null);
    } catch (err) {
      console.error("Failed to update variant stock", err);
    } finally {
      setSavingStock(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden my-8 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-2xs">
              <Package className="w-5 h-5 text-[#F9B53F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-slate-400 uppercase tracking-wider">
                  Product Details
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight truncate max-w-md">
                {product.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/80 transition-colors cursor-pointer shadow-2xs"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {/* Description Overview Box */}
          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-1 shadow-2xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#F9B53F]" /> Description
            </span>
            <p className="text-xs text-slate-600 font-medium">
              {product.description ||
                "No description provided for this product."}
            </p>
          </div>

          {/* Existing Variants List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Product Variants & Stock
                </h3>
              </div>
              {!showAddForm && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-amber-200/60 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Variant
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {product.variants?.length === 0 || !product.variants ? (
                <div className="p-6 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-400 text-xs italic shadow-2xs">
                  No variants available.
                </div>
              ) : (
                product.variants?.map((v, idx) => {
                  const isEditing =
                    editingVariantId !== null &&
                    editingVariantId === v.productVariantId;

                  return (
                    <div
                      key={v.productVariantId ?? idx}
                      className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] font-black text-amber-900 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                            {v.sku}
                          </span>
                          <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                            {v.color} / {v.size}
                          </span>
                        </div>

                        <div>
                          {isEditing ? (
                            <div className="inline-flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-amber-300 shadow-2xs mt-1">
                              <span className="text-xs text-slate-500 font-bold">
                                Stock:
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={tempStock}
                                onChange={(e) =>
                                  setTempStock(parseInt(e.target.value) || 0)
                                }
                                className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F]"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleSaveVariantStock(v.productVariantId);
                                  if (e.key === "Escape")
                                    setEditingVariantId(null);
                                }}
                              />
                              <button
                                type="button"
                                disabled={savingStock}
                                onClick={() =>
                                  handleSaveVariantStock(v.productVariantId)
                                }
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer border border-emerald-200/60 shadow-2xs"
                                title="Save stock"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingVariantId(null)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer border border-slate-200/60 shadow-2xs"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingVariantId(v.productVariantId ?? null);
                                setTempStock(v.stock);
                              }}
                              className="group/stock inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-400 font-medium hover:text-slate-700 transition-colors pt-1"
                              title="Click to quickly update stock"
                            >
                              Stock:{" "}
                              <span className="text-slate-800 font-bold">
                                {v.stock}
                              </span>{" "}
                              units
                              <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover/stock:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="font-mono font-black text-slate-900 text-sm self-start sm:self-auto">
                        PHP {v.unitPrice.toFixed(2)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add New Variant Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddSubmit}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  New Variant Details
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase">
                    <Tag className="w-3 h-3 text-[#F9B53F]" /> SKU{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newVariant.sku}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, sku: e.target.value })
                    }
                    placeholder="SKU-201"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-semibold text-slate-800 uppercase focus:outline-none focus:border-[#F9B53F]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase">
                    <DollarSign className="w-3 h-3 text-[#F9B53F]" /> Price
                    (PHP) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newVariant.unitPrice}
                    onChange={(e) =>
                      setNewVariant({
                        ...newVariant,
                        unitPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase">
                    <Box className="w-3 h-3 text-[#F9B53F]" /> Initial Stock
                  </label>
                  <input
                    type="number"
                    value={newVariant.stock}
                    onChange={(e) =>
                      setNewVariant({
                        ...newVariant,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase">
                    Option / Size
                  </label>
                  <input
                    type="text"
                    value={newVariant.size}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, size: e.target.value })
                    }
                    placeholder="e.g. A4 / Glossy"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Variant"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-white shrink-0 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
