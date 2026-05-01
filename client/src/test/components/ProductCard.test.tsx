import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ProductCard from '../../components/product/ProductCard';
import cartReducer from '../../features/cart/cartSlice';
import wishlistReducer from '../../features/wishlist/wishlistSlice';
import authReducer from '../../features/auth/authSlice';
import type { Product } from '../../types/product.types';
import type { ReactNode } from 'react';

// Mocks
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }));

function makeStore() {
  return configureStore({
    reducer: { cart: cartReducer, wishlist: wishlistReducer, auth: authReducer },
  });
}

function Wrapper({ store, children }: { store: ReturnType<typeof makeStore>; children: ReactNode }) {
  return (
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );
}

const mockProduct: Product = {
  _id: 'prod-001',
  name: 'Dell XPS 15 — Core i7',
  slug: 'dell-xps-15',
  description: 'Laptop haut de gamme',
  sku: 'DELL-XPS-001',
  price: 450_000,
  compareAtPrice: 500_000,
  currency: 'XOF',
  images: [{ url: 'https://example.com/laptop.jpg', isPrimary: true, order: 0 }],
  category: { _id: 'cat-1', name: 'Informatique', slug: 'informatique' },
  tags: ['laptop', 'dell'],
  variants: [],
  specifications: [],
  stock: 5,
  isActive: true,
  isOnSale: false,
  brand: 'Dell',
  rating: 4.5,
  numReviews: 12,
  totalSold: 8,
  viewCount: 150,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('ProductCard', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    vi.clearAllMocks();
  });

  it('affiche le nom du produit', () => {
    render(<Wrapper store={store}><ProductCard product={mockProduct} /></Wrapper>);
    expect(screen.getByText('Dell XPS 15 — Core i7')).toBeInTheDocument();
  });

  it('affiche le prix formaté en FCFA', () => {
    render(<Wrapper store={store}><ProductCard product={mockProduct} /></Wrapper>);
    expect(screen.getByText(/450 000/)).toBeInTheDocument();
  });

  it('affiche le badge de réduction quand compareAtPrice est défini', () => {
    render(<Wrapper store={store}><ProductCard product={mockProduct} /></Wrapper>);
    // Réduction = (500k - 450k) / 500k = 10%
    expect(screen.getByText(/-10%/)).toBeInTheDocument();
  });

  it('affiche la marque si brand est défini', () => {
    render(<Wrapper store={store}><ProductCard product={mockProduct} /></Wrapper>);
    expect(screen.getByText('Dell')).toBeInTheDocument();
  });

  it('lien du produit pointe vers /produit/:slug', () => {
    render(<Wrapper store={store}><ProductCard product={mockProduct} /></Wrapper>);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/produit/dell-xps-15');
  });

  it('clique sur "Ajouter au panier" dispatche addToCart', () => {
    render(<Wrapper store={store}><ProductCard product={mockProduct} /></Wrapper>);
    const btn = screen.getByTitle(/Ajouter au panier/i);
    fireEvent.click(btn);
    const cart = store.getState().cart;
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]._id).toBe('prod-001');
    expect(cart.items[0].finalPrice).toBe(450_000);
  });

  it('clique sur favori ajoute le produit à la wishlist', () => {
    render(<Wrapper store={store}><ProductCard product={mockProduct} /></Wrapper>);
    const wishlistBtn = screen.getByTitle(/Ajouter aux favoris/i);
    fireEvent.click(wishlistBtn);
    expect(store.getState().wishlist.items).toContain('prod-001');
  });

  it('affiche le badge "Rupture" quand stock = 0', () => {
    const outOfStock = { ...mockProduct, stock: 0 };
    render(<Wrapper store={store}><ProductCard product={outOfStock} /></Wrapper>);
    // La carte affiche au moins un élément "Rupture" (badge ou bouton)
    expect(screen.getAllByText(/Rupture/i).length).toBeGreaterThan(0);
  });
});
