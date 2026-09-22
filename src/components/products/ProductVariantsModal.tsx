import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Product, ProductVariant } from "../../types/product";
import {
  X,
  Plus,
  Package,
  DollarSign,
  Box,
  Check,
  Edit2,
  FileText,
  Sliders,
  Palette,
  Tag,
  Trash2,
} from "lucide-react";
import { ConfirmModal } from "../common/ConfirmModal";

interface ProductVariantsModalProps {
  product: Product;
  saving: boolean;
  error: string;
  onClose: () => void;
  onAddVariant: (productId: number, variant: ProductVariant) => void;
  onUpdateVariant?: (
    productId: number,
    variantId: number,
    data: ProductVariant,
  ) => Promise<void>;
  onDeleteVariant?: (productId: number, variantId: number) => Promise<void>;
  onUpdateProductDetails?: (
    productId: number,
    data: { name: string; description: string; isActive: boolean },
  ) => Promise<void>;
}

export const ProductVariantsModal: React.FC<ProductVariantsModalProps> = ({
  product,
  saving,
  error,
  onClose,
  onAddVariant,
  onUpdateVariant,
  onDeleteVariant,
  onUpdateProductDetails,
}) => {
  const [prevProductId, setPrevProductId] = useState<number>(product.productId);

  // Inline Product Editing States
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productDetails, setProductDetails] = useState({
    name: product.name,
    description: product.description || "",
    isActive: product.isActive,
  });
  const [savingProduct, setSavingProduct] = useState(false);

  if (product.productId !== prevProductId) {
    setPrevProductId(product.productId);
    setProductDetails({
      name: product.name,
      description: product.description || "",
      isActive: product.isActive,
    });
    setIsEditingProduct(false);
  }

  // New Variant Form State
  const [newVariant, setNewVariant] = useState<ProductVariant>({
    sku: "",
    color: "",
    size: "",
    unitPrice: 0,
    stock: 0,
    isActive: true,
  });

  // Inline Full Variant Editing States
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editVariantData, setEditVariantData] = useState<ProductVariant>({
    sku: "",
    color: "",
    size: "",
    unitPrice: 0,
    stock: 0,
    isActive: true,
  });
  const [savingVariant, setSavingVariant] = useState(false);

  // Deletion Modal Tracking States
  const [deletingVariantId, setDeletingVariantId] = useState<number | null>(
    null,
  );
  const [variantToDelete, setVariantToDelete] = useState<number | null>(null);

  // Filter out inactive / soft-deleted variants from UI
  const visibleVariants =
    product.variants?.filter((v) => v.isActive !== false) || [];

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSaveProductDetails = async () => {
    if (!productDetails.name.trim()) {
      toast.error("Product Name is required.");
      return;
    }
    if (!onUpdateProductDetails) return;

    try {
      setSavingProduct(true);
      await onUpdateProductDetails(product.productId, productDetails);
      toast.success("Product details updated successfully!");
      setIsEditingProduct(false);
    } catch (err) {
      console.error("Failed to update product details", err);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const hasIdentifier =
      (newVariant.sku && newVariant.sku.trim() !== "") ||
      (newVariant.color && newVariant.color.trim() !== "") ||
      (newVariant.size && newVariant.size.trim() !== "");

    if (!hasIdentifier) {
      toast.error("Please provide at least a SKU Code, Color, or Size option.");
      return;
    }

    onAddVariant(product.productId, newVariant);
    setNewVariant({
      sku: "",
      color: "",
      size: "",
      unitPrice: 0,
      stock: 0,
      isActive: true,
    });
  };

  const startEditVariant = (variant: ProductVariant) => {
    setEditingVariantId(variant.productVariantId ?? null);
    setEditVariantData({
      sku: variant.sku || "",
      color: variant.color || "",
      size: variant.size || "",
      unitPrice: variant.unitPrice || 0,
      stock: variant.stock || 0,
      isActive: variant.isActive !== false,
    });
  };

  const handleSaveVariant = async (variantId: number | undefined) => {
    if (!onUpdateVariant || variantId === undefined) return;

    try {
      setSavingVariant(true);
      await onUpdateVariant(product.productId, variantId, editVariantData);
      toast.success("Variant successfully updated!");
      setEditingVariantId(null);
    } catch (err) {
      console.error("Failed to update variant", err);
    } finally {
      setSavingVariant(false);
    }
  };

  const requestDeleteVariant = (variantId: number | undefined) => {
    if (variantId === undefined) return;
    setVariantToDelete(variantId);
  };

  const executeDeleteVariant = async () => {
    if (!onDeleteVariant || variantToDelete === null) return;

    try {
      setDeletingVariantId(variantToDelete);
      await onDeleteVariant(product.productId, variantToDelete);
      toast.success("Variant deleted.");
      setVariantToDelete(null);
    } catch (err) {
      console.error("Failed to delete variant", err);
    } finally {
      setDeletingVariantId(null);
    }
  };

  const formatVariantAttributes = (color?: string, size?: string) => {
    const parts = [color, size].filter((p) => p && p.trim() !== "");
    return parts.length > 0 ? parts.join(" / ") : "Standard Option";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Modal Shell matching CustomerDetailsModal / QuotationDetailsModal */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Flat Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-2xs shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Product Overview
                </h2>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                {isEditingProduct ? (
                  <input
                    type="text"
                    value={productDetails.name}
                    onChange={(e) =>
                      setProductDetails({
                        ...productDetails,
                        name: e.target.value,
                      })
                    }
                    className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs max-w-xs"
                    placeholder="Product Name"
                  />
                ) : (
                  <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                    {productDetails.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Detailed view, variants, and stock management parameters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase shadow-2xs">
              {visibleVariants.length} Variant(s)
            </span>

            {!isEditingProduct ? (
              <button
                type="button"
                onClick={() => {
                  setProductDetails({
                    name: product.name,
                    description: product.description || "",
                    isActive: product.isActive,
                  });
                  setIsEditingProduct(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:hover:text-white text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={savingProduct}
                  onClick={handleSaveProductDetails}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer text-xs font-semibold border border-emerald-200 dark:border-emerald-900/60 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProduct(false)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body (2-Column Grid Layout matching CustomerDetailsModal/QuotationDetailsModal) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/50 dark:bg-slate-950/50">
          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Description
              </span>
              {isEditingProduct ? (
                <textarea
                  rows={2}
                  value={productDetails.description}
                  onChange={(e) =>
                    setProductDetails({
                      ...productDetails,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter product description..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs mt-1 resize-none"
                />
              ) : (
                <p className="text-xs font-medium text-slate-900 dark:text-slate-100 pt-0.5 leading-relaxed">
                  {productDetails.description || (
                    <span className="italic text-slate-400 dark:text-slate-500">
                      No description provided.
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-slate-400" /> Total Stock &amp;
                Status
              </span>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 pt-0.5">
                {visibleVariants.reduce((acc, v) => acc + (v.stock || 0), 0)}{" "}
                units across {visibleVariants.length} variant(s)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Add Variant Form */}
            <div className="lg:col-span-5 space-y-3">
              <form
                onSubmit={handleAddSubmit}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Add New Variant Option
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        <Tag className="w-3 h-3 text-slate-400" /> SKU Code
                      </label>
                      <input
                        type="text"
                        value={newVariant.sku}
                        onChange={(e) =>
                          setNewVariant({ ...newVariant, sku: e.target.value })
                        }
                        placeholder="e.g. SKU-001"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        <Palette className="w-3 h-3 text-slate-400" /> Color /
                        Variant
                      </label>
                      <input
                        type="text"
                        value={newVariant.color}
                        onChange={(e) =>
                          setNewVariant({
                            ...newVariant,
                            color: e.target.value,
                          })
                        }
                        placeholder="e.g. Matte Black"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      <Sliders className="w-3 h-3 text-slate-400" /> Size /
                      Format
                    </label>
                    <input
                      type="text"
                      value={newVariant.size}
                      onChange={(e) =>
                        setNewVariant({ ...newVariant, size: e.target.value })
                      }
                      placeholder="e.g. A4 / Large"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        <DollarSign className="w-3 h-3 text-slate-400" /> Unit
                        Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newVariant.unitPrice}
                        onChange={(e) =>
                          setNewVariant({
                            ...newVariant,
                            unitPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        <Box className="w-3 h-3 text-slate-400" /> Stock Level
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
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{saving ? "Adding..." : "Save Variant Option"}</span>
                </button>
              </form>
            </div>

            {/* Right Column: Configured Variants List */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Configured Variants
                </h3>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
                  {visibleVariants.length} item(s)
                </span>
              </div>

              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {visibleVariants.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic shadow-2xs">
                    No variant configurations added yet.
                  </div>
                ) : (
                  visibleVariants.map((v, idx) => {
                    const isEditing =
                      editingVariantId !== null &&
                      editingVariantId === v.productVariantId;
                    const isDeleting =
                      deletingVariantId !== null &&
                      deletingVariantId === v.productVariantId;

                    if (isEditing) {
                      return (
                        <div
                          key={v.productVariantId ?? idx}
                          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 space-y-3 shadow-2xs"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" />{" "}
                              Editing Variant
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={savingVariant}
                                onClick={() =>
                                  handleSaveVariant(v.productVariantId)
                                }
                                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs"
                              >
                                <Check className="w-3.5 h-3.5" /> Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingVariantId(null)}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase block mb-1">
                                SKU
                              </label>
                              <input
                                type="text"
                                value={editVariantData.sku}
                                onChange={(e) =>
                                  setEditVariantData({
                                    ...editVariantData,
                                    sku: e.target.value,
                                  })
                                }
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase block mb-1">
                                Color
                              </label>
                              <input
                                type="text"
                                value={editVariantData.color}
                                onChange={(e) =>
                                  setEditVariantData({
                                    ...editVariantData,
                                    color: e.target.value,
                                  })
                                }
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase block mb-1">
                                Size
                              </label>
                              <input
                                type="text"
                                value={editVariantData.size}
                                onChange={(e) =>
                                  setEditVariantData({
                                    ...editVariantData,
                                    size: e.target.value,
                                  })
                                }
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase block mb-1">
                                Unit Price (₱)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={editVariantData.unitPrice}
                                onChange={(e) =>
                                  setEditVariantData({
                                    ...editVariantData,
                                    unitPrice: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase block mb-1">
                                Stock
                              </label>
                              <input
                                type="number"
                                value={editVariantData.stock}
                                onChange={(e) =>
                                  setEditVariantData({
                                    ...editVariantData,
                                    stock: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const hasSku = v.sku && v.sku.trim() !== "";

                    return (
                      <div
                        key={v.productVariantId ?? idx}
                        className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {hasSku && (
                              <span className="font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg">
                                {v.sku}
                              </span>
                            )}
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {formatVariantAttributes(v.color, v.size)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                            Stock: {v.stock} units
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="font-mono font-semibold text-slate-900 dark:text-white text-xs">
                            ₱{v.unitPrice.toFixed(2)}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditVariant(v)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                              title="Edit Variant"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() =>
                                requestDeleteVariant(v.productVariantId)
                              }
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition-all cursor-pointer border border-rose-200 dark:border-rose-900/60 shadow-2xs disabled:opacity-40"
                              title="Delete Variant"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:hover:text-white transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            Close Overview
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Variant Deletion */}
      <ConfirmModal
        isOpen={variantToDelete !== null}
        title="Delete Variant Option"
        message="Are you sure you want to delete this variant option? The variant will be moved to the Trash & Recovery archive."
        confirmText="Yes, Delete"
        isDanger={true}
        loading={deletingVariantId !== null}
        onConfirm={executeDeleteVariant}
        onClose={() => setVariantToDelete(null)}
      />
    </div>
  );
};
