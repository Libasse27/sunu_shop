/**
 * Tests d'intégration — Webhooks de paiement
 *
 * Stratégie :
 *  - Stripe : teste la validation de signature (rejet obligatoire)
 *    Le business logic (order update) est couvert par syncPayment.test.ts.
 *    Pour un test E2E complet avec Stripe SDK actif, définir STRIPE_SECRET_KEY
 *    et STRIPE_WEBHOOK_SECRET dans l'environnement de CI.
 *  - OrangeMoney / Wave : teste la sécurité des callbacks publics.
 */

import request from 'supertest';
import crypto from 'crypto';
import app from '../../app';
import User from '../../models/User.model';
import Category from '../../models/Category.model';
import Product from '../../models/Product.model';
import Order from '../../models/Order.model';
import Payment from '../../models/Payment.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Construit un header stripe-signature valide selon le protocole Stripe.
 * Format : t=<timestamp>,v1=<hmac_sha256(secret, "<timestamp>.<payload>")>
 *
 * À utiliser quand STRIPE_WEBHOOK_SECRET est défini dans l'env de test,
 * ce qui active la validation réelle de signature côté contrôleur.
 */
const buildStripeSignature = (payload: string, secret: string): string => {
  const ts = Math.floor(Date.now() / 1000);
  const signed = `${ts}.${payload}`;
  const sig = crypto.createHmac('sha256', secret).update(signed, 'utf8').digest('hex');
  return `t=${ts},v1=${sig}`;
};

const registerAndLogin = async (email: string, role = 'client') => {
  await User.create({
    firstName: 'Test',
    lastName:  'Webhook',
    email,
    password:  'TestPass123!',
    role,
    isActive:  true,
  });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'TestPass123!' });
  return res.body.data.accessToken as string;
};

const createOrderAndPayment = async (userId: string) => {
  const cat = await Category.create({
    name:     `Cat-${Date.now()}`,
    slug:     `cat-${Date.now()}`,
    isActive: true,
  });
  const product = await Product.create({
    name:        `TV-${Date.now()}`,
    slug:        `tv-${Date.now()}`,
    sku:         `SKU-${Date.now()}`,
    description: 'Test',
    price:       450_000,
    currency:    'XOF',
    stock:       5,
    category:    cat._id,
    images:      [{ url: 'https://example.com/tv.jpg', isPrimary: true, order: 0 }],
    isActive:    true,
  });
  const order = await Order.create({
    user:        userId,
    orderNumber: `ORD-WH-${Date.now()}`,
    items: [{
      product:  product._id,
      name:     product.name,
      image:    product.images[0].url,
      price:    product.price,
      quantity: 1,
      subtotal: product.price,
    }],
    shippingAddress: {
      fullName: 'Test User',
      phone:    '+221770000001',
      street:   'Rue Test',
      city:     'Dakar',
      region:   'Dakar',
      country:  'Sénégal',
    },
    pricing:       { subtotal: 450_000, shippingCost: 0, tax: 0, discount: 0, total: 450_000 },
    payment:       { method: 'stripe', status: 'pending' },
    status:        'pending',
    statusHistory: [{ status: 'pending', date: new Date() }],
    shipping:      { method: 'standard' },
  });
  const payment = await Payment.create({
    order:         order._id,
    user:          userId,
    method:        'stripe',
    amount:        450_000,
    currency:      'XOF',
    status:        'initiated',
    transactionId: `pi_test_${Date.now()}`,
  });
  return { order, payment };
};

// ─── Stripe webhook ────────────────────────────────────────────────────────────

describe('POST /api/v1/payments/stripe/webhook', () => {
  it('retourne 400 si le header stripe-signature est absent', async () => {
    const res = await request(app)
      .post('/api/v1/payments/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ type: 'payment_intent.succeeded' }));

    expect([400, 401]).toContain(res.status);
  });

  it('retourne 400 si la signature est syntaxiquement invalide', async () => {
    const payload = JSON.stringify({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test', status: 'succeeded' } },
    });

    const res = await request(app)
      .post('/api/v1/payments/stripe/webhook')
      .set('stripe-signature', 'invalide-sans-format-stripe')
      .set('Content-Type', 'application/json')
      .send(payload);

    expect([400, 401]).toContain(res.status);
  });

  it('retourne 400 avec un payload JSON vide et signature fantaisiste', async () => {
    const res = await request(app)
      .post('/api/v1/payments/stripe/webhook')
      .set('stripe-signature', 't=1234,v1=aabbccdd')
      .set('Content-Type', 'application/json')
      .send('{}');

    expect([400, 401]).toContain(res.status);
  });

  it('retourne 400 avec un corps non-JSON (attaque de format)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/stripe/webhook')
      .set('stripe-signature', 't=1234,v1=fake')
      .set('Content-Type', 'text/plain')
      .send('not-json-at-all');

    expect([400, 401]).toContain(res.status);
  });

  // Test conditionnel : uniquement si STRIPE_WEBHOOK_SECRET est défini
  // Ce test s'exécute en CI quand les secrets Stripe de test sont injectés.
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const describeWithStripe = stripeWebhookSecret ? describe : describe.skip;

  describeWithStripe('avec STRIPE_WEBHOOK_SECRET configuré', () => {
    it('retourne 400 si la signature HMAC est correctement construite mais avec le mauvais secret', async () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded', data: { object: {} } });
      const wrongSecret = 'whsec_wrong_secret_12345';
      const sig = buildStripeSignature(payload, wrongSecret);

      const res = await request(app)
        .post('/api/v1/payments/stripe/webhook')
        .set('stripe-signature', sig)
        .set('Content-Type', 'application/json')
        .send(payload);

      expect([400, 401]).toContain(res.status);
    });

    it('retourne 200 et reçoit l\'événement avec la bonne signature', async () => {
      const clientToken = await registerAndLogin(`wh-user-${Date.now()}@test.sn`);
      const user = await User.findOne({ email: { $regex: /wh-user/ } });
      const { payment } = await createOrderAndPayment(user!._id.toString());

      const stripeEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id:       payment.transactionId,
            status:   'succeeded',
            amount:   45000000, // centimes (pas utilisé par notre handler)
            currency: 'xof',
            metadata: { orderId: payment.order.toString() },
          },
        },
      };

      const payload = JSON.stringify(stripeEvent);
      const sig = buildStripeSignature(payload, stripeWebhookSecret!);

      const res = await request(app)
        .post('/api/v1/payments/stripe/webhook')
        .set('stripe-signature', sig)
        .set('Content-Type', 'application/json')
        .send(Buffer.from(payload)); // corps brut (requis par Stripe)

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);

      // Vérifier la mise à jour en base
      const updatedPayment = await Payment.findById(payment._id);
      expect(updatedPayment?.status).toBe('completed');

      const updatedOrder = await Order.findById(payment.order);
      expect(updatedOrder?.status).toBe('confirmed');
    });
  });
});

// ─── Orange Money callback ─────────────────────────────────────────────────────

describe('POST /api/v1/payments/orange-money/callback', () => {
  it('retourne 400 ou 404 sans données valides', async () => {
    const res = await request(app)
      .post('/api/v1/payments/orange-money/callback')
      .send({ status: 'SUCCESS' });

    expect([400, 404]).toContain(res.status);
  });

  it('retourne 400 si notif_token absent', async () => {
    const res = await request(app)
      .post('/api/v1/payments/orange-money/callback')
      .send({ status: 'SUCCESS', pay_token: 'test' });

    expect([400, 404]).toContain(res.status);
  });
});

// ─── Wave callback ────────────────────────────────────────────────────────────

describe('POST /api/v1/payments/wave/callback', () => {
  it('retourne 400 ou 401 sans token Wave valide', async () => {
    const res = await request(app)
      .post('/api/v1/payments/wave/callback')
      .send({ id: 'wave-txn-001', wave_code: 'WV-TEST' });

    expect([400, 401, 403, 404]).toContain(res.status);
  });
});
