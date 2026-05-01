import { Request, Response } from 'express';
import Banner from '../models/Banner.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

// ── Public ─────────────────────────────────────────────────────────────────────

export const getActiveBanners = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await Banner.find({ isActive: true, type: 'hero' })
    .sort({ order: 1, createdAt: 1 }).lean();
  ApiResponse.success(res, banners, 'Bannières récupérées avec succès');
});

export const getActivePromoBanner = asyncHandler(async (_req: Request, res: Response) => {
  const banner = await Banner.findOne({ isActive: true, type: 'promo' })
    .sort({ order: 1, createdAt: 1 }).lean();
  ApiResponse.success(res, banner, 'Bannière promo récupérée');
});

// ── Admin ──────────────────────────────────────────────────────────────────────

// ?type=hero|promo (défaut: hero)
export const getAllBanners = asyncHandler(async (req: Request, res: Response) => {
  const type = (req.query.type as string) || 'hero';
  const banners = await Banner.find({ type }).sort({ order: 1, createdAt: 1 }).lean();
  ApiResponse.success(res, banners, 'Bannières récupérées avec succès');
});

export const createBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.create(req.body);
  ApiResponse.created(res, banner, 'Bannière créée avec succès');
});

export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) throw ApiError.notFound('Bannière non trouvée');
  Object.assign(banner, req.body);
  await banner.save();
  ApiResponse.success(res, banner, 'Bannière mise à jour avec succès');
});

export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw ApiError.notFound('Bannière non trouvée');
  ApiResponse.success(res, null, 'Bannière supprimée avec succès');
});

// Bulk reorder — body: { items: [{ id, order }] }
export const reorderBanners = asyncHandler(async (req: Request, res: Response) => {
  const items: { id: string; order: number }[] = req.body.items;
  await Promise.all(items.map(({ id, order }) => Banner.findByIdAndUpdate(id, { order })));
  ApiResponse.success(res, null, 'Ordre mis à jour avec succès');
});
