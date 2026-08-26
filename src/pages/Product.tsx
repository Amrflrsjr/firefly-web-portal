import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import type {
  Product,
  CreateProductDto,
  ProductVariant,
} from "../types/product";
import {
  Plus,
  Search,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import axios from "axios";

import { ProductTable } from "../components/products/ProductTable";
import { ProductVariantsModal } from "../components/products/ProductVariantsModal";
import { CreateProductModal } from "../components/products/CreateProductModal";
import { EditProductModal } from "../components/products/EditProductModal";
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Confirm modal state for deletion
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadProducts = useCallback(
    async (query = "", sort = "name", asc = true) => {
      try {
        setLoading(true);
        const response = await api.get<Product[]>("/products", {
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
      await api.post("/products", dto);
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

  const handleEditProduct = async (data: {
    name: string;
    description: string;
    isActive: boolean;
  }) => {
    if (!activeProduct) return;
    setSaving(true);
    setFormError("");
    try {
      await api.put(`/products/${activeProduct.productId}`, data);
      toast.success("Product details updated!");
      setIsEditOpen(false);
      setSelectedProduct(null);
      await loadProducts(searchQuery, sortBy, ascending);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message || "Failed to update product";
        setFormError(msg);
        toast.error(msg);
      }
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
      await api.post(`/products/${productId}/variants`, variant);
      toast.success("Product variant added!");
      await loadProducts(searchQuery, sortBy, ascending);

      const updatedResponse = await api.get<Product[]>("/products", {
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

      await api.put(`/products/variants/${variantId}`, payload);
      toast.success("Stock updated successfully!");

      await loadProducts(searchQuery, sortBy, ascending);

      const updatedResponse = await api.get<Product[]>("/products", {
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
        const msg =
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message || "Failed to update stock";
        toast.error(msg);
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
      await api.delete(`/products/${productToDelete}`);
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
    <div className="space-y-6 pb-10">
      {/* Executive Header Banner matching Dashboard style */}
      <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Catalog & Inventory Hub</span>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Products & Catalog
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-normal leading-relaxed">
              Manage items, variants, SKUs, and unit pricing seamlessly across
              your inventory.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setFormError("");
                setIsCreateOpen(true);
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 text-xs font-extrabold shadow-lg shadow-amber-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-3" />
              <span>Add Product</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
          <button
            onClick={() => loadProducts(searchQuery, sortBy, ascending)}
            className="text-xs font-bold bg-white border border-rose-200 px-4 py-2 rounded-xl shadow-2xs hover:bg-rose-100 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Professional UI/UX Search Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 flex items-center justify-between">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, description, or SKU..."
            value={searchQuery}
            onChange={(e) => updateQueryParams({ search: e.target.value })}
            className="w-full bg-slate-50/80 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all shadow-2xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 overflow-hidden">
        <ProductTable
          loading={loading}
          products={products}
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSortChange}
          onViewVariants={(prod) => {
            setSelectedProduct(prod);
            setIsEditOpen(false);
          }}
          onEditProduct={(prod) => {
            setSelectedProduct(prod);
            setFormError("");
            setIsEditOpen(true);
          }}
          onUpdateVariantStock={handleUpdateVariantStock}
          onDeleteProduct={(productId) => setProductToDelete(productId)}
        />
      </div>

      {activeProduct && !isEditOpen && (
        <ProductVariantsModal
          product={activeProduct}
          saving={saving}
          error={formError}
          onClose={() => {
            setSelectedProduct(null);
            if (searchQuery) setSearchParams({}, { replace: true });
          }}
          onAddVariant={handleAddVariant}
          onUpdateVariantStock={handleUpdateVariantStock}
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

      {isEditOpen && activeProduct && (
        <EditProductModal
          product={activeProduct}
          saving={saving}
          error={formError}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedProduct(null);
          }}
          onSubmit={handleEditProduct}
        />
      )}
    </div>
  );
};
