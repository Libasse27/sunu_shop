import { http, HttpResponse } from 'msw';

const BASE = '/api/v1';

// ─── Produits & Catalogue ─────────────────────────────────────────────────────

const mockProduct = {
  _id: 'prod-001',
  name: 'HP 15s Intel Core i5',
  slug: 'hp-15s-intel-core-i5',
  description: 'Ordinateur portable performant',
  price: 450_000,
  currency: 'XOF',
  stock: 10,
  images: [{ url: 'https://example.com/laptop.jpg', isPrimary: true, order: 0 }],
  category: { _id: 'cat-001', name: 'Informatique', slug: 'informatique' },
  isActive: true,
  ratings: { average: 4.5, count: 12 },
};

const mockProductList = {
  success: true,
  message: 'Produits récupérés',
  data: [mockProduct],
  pagination: { total: 1, page: 1, totalPages: 1, limit: 20 },
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-123',
  firstName: 'Moussa',
  lastName: 'Diallo',
  email: 'moussa@test.sn',
  role: 'client',
  isVerified: true,
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────

let wishlistItems: typeof mockProduct[] = [];

// ─── Orders ───────────────────────────────────────────────────────────────────

const mockOrder = {
  _id: 'order-001',
  orderNumber: 'ORD-20240101-0001',
  status: 'pending',
  items: [{ product: mockProduct, quantity: 1, price: 450_000, subtotal: 450_000 }],
  pricing: { subtotal: 450_000, shippingCost: 0, tax: 0, discount: 0, total: 450_000 },
  payment: { method: 'stripe', status: 'pending' },
  createdAt: new Date().toISOString(),
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const handlers = [
  // ── Produits ────────────────────────────────────────────────────────────────
  http.get(`${BASE}/products`, () =>
    HttpResponse.json(mockProductList),
  ),

  http.get(`${BASE}/products/featured`, () =>
    HttpResponse.json({ success: true, data: [mockProduct] }),
  ),

  http.get(`${BASE}/products/new-arrivals`, () =>
    HttpResponse.json({ success: true, data: [mockProduct] }),
  ),

  http.get(`${BASE}/products/best-sellers`, () =>
    HttpResponse.json({ success: true, data: [mockProduct] }),
  ),

  http.get(`${BASE}/products/slug/:slug`, ({ params }) => {
    if (params.slug === 'not-found') {
      return HttpResponse.json({ success: false, message: 'Produit introuvable' }, { status: 404 });
    }
    return HttpResponse.json({ success: true, data: mockProduct });
  }),

  http.get(`${BASE}/products/:id/related`, () =>
    HttpResponse.json({ success: true, data: [mockProduct] }),
  ),

  // ── Catégories ───────────────────────────────────────────────────────────────
  http.get(`${BASE}/categories`, () =>
    HttpResponse.json({
      success: true,
      data: [{ _id: 'cat-001', name: 'Informatique', slug: 'informatique', isActive: true }],
    }),
  ),

  // ── Auth ─────────────────────────────────────────────────────────────────────
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email === 'bad@test.sn' || body.password === 'wrong') {
      return HttpResponse.json(
        { success: false, message: 'Identifiants invalides' },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      success: true,
      message: 'Connexion réussie',
      data: { user: mockUser, accessToken: 'mock-access-token' },
    });
  }),

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = await request.json() as { email: string };
    if (body.email === 'existing@test.sn') {
      return HttpResponse.json(
        { success: false, message: 'Email déjà utilisé' },
        { status: 409 },
      );
    }
    return HttpResponse.json({
      success: true,
      message: 'Compte créé',
      data: { user: { ...mockUser, email: body.email }, accessToken: 'mock-access-token' },
    });
  }),

  http.post(`${BASE}/auth/logout`, () =>
    HttpResponse.json({ success: true, message: 'Déconnecté' }),
  ),

  http.post(`${BASE}/auth/refresh-token`, () =>
    HttpResponse.json({
      success: true,
      data: { accessToken: 'refreshed-access-token' },
    }),
  ),

  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({ success: true, data: mockUser }),
  ),

  // ── Wishlist ─────────────────────────────────────────────────────────────────
  http.get(`${BASE}/wishlist`, () =>
    HttpResponse.json({ success: true, data: wishlistItems }),
  ),

  http.post(`${BASE}/wishlist/:productId`, ({ params }) => {
    const p = { ...mockProduct, _id: params.productId as string };
    if (!wishlistItems.find(i => i._id === p._id)) wishlistItems.push(p);
    return HttpResponse.json({ success: true, data: wishlistItems });
  }),

  http.delete(`${BASE}/wishlist/:productId`, ({ params }) => {
    wishlistItems = wishlistItems.filter(i => i._id !== params.productId);
    return HttpResponse.json({ success: true, data: wishlistItems });
  }),

  // ── Commandes ────────────────────────────────────────────────────────────────
  http.get(`${BASE}/orders`, () =>
    HttpResponse.json({
      success: true,
      data: [mockOrder],
      pagination: { total: 1, page: 1, totalPages: 1, limit: 10 },
    }),
  ),

  http.get(`${BASE}/orders/:id`, ({ params }) => {
    if (params.id === 'not-found') {
      return HttpResponse.json({ success: false, message: 'Commande introuvable' }, { status: 404 });
    }
    return HttpResponse.json({ success: true, data: mockOrder });
  }),

  http.post(`${BASE}/orders`, () =>
    HttpResponse.json({ success: true, data: mockOrder }, { status: 201 }),
  ),

  // ── Paiements ────────────────────────────────────────────────────────────────
  http.post(`${BASE}/payments/stripe/create-intent`, () =>
    HttpResponse.json({
      success: true,
      data: {
        clientSecret: 'pi_test_secret_mock',
        paymentIntentId: 'pi_test_mock',
        amount: 450_000,
      },
    }),
  ),

  http.post(`${BASE}/payments/create-intent`, () =>
    HttpResponse.json({
      success: true,
      data: {
        token: 'intent-token-mock',
        amount: 450_000,
        expiresAt: new Date(Date.now() + 1800_000).toISOString(),
      },
    }),
  ),

  // ── Coupons ───────────────────────────────────────────────────────────────────
  http.post(`${BASE}/coupons/validate`, async ({ request }) => {
    const body = await request.json() as { code: string };
    if (body.code === 'INVALID') {
      return HttpResponse.json(
        { success: false, message: 'Coupon invalide ou expiré' },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      success: true,
      data: { code: body.code, discount: 10_000, type: 'fixed', isValid: true },
    });
  }),

  // ── Avis ──────────────────────────────────────────────────────────────────────
  http.get(`${BASE}/reviews/product/:productId`, () =>
    HttpResponse.json({
      success: true,
      data: [{ _id: 'rev-001', rating: 5, comment: 'Excellent produit', user: mockUser }],
    }),
  ),
];
