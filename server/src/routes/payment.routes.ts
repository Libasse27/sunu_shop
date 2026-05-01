import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import {
  createStripeIntent,
  confirmStripePayment,
  stripeWebhook,
  initiateOrangeMoney,
  orangeMoneyCallback,
  initiateWave,
  waveCallback,
  getPaymentStatus,
  refundPayment,
} from '../controllers/payment.controller';
import {
  createPaymentIntent,
  getPaymentIntent,
  confirmQRPayment,
  cancelPaymentIntent,
} from '../controllers/paymentVerification.controller';

const router = Router();

// ─── QR PAYMENT (Wave / Orange Money) ────────────────────────────────────────

router.post('/intent',           protect, createPaymentIntent);
router.get('/intent/:token',     protect, getPaymentIntent);
router.post('/confirm',          protect, confirmQRPayment);
router.delete('/intent/:token',  protect, cancelPaymentIntent);

// ─── STRIPE ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /payments/stripe/create-intent:
 *   post:
 *     summary: Créer un PaymentIntent Stripe
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId: { type: string, description: "ObjectId de la commande" }
 *     responses:
 *       200:
 *         description: clientSecret Stripe retourné
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         clientSecret: { type: string }
 *       404:
 *         description: Commande non trouvée
 */
router.post('/stripe/create-intent', protect, createStripeIntent);

/**
 * @swagger
 * /payments/stripe/confirm:
 *   post:
 *     summary: Confirmer un paiement Stripe (après 3DS si nécessaire)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentIntentId, orderId]
 *             properties:
 *               paymentIntentId: { type: string }
 *               orderId: { type: string }
 *     responses:
 *       200:
 *         description: Paiement confirmé
 */
router.post('/stripe/confirm', protect, confirmStripePayment);

/**
 * @swagger
 * /payments/stripe/webhook:
 *   post:
 *     summary: Webhook Stripe (événements paiement/remboursement)
 *     tags: [Payments]
 *     security: []
 *     description: |
 *       Endpoint interne pour Stripe. **Ne pas appeler manuellement.**
 *
 *       Signature vérifiée via `stripe-signature` header + `STRIPE_WEBHOOK_SECRET`.
 *
 *       Événements traités :
 *       - `payment_intent.succeeded` → commande confirmée
 *       - `payment_intent.payment_failed` → statut failed
 *       - `charge.refunded` → statut refunded
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Événement traité
 *       400:
 *         description: Signature invalide ou payload malformé
 */
router.post('/stripe/webhook', stripeWebhook);

// ─── ORANGE MONEY ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /payments/orange-money/initiate:
 *   post:
 *     summary: Initier un paiement Orange Money
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, phoneNumber]
 *             properties:
 *               orderId: { type: string }
 *               phoneNumber: { type: string, example: "+221770000001", description: "Numéro Orange Money" }
 *     responses:
 *       200:
 *         description: Paiement initié — l'utilisateur reçoit un USSD prompt sur son téléphone
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         transactionId: { type: string }
 *                         message: { type: string }
 */
router.post('/orange-money/initiate', protect, initiateOrangeMoney);

/**
 * @swagger
 * /payments/orange-money/callback:
 *   post:
 *     summary: Callback Orange Money (webhook interne)
 *     tags: [Payments]
 *     security: []
 *     description: Endpoint pour Orange Money. **Ne pas appeler manuellement.** Signature vérifiée côté serveur.
 *     responses:
 *       200:
 *         description: Callback traité
 *       400:
 *         description: Signature invalide
 */
router.post('/orange-money/callback', orangeMoneyCallback);

// ─── WAVE ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /payments/wave/initiate:
 *   post:
 *     summary: Initier un paiement Wave
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId: { type: string }
 *     responses:
 *       200:
 *         description: URL de paiement Wave retournée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         paymentUrl: { type: string, description: "URL de redirection vers Wave" }
 *                         transactionId: { type: string }
 */
router.post('/wave/initiate', protect, initiateWave);

/**
 * @swagger
 * /payments/wave/callback:
 *   post:
 *     summary: Callback Wave (webhook interne)
 *     tags: [Payments]
 *     security: []
 *     description: Endpoint pour Wave. **Ne pas appeler manuellement.** Signature vérifiée via `wave-signature` header.
 *     responses:
 *       200:
 *         description: Callback traité
 */
router.post('/wave/callback', waveCallback);

// ─── REMBOURSEMENT ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /payments/{id}/refund:
 *   post:
 *     summary: Rembourser un paiement (admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ObjectId du paiement (Payment model)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: "Produit défectueux" }
 *               amount: { type: integer, description: "Montant partiel en FCFA (optionnel — total si absent)" }
 *     responses:
 *       200:
 *         description: Remboursement initié
 *       403:
 *         description: Rôle insuffisant
 *       404:
 *         description: Paiement non trouvé
 */
router.post('/:id/refund', protect, adminOnly, refundPayment);

/**
 * @swagger
 * /payments/{paymentId}/status:
 *   get:
 *     summary: Polling du statut d'un paiement (Orange Money, Wave, Stripe)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Utilisé par le frontend après redirection depuis Orange Money ou Wave
 *       pour connaître le résultat final du paiement (pending → completed/failed).
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: string }
 *         description: ObjectId du paiement
 *     responses:
 *       200:
 *         description: Statut du paiement
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         status: { type: string, enum: [initiated, pending, completed, failed, refunded] }
 *                         method: { type: string, enum: [stripe, orange_money, wave, cash_on_delivery] }
 *                         amount: { type: integer }
 *                         orderId: { type: string }
 */
router.get('/:paymentId/status', protect, getPaymentStatus);

export default router;
