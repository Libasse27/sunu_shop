import { Router } from 'express';
import {
  subscribe, unsubscribe, unsubscribeByToken,
  getSubscribers, getStats,
  sendNewsletter, getCampaigns,
} from '../controllers/newsletter.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import { subscribeValidator, unsubscribeValidator, sendNewsletterValidator } from '../validators/newsletter.validator';

const router = Router();

// Public
router.post('/subscribe', subscribeValidator, validate, subscribe);
router.post('/unsubscribe', unsubscribeValidator, validate, unsubscribe);
router.get('/unsubscribe', unsubscribeByToken);

// Admin
router.get('/', protect, adminOnly, getSubscribers);
router.get('/stats', protect, adminOnly, getStats);
router.post('/send', protect, adminOnly, sendNewsletterValidator, validate, sendNewsletter);
router.get('/campaigns', protect, adminOnly, getCampaigns);

export default router;
