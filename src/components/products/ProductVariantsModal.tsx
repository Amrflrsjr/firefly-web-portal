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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158]" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 flex items-center justify-center text-slate-800 shadow-2xs">
              <Package className="w-5 h-5 text-[#F9B53F]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {product.name}
              </h2>
              <p className="text-xs text-slate-400 font-medium truncate max-w-xs">
                {product.description || "No description provided"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#FCFDFF]">
          {/* Existing Variants List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Product Variants
                </h3>
              </div>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Variant
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {product.variants?.length === 0 || !product.variants ? (
                <div className="p-4 text-center bg-white rounded-2xl border border-slate-200/70 text-slate-400 text-xs italic">
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
                      className="p-3.5 bg-white rounded-2xl border border-slate-200/70 shadow-2xs flex items-center justify-between text-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-md">
                            {v.sku}
                          </span>
                          <span className="font-bold text-slate-800">
                            {v.color} / {v.size}
                          </span>
                        </div>

                        <div className="mt-1">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1.5 mt-1">
                              <span className="text-xs text-slate-400 font-medium">
                                Stock:
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={tempStock}
                                onChange={(e) =>
                                  setTempStock(parseInt(e.target.value) || 0)
                                }
                                className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F]"
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
                                className="p-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-md transition-colors cursor-pointer"
                                title="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingVariantId(null)}
                                className="p-1 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
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
                              className="group/stock inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-400 font-medium hover:text-slate-700 transition-colors"
                              title="Click to quickly update stock"
                            >
                              Stock:{" "}
                              <span className="text-slate-700 font-bold">
                                {v.stock}
                              </span>{" "}
                              units
                              <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover/stock:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="font-mono font-bold text-slate-900 text-sm">
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
              className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase mb-1">
                    <Tag className="w-3 h-3 text-[#F9B53F]" /> SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVariant.sku}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, sku: e.target.value })
                    }
                    placeholder="SKU-201"
                    className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 uppercase focus:outline-none focus:border-[#F9B53F]"
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
                    value={newVariant.unitPrice}
                    onChange={(e) =>
                      setNewVariant({
                        ...newVariant,
                        unitPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase mb-1">
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
                    className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Option / Size
                  </label>
                  <input
                    type="text"
                    value={newVariant.size}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, size: e.target.value })
                    }
                    placeholder="e.g. A4 / Glossy"
                    className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F9B53F]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Variant"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
