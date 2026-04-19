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
  pagination: { total: number; page: number; pages: number; limit: number };
}

export const productApi = {
  getProducts: (filters: ProductFilters = {}): Promise<{ success: boolean; data: Product[]; pagination: ProductsResponse['pagination'] }> =>
    api
      .get<{ success: boolean; data: Product[]; pagination: ProductsResponse['pagination'] }>('/products', { params: filters })
      .then((r) => r.data),

  getProductBySlug: (slug: string): Promise<{ success: boolean; data: Product }> =>
    api
      .get<{ success: boolean; data: Product }>(`/products/slug/${slug}`)
      .then((r) => r.data),

  getFeatured: (): Promise<{ success: boolean; data: Product[] }> =>
    api
      .get<{ success: boolean; data: Product[] }>('/products/featured')
      .then((r) => r.data),

  getNewArrivals: (): Promise<{ success: boolean; data: Product[] }> =>
    api
      .get<{ success: boolean; data: Product[] }>('/products/new-arrivals')
      .then((r) => r.data),

  getBestSellers: (): Promise<{ success: boolean; data: Product[] }> =>
    api
      .get<{ success: boolean; data: Product[] }>('/products/best-sellers')
      .then((r) => r.data),
};
