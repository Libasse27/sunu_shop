import { PricingService } from '../../services/pricing.service';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../../utils/constants';

const pricing = new PricingService();

// ─── Coupon mock minimal ──────────────────────────────────────────────────────
const makeCoupon = (overrides: Record<string, unknown> = {}) => ({
  code:           'TEST10',
  type:           'percentage' as const,
  value:          10,
  minOrderAmount: 0,
  maxDiscount:    undefined,
  ...overrides,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

// ─── calculateShipping ────────────────────────────────────────────────────────

describe('PricingService.calculateShipping', () => {
  it('applique les frais standard sous le seuil', () => {
    const r = pricing.calculateShipping(10_000);
    expect(r.isFree).toBe(false);
    expect(r.cost).toBe(SHIPPING_COST);
    expect(r.remaining).toBe(FREE_SHIPPING_THRESHOLD - 10_000);
  });

  it('livraison gratuite exactement au seuil', () => {
    const r = pricing.calculateShipping(FREE_SHIPPING_THRESHOLD);
    expect(r.isFree).toBe(true);
    expect(r.cost).toBe(0);
    expect(r.remaining).toBe(0);
  });

  it('livraison gratuite au-dessus du seuil', () => {
    const r = pricing.calculateShipping(100_000);
    expect(r.isFree).toBe(true);
    expect(r.cost).toBe(0);
  });
});

// ─── calculateCouponDiscount ──────────────────────────────────────────────────

describe('PricingService.calculateCouponDiscount', () => {
  it('applique un coupon pourcentage', () => {
    const r = pricing.calculateCouponDiscount(makeCoupon({ type: 'percentage', value: 10 }), 50_000);
    expect(r.discount).toBe(5_000);
    expect(r.type).toBe('percentage');
  });

  it('plafonne le coupon pourcentage à maxDiscount', () => {
    const r = pricing.calculateCouponDiscount(
      makeCoupon({ type: 'percentage', value: 50, maxDiscount: 10_000 }),
      100_000,
    );
    expect(r.discount).toBe(10_000);
  });

  it('applique un coupon montant fixe', () => {
    const r = pricing.calculateCouponDiscount(makeCoupon({ type: 'fixed_amount', value: 5_000 }), 30_000);
    expect(r.discount).toBe(5_000);
  });

  it('coupon montant fixe ne dépasse pas le sous-total', () => {
    const r = pricing.calculateCouponDiscount(makeCoupon({ type: 'fixed_amount', value: 50_000 }), 10_000);
    expect(r.discount).toBe(10_000);
  });

  it('coupon free_shipping retourne discount 0 (géré dans calculateOrderPricing)', () => {
    const r = pricing.calculateCouponDiscount(makeCoupon({ type: 'free_shipping', value: 0 }), 15_000);
    expect(r.discount).toBe(0);
    expect(r.type).toBe('free_shipping');
  });

  it('refuse si sous-total < minOrderAmount', () => {
    const r = pricing.calculateCouponDiscount(makeCoupon({ minOrderAmount: 20_000 }), 10_000);
    expect(r.discount).toBe(0);
    expect(r.type).toBe('none');
  });
});

// ─── calculateOrderPricing ────────────────────────────────────────────────────

describe('PricingService.calculateOrderPricing', () => {
  it('calcule le total sans coupon (sous seuil livraison)', () => {
    const r = pricing.calculateOrderPricing(10_000);
    expect(r.subtotal).toBe(10_000);
    expect(r.shippingCost).toBe(SHIPPING_COST);
    expect(r.discount).toBe(0);
    expect(r.total).toBe(10_000 + SHIPPING_COST);
  });

  it('calcule le total sans coupon (livraison gratuite)', () => {
    const r = pricing.calculateOrderPricing(30_000);
    expect(r.shippingCost).toBe(0);
    expect(r.total).toBe(30_000);
  });

  it('applique une remise coupon sur le total', () => {
    const r = pricing.calculateOrderPricing(30_000, 3_000, 'percentage', 'PROMO');
    expect(r.discount).toBe(3_000);
    expect(r.total).toBe(27_000);
    expect(r.couponCode).toBe('PROMO');
  });

  it('coupon free_shipping annule les frais de port', () => {
    const r = pricing.calculateOrderPricing(10_000, 0, 'free_shipping');
    expect(r.shippingCost).toBe(0);
    expect(r.discount).toBe(SHIPPING_COST);
    expect(r.total).toBe(10_000);
  });

  it('total ne peut pas être négatif', () => {
    const r = pricing.calculateOrderPricing(5_000, 99_999);
    expect(r.total).toBe(0);
  });
});

// ─── Helpers produit ─────────────────────────────────────────────────────────

describe('PricingService helpers produit', () => {
  it('getDiscountPercentage calcule correctement', () => {
    expect(pricing.getDiscountPercentage(100_000, 75_000)).toBe(25);
  });

  it('getDiscountPercentage retourne 0 si pas de remise', () => {
    expect(pricing.getDiscountPercentage(50_000, 60_000)).toBe(0);
    expect(pricing.getDiscountPercentage(0, 50_000)).toBe(0);
  });

  it('getSavingsAmount calcule l\'économie totale', () => {
    expect(pricing.getSavingsAmount(10_000, 8_000, 3)).toBe(6_000);
  });

  it('getEffectivePrice applique le modificateur de variante', () => {
    expect(pricing.getEffectivePrice(50_000, 5_000)).toBe(55_000);
    expect(pricing.getEffectivePrice(50_000, -5_000)).toBe(45_000);
  });
});

// ─── Marges ───────────────────────────────────────────────────────────────────

describe('PricingService.calculateMargin', () => {
  it('calcule la marge correctement', () => {
    const r = pricing.calculateMargin(100_000, 60_000);
    expect(r.amount).toBe(40_000);
    expect(r.percentage).toBe(40);
  });

  it('retourne zéro si pas de costPrice', () => {
    const r = pricing.calculateMargin(100_000, 0);
    expect(r.amount).toBe(0);
    expect(r.percentage).toBe(0);
  });
});
