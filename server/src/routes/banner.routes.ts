import { Router } from 'express';
import {
  getActiveBanners, getActivePromoBanner, getAllBanners,
  createBanner, updateBanner, deleteBanner, reorderBanners,
} from '../controllers/banner.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import { createBannerValidator, updateBannerValidator, reorderBannersValidator } from '../validators/banner.validator';
import { cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache.middleware';

const BANNERS_CACHE = 'cache:/api/v1/banners*';

const router = Router();

// Public
router.get('/', cacheMiddleware(300), getActiveBanners);
router.get('/promo', cacheMiddleware(300), getActivePromoBanner);

// Admin — GET /admin/all?type=hero|promo
router.get('/admin/all', protect, adminOnly, getAllBanners);
router.post('/', protect, adminOnly, createBannerValidator, validate, invalidateCacheMiddleware(BANNERS_CACHE), createBanner);
router.put('/reorder', protect, adminOnly, reorderBannersValidator, validate, invalidateCacheMiddleware(BANNERS_CACHE), reorderBanners);
router.put('/:id', protect, adminOnly, updateBannerValidator, validate, invalidateCacheMiddleware(BANNERS_CACHE), updateBanner);
router.delete('/:id', protect, adminOnly, invalidateCacheMiddleware(BANNERS_CACHE), deleteBanner);

export default router;
