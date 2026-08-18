import React, { useEffect, useState } from "react";
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

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals visibility
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadProducts = async () => {
    try {
      const response = await api.get<Product[]>("/products");
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
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        const response = await api.get<Product[]>("/products");
        if (isSubscribed) {
          setProducts(response.data);
          setApiError(null);
        }
      } catch (err: unknown) {
        if (isSubscribed && axios.isAxiosError(err)) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            "Failed to fetch data";
          setApiError(msg);
          toast.error(msg);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Handlers
  const handleCreateProduct = async (dto: CreateProductDto) => {
    setSaving(true);
    setFormError("");
    try {
      await api.post("/products", dto);
      toast.success("Product created successfully!");
      setIsCreateOpen(false);
      await loadProducts();
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
    if (!selectedProduct) return;
    setSaving(true);
    setFormError("");
    try {
      await api.put(`/products/${selectedProduct.productId}`, data);
      toast.success("Product details updated!");
      setIsEditOpen(false);
      setSelectedProduct(null);
      await loadProducts();
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
      await loadProducts();
      // Keep selectedProduct fresh
      const updatedResponse = await api.get<Product[]>(`/products`);
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

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variants.some((v) =>
        v.sku.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Products & Catalog
          </h1>
          <p className="text-sm text-slate-500">
            Manage items, variants, SKUs, and pricing
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
          <button
            onClick={loadProducts}
            className="text-xs font-bold bg-red-100 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, description, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800"
          />
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <ProductTable
          loading={loading}
          products={filteredProducts}
          onViewVariants={(prod) => setSelectedProduct(prod)}
        />
      </div>

      {/* View/Add Variants Modal */}
      {selectedProduct && !isEditOpen && (
        <ProductVariantsModal
          product={selectedProduct}
          saving={saving}
          error={formError}
          onClose={() => setSelectedProduct(null)}
          onEditProduct={() => {
            setFormError("");
            setIsEditOpen(true);
          }}
          onAddVariant={handleAddVariant}
        />
      )}

      {/* Create Product Modal */}
      {isCreateOpen && (
        <CreateProductModal
          saving={saving}
          error={formError}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateProduct}
        />
      )}

      {/* Edit Product Modal */}
      {isEditOpen && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          saving={saving}
          error={formError}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleEditProduct}
        />
      )}
    </div>
  );
};
