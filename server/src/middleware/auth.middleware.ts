import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/generateToken';
import User from '../models/User.model';
import { ApiError } from '../utils/ApiError';

export const protect = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw ApiError.unauthorized('Token manquant, veuillez vous connecter');
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw ApiError.unauthorized('Utilisateur non trouvé');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Compte désactivé');
    }

    req.user = user as typeof req.user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Token invalide'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expiré'));
    }
    next(error);
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user as typeof req.user;
      }
    }
  } catch {
    // Silently continue without auth
  }
  next();
};
