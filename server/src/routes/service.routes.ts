import { Router } from 'express';
import {
  getServices, getAllServices, getServiceBySlug,
  createService, updateService, deleteService,
} from '../controllers/service.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import { createServiceValidator, updateServiceValidator } from '../validators/service.validator';

const router = Router();

// Public routes
router.get('/', getServices);
router.get('/slug/:slug', getServiceBySlug);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllServices);
router.post('/', protect, adminOnly, createServiceValidator, validate, createService);
router.put('/:id', protect, adminOnly, updateServiceValidator, validate, updateService);
router.delete('/:id', protect, adminOnly, deleteService);

export default router;
