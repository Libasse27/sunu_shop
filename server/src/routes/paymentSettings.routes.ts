import { Router } from 'express';
import { getPaymentSettings, updatePaymentSettings } from '../controllers/paymentSettings.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';

const router = Router();

// Public — checkout fetches QR code URLs
router.get('/', getPaymentSettings);

// Admin only — upload QR code URLs and phone numbers
router.put('/', protect, adminOnly, updatePaymentSettings);

export default router;
