import Category from '../../models/Category.model';
import Product from '../../models/Product.model';
import { InventoryService } from '../../services/inventory.service';

const inventory = new InventoryService();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeProduct = async (overrides: Record<string, unknown> = {}) => {
  const cat = await Category.create({ name: `Cat-${Date.now()}`, slug: `cat-${Date.now()}` });
  return Product.create({
    name:        `Produit-${Date.now()}`,
    slug:        `produit-${Date.now()}`,
    sku:         `SKU-${Date.now()}`,
    description: 'Description de test',
    price:       50_000,
    currency:    'XOF',
    stock:       10,
    category:    cat._id,
    images:      [{ url: 'https://example.com/img.jpg', isPrimary: true, order: 0 }],
    isActive:    true,
    ...overrides,
  });
};

// ─── validateStock ────────────────────────────────────────────────────────────

describe('InventoryService.validateStock', () => {
  it('valide si le stock est suffisant', async () => {
    const p = await makeProduct({ stock: 5 });
    const result = await inventory.validateStock([{ productId: String(p._id), quantity: 3 }]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('signale une erreur si stock insuffisant', async () => {
    const p = await makeProduct({ stock: 2 });
    const result = await inventory.validateStock([{ productId: String(p._id), quantity: 5 }]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].requested).toBe(5);
    expect(result.errors[0].available).toBe(2);
  });

  it('signale une erreur si produit inactif', async () => {
    const p = await makeProduct({ stock: 10, isActive: false });
    const result = await inventory.validateStock([{ productId: String(p._id), quantity: 1 }]);
    expect(result.valid).toBe(false);
  });

  it('signale une erreur si produit inexistant', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const result = await inventory.validateStock([{ productId: fakeId, quantity: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].name).toBe('Produit inconnu');
  });
});

// ─── deductStock ─────────────────────────────────────────────────────────────

describe('InventoryService.deductStock', () => {
  it('déduit le stock et incrémente totalSold', async () => {
    const p = await makeProduct({ stock: 10, totalSold: 0 });
    await inventory.deductStock([{ productId: String(p._id), quantity: 3 }]);

    const updated = await Product.findById(p._id);
    expect(updated?.stock).toBe(7);
    expect(updated?.totalSold).toBe(3);
  });

  it('lève une erreur si stock insuffisant', async () => {
    const p = await makeProduct({ stock: 2 });
    await expect(
      inventory.deductStock([{ productId: String(p._id), quantity: 5 }]),
    ).rejects.toThrow(/stock insuffisant/i);
  });

  it('effectue un rollback si un item échoue après des déductions réussies', async () => {
    const p1 = await makeProduct({ stock: 5 });
    const p2 = await makeProduct({ stock: 1 });

    await expect(
      inventory.deductStock([
        { productId: String(p1._id), quantity: 3 },
        { productId: String(p2._id), quantity: 5 }, // insuffisant → rollback p1
      ]),
    ).rejects.toThrow(/stock insuffisant/i);

    const restored = await Product.findById(p1._id);
    expect(restored?.stock).toBe(5); // stock de p1 restauré
  });
});

// ─── restoreStock ─────────────────────────────────────────────────────────────

describe('InventoryService.restoreStock', () => {
  it('restitue le stock après déduction', async () => {
    const p = await makeProduct({ stock: 10 });
    await inventory.deductStock([{ productId: String(p._id), quantity: 4 }]);
    await inventory.restoreStock([{ productId: String(p._id), quantity: 4 }]);

    const final = await Product.findById(p._id);
    expect(final?.stock).toBe(10);
  });

  it('ne lance pas d\'erreur si le produit est inexistant (non bloquant)', async () => {
    await expect(
      inventory.restoreStock([{ productId: '507f1f77bcf86cd799439011', quantity: 1 }]),
    ).resolves.not.toThrow();
  });
});

// ─── setStock ─────────────────────────────────────────────────────────────────

describe('InventoryService.setStock', () => {
  it('met à jour le stock directement', async () => {
    const p = await makeProduct({ stock: 5 });
    const result = await inventory.setStock(String(p._id), 20);
    expect(result.newStock).toBe(20);

    const updated = await Product.findById(p._id);
    expect(updated?.stock).toBe(20);
  });

  it('rejette un stock négatif', async () => {
    const p = await makeProduct();
    await expect(inventory.setStock(String(p._id), -1)).rejects.toThrow(/négatif/i);
  });

  it('retourne 404 pour un produit inexistant', async () => {
    await expect(
      inventory.setStock('507f1f77bcf86cd799439011', 10),
    ).rejects.toThrow(/non trouvé/i);
  });
});

// ─── isStockSufficient ────────────────────────────────────────────────────────

describe('InventoryService.isStockSufficient', () => {
  it('retourne true si stock suffisant', async () => {
    const p = await makeProduct({ stock: 10 });
    expect(await inventory.isStockSufficient(String(p._id), 5)).toBe(true);
  });

  it('retourne false si stock insuffisant', async () => {
    const p = await makeProduct({ stock: 2 });
    expect(await inventory.isStockSufficient(String(p._id), 5)).toBe(false);
  });

  it('retourne false si produit inactif', async () => {
    const p = await makeProduct({ stock: 10, isActive: false });
    expect(await inventory.isStockSufficient(String(p._id), 1)).toBe(false);
  });
});
