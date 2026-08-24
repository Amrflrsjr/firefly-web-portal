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
} from "lucide-react";

interface ProductTableProps {
  loading: boolean;
  products: Product[];
  sortBy: string;
  ascending: boolean;
  onSort: (field: string) => void;
  onViewVariants: (product: Product) => void;
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
      <div className="p-12 text-center text-slate-400 text-sm font-medium">
        Loading products catalog...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm font-medium">
        No products found. Click{" "}
        <b className="text-slate-700">"+ Add Product"</b> above to add one.
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
      <div className="overflow-x-visible sm:overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              <th
                onClick={() => onSort("name")}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Product Name
                  {renderSortIcon("name")}
                </div>
              </th>
              <th className="py-3.5 px-6">Variants</th>
              <th className="py-3.5 px-6">Price Range</th>
              <th className="py-3.5 px-6">Stock Management</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
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

              const singleVariant =
                product.variants?.length === 1 ? product.variants[0] : null;
              const isEditing =
                singleVariant !== null &&
                editingProductId === product.productId;

              return (
                <tr
                  key={product.productId}
                  onClick={() => onViewVariants(product)}
                  className="hover:bg-[#FCFDFF] transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-6 text-slate-800">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FFCB62]/30 to-[#F4D158]/30 text-[#F9B53F] font-bold flex items-center justify-center text-xs shadow-2xs group-hover:scale-105 transition-transform">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-slate-900 font-bold group-hover:text-amber-900 transition-colors">
                          {product.name}
                        </div>
                        <div className="text-xs text-slate-400 font-normal max-w-xs truncate mt-0.5">
                          {product.description || "No description provided"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-slate-600">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100/80 text-slate-700 border border-slate-200/60 shadow-2xs">
                      <Layers className="w-3 h-3 text-[#F9B53F]" />
                      {product.variants?.length || 0} Variants
                    </span>
                  </td>

                  <td className="py-4 px-6 font-bold text-slate-800 font-mono text-xs">
                    {minPrice === maxPrice
                      ? `PHP ${minPrice.toFixed(2)}`
                      : `PHP ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`}
                  </td>

                  <td
                    className="py-4 px-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {singleVariant ? (
                      isEditing ? (
                        <div className="inline-flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={tempStock}
                            onChange={(e) =>
                              setTempStock(parseInt(e.target.value) || 0)
                            }
                            className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F] shadow-xs"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleSaveStock(
                                  product.productId,
                                  singleVariant.productVariantId,
                                  e,
                                );
                              if (e.key === "Escape") setEditingProductId(null);
                            }}
                          />
                          <button
                            type="button"
                            disabled={savingStock}
                            onClick={(e) =>
                              handleSaveStock(
                                product.productId,
                                singleVariant.productVariantId,
                                e,
                              )
                            }
                            className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProductId(null)}
                            className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingProductId(product.productId);
                            setTempStock(singleVariant.stock);
                          }}
                          className="group/stock inline-flex items-center gap-2 cursor-pointer py-1 px-2 rounded-xl hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200"
                          title="Click to quickly update stock"
                        >
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                              singleVariant.stock > 0
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                : "bg-rose-50 text-rose-700 border-rose-200/80"
                            }`}
                          >
                            {singleVariant.stock} in stock
                          </span>
                          <span>
                            <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover/stock:opacity-100 transition-opacity" />
                          </span>
                        </div>
                      )
                    ) : (
                      <span
                        onClick={() => onViewVariants(product)}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80 cursor-pointer hover:bg-slate-200 transition-colors"
                        title="Multiple variants - click to manage variants"
                      >
                        {totalStock} total (Multiple variants)
                      </span>
                    )}
                  </td>

                  <td
                    className="py-4 px-6 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onDeleteProduct?.(product.productId)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 transition-colors cursor-pointer inline-flex items-center justify-center shadow-2xs"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
