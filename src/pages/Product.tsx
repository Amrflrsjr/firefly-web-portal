import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import type {
  Product,
  CreateProductDto,
  ProductVariant,
} from "../types/product";
import { Plus, Search, AlertCircle } from "lucide-react";
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

  const loadProducts = async (query = "", sort = "name", asc = true) => {
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
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts(searchQuery, sortBy, ascending);
  }, [searchQuery, sortBy, ascending]);

  // Auto-open modal if there's an exact ID match
  const exactMatchProduct = searchQuery
    ? products.find((p) => p.productId.toString() === searchQuery)
    : null;

  const activeProduct = selectedProduct || exactMatchProduct;

  // Handlers
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

      // 1. Reload the main products table data
      await loadProducts(searchQuery, sortBy, ascending);

      // 2. Fetch fresh data and update the active modal's product state so it reflects instantly
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
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const params: Record<string, string> = {};
    if (val) params.search = val;
    if (sortBy) params.sortBy = sortBy;
    if (!ascending) params.ascending = "false";
    setSearchParams(params, { replace: true });
  };

  const handleSortChange = (field: string) => {
    const newAscending = sortBy === field ? !ascending : true;
    const params: Record<string, string> = {
      sortBy: field,
      ascending: String(newAscending),
    };
    if (searchQuery) params.search = searchQuery;
    setSearchParams(params, { replace: true });
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Products & Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage items, variants, SKUs, and unit pricing
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-900 font-bold px-4 py-2.5 rounded-2xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {apiError && (
        <div className="bg-rose-50 border border-rose-200/80 text-rose-700 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
          <button
            onClick={() => loadProducts(searchQuery, sortBy, ascending)}
            className="text-xs font-bold bg-white hover:bg-rose-100 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, description, or SKU..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-[#FCFDFF] border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-[#FFCB62]/20 transition-all shadow-2xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <ProductTable
          loading={loading}
          products={products}
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSortChange}
          onViewVariants={(prod) => setSelectedProduct(prod)}
          onUpdateVariantStock={handleUpdateVariantStock}
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
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleEditProduct}
        />
      )}
    </div>
  );
};
