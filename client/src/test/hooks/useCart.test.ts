import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import cartReducer, { selectCartTotal } from '../../features/cart/cartSlice';
import wishlistReducer from '../../features/wishlist/wishlistSlice';
import authReducer from '../../features/auth/authSlice';
import { useCart } from '../../hooks/useCart';
import type { CartItem } from '../../types/cart.types';
import type { ReactNode } from 'react';

vi.mock('../../services/api', () => ({
  default: { get: vi.fn() },
}));

function makeStore(preloadedCart: CartItem[] = []) {
  return configureStore({
    reducer: { cart: cartReducer, wishlist: wishlistReducer, auth: authReducer },
    preloadedState: {
      cart: { items: preloadedCart, coupon: null, drawerOpen: false },
    },
  });
}

function makeWrapper(store: ReturnType<typeof makeStore>) {
  return ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
}

const laptop: CartItem = {
  _id: 'prod-1',
  name: 'Dell XPS 15',
  slug: 'dell-xps-15',
  price: 450_000,
  finalPrice: 460_000, // +10 000 FCFA variante 16Go RAM
  image: '',
  stock: 5,
  quantity: 1,
  variant: { name: 'RAM', value: '16 Go' },
};

describe('useCart hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('expose les items du panier', () => {
    const store = makeStore([laptop]);
    const { result } = renderHook(() => useCart(), { wrapper: makeWrapper(store) });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Dell XPS 15');
  });

  it('calcule le total avec finalPrice (variante incluse)', () => {
    const store = makeStore([laptop]);
    const state = store.getState();
    const total = selectCartTotal(state);
    // finalPrice = 460 000, quantity = 1
    expect(total).toBe(460_000);
  });

  it('calcule le total avec plusieurs articles', () => {
    const phone: CartItem = {
      _id: 'prod-2',
      name: 'iPhone 15',
      slug: 'iphone-15',
      price: 700_000,
      finalPrice: 700_000,
      image: '',
      stock: 10,
      quantity: 2,
    };
    const store = makeStore([laptop, phone]);
    const total = selectCartTotal(store.getState());
    // 460 000 × 1 + 700 000 × 2 = 1 860 000
    expect(total).toBe(1_860_000);
  });

  it('add() ajoute un produit au panier', () => {
    const store = makeStore();
    const { result } = renderHook(() => useCart(), { wrapper: makeWrapper(store) });

    act(() => { result.current.add(laptop); });

    expect(store.getState().cart.items).toHaveLength(1);
  });

  it('remove() retire un produit', () => {
    const store = makeStore([laptop]);
    const { result } = renderHook(() => useCart(), { wrapper: makeWrapper(store) });

    act(() => { result.current.remove('prod-1', '16 Go'); });

    expect(store.getState().cart.items).toHaveLength(0);
  });

  it('update() modifie la quantité', () => {
    const store = makeStore([laptop]);
    const { result } = renderHook(() => useCart(), { wrapper: makeWrapper(store) });

    act(() => { result.current.update('prod-1', 3, '16 Go'); });

    expect(store.getState().cart.items[0].quantity).toBe(3);
  });
});
