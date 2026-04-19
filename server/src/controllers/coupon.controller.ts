import { Request, Response } from 'express';
import Coupon from '../models/Coupon.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { getPagination, getPaginationResult } from '../utils/pagination';

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, orderTotal } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) throw ApiError.notFound('Code promo invalide');
  if (new Date() < coupon.startDate || new Date() > coupon.endDate) {
    throw ApiError.badRequest('Code promo expiré');
  }
  if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
    throw ApiError.badRequest('Code promo épuisé');
  }
  if (orderTotal < coupon.minOrderAmount) {
    throw ApiError.badRequest(`Montant minimum de commande : ${coupon.minOrderAmount} FCFA`);
  }

  const userUsage = coupon.usedBy.filter(u => u.user.toString() === req.user!._id.toString()).length;
  if (userUsage >= coupon.maxUsagePerUser) {
    throw ApiError.badRequest('Vous avez déjà utilisé ce code promo');
  }

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (orderTotal * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === 'fixed_amount') {
    discount = coupon.value;
  }

  ApiResponse.success(res, { code: coupon.code, type: coupon.type, discount, description: coupon.description });
});

// Admin
export const getCoupons = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req.query);
  const total = await Coupon.countDocuments();
  const coupons = await Coupon.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  ApiResponse.paginated(res, coupons, getPaginationResult(total, { page, limit }));
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.create(req.body);
  ApiResponse.created(res, coupon, 'Coupon créé');
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) throw ApiError.notFound('Coupon non trouvé');
  ApiResponse.success(res, coupon, 'Coupon mis à jour');
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  await Coupon.findByIdAndDelete(req.params.id);
  ApiResponse.success(res, null, 'Coupon supprimé');
});
