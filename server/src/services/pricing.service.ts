/**
 * pricing.service.ts — Couche service pour tous les calculs de prix
 *
 * Source unique de vérité pour :
 *   - Calcul des frais de livraison
 *   - Application des remises coupon
 *   - Totaux commande (sous-total, livraison, remise, total)
 *   - Prix barré et pourcentage de remise
 *   - Formatage monétaire FCFA
 */

import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../utils/constants';
import { ICoupon } from '../models/Coupon.model';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShippingResult {
  cost: number;
  isFree: boolean;
  remaining: number; // montant restant pour la livraison gratuite
}

export interface DiscountResult {
  discount: number;
  label: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'none';
}

export interface OrderPricing {
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  couponCode?: string;
  total: number;
}

export interface CartSummary extends OrderPricing {
  freeShipping: boolean;
  remainingForFreeShipping: number;
  savingsTotal: number; // somme remise coupon + éventuelles livraisons gratuites
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class PricingService {

  // ── Livraison ─────────────────────────────────────────────────────────────

  /**
   * Calcule les frais de livraison selon le sous-total.
   * Livraison gratuite dès FREE_SHIPPING_THRESHOLD FCFA.
   */
  calculateShipping(subtotal: number): ShippingResult {
    const isFree = subtotal >= FREE_SHIPPING_THRESHOLD;
    return {
      cost:      isFree ? 0 : SHIPPING_COST,
      isFree,
      remaining: isFree ? 0 : FREE_SHIPPING_THRESHOLD - subtotal,
    };
  }

  // ── Remises coupon ────────────────────────────────────────────────────────

  /**
   * Calcule la remise appliquée par un coupon sur un sous-total donné.
   * Ne touche pas la base de données — calcul pur.
   *
   * @param coupon     - Document coupon validé (déjà vérifié actif + non expiré)
   * @param subtotal   - Sous-total panier avant remise
   */
  calculateCouponDiscount(coupon: ICoupon, subtotal: number): DiscountResult {
    if (subtotal < coupon.minOrderAmount) {
      return { discount: 0, label: `Min. ${coupon.minOrderAmount} FCFA requis`, type: 'none' };
    }

    let discount = 0;
    let label = '';

    switch (coupon.type) {
      case 'percentage':
        discount = Math.round((subtotal * coupon.value) / 100);
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        label = `−${coupon.value}%`;
        break;

      case 'fixed_amount':
        discount = Math.min(coupon.value, subtotal); // jamais > sous-total
        label = `−${coupon.value} FCFA`;
        break;

      case 'free_shipping':
        // Le discount est appliqué sur les frais de livraison, pas le sous-total
        discount = 0; // géré séparément dans calculateOrderPricing
        label = 'Livraison offerte';
        break;

      default:
        discount = 0;
        label = '';
    }

    return { discount, label, type: coupon.type as DiscountResult['type'] };
  }

  // ── Totaux commande ───────────────────────────────────────────────────────

  /**
   * Calcule l'ensemble des montants d'une commande.
   * Gère le cas coupon free_shipping (annule les frais de livraison).
   *
   * @param subtotal     - Sous-total produits
   * @param discount     - Remise calculée via calculateCouponDiscount
   * @param couponType   - Type du coupon (pour le cas free_shipping)
   * @param couponCode   - Code coupon utilisé (pour sauvegarde)
   */
  calculateOrderPricing(
    subtotal: number,
    discount = 0,
    couponType?: string,
    couponCode?: string,
  ): OrderPricing {
    const shipping = this.calculateShipping(subtotal);

    // Coupon livraison gratuite → shippingCost = 0, le client paie uniquement le sous-total.
    // Le champ discount enregistre l'économie réalisée (pour affichage), mais ne réduit pas le total
    // puisque les frais de port sont déjà annulés via shippingCost = 0.
    const shippingCost    = couponType === 'free_shipping' ? 0 : shipping.cost;
    const displayDiscount = couponType === 'free_shipping' ? shipping.cost : discount;
    const totalReduction  = couponType === 'free_shipping' ? 0 : discount;

    const total = Math.max(0, subtotal + shippingCost - totalReduction);

    return {
      subtotal,
      shippingCost,
      tax:        0, // TVA non applicable en contexte SYSCOHADA sans TVA collecteur
      discount:   displayDiscount,
      couponCode,
      total,
    };
  }

  /**
   * Résumé complet du panier — utile pour le checkout et les API cart.
   *
   * @param subtotal  - Sous-total des articles
   * @param coupon    - Coupon appliqué (null si aucun)
   */
  calculateCartSummary(subtotal: number, coupon?: ICoupon | null): CartSummary {
    const shipping = this.calculateShipping(subtotal);

    let discount = 0;
    let couponCode: string | undefined;
    let couponType: string | undefined;

    if (coupon) {
      const result = this.calculateCouponDiscount(coupon, subtotal);
      discount = result.discount;
      couponCode = coupon.code;
      couponType = coupon.type;
    }

    const pricing = this.calculateOrderPricing(subtotal, discount, couponType, couponCode);

    return {
      ...pricing,
      freeShipping:               pricing.shippingCost === 0,
      remainingForFreeShipping:   shipping.remaining,
      savingsTotal:               pricing.discount,
    };
  }

  // ── Calculs de remise produit ─────────────────────────────────────────────

  /**
   * Calcule le pourcentage de remise entre un prix original et un prix soldé.
   * Retourne 0 si aucune remise applicable.
   */
  getDiscountPercentage(originalPrice: number, salePrice: number): number {
    if (!originalPrice || originalPrice <= salePrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  }

  /**
   * Calcule l'économie réalisée en montant absolu.
   */
  getSavingsAmount(originalPrice: number, salePrice: number, quantity = 1): number {
    return Math.max(0, (originalPrice - salePrice) * quantity);
  }

  /**
   * Détermine le prix effectif d'un produit (tient compte des variantes).
   */
  getEffectivePrice(basePrice: number, variantPriceModifier = 0): number {
    return Math.max(0, basePrice + variantPriceModifier);
  }

  // ── Formatage ─────────────────────────────────────────────────────────────

  /**
   * Formate un montant en FCFA selon le format sénégalais.
   * Exemple : 1500000 → "1 500 000 FCFA"
   */
  formatFCFA(amount: number): string {
    return new Intl.NumberFormat('fr-SN', { style: 'decimal' }).format(amount) + ' FCFA';
  }

  /**
   * Arrondit un montant au multiple de 5 FCFA le plus proche (monnaie courante).
   */
  roundToNearest5(amount: number): number {
    return Math.round(amount / 5) * 5;
  }

  // ── Marges & rentabilité (usage admin) ───────────────────────────────────

  /**
   * Calcule la marge brute d'un produit vendu.
   */
  calculateMargin(salePrice: number, costPrice: number): { amount: number; percentage: number } {
    if (!costPrice) return { amount: 0, percentage: 0 };
    const amount     = salePrice - costPrice;
    const percentage = Math.round((amount / salePrice) * 100);
    return { amount, percentage };
  }

  /**
   * Calcule la valeur du stock d'un produit (quantité × coût d'achat).
   */
  calculateStockValue(quantity: number, costPrice: number): number {
    return quantity * costPrice;
  }

  /**
   * Projette le CA potentiel si tout le stock est vendu.
   */
  calculatePotentialRevenue(quantity: number, salePrice: number): number {
    return quantity * salePrice;
  }
}

export const pricingService = new PricingService();
