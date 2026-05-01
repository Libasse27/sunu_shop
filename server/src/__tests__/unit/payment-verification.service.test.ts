import redis from '../../config/redis';
import { PaymentVerificationService } from '../../services/payment-verification.service';
import Product from '../../models/Product.model';
import Category from '../../models/Category.model';

const svc = new PaymentVerificationService();

const INTENT_PREFIX = 'payment:intent:';
const USER_A = '507f1f77bcf86cd799439011';
const USER_B = '507f1f77bcf86cd799439012';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeProduct = async (overrides: Record<string, unknown> = {}) => {
  const cat = await Category.create({
    name:     `Cat-${Date.now()}`,
    slug:     `cat-${Date.now()}`,
    isActive: true,
  });
  return Product.create({
    name:        `Prod-${Date.now()}`,
    slug:        `prod-${Date.now()}`,
    sku:         `SKU-${Date.now()}`,
    description: 'Produit de test',
    price:       50_000,
    currency:    'XOF',
    stock:       10,
    category:    cat._id,
    images:      [{ url: 'https://example.com/img.jpg', isPrimary: true, order: 0 }],
    isActive:    true,
    ...overrides,
  });
};

/**
 * Crée un intent en capturant la payload Redis stockée via setex.
 * Retourne mockGet() — à appeler pour injecter ces données dans redis.get
 * avant chaque appel à verifyIntent/consumeIntent/getIntentAmount.
 */
async function createAndCapture(
  userId:    string,
  productId: string,
  qty = 1,
): Promise<{ token: string; amount: number; mockGet: () => void; rawStored: string }> {
  let rawStored = '';

  (redis.setex as jest.Mock).mockImplementationOnce(
    async (_key: string, _ttl: number, value: string) => {
      rawStored = value;
      return 'OK';
    },
  );

  const result = await svc.createIntent(userId, [{ productId, quantity: qty }]);

  return {
    token:     result.token,
    amount:    result.amount,
    rawStored,
    mockGet:   () => (redis.get as jest.Mock).mockResolvedValueOnce(rawStored),
  };
}

// ─── createIntent ─────────────────────────────────────────────────────────────

describe('PaymentVerificationService.createIntent', () => {
  it('lève 400 si le panier est vide', async () => {
    await expect(svc.createIntent(USER_A, [])).rejects.toMatchObject({ statusCode: 400 });
  });

  it('lève 400 si quantity < 1', async () => {
    const p = await makeProduct();
    await expect(
      svc.createIntent(USER_A, [{ productId: p._id.toString(), quantity: 0 }]),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('lève 404 si le produit est inexistant', async () => {
    await expect(
      svc.createIntent(USER_A, [{ productId: '507f1f77bcf86cd799439099', quantity: 1 }]),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('lève 400 si le produit est inactif', async () => {
    const p = await makeProduct({ isActive: false });
    await expect(
      svc.createIntent(USER_A, [{ productId: p._id.toString(), quantity: 1 }]),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('lève 400 si stock insuffisant', async () => {
    const p = await makeProduct({ stock: 2 });
    await expect(
      svc.createIntent(USER_A, [{ productId: p._id.toString(), quantity: 5 }]),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('retourne un token UUID + montant exact + breakdown complet', async () => {
    const p = await makeProduct({ price: 50_000, stock: 5 });

    let rawStored = '';
    (redis.setex as jest.Mock).mockImplementationOnce(
      async (_k: string, _t: number, v: string) => { rawStored = v; return 'OK'; },
    );

    const r = await svc.createIntent(USER_A, [{ productId: p._id.toString(), quantity: 2 }]);

    expect(r.token).toMatch(/^[\da-f-]{36}$/);   // UUID v4
    expect(r.amount).toBe(100_000);               // 50k × 2
    expect(r.breakdown.subtotal).toBe(100_000);
    expect(r.expiresAt).toBeInstanceOf(Date);
    expect(r.expiresAt.getTime()).toBeGreaterThan(Date.now());

    // Persistance Redis : TTL = 1800 s (30 min)
    expect(redis.setex).toHaveBeenCalledWith(
      expect.stringContaining(INTENT_PREFIX),
      1800,
      expect.any(String),
    );

    const stored = JSON.parse(rawStored);
    expect(stored.status).toBe('pending');
    expect(stored.signature).toBeDefined();
    expect(stored.userId).toBe(USER_A);
  });

  it('livraison gratuite quand subtotal ≥ 25 000 FCFA', async () => {
    const p = await makeProduct({ price: 30_000, stock: 5 });
    (redis.setex as jest.Mock).mockResolvedValueOnce('OK');

    const r = await svc.createIntent(USER_A, [{ productId: p._id.toString(), quantity: 1 }]);

    expect(r.breakdown.isFreeShipping).toBe(true);
    expect(r.breakdown.shippingCost).toBe(0);
  });

  it('ajoute les frais de livraison quand subtotal < 25 000 FCFA', async () => {
    const p = await makeProduct({ price: 10_000, stock: 5 });
    (redis.setex as jest.Mock).mockResolvedValueOnce('OK');

    const r = await svc.createIntent(USER_A, [{ productId: p._id.toString(), quantity: 1 }]);

    expect(r.breakdown.shippingCost).toBeGreaterThan(0);
    expect(r.amount).toBe(r.breakdown.subtotal + r.breakdown.shippingCost);
  });

  it('calcule le montant en multipliant price × quantity pour chaque item', async () => {
    const p = await makeProduct({ price: 25_000, stock: 10 });
    (redis.setex as jest.Mock).mockResolvedValueOnce('OK');

    const r = await svc.createIntent(USER_A, [{ productId: p._id.toString(), quantity: 4 }]);

    expect(r.breakdown.subtotal).toBe(100_000); // 25k × 4
  });
});

// ─── verifyIntent ─────────────────────────────────────────────────────────────

describe('PaymentVerificationService.verifyIntent', () => {
  it('valid=false si token absent de Redis (expiré ou inexistant)', async () => {
    (redis.get as jest.Mock).mockResolvedValueOnce(null);

    const r = await svc.verifyIntent('ghost-token', USER_A);

    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/expir|introuvable/i);
    expect(r.serverAmount).toBe(0);
  });

  it('valid=true pour un intent valide — happy path complet', async () => {
    const p = await makeProduct({ price: 50_000, stock: 5 });
    const { token, amount, mockGet } = await createAndCapture(USER_A, p._id.toString());
    mockGet();

    const r = await svc.verifyIntent(token, USER_A, amount);

    expect(r.valid).toBe(true);
    expect(r.serverAmount).toBe(amount);
    expect(r.breakdown).toBeDefined();
    expect(r.breakdown!.total).toBe(amount);
  });

  it('valid=false si userId différent → accès non autorisé', async () => {
    const p = await makeProduct({ price: 50_000, stock: 5 });
    const { token, amount, mockGet } = await createAndCapture(USER_A, p._id.toString());
    mockGet();

    const r = await svc.verifyIntent(token, USER_B, amount);

    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/autoris/i);
    expect(r.serverAmount).toBe(0);
  });

  it('valid=false si montant client manipulé (clientAmount < serverAmount)', async () => {
    const p = await makeProduct({ price: 50_000, stock: 5 });
    const { token, amount, mockGet } = await createAndCapture(USER_A, p._id.toString());
    mockGet();

    const r = await svc.verifyIntent(token, USER_A, amount - 5_000);

    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/montant incorrect/i);
    expect(r.serverAmount).toBe(amount);
  });

  it('valid=false si montant client gonflé (clientAmount > serverAmount)', async () => {
    const p = await makeProduct({ price: 50_000, stock: 5 });
    const { token, amount, mockGet } = await createAndCapture(USER_A, p._id.toString());
    mockGet();

    const r = await svc.verifyIntent(token, USER_A, amount + 1);

    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/montant incorrect/i);
  });

  it('valid=true sans clientAmount (comparaison désactivée)', async () => {
    const p = await makeProduct({ price: 50_000, stock: 5 });
    const { token, mockGet } = await createAndCapture(USER_A, p._id.toString());
    mockGet();

    const r = await svc.verifyIntent(token, USER_A); // clientAmount omis

    expect(r.valid).toBe(true);
  });

  it('valid=false si intent déjà consommé (status=used)', async () => {
    const p = await makeProduct({ price: 50_000, stock: 5 });
    const { amount, rawStored } = await createAndCapture(USER_A, p._id.toString());

    const stored = JSON.parse(rawStored);
    stored.status = 'used';
    (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(stored));

    const r = await svc.verifyIntent('any-token', USER_A, amount);

    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/déjà été utilisée/i);
  });

  it('valid=false si signature HMAC corrompue (données Redis falsifiées)', async () => {
    const p = await makeProduct({ price: 50_000, stock: 5 });
    const { rawStored } = await createAndCapture(USER_A, p._id.toString());

    const stored = JSON.parse(rawStored);
    stored.signature = 'tampered_' + stored.signature.slice(10);
    (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(stored));

    const r = await svc.verifyIntent('any-token', USER_A);

    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/signature invalide/i);
  });
});

// ─── consumeIntent ────────────────────────────────────────────────────────────

describe('PaymentVerificationService.consumeIntent', () => {
  it('retourne amount + breakdown et écrit status=used dans Redis', async () => {
    const p = await makeProduct({ price: 75_000, stock: 5 });
    const { token, amount, rawStored } = await createAndCapture(USER_A, p._id.toString());

    // consumeIntent appelle _getIntent deux fois : verifyIntent + mise à jour
    (redis.get as jest.Mock)
      .mockResolvedValueOnce(rawStored)   // verifyIntent
      .mockResolvedValueOnce(rawStored);  // mise à jour du statut

    const result = await svc.consumeIntent(token, USER_A);

    expect(result.amount).toBe(amount);
    expect(result.breakdown).toBeDefined();

    // La dernière écriture Redis doit avoir TTL=300s et status=used
    const allSetexCalls = (redis.setex as jest.Mock).mock.calls;
    const lastWrite = allSetexCalls[allSetexCalls.length - 1];
    expect(lastWrite[1]).toBe(300);
    expect(JSON.parse(lastWrite[2] as string).status).toBe('used');
  });

  it('lève ApiError 400 si token introuvable', async () => {
    (redis.get as jest.Mock).mockResolvedValueOnce(null);

    await expect(svc.consumeIntent('ghost', USER_A)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('lève ApiError 400 si userId différent', async () => {
    const p = await makeProduct({ price: 50_000, stock: 5 });
    const { token, mockGet } = await createAndCapture(USER_A, p._id.toString());
    mockGet();

    await expect(svc.consumeIntent(token, USER_B)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('lève ApiError 400 sur double consommation (anti double-dépense)', async () => {
    const p = await makeProduct({ price: 50_000, stock: 5 });
    const { rawStored } = await createAndCapture(USER_A, p._id.toString());

    const usedStored = JSON.parse(rawStored);
    usedStored.status = 'used';
    (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(usedStored));

    await expect(svc.consumeIntent('any-token', USER_A)).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

// ─── invalidateIntent ─────────────────────────────────────────────────────────

describe('PaymentVerificationService.invalidateIntent', () => {
  it('appelle redis.del avec le préfixe payment:intent:', async () => {
    await svc.invalidateIntent('my-uuid-token');

    expect(redis.del).toHaveBeenCalledWith(`${INTENT_PREFIX}my-uuid-token`);
  });

  it('ne lève pas d\'erreur si Redis est indisponible (opération non bloquante)', async () => {
    (redis.del as jest.Mock).mockRejectedValueOnce(new Error('Redis down'));

    await expect(svc.invalidateIntent('any-token')).resolves.not.toThrow();
  });
});

// ─── getIntentAmount ──────────────────────────────────────────────────────────

describe('PaymentVerificationService.getIntentAmount', () => {
  it('retourne null pour un token inexistant ou expiré', async () => {
    (redis.get as jest.Mock).mockResolvedValueOnce(null);

    expect(await svc.getIntentAmount('ghost', USER_A)).toBeNull();
  });

  it('retourne null si userId ne correspond pas', async () => {
    const p = await makeProduct({ price: 50_000, stock: 5 });
    const { mockGet } = await createAndCapture(USER_A, p._id.toString());
    mockGet();

    expect(await svc.getIntentAmount('any-token', USER_B)).toBeNull();
  });

  it('retourne null si statut est "used"', async () => {
    const p = await makeProduct({ price: 50_000, stock: 5 });
    const { rawStored } = await createAndCapture(USER_A, p._id.toString());

    const stored = JSON.parse(rawStored);
    stored.status = 'used';
    (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(stored));

    expect(await svc.getIntentAmount('any-token', USER_A)).toBeNull();
  });

  it('retourne amount + breakdown + expiresAt pour un intent valide', async () => {
    const p = await makeProduct({ price: 50_000, stock: 5 });
    const { token, amount, mockGet } = await createAndCapture(USER_A, p._id.toString());
    mockGet();
    // redis.ttl est mocké à 1800 dans setup.ts

    const result = await svc.getIntentAmount(token, USER_A);

    expect(result).not.toBeNull();
    expect(result!.amount).toBe(amount);
    expect(result!.breakdown).toBeDefined();
    expect(result!.expiresAt).toBeInstanceOf(Date);
    expect(result!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
