import { Request, Response } from 'express';
import Banner from '../models/Banner.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

// Public — active banners sorted by order
export const getActiveBanners = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
  ApiResponse.success(res, banners, 'Bannières récupérées avec succès');
});

// Admin — all banners
export const getAllBanners = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await Banner.find({}).sort({ order: 1, createdAt: 1 }).lean();
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

// Bulk reorder — body: [{ id, order }]
export const reorderBanners = asyncHandler(async (req: Request, res: Response) => {
  const items: { id: string; order: number }[] = req.body.items;
  await Promise.all(items.map(({ id, order }) => Banner.findByIdAndUpdate(id, { order })));
  ApiResponse.success(res, null, 'Ordre mis à jour avec succès');
});
