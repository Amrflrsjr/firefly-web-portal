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
  Loader2,
  ChevronDown,
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
  onUpdateProductDetails?: (
    productId: number,
    data: { name: string; description: string; isActive: boolean },
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
  onUpdateProductDetails,
  onDeleteProduct,
}) => {
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Inline stock editing states
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const [savingStock, setSavingStock] = useState(false);

  // Inline catalog status updating state
  const [updatingStatusProductId, setUpdatingStatusProductId] = useState<
    number | null
  >(null);

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

  const handleStatusChange = async (
    product: Product,
    newStatus: boolean,
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    e.stopPropagation();
    if (!onUpdateProductDetails || product.isActive === newStatus) return;

    try {
      setUpdatingStatusProductId(product.productId);
      await onUpdateProductDetails(product.productId, {
        name: product.name,
        description: product.description || "",
        isActive: newStatus,
      });
    } catch (err) {
      console.error("Failed to update product status", err);
    } finally {
      setUpdatingStatusProductId(null);
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
              <th className="py-3.5 px-6 whitespace-nowrap">Catalog Status</th>
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
              const isEditing =
                hasSingleVariant && editingProductId === product.productId;

              const isActiveInCatalog = product.isActive !== false;
              const isUpdatingStatus =
                updatingStatusProductId === product.productId;

              return (
                <tr
                  key={product.productId}
                  className={`transition-colors ${
                    isEditing
                      ? "bg-amber-50/70 ring-1 ring-inset ring-amber-300/60"
                      : "hover:bg-[#FCFDFF] group"
                  }`}
                >
                  <td
                    className="py-4 px-6 text-slate-800 cursor-pointer"
                    onClick={() => !isEditing && onViewVariants(product)}
                  >
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

                  {/* Dynamic Active/Inactive Colored Dropdown */}
                  <td
                    className="py-4 px-6 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative inline-flex items-center">
                      <select
                        disabled={isUpdatingStatus}
                        value={isActiveInCatalog ? "active" : "inactive"}
                        onChange={(e) =>
                          handleStatusChange(
                            product,
                            e.target.value === "active",
                            e,
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                        className={`appearance-none pl-3.5 pr-7 py-1 rounded-full text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                          isActiveInCatalog
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100/80 focus:ring-emerald-300"
                            : "bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100/80 focus:ring-rose-300"
                        }`}
                      >
                        <option
                          value="active"
                          className="bg-white text-emerald-700 font-bold"
                        >
                          Active
                        </option>
                        <option
                          value="inactive"
                          className="bg-white text-rose-700 font-bold"
                        >
                          Inactive
                        </option>
                      </select>

                      <div className="absolute right-2.5 pointer-events-none flex items-center justify-center">
                        {isUpdatingStatus ? (
                          <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                        ) : (
                          <ChevronDown
                            className={`w-3 h-3 ${
                              isActiveInCatalog
                                ? "text-emerald-500"
                                : "text-rose-500"
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  </td>

                  <td
                    className="py-4 px-6 text-slate-600 whitespace-nowrap cursor-pointer"
                    onClick={() => !isEditing && onViewVariants(product)}
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 shadow-2xs">
                      <Layers className="w-3 h-3 text-[#F9B53F]" />
                      {product.variants?.length || 0} Variants
                    </span>
                  </td>

                  <td
                    className="py-4 px-6 font-bold text-slate-900 font-mono text-xs whitespace-nowrap cursor-pointer"
                    onClick={() => !isEditing && onViewVariants(product)}
                  >
                    <span className="bg-slate-100/80 px-2.5 py-1 rounded-lg text-slate-700 border border-slate-200/60">
                      {minPrice === maxPrice
                        ? `PHP ${minPrice.toFixed(2)}`
                        : `PHP ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`}
                    </span>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
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
                              handleSaveStock(
                                product.productId,
                                targetVariant?.productVariantId,
                                e,
                              );
                            }
                            if (e.key === "Escape") setEditingProductId(null);
                          }}
                        />
                        <button
                          type="button"
                          disabled={savingStock}
                          onClick={(e) =>
                            handleSaveStock(
                              product.productId,
                              targetVariant?.productVariantId,
                              e,
                            )
                          }
                          className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer shadow-2xs border border-emerald-200/60 active:scale-95"
                          title="Save stock"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProductId(null)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer shadow-2xs border border-slate-200/60 active:scale-95"
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
                        onClick={() => onViewVariants(product)}
                        className="inline-flex items-center gap-2 cursor-pointer py-1 px-2.5 rounded-xl hover:bg-slate-100/80 transition-all border border-transparent"
                        title="Click to view and edit variant stocks in modal"
                      >
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs whitespace-nowrap">
                          {totalStock} total ({product.variants?.length || 0}{" "}
                          variants)
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProduct?.(product);
                        }}
                        title="Edit Product Details"
                        className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60 rounded-xl transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center active:scale-95"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProduct?.(product.productId);
                        }}
                        title="Delete Product"
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 rounded-xl transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center active:scale-95"
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
