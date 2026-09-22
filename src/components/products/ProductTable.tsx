import React, { useState, useRef, useEffect } from "react";
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
  MoreVertical,
  Eye,
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

  // Actions dropdown menu states
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
        setMenuCoords(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-xs font-medium flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="w-5 h-5 border-2 border-slate-600 dark:border-slate-300 border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          Loading products catalog...
        </span>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
        No products found. Click{" "}
        <b className="text-slate-700 dark:text-slate-300">"+ Add Product"</b>{" "}
        above to add one.
      </div>
    );
  }

  const totalPages = Math.ceil(products.length / pageSize) || 1;
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
      return (
        <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
      );
    }
    return ascending ? (
      <ArrowUp className="w-3 h-3 text-slate-700 dark:text-slate-200" />
    ) : (
      <ArrowDown className="w-3 h-3 text-slate-700 dark:text-slate-200" />
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
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
              <th
                onClick={() => onSort("name")}
                className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  Product Name
                  {renderSortIcon("name")}
                </div>
              </th>
              <th className="py-3 px-4 whitespace-nowrap">Catalog Status</th>
              <th className="py-3 px-4 whitespace-nowrap">Variants</th>
              <th className="py-3 px-4 whitespace-nowrap">Price Range</th>
              <th className="py-3 px-4 whitespace-nowrap">Stock Management</th>
              <th className="py-3 px-4 text-right whitespace-nowrap w-16 font-bold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
            {currentProducts.map((product) => {
              const hasVariants =
                product.variants && product.variants.length > 0;
              const minPrice = hasVariants
                ? Math.min(...product.variants.map((v) => v.unitPrice))
                : 0;
              const maxPrice = hasVariants
                ? Math.max(...product.variants.map((v) => v.unitPrice))
                : 0;
              const totalStock = hasVariants
                ? product.variants.reduce((acc, v) => acc + v.stock, 0)
                : 0;

              const hasSingleVariant = product.variants?.length === 1;
              const targetVariant = hasSingleVariant
                ? product.variants[0]
                : null;
              const isEditing =
                hasSingleVariant && editingProductId === product.productId;

              const isActiveInCatalog = product.isActive !== false;
              const isUpdatingStatus =
                updatingStatusProductId === product.productId;

              const isMenuOpen = activeMenuId === product.productId;

              return (
                <tr
                  key={product.productId}
                  className={`transition-colors ${
                    isEditing
                      ? "bg-amber-50/70 dark:bg-amber-950/40"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50 group cursor-pointer"
                  }`}
                  onClick={() => !isEditing && onViewVariants(product)}
                >
                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-3 min-w-50">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shadow-2xs shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-slate-900 dark:text-white font-semibold truncate">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal max-w-xs truncate mt-0.5">
                          {product.description || (
                            <span className="italic opacity-70">
                              No description provided
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Dynamic Active/Inactive Colored Dropdown */}
                  <td
                    className="py-3.5 px-4 whitespace-nowrap"
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
                        className={`appearance-none cursor-pointer pl-2.5 pr-6 py-1 rounded-lg text-[11px] font-bold border transition-all duration-150 outline-none focus:ring-1 shadow-2xs ${
                          isActiveInCatalog
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 focus:ring-emerald-400"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 focus:ring-rose-400"
                        }`}
                      >
                        <option
                          value="active"
                          className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-semibold"
                        >
                          Active
                        </option>
                        <option
                          value="inactive"
                          className="bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 font-semibold"
                        >
                          Inactive
                        </option>
                      </select>
                      <div className="absolute right-2 pointer-events-none flex items-center justify-center">
                        {isUpdatingStatus ? (
                          <Loader2 className="w-3 h-3 animate-spin text-slate-400 dark:text-slate-500" />
                        ) : (
                          <ChevronDown
                            className={`w-3 h-3 ${
                              isActiveInCatalog
                                ? "text-emerald-500 dark:text-emerald-400"
                                : "text-rose-500 dark:text-rose-400"
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {hasVariants ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <Layers className="w-3 h-3 text-slate-400" />
                        {product.variants.length} Variants
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        No Variants
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-200 font-mono text-xs whitespace-nowrap">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {hasVariants
                        ? minPrice === maxPrice
                          ? `₱${minPrice.toFixed(2)}`
                          : `₱${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`
                        : "N/A"}
                    </span>
                  </td>

                  <td
                    className="py-3.5 px-4 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isEditing ? (
                      <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm">
                        <input
                          type="number"
                          min={0}
                          value={tempStock}
                          onChange={(e) =>
                            setTempStock(parseInt(e.target.value) || 0)
                          }
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
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
                          className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-900/60 shadow-2xs active:scale-95"
                          title="Save stock"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProductId(null)}
                          className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs active:scale-95"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : !hasVariants ? (
                      <div
                        onClick={() => onViewVariants(product)}
                        className="inline-flex items-center gap-1 cursor-pointer"
                        title="Click to add variants and stock"
                      >
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          No stock tracked
                        </span>
                      </div>
                    ) : hasSingleVariant && targetVariant ? (
                      <div
                        onClick={() => {
                          setEditingProductId(product.productId);
                          setTempStock(targetVariant.stock);
                        }}
                        className="group/stock inline-flex items-center gap-1.5 cursor-pointer"
                        title="Click to quickly update stock"
                      >
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border shadow-2xs ${
                            targetVariant.stock > 0
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
                              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60"
                          }`}
                        >
                          {targetVariant.stock} in stock
                        </span>
                        <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 group-hover/stock:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center opacity-0 group-hover/stock:opacity-100 transition-all shadow-2xs">
                          <Edit2 className="w-3 h-3" />
                        </span>
                      </div>
                    ) : (
                      <div
                        onClick={() => onViewVariants(product)}
                        className="inline-flex items-center gap-1 cursor-pointer"
                        title="Click to view and edit variant stocks in modal"
                      >
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {totalStock} total ({product.variants.length}{" "}
                          variants)
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Actions Column with Fixed Positioning Dropdown */}
                  <td className="py-3.5 px-4 text-right relative whitespace-nowrap">
                    <div
                      className="flex items-center justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeMenuId === product.productId) {
                            setActiveMenuId(null);
                            setMenuCoords(null);
                          } else {
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            const menuHeight = 160;
                            const showAbove =
                              window.innerHeight - rect.bottom < menuHeight &&
                              rect.top > menuHeight;

                            setActiveMenuId(product.productId);
                            setMenuCoords({
                              top: showAbove
                                ? rect.top - menuHeight - 4
                                : rect.bottom + 4,
                              left: Math.max(12, rect.right - 180),
                            });
                          }
                        }}
                        title="Actions"
                        className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition-all duration-150 shadow-2xs cursor-pointer inline-flex items-center justify-center"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && menuCoords && (
                        <div
                          ref={menuRef}
                          style={{
                            position: "fixed",
                            top: `${menuCoords.top}px`,
                            left: `${menuCoords.left}px`,
                          }}
                          className="w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1 text-left text-xs"
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                              onViewVariants(product);
                            }}
                            className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Variants</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                              onEditProduct?.(product);
                            }}
                            className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit Product</span>
                          </button>

                          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                              onDeleteProduct?.(product.productId);
                            }}
                            className="w-full px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Product</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {Math.min(startIndex + pageSize, products.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {products.length}
            </span>{" "}
            results
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
