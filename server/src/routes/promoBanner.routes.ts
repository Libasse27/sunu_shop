import { Router } from 'express';
import {
  getActivePromoBanner, getAllPromoBanners,
  createPromoBanner, updatePromoBanner, deletePromoBanner,
} from '../controllers/promoBanner.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import { createPromoBannerValidator, updatePromoBannerValidator } from '../validators/promoBanner.validator';
import { cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache.middleware';

const PROMO_CACHE = 'cache:/api/v1/promo-banners*';

const router = Router();

router.get('/', cacheMiddleware(300), getActivePromoBanner);
router.get('/admin/all', protect, adminOnly, getAllPromoBanners);
router.post('/', protect, adminOnly, createPromoBannerValidator, validate, invalidateCacheMiddleware(PROMO_CACHE), createPromoBanner);
router.put('/:id', protect, adminOnly, updatePromoBannerValidator, validate, invalidateCacheMiddleware(PROMO_CACHE), updatePromoBanner);
router.delete('/:id', protect, adminOnly, invalidateCacheMiddleware(PROMO_CACHE), deletePromoBanner);

export default router;
