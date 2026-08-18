import React from "react";
import type { Product } from "../../types/product";
import { Package, Layers } from "lucide-react";

interface ProductTableProps {
  loading: boolean;
  products: Product[];
  onViewVariants: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  loading,
  products,
  onViewVariants,
}) => {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading products...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        No products found. Click <b>"+ Add Product"</b> above to add one.
      </div>
    );
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
          <th className="p-4">Product Name</th>
          <th className="p-4">Variants</th>
          <th className="p-4">Price Range</th>
          <th className="p-4">Total Stock</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {products.map((product) => {
          const minPrice = product.variants?.length
            ? Math.min(...product.variants.map((v) => v.unitPrice))
            : 0;
          const maxPrice = product.variants?.length
            ? Math.max(...product.variants.map((v) => v.unitPrice))
            : 0;
          const totalStock =
            product.variants?.reduce((acc, v) => acc + v.stock, 0) || 0;

          return (
            <tr
              key={product.productId}
              onClick={() => onViewVariants(product)}
              className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
            >
              <td className="p-4 font-semibold text-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFCB62]/20 text-[#F9B53F] font-bold flex items-center justify-center text-xs group-hover:bg-[#FFCB62]/40 transition-colors">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-800 font-bold group-hover:text-slate-900">
                      {product.name}
                    </div>
                    <div className="text-xs text-slate-400 max-w-xs truncate">
                      {product.description || "No description"}
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-4 text-slate-600">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  <Layers className="w-3 h-3" />
                  {product.variants?.length || 0} Variants
                </span>
              </td>
              <td className="p-4 font-semibold text-slate-800 font-mono text-xs">
                {minPrice === maxPrice
                  ? `PHP ${minPrice.toFixed(2)}`
                  : `PHP ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`}
              </td>
              <td className="p-4">
                <span
                  className={`font-semibold text-xs px-2.5 py-1 rounded-full ${
                    totalStock > 0
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {totalStock} in stock
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
