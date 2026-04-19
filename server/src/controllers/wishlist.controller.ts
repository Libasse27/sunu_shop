import { Request, Response } from 'express';
import User from '../models/User.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id).populate('wishlist', 'name slug price compareAtPrice images rating numReviews stock');
  ApiResponse.success(res, user?.wishlist || []);
});

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.user!._id, { $addToSet: { wishlist: req.params.productId } });
  ApiResponse.success(res, null, 'Ajouté à la wishlist');
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.user!._id, { $pull: { wishlist: req.params.productId } });
  ApiResponse.success(res, null, 'Retiré de la wishlist');
});
