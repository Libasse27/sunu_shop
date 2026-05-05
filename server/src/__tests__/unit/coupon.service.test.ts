import Coupon from '../../models/Coupon.model';
import { couponService } from '../../services/coupon.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_A = '507f1f77bcf86cd799439011';
const USER_B = '507f1f77bcf86cd799439012';

const makeCoupon = async (overrides: Record<string, unknown> = {}) => {
  const now = new Date();
  return Coupon.create({
    code:           `PROMO-${Date.now()}`,
    type:           'percentage',
    value:          10,
    minOrderAmount: 0,
    maxUsagePerUser: 1,
    usedCount:      0,
    usedBy:         [],
    startDate:      new Date(now.getTime() - 1000),
    endDate:        new Date(now.getTime() + 86_400_000), // demain
    isActive:       true,
    ...overrides,
  });
};

// ─── validateCoupon ───────────────────────────────────────────────────────────

describe('CouponService.validateCoupon', () => {
  it('retourne valid=true avec la remise correcte pour un coupon valide', async () => {
    const c = await makeCoupon({ type: 'percentage', value: 20 });
    const result = await couponService.validateCoupon(c.code, USER_A, 100_000);

    expect(result.valid).toBe(true);
    expect(result.discount).toBe(20_000);
    expect(result.coupon?.code).toBe(c.code);
  });

  it('rejette un code inexistant', async () => {
    const result = await couponService.validateCoupon('INEXISTANT', USER_A, 50_000);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/invalide|inexistant/i);
  });

  it('rejette un coupon inactif', async () => {
    const c = await makeCoupon({ isActive: false });
    const result = await couponService.validateCoupon(c.code, USER_A, 50_000);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/désactivé/i);
  });

  it('rejette un coupon expiré', async () => {
    const c = await makeCoupon({
      startDate: new Date('2020-01-01'),
      endDate:   new Date('2020-06-01'), // passé
    });
    const result = await couponService.validateCoupon(c.code, USER_A, 50_000);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/expiré/i);
  });

  it('rejette quand la limite globale d\'usage est atteinte', async () => {
    const c = await makeCoupon({ maxUsage: 5, usedCount: 5 });
    const result = await couponService.validateCoupon(c.code, USER_A, 50_000);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/limite/i);
  });

  it('rejette quand l\'utilisateur a déjà utilisé le coupon (maxUsagePerUser=1)', async () => {
    const c = await makeCoupon({
      maxUsagePerUser: 1,
      usedBy: [{ user: USER_A, date: new Date() }],
    });
    const result = await couponService.validateCoupon(c.code, USER_A, 50_000);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/déjà utilisé/i);
  });

  it('accepte le même coupon pour un autre utilisateur', async () => {
    const c = await makeCoupon({
      maxUsagePerUser: 1,
      usedBy: [{ user: USER_A, date: new Date() }],
    });
    const result = await couponService.validateCoupon(c.code, USER_B, 50_000);
    expect(result.valid).toBe(true);
  });

  it('rejette si le sous-total est inférieur au montant minimum', async () => {
    const c = await makeCoupon({ minOrderAmount: 50_000 });
    const result = await couponService.validateCoupon(c.code, USER_A, 20_000);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/minimum/i);
  });

  it('est insensible à la casse du code', async () => {
    const _c = await makeCoupon({ code: 'UPPER10' });
    const result = await couponService.validateCoupon('upper10', USER_A, 50_000);
    expect(result.valid).toBe(true);
  });
});

// ─── recordUsage ──────────────────────────────────────────────────────────────

describe('CouponService.recordUsage', () => {
  it('incrémente usedCount et ajoute l\'utilisateur à usedBy', async () => {
    const c = await makeCoupon({ usedCount: 0, usedBy: [] });

    await couponService.recordUsage(c, USER_A);

    const updated = await Coupon.findById(c._id);
    expect(updated?.usedCount).toBe(1);
    expect(updated?.usedBy).toHaveLength(1);
    expect(updated?.usedBy[0].user.toString()).toBe(USER_A);
  });

  it('empêche la réutilisation après recordUsage (maxUsagePerUser=1)', async () => {
    const c = await makeCoupon({ maxUsagePerUser: 1, usedCount: 0, usedBy: [] });
    await couponService.recordUsage(c, USER_A);

    const result = await couponService.validateCoupon(c.code, USER_A, 50_000);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/déjà utilisé/i);
  });
});

// ─── revokeUsage ──────────────────────────────────────────────────────────────

describe('CouponService.revokeUsage', () => {
  it('décrémente usedCount et retire la dernière occurrence de l\'utilisateur', async () => {
    const c = await makeCoupon({
      usedCount: 2,
      usedBy: [
        { user: USER_A, date: new Date() },
        { user: USER_B, date: new Date() },
      ],
    });

    await couponService.revokeUsage(c.code, USER_A);

    const updated = await Coupon.findById(c._id);
    expect(updated?.usedCount).toBe(1);
    expect(updated?.usedBy).toHaveLength(1);
    expect(updated?.usedBy[0].user.toString()).toBe(USER_B);
  });

  it('ne plante pas si le coupon n\'existe pas', async () => {
    await expect(
      couponService.revokeUsage('INEXISTANT', USER_A),
    ).resolves.not.toThrow();
  });

  it('ne descend pas sous zéro (usedCount plancher à 0)', async () => {
    const c = await makeCoupon({ usedCount: 0, usedBy: [] });
    await couponService.revokeUsage(c.code, USER_A);
    const updated = await Coupon.findById(c._id);
    expect(updated?.usedCount).toBe(0);
  });
});

// ─── validateOrThrow ──────────────────────────────────────────────────────────

describe('CouponService.validateOrThrow', () => {
  it('retourne le coupon si valide', async () => {
    const c = await makeCoupon();
    const result = await couponService.validateOrThrow(c.code, USER_A, 50_000);
    expect(result.code).toBe(c.code);
  });

  it('lève ApiError.badRequest si invalide', async () => {
    await expect(
      couponService.validateOrThrow('INVALIDE', USER_A, 50_000),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
