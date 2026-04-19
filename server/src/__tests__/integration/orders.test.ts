import request from 'supertest';
import app from '../../app';
import User from '../../models/User.model';
import Product from '../../models/Product.model';
import Category from '../../models/Category.model';
import Order from '../../models/Order.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const registerAndLogin = async (email: string, role = 'client') => {
  await User.create({
    firstName: 'Test',
    lastName: 'User',
    email,
    password: 'TestPass123!',
    role,
    isActive: true,
  });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'TestPass123!' });
  return res.body.data.accessToken as string;
};

const createProduct = async (price = 150000, stock = 10) => {
  const cat = await Category.create({ name: `Cat-${Date.now()}`, slug: `cat-${Date.now()}`, isActive: true });
  return Product.create({
    name: 'Smartphone Samsung',
    slug: `samsung-${Date.now()}`,
    description: 'Téléphone Samsung Galaxy',
    sku: `SKU-${Date.now()}`,
    price,
    currency: 'XOF',
    stock,
    category: cat._id,
    images: [{ url: 'https://example.com/img.jpg', isPrimary: true, order: 0 }],
    isActive: true,
  });
};

const shippingAddress = {
  fullName: 'Amadou Diallo',
  phone: '+221770000001',
  street: '12 Avenue Cheikh Anta Diop',
  city: 'Dakar',
  region: 'Dakar',
  country: 'Sénégal',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Orders API', () => {
  let clientToken: string;
  let adminToken: string;

  beforeEach(async () => {
    clientToken = await registerAndLogin('client@test.com', 'client');
    adminToken = await registerAndLogin('admin@test.com', 'admin');
  });

  // ─── POST /orders ───────────────────────────────────────────────────────────
  describe('POST /api/v1/orders', () => {
    it('crée une commande et décrémente le stock', async () => {
      const product = await createProduct(150000, 5);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          items: [{ product: product._id.toString(), quantity: 2 }],
          shippingAddress,
          payment: { method: 'cash_on_delivery' },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderNumber).toMatch(/^ORD-/);
      expect(res.body.data.status).toBe('pending');

      // Stock decremented
      const updated = await Product.findById(product._id);
      expect(updated?.stock).toBe(3);
    });

    it('calcule correctement le total (livraison gratuite ≥ 25 000 FCFA)', async () => {
      const product = await createProduct(30000, 10);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          items: [{ product: product._id.toString(), quantity: 1 }],
          shippingAddress,
          payment: { method: 'cash_on_delivery' },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.pricing.shippingCost).toBe(0);
    });

    it('applique les frais de livraison (< 25 000 FCFA)', async () => {
      const product = await createProduct(10000, 10);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          items: [{ product: product._id.toString(), quantity: 1 }],
          shippingAddress,
          payment: { method: 'cash_on_delivery' },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.pricing.shippingCost).toBe(3000);
    });

    it('rejette si stock insuffisant — 400', async () => {
      const product = await createProduct(50000, 1);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          items: [{ product: product._id.toString(), quantity: 5 }],
          shippingAddress,
          payment: { method: 'cash_on_delivery' },
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/stock/i);
    });

    it('refuse sans authentification — 401', async () => {
      const product = await createProduct();
      const res = await request(app)
        .post('/api/v1/orders')
        .send({
          items: [{ product: product._id.toString(), quantity: 1 }],
          shippingAddress,
          payment: { method: 'cash_on_delivery' },
        });
      expect(res.status).toBe(401);
    });
  });

  // ─── GET /orders/my-orders ──────────────────────────────────────────────────
  describe('GET /api/v1/orders/my-orders', () => {
    it('retourne les commandes de l\'utilisateur connecté', async () => {
      const product = await createProduct(50000, 5);
      await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          items: [{ product: product._id.toString(), quantity: 1 }],
          shippingAddress,
          payment: { method: 'cash_on_delivery' },
        });

      const res = await request(app)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('refuse sans token — 401', async () => {
      const res = await request(app).get('/api/v1/orders/my-orders');
      expect(res.status).toBe(401);
    });
  });

  // ─── GET /orders/track/:orderNumber ─────────────────────────────────────────
  describe('GET /api/v1/orders/track/:orderNumber', () => {
    it('retourne le suivi sans authentification', async () => {
      const product = await createProduct(50000, 5);
      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          items: [{ product: product._id.toString(), quantity: 1 }],
          shippingAddress,
          payment: { method: 'cash_on_delivery' },
        });
      const { orderNumber } = orderRes.body.data;

      const res = await request(app).get(`/api/v1/orders/track/${orderNumber}`);
      expect(res.status).toBe(200);
      expect(res.body.data.orderNumber).toBe(orderNumber);
    });

    it('retourne 404 pour un numéro inexistant', async () => {
      const res = await request(app).get('/api/v1/orders/track/ORD-00000000-XXXX');
      expect(res.status).toBe(404);
    });
  });

  // ─── PUT /orders/:id/cancel ──────────────────────────────────────────────────
  describe('PUT /api/v1/orders/:id/cancel', () => {
    it('annule une commande pending et restore le stock', async () => {
      const product = await createProduct(50000, 5);
      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          items: [{ product: product._id.toString(), quantity: 2 }],
          shippingAddress,
          payment: { method: 'cash_on_delivery' },
        });
      const orderId = orderRes.body.data._id;

      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('cancelled');

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct?.stock).toBe(5); // Stock restored
    });
  });

  // ─── Admin: PUT /orders/:id/status ───────────────────────────────────────────
  describe('PUT /api/v1/orders/:id/status (admin)', () => {
    it('change le statut en "confirmed"', async () => {
      const product = await createProduct(50000, 5);
      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          items: [{ product: product._id.toString(), quantity: 1 }],
          shippingAddress,
          payment: { method: 'cash_on_delivery' },
        });
      const orderId = orderRes.body.data._id;

      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'confirmed', note: 'Commande validée' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('confirmed');
    });

    it('refuse pour un rôle client — 403', async () => {
      const product = await createProduct(50000, 5);
      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          items: [{ product: product._id.toString(), quantity: 1 }],
          shippingAddress,
          payment: { method: 'cash_on_delivery' },
        });
      const orderId = orderRes.body.data._id;

      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'confirmed' });

      expect(res.status).toBe(403);
    });
  });
});
