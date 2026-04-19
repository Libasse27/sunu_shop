import { Router } from 'express';
import {
  getDashboardStats,
  getSalesData,
  getTopProducts,
  getLowStockProducts,
  getOrderStatusDistribution,
  getPaymentMethodDistribution,
  getRecentActivity,
  getRevenueSummary,
  getRevenueByCategory,
} from '../controllers/analytics.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';

const router = Router();

router.use(protect, adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesData);
router.get('/products/top', getTopProducts);
router.get('/products/low-stock', getLowStockProducts);
router.get('/orders/status', getOrderStatusDistribution);
router.get('/payments/methods', getPaymentMethodDistribution);
router.get('/recent-activity', getRecentActivity);
router.get('/revenue-summary', getRevenueSummary);
router.get('/revenue-by-category', getRevenueByCategory);

export default router;
