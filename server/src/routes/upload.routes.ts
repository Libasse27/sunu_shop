import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { uploadSingle, uploadMultiple } from '../middleware/upload.middleware';
import {
  uploadImage,
  uploadImages,
  deleteImage,
} from '../controllers/upload.controller';

const router = Router();

router.post('/image', protect, adminOnly, uploadSingle, uploadImage);
router.post('/images', protect, adminOnly, uploadMultiple, uploadImages);
router.delete('/image/:publicId', protect, adminOnly, deleteImage);

export default router;
