import { Router } from 'express';
import {
  getActiveAnnouncements, getAllAnnouncements,
  createAnnouncement, updateAnnouncement, deleteAnnouncement, reorderAnnouncements,
} from '../controllers/announcement.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import { createAnnouncementValidator, updateAnnouncementValidator, reorderAnnouncementsValidator } from '../validators/announcement.validator';
import { cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache.middleware';

const ANNOUNCEMENTS_CACHE = 'cache:/api/v1/announcements*';

const router = Router();

router.get('/', cacheMiddleware(300), getActiveAnnouncements);
router.get('/admin/all', protect, adminOnly, getAllAnnouncements);
router.post('/', protect, adminOnly, createAnnouncementValidator, validate, invalidateCacheMiddleware(ANNOUNCEMENTS_CACHE), createAnnouncement);
router.put('/reorder', protect, adminOnly, reorderAnnouncementsValidator, validate, invalidateCacheMiddleware(ANNOUNCEMENTS_CACHE), reorderAnnouncements);
router.put('/:id', protect, adminOnly, updateAnnouncementValidator, validate, invalidateCacheMiddleware(ANNOUNCEMENTS_CACHE), updateAnnouncement);
router.delete('/:id', protect, adminOnly, invalidateCacheMiddleware(ANNOUNCEMENTS_CACHE), deleteAnnouncement);

export default router;
