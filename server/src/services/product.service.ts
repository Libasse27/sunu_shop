/**
 * product.service.ts — Couche service pour les opérations produits
 *
 * Centralise :
 *   - Recherche et filtrage avancé
 *   - Génération de slug unique
 *   - Produits similaires / recommandations
 *   - Statistiques produit (vues, ventes, note)
 *   - Gestion des flags (featured, newArrival, onSale)
 *   - Validation des données avant création/modification
 */

import Product, { IProduct } from '../models/Product.model';
import type { SortOrder } from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { getPagination, getPaginationResult } from '../utils/pagination';
import { createSlug } from '../utils/slugify';
import { buildSearchRegex } from '../utils/regex.utils';
import { pricingService } from './pricing.service';
import logger from '../utils/logger';

// ─── Projections ──────────────────────────────────────────────────────────────
// Champs renvoyés pour les cartes produit — exclut description, specs, SEO, fournisseur
export const LIST_SELECT =
  'name slug price compareAtPrice currency images category ' +
  'tags brand stock rating numReviews totalSold viewCount ' +
  'isFeatured isNewArrival isBestSeller isOnSale isActive createdAt';

// Champs renvoyés dans la liste admin (ajoute sku et données fournisseur basiques)
export const ADMIN_LIST_SELECT = `${LIST_SELECT} sku lowStockThreshold supplier.name costPrice`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const withDiscount = <T extends { price: number; compareAtPrice?: number | null }>(
  products: T[],
): (T & { discountPercentage: number })[] =>
  products.map(p => ({
    ...p,
    discountPercentage: pricingService.getDiscountPercentage(p.compareAtPrice ?? 0, p.price),
  }));

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductFilters {
  search?:      string;
  category?:    string;
  minPrice?:    number;
  maxPrice?:    number;
  rating?:      number;
  brand?:       string;
  tags?:        string[];
  sort?:        'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating' | 'bestseller';
  inStock?:     boolean;
  onSale?:      boolean;
  isFeatured?:  boolean;
  page?:        number;
  limit?:       number;
}

export interface AdminProductFilters extends ProductFilters {
  isActive?:    boolean;
  supplier?:    string;
  lowStock?:    boolean;
}

export interface ProductStats {
  _id:            string;
  name:           string;
  viewCount:      number;
  totalSold:      number;
  rating:         number;
  numReviews:     number;
  revenue:        number;
  margin?:        { amount: number; percentage: number };
  stockValue?:    number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SORT_MAP: Record<string, { [key: string]: SortOrder }> = {
  newest:     { createdAt: -1 },
  price_asc:  { price: 1 },
  price_desc: { price: -1 },
  popular:    { viewCount: -1 },
  rating:     { rating: -1 },
  bestseller: { totalSold: -1 },
};

// ─── Service ──────────────────────────────────────────────────────────────────

export class ProductService {

  // ── Requêtes ──────────────────────────────────────────────────────────────

  /**
   * Recherche paginée avec filtres — utilisée par la boutique publique.
   */
  async getProducts(filters: ProductFilters) {
    const { page = 1, limit = 20 } = filters;
    const filter: Record<string, unknown> = { isActive: true };

    if (filters.search) filter.$text = { $search: filters.search };
    if (filters.category) {
      const Category = (await import('../models/Category.model')).default;
      const children = await Category.find({ parent: filters.category }, '_id').lean();
      filter.category = children.length > 0
        ? { $in: [filters.category, ...children.map((c: { _id: unknown }) => c._id)] }
        : filters.category;
    }
    if (filters.brand)       filter.brand       = filters.brand;
    if (filters.rating)      filter.rating      = { $gte: filters.rating };
    if (filters.inStock)     filter.stock       = { $gt: 0 };
    if (filters.onSale)      filter.isOnSale    = true;
    if (filters.isFeatured)  filter.isFeatured  = true;
    if (filters.tags?.length) filter.tags       = { $in: filters.tags };

    if (filters.minPrice || filters.maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (filters.minPrice) priceFilter.$gte = filters.minPrice;
      if (filters.maxPrice) priceFilter.$lte = filters.maxPrice;
      filter.price = priceFilter;
    }

    const sortOption = SORT_MAP[filters.sort ?? 'newest'] ?? SORT_MAP.newest;
    const pagination = getPagination({ page, limit });

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select(LIST_SELECT)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip((pagination.page - 1) * pagination.limit)
        .limit(pagination.limit)
        .lean(),
    ]);

    return {
      products: withDiscount(products),
      pagination: getPaginationResult(total, pagination),
    };
  }

  /**
   * Liste admin avec filtres étendus (incluant inactifs, fournisseur, stock faible).
   */
  async getAdminProducts(filters: AdminProductFilters) {
    const { page = 1, limit = 20 } = filters;
    const filter: Record<string, unknown> = {};

    if (filters.search) filter.$text = { $search: filters.search };
    if (filters.category) filter.category = filters.category;
    if (filters.isActive !== undefined) filter.isActive = filters.isActive;
    if (filters.isFeatured !== undefined) filter.isFeatured = filters.isFeatured;
    if (filters.onSale !== undefined) filter.isOnSale = filters.onSale;
    if (filters.supplier) filter['supplier.name'] = buildSearchRegex(filters.supplier);
    if (filters.lowStock) {
      filter.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] };
    }

    const pagination = getPagination({ page, limit });

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select(ADMIN_LIST_SELECT)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip((pagination.page - 1) * pagination.limit)
        .limit(pagination.limit)
        .lean(),
    ]);

    return {
      products: withDiscount(products),
      pagination: getPaginationResult(total, pagination),
    };
  }

  // ── Détail ────────────────────────────────────────────────────────────────

  async getProductBySlug(slug: string): Promise<IProduct> {
    const product = await Product.findOne({ slug, isActive: true })
      .populate('category', 'name slug')
      .populate({
        path:    'relatedProducts',
        select:  'name slug price images rating numReviews isActive',
        match:   { isActive: true },
        options: { limit: 8 },
      });
    if (!product) throw ApiError.notFound('Produit non trouvé');
    product.viewCount += 1;
    await product.save();
    return product;
  }

  async getProductById(id: string): Promise<IProduct> {
    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .lean();
    if (!product) throw ApiError.notFound('Produit non trouvé');
    return product as unknown as IProduct;
  }

  // ── Listes spéciales ──────────────────────────────────────────────────────

  async getFeaturedProducts(limit = 8) {
    const raw = await Product.find({ isActive: true, isFeatured: true })
      .select(LIST_SELECT)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return withDiscount(raw);
  }

  async getNewArrivals(limit = 8) {
    const raw = await Product.find({ isActive: true, isNewArrival: true })
      .select(LIST_SELECT)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return withDiscount(raw);
  }

  async getBestSellers(limit = 8) {
    const raw = await Product.find({ isActive: true, isBestSeller: true })
      .select(LIST_SELECT)
      .populate('category', 'name slug')
      .sort({ totalSold: -1 })
      .limit(limit)
      .lean();
    return withDiscount(raw);
  }

  async getOnSaleProducts(limit = 12) {
    const raw = await Product.find({ isActive: true, isOnSale: true })
      .select(LIST_SELECT)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return withDiscount(raw);
  }

  async getProductsByCategory(categoryId: string, page: number, limit: number) {
    const filter = { isActive: true, category: categoryId };
    const [total, raw] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select(LIST_SELECT)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return {
      products:   withDiscount(raw),
      pagination: getPaginationResult(total, { page, limit }),
    };
  }

  // ── Recommandations ───────────────────────────────────────────────────────

  /**
   * Produits similaires : même catégorie ET/OU même tags.
   * Exclut le produit source.
   *
   * @param productId - ID du produit source
   * @param limit     - Nombre de résultats
   */
  async getRelatedProducts(productId: string, limit = 4): Promise<IProduct[]> {
    const source = await Product.findById(productId).lean();
    if (!source) return [];

    const related = await Product.find({
      _id:      { $ne: source._id },
      isActive: true,
      $or: [
        { category: source.category },
        { tags: { $in: source.tags ?? [] } },
      ],
    })
      .select(LIST_SELECT)
      .populate('category', 'name slug')
      .sort({ totalSold: -1, rating: -1 })
      .limit(limit)
      .lean();

    return related as unknown as IProduct[];
  }

  /**
   * Produits souvent achetés ensemble (co-occurrence dans les commandes).
   * Algorithme : trouver les commandes contenant le produit source,
   * puis compter les co-occurrences d'autres produits dans ces commandes.
   *
   * @param productId - ID du produit source
   * @param limit     - Nombre de résultats
   */
  async getFrequentlyBoughtTogether(productId: string, limit = 4): Promise<IProduct[]> {
    const Order = (await import('../models/Order.model')).default;

    const coOccurrences = await Order.aggregate([
      // Commandes payées contenant le produit source
      { $match: { 'items.product': new (await import('mongoose')).Types.ObjectId(productId), 'payment.status': 'completed' } },
      { $unwind: '$items' },
      // Exclure le produit source lui-même
      { $match: { 'items.product': { $ne: new (await import('mongoose')).Types.ObjectId(productId) } } },
      { $group: { _id: '$items.product', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    const ids = coOccurrences.map(c => c._id);
    const products = await Product.find({ _id: { $in: ids }, isActive: true })
      .populate('category', 'name slug')
      .lean();

    // Réordonner selon la fréquence de co-occurrence
    const idOrder = ids.map(String);
    return products.sort(
      (a, b) => idOrder.indexOf(String(a._id)) - idOrder.indexOf(String(b._id)),
    ) as unknown as IProduct[];
  }

  // ── Gestion du slug ───────────────────────────────────────────────────────

  /**
   * Génère un slug unique pour un nouveau produit.
   * Ajoute un suffixe timestamp si le slug existe déjà.
   *
   * @param name - Nom du produit
   */
  async generateUniqueSlug(name: string): Promise<string> {
    const base = createSlug(name);
    const existing = await Product.findOne({ slug: base }).select('_id').lean();
    if (!existing) return base;
    return `${base}-${Date.now()}`;
  }

  // ── Création / Mise à jour ─────────────────────────────────────────────────

  /**
   * Crée un produit avec génération automatique du slug.
   *
   * @param data - Données du produit (validées en amont par le validator)
   */
  async createProduct(data: Record<string, unknown>): Promise<IProduct> {
    const slug = await this.generateUniqueSlug(data.name as string);
    const product = await Product.create({ ...data, slug });

    logger.info('Produit créé', { id: product._id, name: product.name, slug });
    return product;
  }

  /**
   * Met à jour un produit existant.
   * Régénère le slug si le nom change et qu'aucun slug n'est fourni.
   */
  async updateProduct(id: string, data: Record<string, unknown>): Promise<IProduct> {
    const existing = await Product.findById(id);
    if (!existing) throw ApiError.notFound('Produit non trouvé');

    // Si le nom change et qu'aucun slug n'est fourni, régénérer le slug
    if (data.name && data.name !== existing.name && !data.slug) {
      data.slug = await this.generateUniqueSlug(data.name as string);
    }

    const updated = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updated) throw ApiError.notFound('Produit non trouvé');

    logger.info('Produit mis à jour', { id, name: updated.name });
    return updated;
  }

  /**
   * Soft-delete d'un produit (isActive = false).
   */
  async deleteProduct(id: string): Promise<void> {
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!product) throw ApiError.notFound('Produit non trouvé');
    logger.info('Produit désactivé', { id, name: product.name });
  }

  // ── Statistiques ─────────────────────────────────────────────────────────

  /**
   * Statistiques complètes d'un produit (vues, ventes, note, marge).
   */
  async getProductStats(productId: string): Promise<ProductStats> {
    const product = await Product.findById(productId)
      .select('name viewCount totalSold rating numReviews price costPrice stock')
      .lean();
    if (!product) throw ApiError.notFound('Produit non trouvé');

    const margin = product.costPrice
      ? pricingService.calculateMargin(product.price, product.costPrice)
      : undefined;

    return {
      _id:        String(product._id),
      name:       product.name,
      viewCount:  product.viewCount ?? 0,
      totalSold:  product.totalSold ?? 0,
      rating:     product.rating ?? 0,
      numReviews: product.numReviews ?? 0,
      revenue:    (product.totalSold ?? 0) * product.price,
      margin,
      stockValue: product.costPrice
        ? pricingService.calculateStockValue(product.stock, product.costPrice)
        : undefined,
    };
  }

  /**
   * Incrémente le compteur de vues d'un produit.
   * Méthode séparée pour être appelée sans bloquer le rendu de la page.
   */
  async incrementViewCount(productId: string): Promise<void> {
    await Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } });
  }

  // ── Mises à jour en masse ─────────────────────────────────────────────────

  /**
   * Met à jour des flags sur plusieurs produits simultanément.
   *
   * @param ids    - Liste d'IDs produits
   * @param update - Champs à modifier (whitelist stricte)
   */
  async bulkUpdate(
    ids: string[],
    update: Partial<{ isActive: boolean; isFeatured: boolean; isNewArrival: boolean; isBestSeller: boolean; isOnSale: boolean; category: string }>,
  ): Promise<{ modifiedCount: number }> {
    const result = await Product.updateMany(
      { _id: { $in: ids } },
      { $set: update },
    );
    logger.info('Bulk update produits', { count: result.modifiedCount, update });
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Désactive plusieurs produits simultanément.
   */
  async bulkDelete(ids: string[]): Promise<{ modifiedCount: number }> {
    const result = await Product.updateMany({ _id: { $in: ids } }, { $set: { isActive: false } });
    return { modifiedCount: result.modifiedCount };
  }
}

export const productService = new ProductService();
