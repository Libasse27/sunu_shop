import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { paymentVerificationService } from '../services/payment-verification.service';
import { orderService } from '../services/order.service';

/**
 * POST /payments/intent
 * Calcule le montant exact côté serveur et retourne un token signé.
 * Le client NE peut PAS influencer le montant calculé.
 */
export const createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  const { items, couponCode } = req.body;

  if (!items?.length) throw ApiError.badRequest('Le panier est vide');

  const intent = await paymentVerificationService.createIntent(
    String(req.user!._id),
    items,
    couponCode,
  );

  ApiResponse.success(res, intent, 'Intention de paiement créée');
});

/**
 * GET /payments/intent/:token
 * Retourne le montant stocké pour affichage (vérifie la propriété).
 */
export const getPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  const data = await paymentVerificationService.getIntentAmount(
    req.params.token,
    String(req.user!._id),
  );

  if (!data) throw ApiError.notFound('Intention de paiement expirée ou introuvable');

  ApiResponse.success(res, data);
});

/**
 * POST /payments/confirm
 * Vérifie l'intention, crée la commande avec le montant serveur, invalide le token.
 *
 * Le flux anti-manipulation :
 *  1. Le token est vérifié (signature HMAC + propriétaire + statut pending)
 *  2. Si clientAmount est fourni, il est comparé au montant serveur
 *     → blocage si différent
 *  3. La commande est créée avec le montant SERVEUR (jamais le montant client)
 *  4. Le token est marqué 'used' (anti double-dépense)
 */
export const confirmQRPayment = asyncHandler(async (req: Request, res: Response) => {
  const { token, clientAmount, shippingAddress, payment, couponCode, customerNote } = req.body;

  if (!token)           throw ApiError.badRequest('Token de paiement requis');
  if (!shippingAddress) throw ApiError.badRequest('Adresse de livraison requise');
  if (!payment?.method) throw ApiError.badRequest('Méthode de paiement requise');

  const userId = String(req.user!._id);

  // ── Vérification intention + comparaison montant ────────────────────────
  const verifyResult = await paymentVerificationService.verifyIntent(token, userId, clientAmount);

  if (!verifyResult.valid) {
    throw ApiError.badRequest(verifyResult.reason ?? 'Paiement invalide');
  }

  // ── Consommation du token (anti double-dépense) ─────────────────────────
  const { amount } = await paymentVerificationService.consumeIntent(token, userId);

  // ── Création de la commande avec le montant SERVER-SIDE ─────────────────
  // Les items sont re-récupérés depuis la DB dans orderService.createOrder()
  const order = await orderService.createOrder(userId, {
    items:          req.body.items,
    shippingAddress,
    payment,
    couponCode,
    customerNote,
  });

  ApiResponse.created(res, {
    order,
    verifiedAmount: amount,
    message:        'Commande créée — paiement en attente de validation',
  }, 'Commande créée avec succès');
});

/**
 * DELETE /payments/intent/:token
 * Invalide une intention (client quitte la page).
 */
export const cancelPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  await paymentVerificationService.invalidateIntent(req.params.token);
  ApiResponse.success(res, null, 'Intention annulée');
});
