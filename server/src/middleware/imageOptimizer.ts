import sharp from 'sharp';

interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Optimise une image avant upload Cloudinary.
 * - Redimensionne (fit: inside, sans agrandissement)
 * - Convertit en WebP pour réduire le poids (30-50% vs JPEG)
 * - Qualité 82 — bon compromis visuel/poids pour connexions lentes
 */
export const optimizeImage = async (
  buffer: Buffer,
  options: OptimizeOptions = {}
): Promise<Buffer> => {
  const {
    width = 800,
    height = 800,
    quality = 82,
    format = 'webp',
  } = options;

  return sharp(buffer)
    .resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true, // ne pas agrandir les petites images
    })
    [format]({ quality })
    .toBuffer();
};

/**
 * Optimise pour les thumbnails (liste produits, admin).
 */
export const optimizeThumbnail = async (buffer: Buffer): Promise<Buffer> => {
  return optimizeImage(buffer, { width: 400, height: 400, quality: 75 });
};
