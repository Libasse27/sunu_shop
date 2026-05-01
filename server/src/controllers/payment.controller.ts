import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import Payment from '../models/Payment.model';
import Order from '../models/Order.model';
import { env } from '../config/env';
import logger from '../utils/logger';
import axios from 'axios';
import crypto from 'crypto';
import type Stripe from 'stripe';
import { applyPaymentOutcome } from '../utils/syncPayment';

// Conditional Stripe import
// La clé doit commencer par sk_test_ ou sk_live_ ET avoir du contenu après le préfixe
const stripeKeyValid = /^sk_(test|live)_\w{10,}/.test(env.STRIPE_SECRET_KEY || '');

let stripe: Stripe | null = null;

if (stripeKeyValid) {
  try {
    // require dynamique — Stripe est une dépendance optionnelle
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const StripeClass = require('stripe');
    stripe = new StripeClass(env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' }) as Stripe;
  } catch (error) {
    logger.warn('Stripe : package non installé. Lancer : npm install stripe');
  }
} else if (env.STRIPE_SECRET_KEY) {
  logger.warn('Stripe : clé API invalide ou incomplète (STRIPE_SECRET_KEY). Les paiements Stripe sont désactivés.');
}

// ===================== STRIPE =====================

export const createStripeIntent = asyncHandler(async (req: Request, res: Response) => {
  if (!stripe) {
    throw ApiError.badRequest('Stripe n\'est pas configuré');
  }

  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Commande non trouvée');

  if (order.user.toString() !== req.user!._id.toString()) {
    throw ApiError.forbidden('Accès non autorisé');
  }

  if (order.payment.status === 'completed') {
    throw ApiError.badRequest('Cette commande a déjà été payée');
  }

  // XOF est une devise zéro-décimal pour Stripe (comme JPY, XAF, BIF...)
  // → on passe le montant en francs directement, sans multiplier par 100
  const stripeAmount = Math.round(order.pricing.total);
  if (stripeAmount < 50) {
    throw ApiError.badRequest('Montant minimum : 50 FCFA');
  }

  // 1️⃣ Créer le PaymentIntent Stripe EN PREMIER
  //    → si Stripe échoue, aucun enregistrement inutile en base
  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount:      stripeAmount,
      currency:    'xof',
      metadata: {
        orderId: order._id.toString(),
        userId:  req.user!._id.toString(),
      },
      description: `Commande ${order.orderNumber} — TechAfrique`,
    });
  } catch (err: unknown) {
    const msg = (err as { raw?: { message?: string }; message?: string })?.raw?.message
      || (err as Error)?.message
      || 'Erreur Stripe';
    logger.error('Stripe PaymentIntent erreur', { error: msg });
    throw ApiError.badRequest(`Stripe : ${msg}`);
  }

  // 2️⃣ Enregistrer le paiement en base seulement si Stripe a réussi
  const payment = await Payment.create({
    order:            order._id,
    user:             req.user!._id,
    method:           'stripe',
    amount:           order.pricing.total,
    currency:         'XOF',
    status:           'initiated',
    transactionId:    paymentIntent.id,
    providerResponse: paymentIntent,
  });

  ApiResponse.success(res, {
    clientSecret: paymentIntent.client_secret,
    paymentId:    payment._id,
    amount:       order.pricing.total,
  }, 'PaymentIntent créé avec succès');
});

export const confirmStripePayment = asyncHandler(async (req: Request, res: Response) => {
  if (!stripe) {
    throw ApiError.badRequest('Stripe n\'est pas configuré');
  }

  const { paymentId, paymentIntentId } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) throw ApiError.notFound('Paiement non trouvé');

  if (payment.user.toString() !== req.user!._id.toString()) {
    throw ApiError.forbidden('Accès non autorisé');
  }

  // Verify with Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  payment.providerResponse = paymentIntent;

  if (paymentIntent.status === 'succeeded') {
    await applyPaymentOutcome(payment, {
      status:        'completed',
      transactionId: paymentIntentId,
      orderNote:     'Paiement confirmé via Stripe',
    });
    ApiResponse.success(res, payment, 'Paiement confirmé avec succès');
  } else {
    await applyPaymentOutcome(payment, { status: 'failed', orderNote: 'Paiement Stripe échoué' });
    throw ApiError.badRequest('Le paiement n\'a pas abouti');
  }
});

export const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  if (!stripe) {
    throw ApiError.badRequest('Stripe n\'est pas configuré');
  }

  const sig = req.headers['stripe-signature'] as string;

  if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
    throw ApiError.badRequest('Signature manquante');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? 'Erreur inconnue';
    throw ApiError.badRequest(`Erreur de vérification du webhook: ${msg}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const payment = await Payment.findOne({ transactionId: paymentIntent.id });
      if (payment && payment.status !== 'completed') {
        payment.providerResponse = paymentIntent;
        await applyPaymentOutcome(payment, {
          status:        'completed',
          transactionId: paymentIntent.id,
          orderNote:     'Paiement confirmé via Stripe webhook',
        });
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const payment = await Payment.findOne({ transactionId: paymentIntent.id });
      if (payment) {
        payment.providerResponse = paymentIntent;
        await applyPaymentOutcome(payment, { status: 'failed', orderNote: 'Paiement Stripe échoué' });
      }
      break;
    }

    default:
      logger.warn('Stripe webhook : type d\'événement non géré', { eventType: event.type });
  }

  res.json({ received: true });
});

// ===================== ORANGE MONEY =====================

interface OrangeMoneyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface OrangeMoneyPaymentResponse {
  payment_url: string;
  payment_token: string;
  notif_token: string;
}

const getOrangeMoneyToken = async (): Promise<string> => {
  if (!env.ORANGE_MONEY_CLIENT_ID || !env.ORANGE_MONEY_CLIENT_SECRET) {
    throw ApiError.badRequest('Orange Money n\'est pas configuré');
  }

  const auth = Buffer.from(`${env.ORANGE_MONEY_CLIENT_ID}:${env.ORANGE_MONEY_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post<OrangeMoneyTokenResponse>(
      'https://api.orange.com/oauth/v3/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (error: unknown) {
    const axiosErr = error as { response?: { data?: unknown }; message?: string };
    logger.error('Orange Money token error', { detail: axiosErr.response?.data || axiosErr.message });
    throw ApiError.internal('Erreur lors de l\'obtention du token Orange Money');
  }
};

export const initiateOrangeMoney = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, phoneNumber } = req.body;

  if (!phoneNumber) {
    throw ApiError.badRequest('Numéro de téléphone requis');
  }

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Commande non trouvée');

  if (order.user.toString() !== req.user!._id.toString()) {
    throw ApiError.forbidden('Accès non autorisé');
  }

  if (order.payment.status === 'completed') {
    throw ApiError.badRequest('Cette commande a déjà été payée');
  }

  // Create Payment record
  const payment = await Payment.create({
    order: order._id,
    user: req.user!._id,
    method: 'orange_money',
    amount: order.pricing.total,
    currency: 'XOF',
    status: 'initiated',
    phoneNumber,
  });

  try {
    const accessToken = await getOrangeMoneyToken();

    const paymentData = {
      merchant_key: env.ORANGE_MONEY_MERCHANT_KEY,
      currency: 'OUV',
      order_id: order.orderNumber,
      amount: order.pricing.total,
      return_url: `${env.CLIENT_URL}/payment/orange-money/return?order=${order._id}&method=orange_money`,
      cancel_url: `${env.CLIENT_URL}/payment/orange-money/cancel?method=orange_money`,
      notif_url: `${env.SERVER_URL}/api/v1/payments/orange-money/callback`,
      lang: 'fr',
      reference: payment._id.toString(),
    };

    const response = await axios.post<OrangeMoneyPaymentResponse>(
      'https://api.orange.com/orange-money-webpay/dev/v1/webpayment',
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    payment.transactionId = response.data.payment_token;
    payment.providerResponse = response.data;
    payment.status = 'pending';
    // Stocker le notif_token pour vérification sécurisée du callback
    payment.metadata = { notif_token: response.data.notif_token };
    await payment.save();

    ApiResponse.success(res, {
      paymentUrl: response.data.payment_url,
      paymentToken: response.data.payment_token,
      paymentId: payment._id,
    }, 'Paiement Orange Money initié');
  } catch (error: unknown) {
    const axiosErr = error as { response?: { data?: unknown }; message?: string };
    payment.status = 'failed';
    payment.providerResponse = axiosErr.response?.data ?? { error: axiosErr.message };
    await payment.save();

    logger.error('Orange Money initiation error', { detail: axiosErr.response?.data || axiosErr.message });
    throw ApiError.internal('Erreur lors de l\'initiation du paiement Orange Money');
  }
});

export const orangeMoneyCallback = asyncHandler(async (req: Request, res: Response) => {
  const { payment_token, notif_token, status, txnid } = req.body;

  if (!payment_token) {
    throw ApiError.badRequest('Token de paiement manquant');
  }

  const payment = await Payment.findOne({ transactionId: payment_token });
  if (!payment) throw ApiError.notFound('Paiement non trouvé');

  // Vérification du notif_token — timingSafeEqual pour éviter les timing attacks
  if (payment.metadata?.notif_token) {
    const expected = Buffer.from(String(payment.metadata.notif_token));
    const received = Buffer.from(String(notif_token || ''));
    const safeEqual = expected.length === received.length &&
      crypto.timingSafeEqual(expected, received);
    if (!safeEqual) {
      logger.warn('Orange Money callback: notif_token invalide', { paymentId: payment._id });
      throw ApiError.badRequest('Signature de callback invalide');
    }
  }

  payment.providerResponse = req.body;

  if (status === 'SUCCESS') {
    payment.metadata = { txnid };
    await applyPaymentOutcome(payment, {
      status:        'completed',
      transactionId: txnid,
      orderNote:     'Paiement confirmé via Orange Money',
    });
    ApiResponse.success(res, { success: true }, 'Paiement Orange Money confirmé');
  } else {
    await applyPaymentOutcome(payment, { status: 'failed', orderNote: 'Paiement Orange Money échoué' });
    ApiResponse.success(res, { success: false }, 'Paiement Orange Money échoué');
  }
});

// ===================== WAVE =====================

interface WaveCheckoutResponse {
  id: string;
  wave_launch_url: string;
  checkout_status: string;
}

export const initiateWave = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.body;

  if (!env.WAVE_API_KEY) {
    throw ApiError.badRequest('Wave n\'est pas configuré');
  }

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Commande non trouvée');

  if (order.user.toString() !== req.user!._id.toString()) {
    throw ApiError.forbidden('Accès non autorisé');
  }

  if (order.payment.status === 'completed') {
    throw ApiError.badRequest('Cette commande a déjà été payée');
  }

  // Create Payment record
  const payment = await Payment.create({
    order: order._id,
    user: req.user!._id,
    method: 'wave',
    amount: order.pricing.total,
    currency: 'XOF',
    status: 'initiated',
  });

  try {
    const checkoutData = {
      amount: order.pricing.total,
      currency: 'XOF',
      error_url: `${env.CLIENT_URL}/payment/wave/error?method=wave`,
      success_url: `${env.CLIENT_URL}/payment/wave/success?order=${order._id}&method=wave`,
      metadata: {
        orderId: order._id.toString(),
        paymentId: payment._id.toString(),
        orderNumber: order.orderNumber,
      },
    };

    const response = await axios.post<WaveCheckoutResponse>(
      'https://api.wave.com/v1/checkout/sessions',
      checkoutData,
      {
        headers: {
          'Authorization': `Bearer ${env.WAVE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    payment.transactionId = response.data.id;
    payment.providerResponse = response.data;
    payment.status = 'pending';
    await payment.save();

    ApiResponse.success(res, {
      checkoutUrl: response.data.wave_launch_url,
      checkoutId: response.data.id,
      paymentId: payment._id,
    }, 'Paiement Wave initié');
  } catch (error: unknown) {
    const axiosErr = error as { response?: { data?: unknown }; message?: string };
    payment.status = 'failed';
    payment.providerResponse = axiosErr.response?.data ?? { error: axiosErr.message };
    await payment.save();

    logger.error('Wave initiation error', { detail: axiosErr.response?.data || axiosErr.message });
    throw ApiError.internal('Erreur lors de l\'initiation du paiement Wave');
  }
});

export const waveCallback = asyncHandler(async (req: Request, res: Response) => {
  if (!env.WAVE_WEBHOOK_SECRET) {
    throw ApiError.badRequest('Wave webhook secret non configuré');
  }

  const signature = req.headers['wave-signature'] as string;
  if (!signature) {
    throw ApiError.badRequest('Signature manquante');
  }

  // Wave envoie la signature au format "sha256=<hex>" — on retire le préfixe
  if (!signature.startsWith('sha256=')) {
    throw ApiError.badRequest('Format de signature Wave invalide');
  }
  const receivedHash = signature.slice(7);

  const expectedHash = crypto.createHmac('sha256', env.WAVE_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  // timingSafeEqual pour éviter les timing attacks
  if (receivedHash.length !== expectedHash.length ||
      !crypto.timingSafeEqual(Buffer.from(receivedHash, 'hex'), Buffer.from(expectedHash, 'hex'))) {
    throw ApiError.badRequest('Signature Wave invalide');
  }

  const { type, data } = req.body;

  if (type === 'checkout.completed') {
    const checkoutId = data.id;
    const payment = await Payment.findOne({ transactionId: checkoutId });
    if (!payment) throw ApiError.notFound('Paiement non trouvé');

    payment.providerResponse = data;
    await applyPaymentOutcome(payment, {
      status:        'completed',
      transactionId: checkoutId,
      orderNote:     'Paiement confirmé via Wave',
    });
  } else if (type === 'checkout.failed') {
    const checkoutId = data.id;
    const payment = await Payment.findOne({ transactionId: checkoutId });
    if (payment) {
      payment.providerResponse = data;
      await applyPaymentOutcome(payment, { status: 'failed', orderNote: 'Paiement Wave échoué' });
    }
  }

  res.json({ received: true });
});

// ===================== GENERAL =====================

/**
 * Polling du statut d'un paiement — utilisé par le frontend après redirection
 * Orange Money / Wave pour connaître le résultat final.
 */
export const getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId).select('status method transactionId amount order');
  if (!payment) throw ApiError.notFound('Paiement non trouvé');

  if (payment.user?.toString() !== req.user!._id.toString()) {
    throw ApiError.forbidden('Accès non autorisé');
  }

  ApiResponse.success(res, {
    status: payment.status,
    method: payment.method,
    amount: payment.amount,
    orderId: payment.order,
  }, 'Statut du paiement récupéré');
});

export const refundPayment = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const { id } = req.params;

  const payment = await Payment.findById(id);
  if (!payment) throw ApiError.notFound('Paiement non trouvé');

  if (payment.status === 'refunded') {
    throw ApiError.badRequest('Ce paiement a déjà été remboursé');
  }

  if (payment.status !== 'completed') {
    throw ApiError.badRequest('Seuls les paiements complétés peuvent être remboursés');
  }

  // Handle Stripe refund
  if (payment.method === 'stripe' && stripe && payment.transactionId) {
    try {
      await stripe.refunds.create({
        payment_intent: payment.transactionId,
      });
    } catch (error: unknown) {
      logger.error('Stripe refund error', { error: (error as Error).message });
      throw ApiError.internal('Erreur lors du remboursement Stripe');
    }
  }

  payment.status = 'refunded';
  payment.refundAmount = payment.amount;
  payment.refundReason = reason;
  payment.refundedAt = new Date();
  await payment.save();

  const order = await Order.findById(payment.order);
  if (order) {
    order.payment.status = 'refunded';
    order.status = 'refunded';
    order.statusHistory.push({
      status: 'refunded',
      date: new Date(),
      note: `Remboursement: ${reason}`,
      updatedBy: req.user!._id,
    });
    await order.save();
  }

  ApiResponse.success(res, payment, 'Paiement remboursé avec succès');
});
