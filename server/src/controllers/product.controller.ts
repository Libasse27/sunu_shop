import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { getPagination } from '../utils/pagination';
import { productService, LIST_SELECT, withDiscount } from '../services/product.service';
import Product from '../models/Product.model';

// ── Lecture publique ──────────────────────────────────────────────────────────

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req.query);
  const { search, category, minPrice, maxPrice, rating, brand, tags, sort, inStock, onSale, ids } = req.query;

  // Lookup batch wishlist par IDs — court-circuite le service pour ce cas spécial
  if (ids) {
    const idList = (ids as string).split(',').filter(Boolean);
    const raw = await Product.find({ _id: { $in: idList }, isActive: true })
      .select(LIST_SELECT)
      .populate('category', 'name slug')
      .lean();
    return ApiResponse.success(res, withDiscount(raw));
  }

  const { products, pagination } = await productService.getProducts({
    search:     search as string,
    category:   category as string,
    minPrice:   minPrice ? Number(minPrice) : undefined,
    maxPrice:   maxPrice ? Number(maxPrice) : undefined,
    rating:     rating ? Number(rating) : undefined,
    brand:      brand as string,
    tags:       tags ? (tags as string).split(',') : undefined,
    sort:       sort as 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating' | 'bestseller',
    inStock:    inStock === 'true',
    onSale:     onSale === 'true',
    page,
    limit,
  });

  ApiResponse.paginated(res, products, pagination);
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductBySlug(req.params.slug);
  ApiResponse.success(res, product);
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id);
  ApiResponse.success(res, product);
});

export const getFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
  ApiResponse.success(res, await productService.getFeaturedProducts());
});

export const getNewArrivals = asyncHandler(async (_req: Request, res: Response) => {
  ApiResponse.success(res, await productService.getNewArrivals());
});

export const getBestSellers = asyncHandler(async (_req: Request, res: Response) => {
  ApiResponse.success(res, await productService.getBestSellers());
});

export const getOnSaleProducts = asyncHandler(async (_req: Request, res: Response) => {
  ApiResponse.success(res, await productService.getOnSaleProducts());
});

export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await productService.getRelatedProducts(req.params.id, 4);
  ApiResponse.success(res, products);
});

export const getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req.query);
  const { products, pagination } = await productService.getProductsByCategory(req.params.categoryId, page, limit);
  ApiResponse.paginated(res, products, pagination);
});

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getAdminProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req.query);
  const { search, category, isActive, isFeatured, isOnSale, supplier } = req.query;

  const { products, pagination } = await productService.getAdminProducts({
    search:     search as string,
    category:   category as string,
    isActive:   isActive !== undefined ? isActive === 'true' : undefined,
    isFeatured: isFeatured !== undefined ? isFeatured === 'true' : undefined,
    onSale:     isOnSale !== undefined ? isOnSale === 'true' : undefined,
    supplier:   supplier as string,
    page,
    limit,
  });

  ApiResponse.paginated(res, products, pagination);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body);
  ApiResponse.created(res, product, 'Produit créé avec succès');
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  ApiResponse.success(res, product, 'Produit mis à jour');
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productService.deleteProduct(req.params.id);
  ApiResponse.success(res, null, 'Produit supprimé');
});

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

export const bulkUpdateProducts = asyncHandler(async (req: Request, res: Response) => {
  const { ids, update } = req.body;
  const result = await productService.bulkUpdate(ids, update);
  ApiResponse.success(res, result, `${result.modifiedCount} produit(s) mis à jour`);
});

export const bulkDeleteProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.bulkDelete(req.body.ids);
  ApiResponse.success(res, result, `${result.modifiedCount} produit(s) supprimé(s)`);
});
