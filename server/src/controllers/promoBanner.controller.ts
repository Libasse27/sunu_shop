import { Request, Response } from 'express';
import PromoBanner from '../models/PromoBanner.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

// Public — first active banner
export const getActivePromoBanner = asyncHandler(async (_req: Request, res: Response) => {
  const banner = await PromoBanner.findOne({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
  ApiResponse.success(res, banner, 'Promo banner récupéré');
});

// Admin — all
export const getAllPromoBanners = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await PromoBanner.find({}).sort({ order: 1, createdAt: 1 }).lean();
  ApiResponse.success(res, banners, 'Promo banners récupérés');
});

export const createPromoBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await PromoBanner.create(req.body);
  ApiResponse.created(res, banner, 'Promo banner créé');
});

export const updatePromoBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await PromoBanner.findById(req.params.id);
  if (!banner) throw ApiError.notFound('Promo banner non trouvé');
  Object.assign(banner, req.body);
  await banner.save();
  ApiResponse.success(res, banner, 'Promo banner mis à jour');
});

export const deletePromoBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await PromoBanner.findByIdAndDelete(req.params.id);
  if (!banner) throw ApiError.notFound('Promo banner non trouvé');
  ApiResponse.success(res, null, 'Promo banner supprimé');
});
