export interface IProductImage {
  url: string;
  publicId?: string;
  alt?: string;
  isPrimary: boolean;
  order: number;
}

export interface IVariantOption {
  value: string;
  priceModifier: number;
  stock: number;
  sku?: string;
}

export interface IVariant {
  name: string;
  options: IVariantOption[];
}

export interface ISpecification {
  key: string;
  value: string;
}

/**
 * IProduct — représentation "raw" du document MongoDB (category = ObjectId string).
 * Côté client, après populate, utiliser l'interface Product de client/src/types/product.types.ts
 * qui expose category comme { _id, name, slug }.
 */
export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  currency: string;
  images: IProductImage[];
  category: string;  // ObjectId — populate → { _id, name, slug } côté client
  tags: string[];
  variants: IVariant[];
  specifications: ISpecification[];
  stock: number;
  lowStockThreshold: number;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  brand?: string;
  origin?: string;
  material?: string;
  rating: number;
  numReviews: number;
  totalSold: number;
  viewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isOnSale: boolean;
  saleStartDate?: string;
  saleEndDate?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  relatedProducts?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  brand?: string;
  tags?: string[];
  inStock?: boolean;
  onSale?: boolean;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating' | 'bestseller';
}
