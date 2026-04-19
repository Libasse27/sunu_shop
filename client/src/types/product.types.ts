export interface ProductImage {
  url: string;
  publicId?: string;
  alt?: string;
  isPrimary: boolean;
  order: number;
}

export interface Variant {
  name: string;
  options: Array<{
    value: string;
    priceModifier: number;
    stock: number;
    sku?: string;
  }>;
}

export interface Supplier {
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  country?: string;
  deliveryDays?: number;
  trackingNumber?: string;
  orderReference?: string;
  notes?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: ProductImage[];
  category: { _id: string; name: string; slug: string };
  subCategory?: { _id: string; name: string; slug: string };
  tags: string[];
  variants: Variant[];
  specifications: Array<{ key: string; value: string }>;
  stock: number;
  brand?: string;
  origin?: string;
  material?: string;
  rating: number;
  numReviews: number;
  totalSold: number;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isOnSale: boolean;
  discountPercentage: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  supplier?: Supplier;
  relatedProducts?: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { url: string };
  icon?: string;
  parent: string | null;
  level: number;
  order: number;
  children?: Category[];
  productCount: number;
}
