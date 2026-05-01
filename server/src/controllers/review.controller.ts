import { Request, Response } from 'express';
import Review from '../models/Review.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { getPagination, getPaginationResult } from '../utils/pagination';
import { reviewService } from '../services/review.service';

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req.query);
  const filter = { product: req.params.productId, isApproved: true };

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .populate('user', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  ApiResponse.paginated(res, reviews, getPaginationResult(total, { page, limit }));
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.createReview(String(req.user!._id), req.body);
  ApiResponse.created(res, review, 'Avis ajouté');
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Avis non trouvé');
  if (review.user.toString() !== req.user!._id.toString()) throw ApiError.forbidden('Non autorisé');

  Object.assign(review, req.body);
  await review.save();
  ApiResponse.success(res, review, 'Avis mis à jour');
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Avis non trouvé');
  if (review.user.toString() !== req.user!._id.toString() && req.user!.role === 'client') {
    throw ApiError.forbidden('Non autorisé');
  }
  await review.deleteOne();
  ApiResponse.success(res, null, 'Avis supprimé');
});

export const markHelpful = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { $inc: { helpfulCount: 1 } }, { new: true });
  if (!review) throw ApiError.notFound('Avis non trouvé');
  ApiResponse.success(res, review);
});

// Admin
export const getAllReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req.query);
  const { status, search } = req.query;

  const filter: Record<string, unknown> = {};
  if (status && status !== 'all') filter.status = status;
  if (search) filter.$text = { $search: search as string };

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .populate('user', 'firstName lastName')
    .populate('product', 'name slug images')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  ApiResponse.paginated(res, reviews, getPaginationResult(total, { page, limit }));
});

export const approveReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.approveReview(req.params.id);
  ApiResponse.success(res, review, 'Avis approuvé');
});

export const rejectReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.rejectReview(req.params.id);
  ApiResponse.success(res, review, 'Avis rejeté');
});

export const replyToReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { adminReply: { text: req.body.text, date: new Date() } },
    { new: true }
  );
  if (!review) throw ApiError.notFound('Avis non trouvé');
  ApiResponse.success(res, review, 'Réponse ajoutée');
});
