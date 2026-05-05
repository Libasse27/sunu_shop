import request from 'supertest';
import app from '../../app';
import User from '../../models/User.model';
import Order from '../../models/Order.model';
import Category from '../../models/Category.model';
import Product from '../../models/Product.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createClientAndLogin = async () => {
  await User.create({
    firstName: 'Fatou',
    lastName: 'Sow',
    email: 'fatou@test.com',
    password: 'TestPass123!',
    role: 'client',
    isActive: true,
  });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'fatou@test.com', password: 'TestPass123!' });
  return res.body.data.accessToken as string;
};

const createTestOrder = async (userId: string) => {
  const cat = await Category.create({ name: `PayCat-${Date.now()}`, slug: `paycat-${Date.now()}`, isActive: true });
  const product = await Product.create({
    name: 'TV Samsung 4K',
    slug: `tv-samsung-${Date.now()}`,
    description: 'Télévision Samsung 55 pouces',
    sku: `TV-SKU-${Date.now()}`,
    price: 450000,
    currency: 'XOF',
    stock: 5,
    category: cat._id,
    images: [{ url: 'https://example.com/tv.jpg', isPrimary: true, order: 0 }],
    isActive: true,
  });

  return Order.create({
    user: userId,
    orderNumber: `ORD-TEST-${Date.now()}`,
    items: [{
      product: product._id,
      name: product.name,
      image: product.images[0].url,
      price: product.price,
      quantity: 1,
      subtotal: product.price,
    }],
    shippingAddress: {
      fullName: 'Fatou Sow',
      phone: '+221770000002',
      street: '5 Rue Carnot',
      city: 'Dakar',
      region: 'Dakar',
      country: 'Sénégal',
    },
    pricing: { subtotal: 450000, shippingCost: 0, tax: 0, discount: 0, total: 450000 },
    payment: { method: 'stripe', status: 'pending' },
    status: 'pending',
    statusHistory: [{ status: 'pending', date: new Date() }],
    shipping: { method: 'standard' },
  });
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Payments API', () => {
  let clientToken: string;
  let userId: string;

  beforeEach(async () => {
    clientToken = await createClientAndLogin();
    const user = await User.findOne({ email: 'fatou@test.com' });
    userId = user!._id.toString();
  });

  // ─── Stripe ─────────────────────────────────────────────────────────────────
  describe('Stripe', () => {
    it('refuse la création d\'un PaymentIntent sans token — 401', async () => {
      const res = await request(app)
        .post('/api/v1/payments/stripe/create-intent')
        .send({ orderId: 'fake-id', amount: 450000 });
      expect(res.status).toBe(401);
    });

    it('refuse un orderId invalide (ObjectId mal formé) — 400 ou 500', async () => {
      const res = await request(app)
        .post('/api/v1/payments/stripe/create-intent')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ orderId: 'not-an-objectid' });
      expect([400, 404, 500]).toContain(res.status);
    });
  });

  // ─── Stripe Webhook ──────────────────────────────────────────────────────────
  describe('POST /api/v1/payments/stripe/webhook', () => {
    it('retourne 400 si la signature est absente', async () => {
      const res = await request(app)
        .post('/api/v1/payments/stripe/webhook')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ type: 'payment_intent.succeeded' }));
      expect([400, 401]).toContain(res.status);
    });

    it('retourne 400 si la signature est invalide', async () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded', data: { object: {} } });
      const res = await request(app)
        .post('/api/v1/payments/stripe/webhook')
        .set('stripe-signature', 'mauvaise-signature')
        .set('Content-Type', 'application/json')
        .send(payload);
      expect([400, 401]).toContain(res.status);
    });
  });

  // ─── Orange Money ────────────────────────────────────────────────────────────
  describe('Orange Money', () => {
    it('refuse l\'initiation de paiement sans token — 401', async () => {
      const res = await request(app)
        .post('/api/v1/payments/orange-money/initiate')
        .send({ orderId: 'fake', phoneNumber: '+221770000001' });
      expect(res.status).toBe(401);
    });
  });

  // ─── Wave ────────────────────────────────────────────────────────────────────
  describe('Wave', () => {
    it('refuse l\'initiation de paiement sans token — 401', async () => {
      const res = await request(app)
        .post('/api/v1/payments/wave/initiate')
        .send({ orderId: 'fake' });
      expect(res.status).toBe(401);
    });
  });

  // ─── Refund (admin) ──────────────────────────────────────────────────────────
  describe('POST /api/v1/payments/:id/refund (admin)', () => {
    it('refuse pour un rôle client — 403', async () => {
      const order = await createTestOrder(userId);

      const res = await request(app)
        .post(`/api/v1/payments/${order._id}/refund`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ reason: 'Remboursement test' });

      expect(res.status).toBe(403);
    });
  });
});
