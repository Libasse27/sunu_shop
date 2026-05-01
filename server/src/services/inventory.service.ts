/**
 * inventory.service.ts — Gestion du stock produit
 *
 * Centralise :
 *   - Déduction atomique du stock (avec rollback)
 *   - Restitution du stock (annulation)
 *   - Validation de disponibilité
 *   - Alertes de stock faible
 *   - Mise à jour bulk du stock
 */

import Product from '../models/Product.model';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockItem {
  productId: string;
  quantity: number;
  variant?: { name: string; value: string };
}

export interface StockValidationResult {
  valid: boolean;
  errors: Array<{ productId: string; name: string; requested: number; available: number }>;
}

export interface StockOperationResult {
  productId: string;
  name: string;
  newStock: number;
}

export type StockOperation = 'deduct' | 'restore';

// ─── Service ──────────────────────────────────────────────────────────────────

export class InventoryService {

  // ── Validation ────────────────────────────────────────────────────────────

  /**
   * Vérifie que le stock est suffisant pour tous les items.
   * Retourne un objet de validation (n'effectue aucune modification).
   *
   * @param items - Liste des articles avec quantités demandées
   */
  async validateStock(items: StockItem[]): Promise<StockValidationResult> {
    const errors: StockValidationResult['errors'] = [];
    if (!items.length) return { valid: true, errors };

    // Une seule requête pour tous les produits (évite N+1)
    const ids = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: ids } })
      .select('name stock isActive')
      .lean();
    const productMap = new Map(products.map(p => [String(p._id), p]));

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        errors.push({ productId: item.productId, name: 'Produit inconnu', requested: item.quantity, available: 0 });
        continue;
      }
      if (!product.isActive) {
        errors.push({ productId: item.productId, name: product.name, requested: item.quantity, available: 0 });
        continue;
      }
      if (product.stock < item.quantity) {
        errors.push({ productId: item.productId, name: product.name, requested: item.quantity, available: product.stock });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Vérifie le stock d'un seul produit.
   */
  async isStockSufficient(productId: string, quantity: number): Promise<boolean> {
    const product = await Product.findById(productId).select('stock isActive').lean();
    return !!(product?.isActive && product.stock >= quantity);
  }

  // ── Déduction atomique ────────────────────────────────────────────────────

  /**
   * Déduit le stock de façon atomique avec rollback automatique.
   * Utilise findOneAndUpdate pour garantir l'atomicité même sous charge concurrente.
   *
   * @param items - Articles à déduire
   * @returns     - Résultats par produit avec nouveau stock
   * @throws      - ApiError si stock insuffisant (rollback effectué)
   */
  async deductStock(items: StockItem[]): Promise<StockOperationResult[]> {
    const results: StockOperationResult[] = [];
    const deducted: Array<{ id: string; qty: number }> = [];

    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity }, isActive: true },
        { $inc: { stock: -item.quantity, totalSold: item.quantity } },
        { new: true, select: 'name stock' },
      );

      if (!updated) {
        // Rollback de toutes les déductions précédentes
        if (deducted.length > 0) {
          await this.restoreStock(deducted.map(d => ({ productId: d.id, quantity: d.qty })));
          logger.warn('Rollback stock effectué', { deducted, failedOn: item.productId });
        }
        throw ApiError.badRequest(`Stock insuffisant ou produit inactif (ID: ${item.productId})`);
      }

      deducted.push({ id: item.productId, qty: item.quantity });
      results.push({ productId: item.productId, name: updated.name, newStock: updated.stock });
    }

    return results;
  }

  // ── Restitution ───────────────────────────────────────────────────────────

  /**
   * Restitue le stock (annulation de commande ou rollback).
   * Non bloquant sur les erreurs individuelles — log les échecs.
   *
   * @param items - Articles à restituer
   */
  async restoreStock(items: Array<{ productId: string; quantity: number }>): Promise<void> {
    const ops = items.map(item =>
      Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity, totalSold: -item.quantity } },
        { new: false },
      ).catch(err => {
        logger.error('Échec restitution stock', { productId: item.productId, error: (err as Error).message });
        return null;
      }),
    );
    await Promise.all(ops);
  }

  // ── Mise à jour manuelle ──────────────────────────────────────────────────

  /**
   * Mise à jour directe du stock par l'admin (réassort, correction).
   * Enregistre la transaction dans les logs.
   *
   * @param productId - ID du produit
   * @param newStock  - Nouveau niveau de stock
   * @param reason    - Motif de la modification (log interne)
   */
  async setStock(productId: string, newStock: number, reason = 'Mise à jour manuelle'): Promise<StockOperationResult> {
    if (newStock < 0) throw ApiError.badRequest('Le stock ne peut pas être négatif');

    const product = await Product.findByIdAndUpdate(
      productId,
      { stock: newStock },
      { new: true, select: 'name stock' },
    );
    if (!product) throw ApiError.notFound('Produit non trouvé');

    logger.info('Stock mis à jour manuellement', {
      productId, name: product.name, newStock, reason,
    });

    return { productId, name: product.name, newStock };
  }

  /**
   * Incrémente ou décrémente le stock d'un produit (ajustement).
   */
  async adjustStock(productId: string, delta: number, reason = 'Ajustement'): Promise<StockOperationResult> {
    const product = await Product.findByIdAndUpdate(
      productId,
      { $inc: { stock: delta } },
      { new: true, select: 'name stock' },
    );
    if (!product) throw ApiError.notFound('Produit non trouvé');
    if (product.stock < 0) {
      // Annuler si le résultat est négatif
      await Product.findByIdAndUpdate(productId, { $inc: { stock: -delta } });
      throw ApiError.badRequest('L\'ajustement résulterait en un stock négatif');
    }

    logger.info('Stock ajusté', { productId, name: product.name, delta, newStock: product.stock, reason });
    return { productId, name: product.name, newStock: product.stock };
  }

  // ── Alertes de stock faible ───────────────────────────────────────────────

  /**
   * Retourne les produits en rupture ou sous leur seuil d'alerte.
   *
   * @param limit - Nombre maximum de produits retournés
   */
  async getLowStockProducts(limit = 20): Promise<Array<{
    _id: string; name: string; sku: string; stock: number;
    lowStockThreshold: number; isOutOfStock: boolean;
  }>> {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .select('name sku stock lowStockThreshold')
      .sort({ stock: 1 })
      .limit(limit)
      .lean();

    return products.map(p => ({
      _id:              String(p._id),
      name:             p.name,
      sku:              p.sku,
      stock:            p.stock,
      lowStockThreshold: p.lowStockThreshold ?? 5,
      isOutOfStock:     p.stock === 0,
    }));
  }

  /**
   * Nombre total de produits en rupture de stock.
   */
  async getOutOfStockCount(): Promise<number> {
    return Product.countDocuments({ isActive: true, stock: 0 });
  }

  /**
   * Valeur totale du stock (somme stock × prix de vente).
   * Optionnel : utiliser le prix d'achat (costPrice) pour la valeur comptable.
   */
  async calculateStockValue(useCostPrice = false): Promise<{ totalValue: number; totalUnits: number }> {
    const result = await Product.aggregate([
      { $match: { isActive: true, stock: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: {
              $multiply: ['$stock', useCostPrice ? { $ifNull: ['$costPrice', '$price'] } : '$price'],
            },
          },
          totalUnits: { $sum: '$stock' },
        },
      },
    ]);
    return result[0] ?? { totalValue: 0, totalUnits: 0 };
  }

  // ── Statistiques ─────────────────────────────────────────────────────────

  /**
   * Résumé de l'état du stock pour le dashboard admin.
   */
  async getStockSummary(): Promise<{
    totalProducts: number;
    outOfStock: number;
    lowStock: number;
    wellStocked: number;
    stockValue: number;
  }> {
    const [totals, stockValue] = await Promise.all([
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
            lowStock: {
              $sum: {
                $cond: [
                  { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] },
                  1, 0,
                ],
              },
            },
          },
        },
      ]),
      this.calculateStockValue(),
    ]);

    const t = totals[0] ?? { total: 0, outOfStock: 0, lowStock: 0 };
    return {
      totalProducts: t.total,
      outOfStock:    t.outOfStock,
      lowStock:      t.lowStock,
      wellStocked:   t.total - t.outOfStock - t.lowStock,
      stockValue:    stockValue.totalValue,
    };
  }
}

export const inventoryService = new InventoryService();
