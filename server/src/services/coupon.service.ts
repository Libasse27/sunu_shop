/**
 * coupon.service.ts — Gestion des codes promo
 *
 * Centralise :
 *   - Validation complète d'un code promo (actif, non expiré, limites usage)
 *   - Calcul de la remise (%, montant fixe, livraison gratuite)
 *   - Enregistrement de l'usage après commande
 *   - Statistiques d'utilisation
 */

import mongoose from 'mongoose';
import Coupon, { ICoupon } from '../models/Coupon.model';
import { ApiError } from '../utils/ApiError';
import { pricingService } from './pricing.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CouponValidationResult {
  valid: boolean;
  coupon: ICoupon | null;
  discount: number;
  label: string;
  reason?: string; // motif si invalide
}

export interface CouponStats {
  code:         string;
  totalUsage:   number;
  maxUsage:     number | null;
  remainingUsage: number | null;
  totalRevenue: number;
  avgOrderValue: number;
  usageRate:    number; // %
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class CouponService {

  // ── Validation ────────────────────────────────────────────────────────────

  /**
   * Valide un code promo pour un utilisateur et un sous-total donnés.
   * Vérifie dans l'ordre :
   *   1. Existence + isActive
   *   2. Dates de validité
   *   3. Limite globale d'usage
   *   4. Limite par utilisateur
   *   5. Montant minimum de commande
   *
   * @param code       - Code coupon saisi (insensible à la casse)
   * @param userId     - ID de l'utilisateur
   * @param orderTotal - Sous-total sur lequel appliquer la remise
   */
  async validateCoupon(
    code: string,
    userId: string,
    orderTotal: number,
  ): Promise<CouponValidationResult> {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon)          return this._invalid(null, 'Code promo invalide ou inexistant');
    if (!coupon.isActive) return this._invalid(coupon, 'Code promo désactivé');

    const now = new Date();
    if (now < coupon.startDate) return this._invalid(coupon, 'Ce code promo n\'est pas encore actif');
    if (now > coupon.endDate)   return this._invalid(coupon, 'Code promo expiré');

    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
      return this._invalid(coupon, 'Ce code promo a atteint sa limite d\'utilisation');
    }

    const userUsages = coupon.usedBy.filter(u => u.user.toString() === userId).length;
    if (userUsages >= coupon.maxUsagePerUser) {
      return this._invalid(coupon, 'Vous avez déjà utilisé ce code promo');
    }

    if (orderTotal < coupon.minOrderAmount) {
      return this._invalid(
        coupon,
        `Montant minimum requis : ${pricingService.formatFCFA(coupon.minOrderAmount)}`,
      );
    }

    const { discount, label } = pricingService.calculateCouponDiscount(coupon, orderTotal);

    return { valid: true, coupon, discount, label };
  }

  /**
   * Valide un code promo et lève une ApiError si invalide.
   * Utilisé quand on veut une exception plutôt qu'un résultat booléen.
   */
  async validateOrThrow(code: string, userId: string, orderTotal: number): Promise<ICoupon> {
    const result = await this.validateCoupon(code, userId, orderTotal);
    if (!result.valid || !result.coupon) {
      throw ApiError.badRequest(result.reason ?? 'Code promo invalide');
    }
    return result.coupon;
  }

  // ── Usage ─────────────────────────────────────────────────────────────────

  /**
   * Enregistre l'utilisation d'un coupon après une commande réussie.
   * Incrémente usedCount et ajoute l'utilisateur à usedBy.
   *
   * @param coupon  - Document coupon (pour éviter une deuxième requête)
   * @param userId  - ID de l'utilisateur
   */
  async recordUsage(coupon: ICoupon, userId: string): Promise<void> {
    coupon.usedCount = (coupon.usedCount ?? 0) + 1;
    coupon.usedBy.push({ user: new mongoose.Types.ObjectId(userId), date: new Date() });
    await coupon.save();
  }

  /**
   * Annule l'usage d'un coupon (lors d'une annulation de commande).
   * Décrémente usedCount et retire la dernière occurrence de l'utilisateur.
   */
  async revokeUsage(couponCode: string, userId: string): Promise<void> {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) return;

    // Retirer la dernière occurrence de cet utilisateur
    const idx = [...coupon.usedBy].reverse().findIndex(u => u.user.toString() === userId);
    if (idx !== -1) {
      coupon.usedBy.splice(coupon.usedBy.length - 1 - idx, 1);
    }
    coupon.usedCount = Math.max(0, (coupon.usedCount ?? 1) - 1);
    await coupon.save();
  }

  // ── Statistiques ─────────────────────────────────────────────────────────

  /**
   * Statistiques d'utilisation d'un coupon spécifique.
   */
  async getCouponStats(couponId: string): Promise<CouponStats> {
    const coupon = await Coupon.findById(couponId).lean();
    if (!coupon) throw ApiError.notFound('Coupon non trouvé');

    // Calcul du CA généré via ce coupon
    const Order = (await import('../models/Order.model')).default;
    const ordersWithCoupon = await Order.aggregate([
      { $match: { 'pricing.couponCode': coupon.code, 'payment.status': 'completed' } },
      {
        $group: {
          _id:            null,
          totalRevenue:   { $sum: '$pricing.total' },
          count:          { $sum: 1 },
          avgOrderValue:  { $avg: '$pricing.total' },
        },
      },
    ]);

    const stats = ordersWithCoupon[0];
    const usageRate = coupon.maxUsage
      ? Math.round((coupon.usedCount / coupon.maxUsage) * 100)
      : 0;

    return {
      code:           coupon.code,
      totalUsage:     coupon.usedCount,
      maxUsage:       coupon.maxUsage ?? null,
      remainingUsage: coupon.maxUsage ? coupon.maxUsage - coupon.usedCount : null,
      totalRevenue:   stats?.totalRevenue ?? 0,
      avgOrderValue:  Math.round(stats?.avgOrderValue ?? 0),
      usageRate,
    };
  }

  /**
   * Résumé global de tous les coupons actifs.
   */
  async getAllCouponsStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    totalUsage: number;
  }> {
    const now = new Date();
    const [total, active, expired, usageAgg] = await Promise.all([
      Coupon.countDocuments(),
      Coupon.countDocuments({ isActive: true, endDate: { $gte: now } }),
      Coupon.countDocuments({ $or: [{ isActive: false }, { endDate: { $lt: now } }] }),
      Coupon.aggregate([{ $group: { _id: null, totalUsage: { $sum: '$usedCount' } } }]),
    ]);

    return { total, active, expired, totalUsage: usageAgg[0]?.totalUsage ?? 0 };
  }

  // ── Helpers privés ────────────────────────────────────────────────────────

  private _invalid(coupon: ICoupon | null, reason: string): CouponValidationResult {
    return { valid: false, coupon, discount: 0, label: '', reason };
  }
}

export const couponService = new CouponService();
