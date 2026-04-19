import { Request, Response } from 'express';
import Product from '../models/Product.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { getPagination, getPaginationResult } from '../utils/pagination';
import { createSlug } from '../utils/slugify';
import redis from '../config/redis';
import { buildSearchRegex } from '../utils/regex.utils';

// TTL cache produits — 5 minutes
const PRODUCTS_CACHE_TTL = 300;

/**
 * Scanne les clés Redis par pattern (non-bloquant, remplace redis.keys()).
 */
const scanRedisKeys = async (pattern: string): Promise<string[]> => {
  const keys: string[] = [];
  let cursor = '0';
  do {
    const [nextCursor, found] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
    cursor = nextCursor;
    keys.push(...found);
  } while (cursor !== '0');
  return keys;
};

/** Invalide tous les caches produits (après create/update/delete) */
const invalidateProductsCache = async (): Promise<void> => {
  try {
    const keys = await scanRedisKeys('products:*');
    if (keys.length > 0) await redis.del(...keys as [string, ...string[]]);
  } catch {
    // Non bloquant — le cache sera naturellement expiré
  }
};

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req.query);
  const { search, category, subCategory, minPrice, maxPrice, rating, brand, tags, sort, inStock, onSale, ids } = req.query;

  // ─── Cache Redis ──────────────────────────────────────────────────────────
  // Pas de cache pour les recherches textuelles ou par IDs (trop variées)
  const isCacheable = !search && !ids;
  const cacheKey = `products:${JSON.stringify({ page, limit, category, subCategory, minPrice, maxPrice, rating, brand, tags, sort, inStock, onSale })}`;

  if (isCacheable) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const { data, pagination } = JSON.parse(cached);
        return ApiResponse.paginated(res, data, pagination);
      }
    } catch {
      // Cache indisponible — continuer vers MongoDB
    }
  }

  const filter: any = { isActive: true };

  // Lookup batch par IDs — utilisé par la wishlist (évite N+1 requêtes)
  if (ids) {
    const idList = (ids as string).split(',').filter(Boolean);
    filter._id = { $in: idList };
  }

  if (search) {
    filter.$text = { $search: search as string };
  }
  if (category) filter.category = category;
  if (subCategory) filter.subCategory = subCategory;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (rating) filter.rating = { $gte: Number(rating) };
  if (brand) filter.brand = brand;
  if (tags) filter.tags = { $in: (tags as string).split(',') };
  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (onSale === 'true') filter.isOnSale = true;

  let sortOption: any = { createdAt: -1 };
  switch (sort) {
    case 'price_asc': sortOption = { price: 1 }; break;
    case 'price_desc': sortOption = { price: -1 }; break;
    case 'newest': sortOption = { createdAt: -1 }; break;
    case 'popular': sortOption = { viewCount: -1 }; break;
    case 'rating': sortOption = { rating: -1 }; break;
    case 'bestseller': sortOption = { totalSold: -1 }; break;
  }

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const pagination = getPaginationResult(total, { page, limit });

  // Mettre en cache le résultat
  if (isCacheable) {
    try {
      await redis.setex(cacheKey, PRODUCTS_CACHE_TTL, JSON.stringify({ data: products, pagination }));
    } catch {
      // Non bloquant
    }
  }

  ApiResponse.paginated(res, products, pagination);
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate('subCategory', 'name slug')
    .populate({
      path: 'relatedProducts',
      select: 'name slug price images rating numReviews isActive',
      match: { isActive: true },
      options: { limit: 8 },
    });

  if (!product) throw ApiError.notFound('Produit non trouvé');

  product.viewCount += 1;
  await product.save();

  ApiResponse.success(res, product);
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('subCategory', 'name slug')
    .lean();

  if (!product) throw ApiError.notFound('Produit non trouvé');
  ApiResponse.success(res, product);
});

export const getFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();
  ApiResponse.success(res, products);
});

export const getNewArrivals = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find({ isActive: true, isNewArrival: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();
  ApiResponse.success(res, products);
});

export const getBestSellers = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find({ isActive: true, isBestSeller: true })
    .populate('category', 'name slug')
    .sort({ totalSold: -1 })
    .limit(8)
    .lean();
  ApiResponse.success(res, products);
});

export const getOnSaleProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find({ isActive: true, isOnSale: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(12);
  ApiResponse.success(res, products);
});

export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Produit non trouvé');

  const related = await Product.find({
    _id: { $ne: product._id },
    isActive: true,
    $or: [
      { category: product.category },
      { tags: { $in: product.tags } },
    ],
  })
    .limit(4)
    .lean();

  ApiResponse.success(res, related);
});

export const getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req.query);
  const filter = { isActive: true, category: req.params.categoryId };

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  ApiResponse.paginated(res, products, getPaginationResult(total, { page, limit }));
});

// Admin
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const slug = createSlug(req.body.name);
  const existing = await Product.findOne({ slug });
  if (existing) {
    req.body.slug = `${slug}-${Date.now()}`;
  } else {
    req.body.slug = slug;
  }

  const product = await Product.create(req.body);
  await invalidateProductsCache();
  ApiResponse.created(res, product, 'Produit créé avec succès');
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) throw ApiError.notFound('Produit non trouvé');
  await invalidateProductsCache();
  ApiResponse.success(res, product, 'Produit mis à jour');
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) throw ApiError.notFound('Produit non trouvé');
  await invalidateProductsCache();
  ApiResponse.success(res, null, 'Produit supprimé');
});

// Admin: list all products (including inactive)
export const getAdminProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req.query);
  const { search, category, isActive, isFeatured, isOnSale, supplier } = req.query;

  const filter: any = {};
  if (search) filter.$text = { $search: search as string };
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
  if (isOnSale !== undefined) filter.isOnSale = isOnSale === 'true';
  if (supplier) filter['supplier.name'] = buildSearchRegex(supplier as string);

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  ApiResponse.paginated(res, products, getPaginationResult(total, { page, limit }));
});

// Admin: update stock
export const updateStock = asyncHandler(async (req: Request, res: Response) => {
  const { stock } = req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock },
    { new: true, runValidators: true },
  );
  if (!product) throw ApiError.notFound('Produit non trouvé');
  ApiResponse.success(res, product, 'Stock mis à jour');
});

// Admin: bulk update products
export const bulkUpdateProducts = asyncHandler(async (req: Request, res: Response) => {
  const { ids, update } = req.body;

  const allowedFields = ['isActive', 'isFeatured', 'isNewArrival', 'isBestSeller', 'isOnSale', 'category'];
  const sanitized: any = {};
  for (const key of Object.keys(update)) {
    if (allowedFields.includes(key)) sanitized[key] = update[key];
  }

  const result = await Product.updateMany({ _id: { $in: ids } }, { $set: sanitized });
  await invalidateProductsCache();
  ApiResponse.success(res, { modifiedCount: result.modifiedCount }, `${result.modifiedCount} produit(s) mis à jour`);
});

// Admin: bulk delete (soft delete)
export const bulkDeleteProducts = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  const result = await Product.updateMany({ _id: { $in: ids } }, { $set: { isActive: false } });
  await invalidateProductsCache();
  ApiResponse.success(res, { modifiedCount: result.modifiedCount }, `${result.modifiedCount} produit(s) supprimé(s)`);
});
