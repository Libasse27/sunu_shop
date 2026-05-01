/**
 * payment-verification.service.ts
 *
 * Garantit que le montant affiché au client provient exclusivement du serveur
 * et ne peut pas être manipulé côté frontend.
 *
 * ─── Algorithme ───────────────────────────────────────────────────────────────
 *
 *  1. CRÉATION D'INTENTION
 *     POST /payments/intent
 *     - Reçoit les items du panier + code coupon éventuel
 *     - Récupère les prix produits depuis la DB (source fiable)
 *     - Calcule le total exact via pricingService
 *     - Génère un token unique (crypto.randomUUID)
 *     - Signe l'intention : HMAC-SHA256(token|amount|userId|ts, JWT_SECRET)
 *     - Stocke en Redis avec TTL 30 min : { amount, signature, userId, status }
 *     - Retourne { token, amount, breakdown, expiresAt } au client
 *
 *  2. VÉRIFICATION D'INTENTION
 *     Avant de créer la commande, le serveur :
 *     a) Récupère l'intention depuis Redis (erreur 400 si absente/expirée)
 *     b) Vérifie la signature HMAC (erreur 400 si falsifiée)
 *     c) Vérifie que userId correspond (erreur 403 si différent)
 *     d) Vérifie que le statut est 'pending' (erreur 409 si déjà utilisée)
 *     e) Compare le montant client (affiché) vs serveur stocké :
 *        → si |clientAmount - serverAmount| > 0 : BLOQUÉ
 *
 *  3. CONSOMMATION (anti double-dépense)
 *     Après validation, le statut passe à 'used'.
 *     Toute nouvelle tentative avec le même token est rejetée (409 Conflict).
 *
 * ─── Sécurité ─────────────────────────────────────────────────────────────────
 *  - Token aléatoire 128 bits (crypto.randomUUID) → non prédictible
 *  - Signature HMAC-SHA256 → toute modification invalide le token
 *  - TTL Redis 30 min → les intentions expirées sont automatiquement supprimées
 *  - userId lié au token → empêche l'utilisation par un autre utilisateur
 *  - Status 'used' persisté → empêche le double-paiement
 */

import crypto from 'crypto';
import redis from '../config/redis';
import Product from '../models/Product.model';
import { pricingService } from './pricing.service';
import { couponService } from './coupon.service';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

// ─── Constantes ───────────────────────────────────────────────────────────────

const INTENT_TTL_SECONDS = 30 * 60;              // 30 minutes
const INTENT_PREFIX      = 'payment:intent:';    // clé Redis
const HMAC_ALGO          = 'sha256';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  quantity:  number;
  variant?:  { name: string; value: string };
}

export interface AmountBreakdown {
  subtotal:      number;
  shippingCost:  number;
  discount:      number;
  couponCode?:   string;
  total:         number;
  isFreeShipping: boolean;
  savingsTotal:  number;
}

export interface PaymentIntentResult {
  token:      string;
  amount:     number;           // montant exact à envoyer (FCFA)
  breakdown:  AmountBreakdown;
  expiresAt:  Date;
  method?:    string;
}

export interface VerifyResult {
  valid:        boolean;
  serverAmount: number;
  breakdown?:   AmountBreakdown;
  reason?:      string;
}

// Données stockées en Redis (jamais exposées au client en clair)
interface StoredIntent {
  userId:    string;
  amount:    number;
  breakdown: AmountBreakdown;
  signature: string;
  status:    'pending' | 'used' | 'expired';
  createdAt: number; // timestamp ms
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class PaymentVerificationService {

  // ── 1. Création d'intention ────────────────────────────────────────────────

  /**
   * Calcule le montant exact depuis la DB et crée une intention de paiement signée.
   *
   * Le client NE PEUT PAS influencer le montant calculé :
   * les prix proviennent de Product.findById(), pas du corps de la requête.
   *
   * @param userId      - ID de l'utilisateur connecté
   * @param items       - Produits du panier (ID + quantité uniquement)
   * @param couponCode  - Code promo optionnel
   * @returns           - Token + montant server-side + détail des calculs
   */
  async createIntent(
    userId:      string,
    items:       CartItem[],
    couponCode?: string,
  ): Promise<PaymentIntentResult> {
    if (!items?.length) throw ApiError.badRequest('Le panier est vide');

    // ── Étape A : Récupération des prix depuis la DB ─────────────────────────
    let subtotal = 0;
    for (const item of items) {
      if (item.quantity < 1) throw ApiError.badRequest('Quantité invalide');

      const product = await Product.findById(item.productId)
        .select('price stock isActive name')
        .lean();

      if (!product)          throw ApiError.notFound(`Produit introuvable : ${item.productId}`);
      if (!product.isActive) throw ApiError.badRequest(`Produit inactif : ${product.name}`);
      if (product.stock < item.quantity) {
        throw ApiError.badRequest(`Stock insuffisant pour "${product.name}" (disponible: ${product.stock})`);
      }

      subtotal += product.price * item.quantity;
    }

    // ── Étape B : Application du coupon ─────────────────────────────────────
    let discount     = 0;
    let appliedCode: string | undefined;
    let couponType:  string | undefined;

    if (couponCode) {
      const result = await couponService.validateCoupon(couponCode, userId, subtotal);
      if (result.valid && result.coupon) {
        discount    = result.discount;
        appliedCode = result.coupon.code;
        couponType  = result.coupon.type;
      }
    }

    // ── Étape C : Calcul des totaux via pricingService ───────────────────────
    const pricing  = pricingService.calculateOrderPricing(subtotal, discount, couponType, appliedCode);
    const shipping = pricingService.calculateShipping(subtotal);

    const breakdown: AmountBreakdown = {
      subtotal:       pricing.subtotal,
      shippingCost:   pricing.shippingCost,
      discount:       pricing.discount,
      couponCode:     pricing.couponCode,
      total:          pricing.total,
      isFreeShipping: shipping.isFree,
      savingsTotal:   pricing.discount + (shipping.isFree ? 0 : 0),
    };

    // ── Étape D : Génération du token et signature HMAC ──────────────────────
    const token     = crypto.randomUUID();
    const createdAt = Date.now();
    const signature = this._sign(token, pricing.total, userId, createdAt);

    const stored: StoredIntent = {
      userId,
      amount:    pricing.total,
      breakdown,
      signature,
      status:    'pending',
      createdAt,
    };

    // ── Étape E : Persistance Redis avec TTL ─────────────────────────────────
    await this._setIntent(token, stored);

    const expiresAt = new Date(createdAt + INTENT_TTL_SECONDS * 1000);

    logger.info('Payment intent créé', {
      token:  token.slice(0, 8) + '…',
      userId,
      amount: pricing.total,
    });

    return { token, amount: pricing.total, breakdown, expiresAt };
  }

  // ── 2. Vérification ───────────────────────────────────────────────────────

  /**
   * Vérifie qu'un token d'intention est valide avant de créer la commande.
   *
   * Vérifie dans l'ordre :
   *   1. Existence en Redis (expiré si absent)
   *   2. Signature HMAC (falsifié si invalide)
   *   3. Propriétaire (userId)
   *   4. Statut 'pending' (anti double-dépense)
   *   5. Correspondance du montant client vs serveur
   *
   * @param token        - Token reçu du client
   * @param userId       - ID de l'utilisateur qui confirme
   * @param clientAmount - Montant affiché côté client (pour comparaison)
   */
  async verifyIntent(
    token:         string,
    userId:        string,
    clientAmount?: number,
  ): Promise<VerifyResult> {
    // 1. Récupération Redis
    const stored = await this._getIntent(token);
    if (!stored) {
      return { valid: false, serverAmount: 0, reason: 'Intention de paiement expirée ou introuvable' };
    }

    // 2. Anti double-dépense (early exit — évite le calcul HMAC inutile)
    if (stored.status !== 'pending') {
      return {
        valid:        false,
        serverAmount: stored.amount,
        reason: stored.status === 'used'
          ? 'Cette intention de paiement a déjà été utilisée'
          : 'Intention de paiement expirée',
      };
    }

    // 3. Vérification signature HMAC
    const expectedSig = this._sign(token, stored.amount, stored.userId, stored.createdAt);
    const storedBuf   = Buffer.from(stored.signature);
    const expectedBuf = Buffer.from(expectedSig);
    const sigValid = storedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(storedBuf, expectedBuf);
    if (!sigValid) {
      logger.warn('Payment intent : signature invalide', { token: token.slice(0, 8) });
      return { valid: false, serverAmount: 0, reason: 'Signature invalide — intention corrompue' };
    }

    // 4. Vérification propriétaire
    if (stored.userId !== userId) {
      logger.warn('Payment intent : tentative d\'utilisation par un autre utilisateur', {
        intendedFor: stored.userId.slice(-4),
        attemptBy:   userId.slice(-4),
      });
      return { valid: false, serverAmount: 0, reason: 'Intention de paiement non autorisée' };
    }

    // 5. Correspondance montant client vs serveur ← ALGORITHME CENTRAL
    if (clientAmount !== undefined) {
      const diff = Math.abs(clientAmount - stored.amount);
      if (diff > 0) {
        logger.warn('Payment intent : montant manipulé détecté', {
          serverAmount: stored.amount,
          clientAmount,
          difference:   diff,
          userId:       userId.slice(-4),
        });
        return {
          valid:        false,
          serverAmount: stored.amount,
          reason:       `Montant incorrect. Montant attendu : ${stored.amount} FCFA, reçu : ${clientAmount} FCFA`,
        };
      }
    }

    return { valid: true, serverAmount: stored.amount, breakdown: stored.breakdown };
  }

  // ── 3. Consommation (anti double-dépense) ─────────────────────────────────

  /**
   * Marque l'intention comme utilisée et retourne les données pour la commande.
   * Lève une ApiError si l'intention est invalide.
   *
   * Cette méthode est appelée juste avant `orderService.createOrder()`.
   * Elle garantit que le montant utilisé pour créer la commande est le montant
   * calculé par le serveur, jamais le montant envoyé par le client.
   *
   * @param token  - Token du client
   * @param userId - ID de l'utilisateur
   * @returns      - Montant vérifié et breakdown
   */
  async consumeIntent(
    token:  string,
    userId: string,
  ): Promise<{ amount: number; breakdown: AmountBreakdown }> {
    const result = await this.verifyIntent(token, userId);

    if (!result.valid) {
      throw ApiError.badRequest(result.reason ?? 'Intention de paiement invalide');
    }

    // Marquer comme utilisée (empêche le double-paiement)
    const stored = await this._getIntent(token);
    if (stored) {
      stored.status = 'used';
      // Conserver encore 5 min pour les logs (TTL court)
      await redis.setex(INTENT_PREFIX + token, 300, JSON.stringify(stored));
    }

    logger.info('Payment intent consommé', {
      token:  token.slice(0, 8) + '…',
      userId,
      amount: result.serverAmount,
    });

    return { amount: result.serverAmount, breakdown: result.breakdown! };
  }

  // ── 4. Invalidation manuelle ──────────────────────────────────────────────

  /**
   * Invalide une intention (ex: client quitte la page checkout).
   * Non bloquant — si Redis est indisponible, l'intention expira naturellement.
   */
  async invalidateIntent(token: string): Promise<void> {
    try {
      await redis.del(INTENT_PREFIX + token);
    } catch {
      // Non bloquant
    }
  }

  // ── 5. Interrogation du montant ───────────────────────────────────────────

  /**
   * Retourne le montant serveur associé à un token (pour affichage sécurisé).
   * N'expose que les champs nécessaires à l'affichage.
   */
  async getIntentAmount(
    token: string,
    userId: string,
  ): Promise<{ amount: number; breakdown: AmountBreakdown; expiresAt: Date } | null> {
    const stored = await this._getIntent(token);
    if (!stored || stored.userId !== userId || stored.status !== 'pending') return null;

    const ttl = await redis.ttl(INTENT_PREFIX + token);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    return { amount: stored.amount, breakdown: stored.breakdown, expiresAt };
  }

  // ── Helpers privés ────────────────────────────────────────────────────────

  /**
   * Génère une signature HMAC-SHA256 pour un token de paiement.
   * La signature lie le token, le montant, l'utilisateur et le timestamp.
   * Toute modification de l'un de ces 4 champs invalide la signature.
   */
  private _sign(token: string, amount: number, userId: string, createdAt: number): string {
    const payload = `${token}|${amount}|${userId}|${createdAt}`;
    return crypto
      .createHmac(HMAC_ALGO, env.JWT_ACCESS_SECRET)
      .update(payload)
      .digest('hex');
  }

  private async _setIntent(token: string, data: StoredIntent): Promise<void> {
    try {
      await redis.setex(INTENT_PREFIX + token, INTENT_TTL_SECONDS, JSON.stringify(data));
    } catch (err) {
      logger.error('Redis : impossible de stocker l\'intention', { error: (err as Error).message });
      throw ApiError.internal('Service de paiement temporairement indisponible');
    }
  }

  private async _getIntent(token: string): Promise<StoredIntent | null> {
    try {
      const raw = await redis.get(INTENT_PREFIX + token);
      return raw ? (JSON.parse(raw) as StoredIntent) : null;
    } catch {
      return null;
    }
  }
}

export const paymentVerificationService = new PaymentVerificationService();
