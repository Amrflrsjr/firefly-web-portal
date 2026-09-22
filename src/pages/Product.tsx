import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import type {
  Product,
  CreateProductDto,
  ProductVariant,
} from "../types/product";
import { Plus, Search, AlertCircle, X } from "lucide-react";
import axios from "axios";

import { ProductTable } from "../components/products/ProductTable";
import { ProductVariantsModal } from "../components/products/ProductVariantsModal";
import { CreateProductModal } from "../components/products/CreateProductModal";
import { ConfirmModal } from "../components/common/ConfirmModal";

export const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "name";
  const ascending = searchParams.get("ascending") !== "false";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modals visibility
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Confirm modal state for deletion
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadProducts = useCallback(
    async (query = "", sort = "name", asc = true) => {
      try {
        setLoading(true);
        const response = await api.get<Product[]>("/Products", {
          params: { search: query, sortBy: sort, ascending: asc },
        });
        setProducts(response.data);
        setApiError(null);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            "Failed to connect to API";
          setApiError(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadProducts(searchQuery, sortBy, ascending);
      return;
    }

    const timer = setTimeout(() => {
      loadProducts(searchQuery, sortBy, ascending);
    }, 0);

    return () => clearTimeout(timer);
  }, [searchQuery, sortBy, ascending, loadProducts]);

  // Auto-open modal if there's an exact ID match
  const exactMatchProduct = searchQuery
    ? products.find((p) => p.productId.toString() === searchQuery)
    : null;

  const activeProduct = selectedProduct || exactMatchProduct;

  const updateQueryParams = (updates: Record<string, string>) => {
    const params: Record<string, string> = {
      search: searchQuery,
      sortBy: sortBy,
      ascending: String(ascending),
      ...updates,
    };
    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });
    setSearchParams(params, { replace: true });
  };

  const handleCreateProduct = async (dto: CreateProductDto) => {
    setSaving(true);
    setFormError("");
    try {
      await api.post("/Products", dto);
      toast.success("Product created successfully!");
      setIsCreateOpen(false);
      await loadProducts(searchQuery, sortBy, ascending);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message || "Failed to create product";
        setFormError(msg);
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProductDetails = async (
    productId: number,
    data: { name: string; description: string; isActive: boolean },
  ) => {
    setSaving(true);
    setFormError("");
    try {
      await api.put(`/Products/${productId}`, data);
      toast.success("Product updated successfully!");
      await loadProducts(searchQuery, sortBy, ascending);

      if (selectedProduct && selectedProduct.productId === productId) {
        const updatedResponse = await api.get<Product[]>("/Products", {
          params: { search: searchQuery, sortBy, ascending },
        });
        const refreshedProduct = updatedResponse.data.find(
          (p) => p.productId === productId,
        );
        if (refreshedProduct) {
          setSelectedProduct(refreshedProduct);
        }
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message || "Failed to update product details";
        setFormError(msg);
        toast.error(msg);
      }
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariant = async (
    productId: number,
    variant: ProductVariant,
  ) => {
    setSaving(true);
    setFormError("");
    try {
      await api.post(`/Products/${productId}/variants`, variant);
      toast.success("Product variant added!");
      await loadProducts(searchQuery, sortBy, ascending);

      const updatedResponse = await api.get<Product[]>("/Products", {
        params: { search: searchQuery, sortBy, ascending },
      });
      const updatedProduct = updatedResponse.data.find(
        (p) => p.productId === productId,
      );
      if (updatedProduct) {
        setSelectedProduct(updatedProduct);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message || "Failed to add variant";
        setFormError(msg);
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVariant = async (
    productId: number,
    variantId: number,
    data: ProductVariant,
  ) => {
    try {
      await api.put(`/Products/variants/${variantId}`, data);
      await loadProducts(searchQuery, sortBy, ascending);

      const updatedResponse = await api.get<Product[]>("/Products", {
        params: { search: searchQuery, sortBy, ascending },
      });
      const refreshedProduct = updatedResponse.data.find(
        (p) => p.productId === productId,
      );
      if (refreshedProduct) {
        setSelectedProduct(refreshedProduct);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message || "Failed to update variant",
        );
      } else {
        toast.error("Failed to update variant");
      }
      throw err;
    }
  };

  const handleDeleteVariant = async (productId: number, variantId: number) => {
    try {
      await api.delete(`/Products/variants/${variantId}`);
      await loadProducts(searchQuery, sortBy, ascending);

      const updatedResponse = await api.get<Product[]>("/Products", {
        params: { search: searchQuery, sortBy, ascending },
      });
      const refreshedProduct = updatedResponse.data.find(
        (p) => p.productId === productId,
      );
      if (refreshedProduct) {
        setSelectedProduct(refreshedProduct);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message || "Failed to delete variant",
        );
      } else {
        toast.error("Failed to delete variant");
      }
      throw err;
    }
  };

  const handleUpdateVariantStock = async (
    productId: number,
    variantId: number,
    newStock: number,
  ) => {
    try {
      const product = products.find((p) => p.productId === productId);
      const variant = product?.variants?.find(
        (v) => v.productVariantId === variantId,
      );

      if (!variant) {
        toast.error("Variant not found");
        return;
      }

      const payload = {
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        unitPrice: variant.unitPrice,
        stock: newStock,
        isActive: variant.isActive,
      };

      await api.put(`/Products/variants/${variantId}`, payload);
      toast.success("Stock updated successfully!");

      await loadProducts(searchQuery, sortBy, ascending);

      if (selectedProduct && selectedProduct.productId === productId) {
        const updatedResponse = await api.get<Product[]>("/Products", {
          params: { search: searchQuery, sortBy, ascending },
        });
        const refreshedProduct = updatedResponse.data.find(
          (p) => p.productId === productId,
        );
        if (refreshedProduct) {
          setSelectedProduct(refreshedProduct);
        }
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message || "Failed to update stock",
        );
      } else {
        toast.error("Failed to update stock");
      }
      throw err;
    }
  };

  const handleSortChange = (field: string) => {
    const newAscending = sortBy === field ? !ascending : true;
    updateQueryParams({ sortBy: field, ascending: String(newAscending) });
  };

  const executeDeleteProduct = async () => {
    if (!productToDelete) return;
    setSaving(true);
    try {
      await api.delete(`/Products/${productToDelete}`);
      toast.success("Product deleted successfully!");
      setSelectedProduct(null);
      setProductToDelete(null);
      await loadProducts(searchQuery, sortBy, ascending);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to delete product");
      } else {
        toast.error("Failed to delete product");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10 px-4 sm:px-0">
      {/* Flat Page Header matching Quotations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Products Catalog
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Manage items, color/size variants, SKUs, and unit pricing seamlessly
            across your active catalog inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError("");
            setIsCreateOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {apiError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
          <button
            onClick={() => loadProducts(searchQuery, sortBy, ascending)}
            className="text-xs font-bold bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 px-3.5 py-1.5 rounded-xl shadow-2xs hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar matching Quotations */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search by product name, description, or SKU..."
                value={searchQuery}
                onChange={(e) => updateQueryParams({ search: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all shadow-2xs"
              />
            </div>

            {searchQuery && (
              <button
                onClick={() => setSearchParams({}, { replace: true })}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <ProductTable
          loading={loading}
          products={products}
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSortChange}
          onViewVariants={(prod) => {
            setSelectedProduct(prod);
          }}
          onEditProduct={(prod) => {
            setSelectedProduct(prod);
            setFormError("");
          }}
          onUpdateVariantStock={handleUpdateVariantStock}
          onUpdateProductDetails={handleUpdateProductDetails}
          onDeleteProduct={(productId) => setProductToDelete(productId)}
        />
      </div>

      {activeProduct && (
        <ProductVariantsModal
          product={activeProduct}
          saving={saving}
          error={formError}
          onClose={() => {
            setSelectedProduct(null);
            if (searchQuery) setSearchParams({}, { replace: true });
          }}
          onAddVariant={handleAddVariant}
          onUpdateVariant={handleUpdateVariant}
          onDeleteVariant={handleDeleteVariant}
          onUpdateProductDetails={handleUpdateProductDetails}
        />
      )}

      <ConfirmModal
        isOpen={productToDelete !== null}
        title="Delete Product"
        message="Are you sure you want to delete this product and its associated variants? This action will soft-delete the items from active operations."
        confirmText="Yes, Delete"
        isDanger={true}
        loading={saving}
        onConfirm={executeDeleteProduct}
        onClose={() => setProductToDelete(null)}
      />

      {isCreateOpen && (
        <CreateProductModal
          saving={saving}
          error={formError}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateProduct}
        />
      )}
    </div>
  );
};

export default Products;
