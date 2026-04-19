import { Request, Response } from 'express';
import Category from '../models/Category.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { createSlug } from '../utils/slugify';

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();

  // Build tree
  const rootCategories = categories.filter(c => !c.parent);
  const tree = rootCategories.map(cat => ({
    ...cat,
    children: categories.filter(c => c.parent?.toString() === cat._id.toString()),
  }));

  ApiResponse.success(res, tree);
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });
  if (!category) throw ApiError.notFound('Catégorie non trouvée');

  const children = await Category.find({ parent: category._id, isActive: true }).sort({ order: 1 });
  ApiResponse.success(res, { ...category.toObject(), children });
});

export const getCategoryTree = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();
  const roots = categories.filter(c => !c.parent);
  const tree = roots.map(root => ({
    ...root,
    children: categories.filter(c => c.parent?.toString() === root._id.toString()),
  }));
  ApiResponse.success(res, tree);
});

// Admin — returns all categories (active + inactive)
export const getAdminCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find().sort({ order: 1 }).lean();
  ApiResponse.success(res, categories);
});

// Admin CRUD
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  req.body.slug = createSlug(req.body.name);

  if (req.body.parent === '' || req.body.parent === null) {
    req.body.parent = null;
    req.body.level = 0;
  } else if (req.body.parent) {
    const parent = await Category.findById(req.body.parent);
    if (parent) req.body.level = parent.level + 1;
  }

  // Convert image URL string to object format
  if (typeof req.body.image === 'string' && req.body.image.trim()) {
    req.body.image = { url: req.body.image.trim() };
  } else if (!req.body.image || req.body.image === '') {
    delete req.body.image;
  }

  const category = await Category.create(req.body);
  ApiResponse.created(res, category, 'Catégorie créée');
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.name) req.body.slug = createSlug(req.body.name);

  if (req.body.parent === '' || req.body.parent === null) {
    req.body.parent = null;
    req.body.level = 0;
  } else if (req.body.parent) {
    const parent = await Category.findById(req.body.parent);
    if (parent) req.body.level = parent.level + 1;
  }

  // Convert image URL string to object format
  if (typeof req.body.image === 'string' && req.body.image.trim()) {
    req.body.image = { url: req.body.image.trim() };
  } else if (req.body.image === '') {
    req.body.image = undefined;
  }

  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) throw ApiError.notFound('Catégorie non trouvée');
  ApiResponse.success(res, category, 'Catégorie mise à jour');
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Catégorie non trouvée');
  ApiResponse.success(res, null, 'Catégorie supprimée');
});
