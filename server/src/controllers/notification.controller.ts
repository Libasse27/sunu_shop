import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { getPagination, getPaginationResult } from '../utils/pagination';
import Notification from '../models/Notification.model';

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req.query);
  const filter = { user: req.user!._id };

  const total = await Notification.countDocuments(filter);
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  ApiResponse.paginated(res, notifications, getPaginationResult(total, { page, limit }));
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) throw ApiError.notFound('Notification non trouvée');

  if (notification.user.toString() !== req.user!._id.toString()) {
    throw ApiError.forbidden('Accès non autorisé');
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  ApiResponse.success(res, notification, 'Notification marquée comme lue');
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await Notification.updateMany(
    { user: req.user!._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  ApiResponse.success(res, { modifiedCount: result.modifiedCount }, 'Toutes les notifications marquées comme lues');
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) throw ApiError.notFound('Notification non trouvée');

  if (notification.user.toString() !== req.user!._id.toString()) {
    throw ApiError.forbidden('Accès non autorisé');
  }

  await notification.deleteOne();

  ApiResponse.success(res, null, 'Notification supprimée');
});
