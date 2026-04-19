import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useProducts } from '../../hooks/useProducts';

// Mock de l'instance axios api
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '../../services/api';

const mockProducts = [
  { _id: '1', name: 'Laptop Pro', slug: 'laptop-pro', price: 450_000, stock: 5, images: [] },
  { _id: '2', name: 'Smartphone X', slug: 'smartphone-x', price: 120_000, stock: 12, images: [] },
];

const mockPaginatedResponse = {
  data: {
    success: true,
    data: mockProducts,
    pagination: { total: 2, page: 1, limit: 20, pages: 1 },
  },
};

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne les produits et pagination après chargement', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() => useProducts({ page: 1, limit: 20 }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.products).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('passe les paramètres de filtre à l\'API', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() =>
      useProducts({ category: 'cat-id-123', sort: 'price_asc', inStock: true })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(api.get).toHaveBeenCalledWith('/products', {
      params: expect.objectContaining({
        category: 'cat-id-123',
        sort: 'price_asc',
        inStock: 'true',
      }),
    });
  });

  it('expose une erreur si l\'API échoue', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { data: { message: 'Erreur serveur' } },
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.products).toHaveLength(0);
    expect(result.current.error).toBe('Erreur serveur');
  });

  it('recharge les produits quand les options changent', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockPaginatedResponse);

    const { result, rerender } = renderHook(
      (options: { page: number }) => useProducts(options),
      { initialProps: { page: 1 } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.get).toHaveBeenCalledTimes(1);

    rerender({ page: 2 });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(api.get).toHaveBeenLastCalledWith('/products', {
      params: expect.objectContaining({ page: 2 }),
    });
  });
});
