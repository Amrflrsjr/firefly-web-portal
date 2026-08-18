import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Product, ProductVariant } from "../../types/product";
import { X, Plus, Pencil } from "lucide-react";

interface ProductVariantsModalProps {
  product: Product;
  saving: boolean;
  error: string;
  onClose: () => void;
  onEditProduct: () => void;
  onAddVariant: (productId: number, variant: ProductVariant) => void;
}

export const ProductVariantsModal: React.FC<ProductVariantsModalProps> = ({
  product,
  saving,
  error,
  onClose,
  onEditProduct,
  onAddVariant,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariant, setNewVariant] = useState<ProductVariant>({
    sku: "",
    color: "Standard",
    size: "Standard",
    unitPrice: 0,
    stock: 0,
    isActive: true,
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariant.sku.trim()) {
      toast.error("SKU is required.");
      return;
    }
    onAddVariant(product.productId, newVariant);
    setShowAddForm(false);
    setNewVariant({
      sku: "",
      color: "Standard",
      size: "Standard",
      unitPrice: 0,
      stock: 0,
      isActive: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
        {/* Header with Title and Edit Product Action */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{product.name}</h2>
            <p className="text-xs text-slate-500">
              {product.description || "No description"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEditProduct}
              className="inline-flex items-center gap-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Details
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Existing Variants List */}
        <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase">
              Product Variants
            </p>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="text-xs font-bold text-[#F9B53F] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Variant
              </button>
            )}
          </div>
          {product.variants?.map((v, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-sm"
            >
              <div>
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded mr-2">
                  {v.sku}
                </span>
                <span className="font-medium text-slate-800">
                  {v.color} / {v.size}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Stock: {v.stock} units
                </p>
              </div>
              <div className="font-bold text-slate-800 font-mono">
                PHP {v.unitPrice.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Add New Variant Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 pt-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                New Variant Details
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  required
                  value={newVariant.sku}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, sku: e.target.value })
                  }
                  placeholder="SKU-201"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Price (PHP) *
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
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Initial Stock
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
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Option / Size
                </label>
                <input
                  type="text"
                  value={newVariant.size}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, size: e.target.value })
                  }
                  placeholder="e.g. A4 / Glossy"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 text-xs font-bold bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Variant"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
