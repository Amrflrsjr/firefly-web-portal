import React, { useState } from "react";
import type { Product } from "../../types/product";
import {
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Edit2,
  Trash2,
  Edit,
} from "lucide-react";

interface ProductTableProps {
  loading: boolean;
  products: Product[];
  sortBy: string;
  ascending: boolean;
  onSort: (field: string) => void;
  onViewVariants: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onUpdateVariantStock?: (
    productId: number,
    variantId: number,
    newStock: number,
  ) => Promise<void>;
  onDeleteProduct?: (productId: number) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  loading,
  products,
  sortBy,
  ascending,
  onSort,
  onViewVariants,
  onEditProduct,
  onUpdateVariantStock,
  onDeleteProduct,
}) => {
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Inline stock editing states (tracking editing product id)
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const [savingStock, setSavingStock] = useState(false);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm font-medium flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="w-6 h-6 border-2 border-[#F9B53F] border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold text-slate-600">
          Loading products catalog...
        </span>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm font-medium bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        No products found. Click{" "}
        <b className="text-slate-800">"+ Add Product"</b> above to add one.
      </div>
    );
  }

  const totalPages = Math.ceil(products.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentProducts = products.slice(startIndex, startIndex + pageSize);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400" />;
    }
    return ascending ? (
      <ArrowUp className="w-3 h-3 text-[#F9B53F]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#F9B53F]" />
    );
  };

  const handleSaveStock = async (
    productId: number,
    variantId: number | undefined,
    e: React.MouseEvent | React.KeyboardEvent,
  ) => {
    e.stopPropagation();
    if (!onUpdateVariantStock || variantId === undefined) return;

    try {
      setSavingStock(true);
      await onUpdateVariantStock(productId, variantId, tempStock);
      setEditingProductId(null);
    } catch (err) {
      console.error("Failed to update stock", err);
    } finally {
      setSavingStock(false);
    }
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              <th
                onClick={() => onSort("name")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  Product Name
                  {renderSortIcon("name")}
                </div>
              </th>
              <th className="py-3.5 px-6 whitespace-nowrap">Variants</th>
              <th className="py-3.5 px-6 whitespace-nowrap">Price Range</th>
              <th className="py-3.5 px-6 whitespace-nowrap">
                Stock Management
              </th>
              <th className="py-3.5 px-6 text-right whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-medium">
            {currentProducts.map((product) => {
              const minPrice = product.variants?.length
                ? Math.min(...product.variants.map((v) => v.unitPrice))
                : 0;
              const maxPrice = product.variants?.length
                ? Math.max(...product.variants.map((v) => v.unitPrice))
                : 0;
              const totalStock =
                product.variants?.reduce((acc, v) => acc + v.stock, 0) || 0;

              const hasSingleVariant = product.variants?.length === 1;
              const targetVariant = hasSingleVariant
                ? product.variants[0]
                : null;
              const isEditing = editingProductId === product.productId;

              return (
                <tr
                  key={product.productId}
                  onClick={() => !isEditing && onViewVariants(product)}
                  className={`transition-colors ${
                    isEditing
                      ? "bg-amber-50/70 ring-1 ring-inset ring-amber-300/60"
                      : "hover:bg-[#FCFDFF] cursor-pointer group"
                  }`}
                >
                  <td className="py-4 px-6 text-slate-800">
                    <div className="flex items-center gap-3.5 min-w-50">
                      <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 text-[#F9B53F] font-bold flex items-center justify-center text-xs shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-slate-900 font-bold group-hover:text-amber-900 transition-colors truncate">
                          {product.name}
                        </div>
                        <div className="text-xs text-slate-400 font-normal max-w-xs truncate mt-0.5">
                          {product.description || "No description provided"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 shadow-2xs">
                      <Layers className="w-3 h-3 text-[#F9B53F]" />
                      {product.variants?.length || 0} Variants
                    </span>
                  </td>

                  <td className="py-4 px-6 font-bold text-slate-900 font-mono text-xs whitespace-nowrap">
                    <span className="bg-slate-100/80 px-2.5 py-1 rounded-lg text-slate-700 border border-slate-200/60">
                      {minPrice === maxPrice
                        ? `PHP ${minPrice.toFixed(2)}`
                        : `PHP ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`}
                    </span>
                  </td>

                  <td
                    className="py-4 px-6 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isEditing ? (
                      <div className="inline-flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-amber-300 shadow-md animate-in fade-in zoom-in-95 duration-150">
                        <input
                          type="number"
                          min={0}
                          value={tempStock}
                          onChange={(e) =>
                            setTempStock(parseInt(e.target.value) || 0)
                          }
                          className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F] focus:bg-white shadow-2xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const variantIdToSave = hasSingleVariant
                                ? targetVariant?.productVariantId
                                : product.variants?.[0]?.productVariantId;
                              handleSaveStock(
                                product.productId,
                                variantIdToSave,
                                e,
                              );
                            }
                            if (e.key === "Escape") setEditingProductId(null);
                          }}
                        />
                        <button
                          type="button"
                          disabled={savingStock}
                          onClick={(e) => {
                            const variantIdToSave = hasSingleVariant
                              ? targetVariant?.productVariantId
                              : product.variants?.[0]?.productVariantId;
                            handleSaveStock(
                              product.productId,
                              variantIdToSave,
                              e,
                            );
                          }}
                          className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer shadow-2xs border border-emerald-200/60"
                          title="Save stock"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProductId(null)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer shadow-2xs border border-slate-200/60"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : hasSingleVariant && targetVariant ? (
                      <div
                        onClick={() => {
                          setEditingProductId(product.productId);
                          setTempStock(targetVariant.stock);
                        }}
                        className="group/stock inline-flex items-center gap-2 cursor-pointer py-1 px-2.5 rounded-xl hover:bg-amber-50/60 transition-all border border-transparent hover:border-amber-200"
                        title="Click to quickly update stock"
                      >
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-2xs whitespace-nowrap ${
                            targetVariant.stock > 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                              : "bg-rose-50 text-rose-700 border-rose-200/80"
                          }`}
                        >
                          {targetVariant.stock} in stock
                        </span>
                        <span className="w-6 h-6 rounded-lg bg-amber-100/50 group-hover/stock:bg-amber-100 text-amber-700 flex items-center justify-center opacity-0 group-hover/stock:opacity-100 transition-all shadow-2xs">
                          <Edit2 className="w-3 h-3" />
                        </span>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          if (product.variants && product.variants.length > 0) {
                            setEditingProductId(product.productId);
                            setTempStock(product.variants[0].stock);
                          } else {
                            onViewVariants(product);
                          }
                        }}
                        className="group/stock inline-flex items-center gap-2 cursor-pointer py-1 px-2.5 rounded-xl hover:bg-amber-50/60 transition-all border border-transparent hover:border-amber-200"
                        title="Click to quickly update primary variant stock or manage variants"
                      >
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs whitespace-nowrap">
                          {totalStock} total ({product.variants?.length || 0}{" "}
                          variants)
                        </span>
                        <span className="w-6 h-6 rounded-lg bg-amber-100/50 group-hover/stock:bg-amber-100 text-amber-700 flex items-center justify-center opacity-0 group-hover/stock:opacity-100 transition-all shadow-2xs">
                          <Edit2 className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                  </td>

                  <td
                    className="py-4 px-6 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditProduct?.(product)}
                        title="Edit Product Details"
                        className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteProduct?.(product.productId)}
                        title="Delete Product"
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center hover:scale-105"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/80 bg-white">
          <p className="text-xs text-slate-500 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-700">{startIndex + 1}</span>{" "}
            to{" "}
            <span className="font-bold text-slate-700">
              {Math.min(startIndex + pageSize, products.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700">{products.length}</span>{" "}
            results
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
