/**
 * Appends Cloudinary transformation parameters to a stored image URL.
 * Only modifies URLs from res.cloudinary.com; passes through all other URLs unchanged.
 *
 * Example:
 *   cloudinaryUrl('https://res.cloudinary.com/demo/image/upload/sample.jpg', 'w_400,f_auto,q_auto')
 *   → 'https://res.cloudinary.com/demo/image/upload/w_400,f_auto,q_auto/sample.jpg'
 */
export function cloudinaryUrl(url: string | undefined | null, transforms: string): string {
  if (!url) return '/placeholder.jpg';
  if (!url.includes('res.cloudinary.com')) return url;
  // Avoid double-transforming: if already has transforms (e.g. /upload/w_800/)
  if (url.match(/\/upload\/[a-z_,0-9]+\//)) return url;
  return url.replace('/upload/', `/upload/${transforms}/`);
}

/** Presets for common use-cases */
export const CLD = {
  /** Product card thumbnail — 400×400 WebP */
  card:     (url: string | undefined | null) => cloudinaryUrl(url, 'w_400,h_400,c_fill,f_auto,q_auto'),
  /** Product detail main image — 800×800 WebP */
  detail:   (url: string | undefined | null) => cloudinaryUrl(url, 'w_800,h_800,c_fill,f_auto,q_auto'),
  /** Product detail thumbnail strip — 100×100 */
  thumb:    (url: string | undefined | null) => cloudinaryUrl(url, 'w_100,h_100,c_fill,f_auto,q_70'),
  /** Admin table tiny icon — 80×80 */
  admin:    (url: string | undefined | null) => cloudinaryUrl(url, 'w_80,h_80,c_fill,f_auto,q_70'),
  /** Category image */
  category: (url: string | undefined | null) => cloudinaryUrl(url, 'w_300,h_200,c_fill,f_auto,q_auto'),
};
