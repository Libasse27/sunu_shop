import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const adminOnly = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return next(ApiError.forbidden('Accès réservé aux administrateurs'));
  }
  next();
};

export const superAdminOnly = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return next(ApiError.forbidden('Accès réservé aux super administrateurs'));
  }
  next();
};
