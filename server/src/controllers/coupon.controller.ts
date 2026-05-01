import { Request, Response } from 'express';
import Coupon from '../models/Coupon.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { getPagination, getPaginationResult } from '../utils/pagination';
import { couponService } from '../services/coupon.service';

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, orderTotal } = req.body;
  if (!code || orderTotal === undefined) throw ApiError.badRequest('Code et montant requis');

  const result = await couponService.validateCoupon(
    String(code),
    String(req.user!._id),
    Number(orderTotal),
  );

  if (!result.valid) throw ApiError.badRequest(result.reason ?? 'Code promo invalide');

  ApiResponse.success(res, {
    code:        result.coupon!.code,
    type:        result.coupon!.type,
    discount:    result.discount,
    label:       result.label,
    description: result.coupon!.description,
  });
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

// Admin — statistiques d'utilisation d'un coupon
export const getCouponStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await couponService.getCouponStats(req.params.id);
  ApiResponse.success(res, stats);
});
