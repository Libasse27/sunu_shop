import { Request, Response } from 'express';
import Announcement from '../models/Announcement.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

export const getActiveAnnouncements = asyncHandler(async (_req: Request, res: Response) => {
  const items = await Announcement.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
  ApiResponse.success(res, items, 'Annonces récupérées avec succès');
});

export const getAllAnnouncements = asyncHandler(async (_req: Request, res: Response) => {
  const items = await Announcement.find({}).sort({ order: 1, createdAt: 1 }).lean();
  ApiResponse.success(res, items, 'Annonces récupérées avec succès');
});

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const item = await Announcement.create(req.body);
  ApiResponse.created(res, item, 'Annonce créée avec succès');
});

export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const item = await Announcement.findById(req.params.id);
  if (!item) throw ApiError.notFound('Annonce non trouvée');
  Object.assign(item, req.body);
  await item.save();
  ApiResponse.success(res, item, 'Annonce mise à jour avec succès');
});

export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const item = await Announcement.findByIdAndDelete(req.params.id);
  if (!item) throw ApiError.notFound('Annonce non trouvée');
  ApiResponse.success(res, null, 'Annonce supprimée avec succès');
});

export const reorderAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const items: { id: string; order: number }[] = req.body.items;
  await Promise.all(items.map(({ id, order }) => Announcement.findByIdAndUpdate(id, { order })));
  ApiResponse.success(res, null, 'Ordre mis à jour avec succès');
});
