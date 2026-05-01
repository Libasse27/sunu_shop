import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useProducts, useProduct } from '../../hooks/useProducts';
import * as productApiModule from '../../services/product.api';

// ─── Mock productApi ──────────────────────────────────────────────────────────

vi.mock('../../services/product.api', () => ({
  productApi: {
    getProducts:    vi.fn(),
    getProductBySlug: vi.fn(),
    getRelated:     vi.fn(),
    getFeatured:    vi.fn(),
    getNewArrivals: vi.fn(),
    getBestSellers: vi.fn(),
  },
}));

const mockProductApi = productApiModule.productApi as {
  getProducts:      ReturnType<typeof vi.fn>;
  getProductBySlug: ReturnType<typeof vi.fn>;
};

// ─── Wrapper QueryClientProvider ─────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: qc }, children);
}

// ─── Données de test ──────────────────────────────────────────────────────────

const mockProducts = [
  { _id: '1', name: 'Laptop Pro',    slug: 'laptop-pro',    price: 450_000, stock: 5,  images: [] },
  { _id: '2', name: 'Smartphone X',  slug: 'smartphone-x',  price: 120_000, stock: 12, images: [] },
];

const mockListResponse = {
  success:    true,
  data:       mockProducts,
  pagination: { total: 2, page: 1, totalPages: 1, limit: 20 },
};

const mockProductResponse = {
  success: true,
  data:    mockProducts[0],
};

// ─── useProducts ─────────────────────────────────────────────────────────────

describe('useProducts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne les produits après chargement', async () => {
    mockProductApi.getProducts.mockResolvedValue(mockListResponse);

    const { result } = renderHook(() => useProducts({ page: 1, limit: 20 }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.pagination.total).toBe(2);
    expect(result.current.isError).toBe(false);
  });

  it('passe les paramètres de filtre à productApi.getProducts', async () => {
    mockProductApi.getProducts.mockResolvedValue(mockListResponse);

    const { result } = renderHook(
      () => useProducts({ category: 'cat-123', sort: 'price_asc', inStock: true }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockProductApi.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'cat-123', sort: 'price_asc', inStock: true }),
      expect.any(AbortSignal),
    );
  });

  it('isError=true si l\'API échoue', async () => {
    mockProductApi.getProducts.mockRejectedValue(new Error('Erreur réseau'));

    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('maintient les données précédentes pendant la pagination (keepPreviousData)', async () => {
    mockProductApi.getProducts.mockResolvedValue(mockListResponse);

    const { result, rerender } = renderHook(
      ({ page }: { page: number }) => useProducts({ page }),
      { wrapper, initialProps: { page: 1 } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.data).toHaveLength(2);

    // Passer à la page 2 — les données précédentes doivent rester disponibles
    mockProductApi.getProducts.mockResolvedValue({
      ...mockListResponse,
      data: [mockProducts[0]],
      pagination: { ...mockListResponse.pagination, page: 2 },
    });
    rerender({ page: 2 });

    // placeholderData maintient les données pendant le refetch
    expect(result.current.data?.data).toBeDefined();
  });
});

// ─── useProduct ───────────────────────────────────────────────────────────────

describe('useProduct', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne le produit par slug', async () => {
    mockProductApi.getProductBySlug.mockResolvedValue(mockProductResponse);

    const { result } = renderHook(() => useProduct('laptop-pro'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.data._id).toBe('1');
    expect(result.current.data?.data.name).toBe('Laptop Pro');
  });

  it('n\'effectue pas de requête si le slug est vide', async () => {
    mockProductApi.getProductBySlug.mockResolvedValue(mockProductResponse);

    const { result } = renderHook(() => useProduct(''), { wrapper });

    // enabled: false → jamais de requête
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockProductApi.getProductBySlug).not.toHaveBeenCalled();
  });
});
