import api from './api';
import type { Product } from '../types/product.types';

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  inStock?: boolean;
}

export interface ProductsResponse {
  data: Product[];
  pagination: { total: number; page: number; totalPages: number; limit: number };
}

export const productApi = {
  getProducts: (filters: ProductFilters = {}, signal?: AbortSignal): Promise<{ success: boolean; data: Product[]; pagination: ProductsResponse['pagination'] }> =>
    api
      .get<{ success: boolean; data: Product[]; pagination: ProductsResponse['pagination'] }>('/products', { params: filters, signal })
      .then((r) => r.data),

  getProductBySlug: (slug: string, signal?: AbortSignal): Promise<{ success: boolean; data: Product }> =>
    api
      .get<{ success: boolean; data: Product }>(`/products/slug/${slug}`, { signal })
      .then((r) => r.data),

  getFeatured: (signal?: AbortSignal): Promise<{ success: boolean; data: Product[] }> =>
    api
      .get<{ success: boolean; data: Product[] }>('/products/featured', { signal })
      .then((r) => r.data),

  getNewArrivals: (signal?: AbortSignal): Promise<{ success: boolean; data: Product[] }> =>
    api
      .get<{ success: boolean; data: Product[] }>('/products/new-arrivals', { signal })
      .then((r) => r.data),

  getBestSellers: (signal?: AbortSignal): Promise<{ success: boolean; data: Product[] }> =>
    api
      .get<{ success: boolean; data: Product[] }>('/products/best-sellers', { signal })
      .then((r) => r.data),

  getRelated: (productId: string, signal?: AbortSignal): Promise<{ success: boolean; data: Product[] }> =>
    api
      .get<{ success: boolean; data: Product[] }>(`/products/${productId}/related`, { signal })
      .then((r) => r.data),
};
