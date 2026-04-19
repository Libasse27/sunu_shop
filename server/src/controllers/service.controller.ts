import { Request, Response } from 'express';
import Service from '../models/Service.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { createSlug } from '../utils/slugify';

export const getServices = asyncHandler(async (_req: Request, res: Response) => {
  const services = await Service.find({ isAvailable: true }).sort({ order: 1, createdAt: 1 }).lean();
  ApiResponse.success(res, services, 'Services récupérés avec succès');
});

export const getAllServices = asyncHandler(async (_req: Request, res: Response) => {
  const services = await Service.find({}).sort({ order: 1, createdAt: 1 }).lean();
  ApiResponse.success(res, services, 'Services récupérés avec succès');
});

export const getServiceBySlug = asyncHandler(async (req: Request, res: Response) => {
  const service = await Service.findOne({ slug: req.params.slug });
  if (!service) throw ApiError.notFound('Service non trouvé');
  ApiResponse.success(res, service, 'Service récupéré avec succès');
});

export const createService = asyncHandler(async (req: Request, res: Response) => {
  const { title, ...rest } = req.body;
  const slug = createSlug(title);
  const existing = await Service.findOne({ slug });
  if (existing) throw ApiError.conflict('Un service avec ce titre existe déjà');
  const service = await Service.create({ title, slug, ...rest });
  ApiResponse.created(res, service, 'Service créé avec succès');
});

export const updateService = asyncHandler(async (req: Request, res: Response) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw ApiError.notFound('Service non trouvé');

  if (req.body.title && req.body.title !== service.title) {
    req.body.slug = createSlug(req.body.title);
  }

  Object.assign(service, req.body);
  await service.save();
  ApiResponse.success(res, service, 'Service mis à jour avec succès');
});

export const deleteService = asyncHandler(async (req: Request, res: Response) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) throw ApiError.notFound('Service non trouvé');
  ApiResponse.success(res, null, 'Service supprimé avec succès');
});
