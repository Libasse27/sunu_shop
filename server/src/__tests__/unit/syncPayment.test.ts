/**
 * Tests unitaires pour applyPaymentOutcome.
 *
 * Cette fonction est le cœur du traitement post-paiement :
 * elle synchronise le statut Payment + Order (paidAt, statusHistory, etc.).
 * Elle est utilisée par Stripe webhook, confirmStripePayment, et les callbacks
 * OrangeMoney/Wave.
 */

import mongoose from 'mongoose';
import User from '../../models/User.model';
import Category from '../../models/Category.model';
import Product from '../../models/Product.model';
import Order from '../../models/Order.model';
import Payment from '../../models/Payment.model';
import { applyPaymentOutcome } from '../../utils/syncPayment';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeOrderAndPayment = async (method = 'stripe') => {
  const user = await User.create({
    firstName: 'Test',
    lastName:  `User-${Date.now()}`,
    email:     `sync-${Date.now()}@test.sn`,
    password:  'TestPass123!',
    role:      'client',
    isActive:  true,
  });

  const cat = await Category.create({
    name:     `Cat-${Date.now()}`,
    slug:     `cat-${Date.now()}`,
    isActive: true,
  });

  const product = await Product.create({
    name:        `TV Samsung-${Date.now()}`,
    slug:        `tv-${Date.now()}`,
    sku:         `SKU-${Date.now()}`,
    description: 'Télévision test',
    price:       450_000,
    currency:    'XOF',
    stock:       5,
    category:    cat._id,
    images:      [{ url: 'https://example.com/tv.jpg', isPrimary: true, order: 0 }],
    isActive:    true,
  });

  const order = await Order.create({
    user:       user._id,
    orderNumber:`ORD-SYNC-${Date.now()}`,
    items: [{
      product:  product._id,
      name:     product.name,
      image:    product.images[0].url,
      price:    product.price,
      quantity: 1,
      subtotal: product.price,
    }],
    shippingAddress: {
      fullName: 'Moussa Diallo',
      phone:    '+221770000001',
      street:   '12 Avenue Bourguiba',
      city:     'Dakar',
      region:   'Dakar',
      country:  'Sénégal',
    },
    pricing: { subtotal: 450_000, shippingCost: 0, tax: 0, discount: 0, total: 450_000 },
    payment: { method, status: 'pending' },
    status:  'pending',
    statusHistory: [{ status: 'pending', date: new Date() }],
    shipping: { method: 'standard' },
  });

  const payment = await Payment.create({
    order:         order._id,
    user:          user._id,
    method,
    amount:        450_000,
    currency:      'XOF',
    status:        'initiated',
    transactionId: `txn-${Date.now()}`,
  });

  return { user, order, payment };
};

// ─── status = completed ───────────────────────────────────────────────────────

describe('applyPaymentOutcome — status: completed', () => {
  it('marque le paiement comme completed', async () => {
    const { payment } = await makeOrderAndPayment();

    await applyPaymentOutcome(payment, {
      status:        'completed',
      transactionId: payment.transactionId,
      orderNote:     'Webhook Stripe : payment_intent.succeeded',
    });

    const updated = await Payment.findById(payment._id);
    expect(updated?.status).toBe('completed');
  });

  it('passe la commande en statut "confirmed"', async () => {
    const { payment, order } = await makeOrderAndPayment();

    await applyPaymentOutcome(payment, { status: 'completed' });

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder?.status).toBe('confirmed');
    expect(updatedOrder?.payment.status).toBe('completed');
  });

  it('enregistre paidAt sur la commande', async () => {
    const { payment, order } = await makeOrderAndPayment();

    await applyPaymentOutcome(payment, { status: 'completed' });

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder?.payment.paidAt).toBeDefined();
    expect(updatedOrder?.payment.paidAt).toBeInstanceOf(Date);
  });

  it('ajoute une entrée "confirmed" dans statusHistory', async () => {
    const { payment, order } = await makeOrderAndPayment();
    const initialLen = order.statusHistory.length;

    await applyPaymentOutcome(payment, { status: 'completed', orderNote: 'Paiement OK' });

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder!.statusHistory.length).toBe(initialLen + 1);

    const lastEntry = updatedOrder!.statusHistory.at(-1)!;
    expect(lastEntry.status).toBe('confirmed');
    expect(lastEntry.note).toBe('Paiement OK');
  });

  it('met à jour transactionId si fourni', async () => {
    const { payment } = await makeOrderAndPayment();
    const newTxnId = 'pi_new_stripe_1234567890';

    await applyPaymentOutcome(payment, { status: 'completed', transactionId: newTxnId });

    const updatedOrder = await Order.findById((await Payment.findById(payment._id))!.order);
    expect(updatedOrder?.payment.transactionId).toBe(newTxnId);
  });

  it('conserve l\'ancien transactionId si non fourni', async () => {
    const { payment, order } = await makeOrderAndPayment();
    const originalTxn = order.payment.transactionId;

    await applyPaymentOutcome(payment, { status: 'completed' });

    const updatedOrder = await Order.findById(order._id);
    // transactionId ne doit pas changer si non fourni dans opts
    expect(updatedOrder?.payment.transactionId).toBe(originalTxn ?? undefined);
  });
});

// ─── status = failed ─────────────────────────────────────────────────────────

describe('applyPaymentOutcome — status: failed', () => {
  it('marque le paiement comme failed', async () => {
    const { payment } = await makeOrderAndPayment();

    await applyPaymentOutcome(payment, { status: 'failed' });

    const updated = await Payment.findById(payment._id);
    expect(updated?.status).toBe('failed');
  });

  it('met à jour order.payment.status sans changer order.status', async () => {
    const { payment, order } = await makeOrderAndPayment();

    await applyPaymentOutcome(payment, { status: 'failed', orderNote: 'Carte refusée' });

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder?.payment.status).toBe('failed');
    expect(updatedOrder?.status).toBe('pending'); // status commande inchangé
    expect(updatedOrder?.payment.paidAt).toBeUndefined();
  });

  it('ajoute une entrée dans statusHistory avec la note', async () => {
    const { payment, order } = await makeOrderAndPayment();
    const note = 'Fonds insuffisants sur le compte';
    const initialLen = order.statusHistory.length;

    await applyPaymentOutcome(payment, { status: 'failed', orderNote: note });

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder!.statusHistory.length).toBe(initialLen + 1);
    expect(updatedOrder!.statusHistory.at(-1)!.note).toBe(note);
  });
});

// ─── status = refunded ────────────────────────────────────────────────────────

describe('applyPaymentOutcome — status: refunded', () => {
  it('marque le paiement comme refunded', async () => {
    const { payment } = await makeOrderAndPayment();
    // Simuler un paiement déjà complété avant le remboursement
    await applyPaymentOutcome(payment, { status: 'completed' });

    const freshPayment = await Payment.findById(payment._id);
    await applyPaymentOutcome(freshPayment!, { status: 'refunded', orderNote: 'Remboursement client' });

    const updated = await Payment.findById(payment._id);
    expect(updated?.status).toBe('refunded');
  });
});

// ─── cas limites ──────────────────────────────────────────────────────────────

describe('applyPaymentOutcome — cas limites', () => {
  it('ne lève pas d\'erreur si la commande est introuvable (payment orphelin)', async () => {
    const user = await User.create({
      firstName: 'Orphan',
      lastName:  `User-${Date.now()}`,
      email:     `orphan-${Date.now()}@test.sn`,
      password:  'TestPass123!',
      role:      'client',
      isActive:  true,
    });

    const ghostOrderId = new mongoose.Types.ObjectId();

    const payment = await Payment.create({
      order:         ghostOrderId,
      user:          user._id,
      method:        'stripe',
      amount:        50_000,
      currency:      'XOF',
      status:        'initiated',
      transactionId: `txn-orphan-${Date.now()}`,
    });

    await expect(
      applyPaymentOutcome(payment, { status: 'completed' }),
    ).resolves.not.toThrow();
  });

  it('utilise une note par défaut si orderNote absent (completed)', async () => {
    const { payment, order } = await makeOrderAndPayment();

    await applyPaymentOutcome(payment, { status: 'completed' });

    const updatedOrder = await Order.findById(order._id);
    const note = updatedOrder!.statusHistory.at(-1)!.note;
    expect(typeof note).toBe('string');
    expect((note ?? '').length).toBeGreaterThan(0);
  });

  it('idempotence : appliquer completed deux fois ne plante pas', async () => {
    const { payment } = await makeOrderAndPayment();

    await applyPaymentOutcome(payment, { status: 'completed' });
    const freshPayment = await Payment.findById(payment._id);
    await expect(
      applyPaymentOutcome(freshPayment!, { status: 'completed' }),
    ).resolves.not.toThrow();
  });
});
