import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Product, ProductVariant } from "../../types/product";
import {
  X,
  Plus,
  Package,
  Layers,
  DollarSign,
  Box,
  Check,
  Edit2,
  FileText,
  Sliders,
  Palette,
  Tag,
  Save,
  Trash2,
  Sparkles,
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

    if (visibleVariants.length <= 1) {
      toast.error("A product must keep at least one variant configuration.");
      return;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-950/20 border border-slate-100 dark:border-slate-800 w-full max-w-5xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-linear-to-r from-[#FFCB62] via-[#F9B53F] to-[#F4D158] shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-[#F9B53F] dark:text-amber-400 shadow-xs shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold tracking-wider uppercase mb-1">
                <Sparkles className="w-3 h-3" /> Catalog Manager
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-lg">
                {productDetails.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Split Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          {/* Left Column: Product Info & Create Variant Form */}
          <div className="lg:col-span-5 p-6 overflow-y-auto space-y-5 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Product Info Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#F9B53F]" /> General
                    Details
                  </span>
                  {!isEditingProduct ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingProduct(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-800 font-extrabold cursor-pointer px-2 py-1 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={savingProduct}
                        onClick={handleSaveProductDetails}
                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProduct(false);
                          setProductDetails({
                            name: product.name,
                            description: product.description || "",
                            isActive: product.isActive,
                          });
                        }}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {isEditingProduct ? (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={productDetails.name}
                        onChange={(e) =>
                          setProductDetails({
                            ...productDetails,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={productDetails.description}
                        onChange={(e) =>
                          setProductDetails({
                            ...productDetails,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F] resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-normal leading-relaxed pt-1">
                    {productDetails.description ||
                      "No description provided for this catalog product."}
                  </p>
                )}
              </div>

              {/* Add Variant Form Card */}
              <form
                onSubmit={handleAddSubmit}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Add New Variant Option
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">
                        <Tag className="w-3 h-3 text-[#F9B53F]" /> SKU Code
                      </label>
                      <input
                        type="text"
                        value={newVariant.sku}
                        onChange={(e) =>
                          setNewVariant({ ...newVariant, sku: e.target.value })
                        }
                        placeholder="e.g. SKU-001"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">
                        <Palette className="w-3 h-3 text-[#F9B53F]" /> Color /
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
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">
                      <Sliders className="w-3 h-3 text-[#F9B53F]" /> Size /
                      Format
                    </label>
                    <input
                      type="text"
                      value={newVariant.size}
                      onChange={(e) =>
                        setNewVariant({ ...newVariant, size: e.target.value })
                      }
                      placeholder="e.g. A4 / Large / 500ml"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">
                        <DollarSign className="w-3 h-3 text-[#F9B53F]" /> Unit
                        Price <span className="text-rose-500">*</span>
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
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">
                        <Box className="w-3 h-3 text-[#F9B53F]" /> Stock Level
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
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full mt-2 py-3 text-xs font-extrabold bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-3" />
                  <span>{saving ? "Adding..." : "Save Variant Option"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Configured Variants List */}
          <div className="lg:col-span-7 p-6 overflow-y-auto space-y-4 bg-white dark:bg-slate-900 flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#F9B53F]" />
                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Configured Variants ({visibleVariants.length})
                </h3>
              </div>
            </div>

            <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              {visibleVariants.length === 0 ? (
                <div className="p-16 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                  <Package className="w-8 h-8 opacity-40 text-slate-400" />
                  <p className="font-semibold">
                    No variant configurations added yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Use the form on the left to add your first option.
                  </p>
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
                        className="p-5 bg-amber-50/50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/80 space-y-3.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-800/60 pb-2.5">
                          <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                            <Edit2 className="w-3.5 h-3.5 text-amber-600" />{" "}
                            Editing Variant Item
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={savingVariant}
                              onClick={() =>
                                handleSaveVariant(v.productVariantId)
                              }
                              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center gap-1 shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" /> Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingVariantId(null)}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-2xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">
                              SKU Code
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
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">
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
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">
                              Size / Option
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
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">
                              Unit Price (PHP)
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
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">
                              Stock Count
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
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#F9B53F]"
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
                      className="p-4 bg-slate-50/60 dark:bg-slate-850/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm hover:border-amber-300/60 dark:hover:border-amber-600/40 transition-all hover:bg-white dark:hover:bg-slate-850 group"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {hasSku && (
                            <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md shadow-2xs">
                              {v.sku}
                            </span>
                          )}
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {formatVariantAttributes(v.color, v.size)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5">
                          <Box className="w-3.5 h-3.5 text-slate-400" />
                          <span>Stock:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-bold">
                            {v.stock} units
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 self-end sm:self-auto shrink-0">
                        <div className="font-mono font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 px-3 py-1.5 rounded-xl shadow-2xs">
                          PHP {v.unitPrice.toFixed(2)}
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditVariant(v)}
                            className="p-2 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
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
                            className="p-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-40"
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

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            Close Window
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
