import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { optimizeImage } from '../middleware/imageOptimizer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format: 'webp', // format imposé après optimisation Sharp
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Upload failed'));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('Aucune image fournie');
  }

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw ApiError.internal('Cloudinary n\'est pas configuré');
  }

  try {
    // Optimisation Sharp avant Cloudinary — WebP 800x800, qualité 82
    const optimizedBuffer = await optimizeImage(req.file.buffer);
    const result = await uploadToCloudinary(optimizedBuffer, 'sunushop/products');

    ApiResponse.success(res, {
      url: result.url,
      publicId: result.publicId,
    }, 'Image uploadée avec succès');
  } catch (error: any) {
    console.error('Cloudinary upload error:', error.message);
    throw ApiError.internal('Erreur lors de l\'upload de l\'image');
  }
});

export const uploadImages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw ApiError.badRequest('Aucune image fournie');
  }

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw ApiError.internal('Cloudinary n\'est pas configuré');
  }

  try {
    // Optimiser toutes les images en parallèle, puis uploader
    const uploadPromises = (req.files as Express.Multer.File[]).map(async (file) => {
      const optimizedBuffer = await optimizeImage(file.buffer);
      return uploadToCloudinary(optimizedBuffer, 'sunushop/products');
    });

    const results = await Promise.all(uploadPromises);

    const images = results.map(result => ({
      url: result.url,
      publicId: result.publicId,
    }));

    ApiResponse.success(res, images, `${images.length} image(s) uploadée(s) avec succès`);
  } catch (error: any) {
    console.error('Cloudinary upload error:', error.message);
    throw ApiError.internal('Erreur lors de l\'upload des images');
  }
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const { publicId } = req.params;

  if (!publicId) {
    throw ApiError.badRequest('Public ID manquant');
  }

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw ApiError.internal('Cloudinary n\'est pas configuré');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok' || result.result === 'not found') {
      ApiResponse.success(res, null, 'Image supprimée avec succès');
    } else {
      throw ApiError.internal('Erreur lors de la suppression de l\'image');
    }
  } catch (error: any) {
    console.error('Cloudinary delete error:', error.message);
    throw ApiError.internal('Erreur lors de la suppression de l\'image');
  }
});
