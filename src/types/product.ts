export interface ProductVariant {
  productVariantId?: number;
  productId?: number;
  sku: string;
  color: string;
  size: string;
  unitPrice: number;
  stock: number;
  isActive: boolean;
}

export interface Product {
  productId: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  variants: ProductVariant[];
}

export interface CreateProductDto {
  name: string;
  description: string;
  variants: ProductVariant[];
}
