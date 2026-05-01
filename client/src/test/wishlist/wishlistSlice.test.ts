import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import wishlistReducer, {
  setWishlist,
  clearWishlist,
  toggleWishlistAsync,
  syncWishlist,
} from '../../features/wishlist/wishlistSlice';
import type { Product } from '../../types/product.types';

// ─── Mock api ─────────────────────────────────────────────────────────────────

vi.mock('../../services/api', () => {
  const mockApi: any = {
    get:    vi.fn(),
    post:   vi.fn(),
    delete: vi.fn(),
  };
  return { default: mockApi };
});

import api from '../../services/api';
const mockApi = api as {
  get:    ReturnType<typeof vi.fn>;
  post:   ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeStore = (items: string[] = [], products: Product[] = []) =>
  configureStore({
    reducer: combineReducers({ wishlist: wishlistReducer }),
    preloadedState: { wishlist: { items, products, syncing: false } },
  });

const mockProduct: Product = {
  _id: 'prod-001',
  name: 'HP 15s Intel Core i5',
  slug: 'hp-15s-intel-core-i5',
  description: 'Ordinateur portable',
  price: 450_000,
  currency: 'XOF',
  stock: 5,
  category: { _id: 'cat-001', name: 'Informatique', slug: 'informatique' } as any,
  images: [{ url: 'https://example.com/laptop.jpg', isPrimary: true, order: 0 }],
  isActive: true,
  ratings: { average: 4.5, count: 12 },
} as Product;

const mockProduct2: Product = {
  ...mockProduct,
  _id: 'prod-002',
  name: 'Samsung Galaxy A54',
  slug: 'samsung-galaxy-a54',
  price: 185_000,
} as Product;

// ─── setWishlist ──────────────────────────────────────────────────────────────

describe('wishlistSlice — setWishlist', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });

  it('remplace les items par le tableau fourni', () => {
    const store = makeStore(['old-id']);
    store.dispatch(setWishlist(['prod-001', 'prod-002']));
    expect(store.getState().wishlist.items).toEqual(['prod-001', 'prod-002']);
  });

  it('persiste les items dans localStorage', () => {
    const store = makeStore();
    store.dispatch(setWishlist(['prod-001']));
    expect(JSON.parse(localStorage.getItem('wishlist') || '[]')).toEqual(['prod-001']);
  });

  it('setWishlist([]) vide la liste sans toucher products', () => {
    const store = makeStore(['prod-001'], [mockProduct]);
    store.dispatch(setWishlist([]));
    const state = store.getState().wishlist;
    expect(state.items).toHaveLength(0);
    expect(state.products).toHaveLength(1); // products non modifiés par setWishlist
  });
});

// ─── clearWishlist ────────────────────────────────────────────────────────────

describe('wishlistSlice — clearWishlist', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });

  it('vide items et products', () => {
    const store = makeStore(['prod-001'], [mockProduct]);
    store.dispatch(clearWishlist());
    const state = store.getState().wishlist;
    expect(state.items).toHaveLength(0);
    expect(state.products).toHaveLength(0);
  });

  it('efface localStorage', () => {
    localStorage.setItem('wishlist', JSON.stringify(['prod-001']));
    const store = makeStore(['prod-001']);
    store.dispatch(clearWishlist());
    expect(JSON.parse(localStorage.getItem('wishlist') || '[]')).toHaveLength(0);
  });
});

// ─── toggleWishlistAsync — optimiste ─────────────────────────────────────────

describe('wishlistSlice — toggleWishlistAsync', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });

  it('pending : ajoute le produit immédiatement si absent (optimiste)', () => {
    mockApi.post.mockReturnValueOnce(new Promise(() => {})); // ne se résout jamais
    const store = makeStore();

    store.dispatch(toggleWishlistAsync({ productId: 'prod-001', product: mockProduct }));

    expect(store.getState().wishlist.items).toContain('prod-001');
    expect(store.getState().wishlist.products).toHaveLength(1);
  });

  it('pending : retire le produit immédiatement si déjà présent (optimiste)', () => {
    mockApi.delete.mockReturnValueOnce(new Promise(() => {}));
    const store = makeStore(['prod-001'], [mockProduct]);

    store.dispatch(toggleWishlistAsync({ productId: 'prod-001', product: mockProduct }));

    expect(store.getState().wishlist.items).not.toContain('prod-001');
    expect(store.getState().wishlist.products).toHaveLength(0);
  });

  it('fulfilled : appelle POST /wishlist/:id quand le produit était absent', async () => {
    mockApi.post.mockResolvedValueOnce({ data: {} });
    const store = makeStore();

    await store.dispatch(toggleWishlistAsync({ productId: 'prod-001', product: mockProduct }));

    expect(mockApi.post).toHaveBeenCalledWith('/wishlist/prod-001');
    expect(store.getState().wishlist.items).toContain('prod-001');
  });

  it('fulfilled : appelle DELETE /wishlist/:id quand le produit était présent', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: {} });
    const store = makeStore(['prod-001'], [mockProduct]);

    await store.dispatch(toggleWishlistAsync({ productId: 'prod-001', product: mockProduct }));

    expect(mockApi.delete).toHaveBeenCalledWith('/wishlist/prod-001');
    expect(store.getState().wishlist.items).not.toContain('prod-001');
  });

  it('rejected : rollback — retire le produit ajouté de façon optimiste', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Réseau indisponible'));
    const store = makeStore();

    await store.dispatch(toggleWishlistAsync({ productId: 'prod-001', product: mockProduct }));

    // L'ajout optimiste (pending) doit avoir été annulé (rejected)
    expect(store.getState().wishlist.items).not.toContain('prod-001');
    expect(store.getState().wishlist.products).toHaveLength(0);
  });

  it('rejected : rollback — remet le produit retiré de façon optimiste', async () => {
    mockApi.delete.mockRejectedValueOnce(new Error('Erreur serveur'));
    const store = makeStore(['prod-001'], [mockProduct]);

    await store.dispatch(toggleWishlistAsync({ productId: 'prod-001', product: mockProduct }));

    expect(store.getState().wishlist.items).toContain('prod-001');
    expect(store.getState().wishlist.products).toHaveLength(1);
  });

  it('persiste l\'état optimiste dans localStorage', () => {
    mockApi.post.mockReturnValueOnce(new Promise(() => {}));
    const store = makeStore();
    store.dispatch(toggleWishlistAsync({ productId: 'prod-001', product: mockProduct }));

    const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
    expect(saved).toContain('prod-001');
  });
});

// ─── syncWishlist ─────────────────────────────────────────────────────────────

describe('wishlistSlice — syncWishlist', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });

  it('pending : syncing passe à true', () => {
    mockApi.get.mockReturnValueOnce(new Promise(() => {}));
    const store = makeStore();
    store.dispatch(syncWishlist());
    expect(store.getState().wishlist.syncing).toBe(true);
  });

  it('fulfilled : fusionne les IDs locaux + serveur (union, pas remplacement)', async () => {
    // local : prod-001 ajouté hors-ligne
    // serveur : prod-002
    mockApi.get.mockResolvedValueOnce({ data: { data: [mockProduct2] } });
    const store = makeStore(['prod-001']);

    await store.dispatch(syncWishlist());

    const { items } = store.getState().wishlist;
    expect(items).toContain('prod-001'); // conservé
    expect(items).toContain('prod-002'); // venu du serveur
    expect(items).toHaveLength(2);
  });

  it('fulfilled : stocke les objets produits pour WishlistPage', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [mockProduct] } });
    const store = makeStore();

    await store.dispatch(syncWishlist());

    expect(store.getState().wishlist.products).toHaveLength(1);
    expect(store.getState().wishlist.products[0]._id).toBe('prod-001');
  });

  it('fulfilled : syncing repasse à false', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } });
    const store = makeStore();
    await store.dispatch(syncWishlist());
    expect(store.getState().wishlist.syncing).toBe(false);
  });

  it('fulfilled : persiste l\'union dans localStorage', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [mockProduct2] } });
    const store = makeStore(['prod-001']);
    await store.dispatch(syncWishlist());

    const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
    expect(saved).toContain('prod-001');
    expect(saved).toContain('prod-002');
  });

  it('rejected : syncing repasse à false sans toucher les items', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('401'));
    const store = makeStore(['prod-001']);

    await store.dispatch(syncWishlist());

    const state = store.getState().wishlist;
    expect(state.syncing).toBe(false);
    expect(state.items).toContain('prod-001'); // inchangé
  });
});
