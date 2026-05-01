import { body, param, query } from 'express-validator';

export const createProductValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom du produit est requis')
    .isLength({ max: 200 }).withMessage('Le nom ne peut pas dépasser 200 caractères'),
  body('description')
    .trim()
    .notEmpty().withMessage('La description est requise')
    .isLength({ max: 5000 }).withMessage('La description ne peut pas dépasser 5000 caractères'),
  body('sku')
    .trim()
    .notEmpty().withMessage('Le SKU est requis'),
  body('price')
    .notEmpty().withMessage('Le prix est requis')
    .isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
  body('compareAtPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le prix comparatif doit être positif'),
  body('category')
    .notEmpty().withMessage('La catégorie est requise')
    .isMongoId().withMessage('ID de catégorie invalide'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Le stock doit être un entier positif'),
  body('images')
    .optional()
    .isArray().withMessage('Les images doivent être un tableau'),
  body('images.*.url')
    .optional()
    .isURL().withMessage('URL d\'image invalide'),
  body('tags')
    .optional()
    .isArray().withMessage('Les tags doivent être un tableau'),
  body('weight')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le poids doit être positif'),
];

export const updateProductValidator = [
  param('id').isMongoId().withMessage('ID de produit invalide'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Le nom ne peut pas dépasser 200 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('La description ne peut pas dépasser 5000 caractères'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
  body('category')
    .optional()
    .isMongoId().withMessage('ID de catégorie invalide'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Le stock doit être un entier positif'),
];

export const productIdValidator = [
  param('id').isMongoId().withMessage('ID de produit invalide'),
];

export const productQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide (1-100)'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Prix minimum invalide'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Prix maximum invalide'),
  query('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Note invalide (0-5)'),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'newest', 'popular', 'rating', 'bestseller']).withMessage('Tri invalide'),
];

export const updateStockValidator = [
  param('id').isMongoId().withMessage('ID de produit invalide'),
  body('stock')
    .notEmpty().withMessage('Le stock est requis')
    .isInt({ min: 0 }).withMessage('Le stock doit être un entier positif'),
];

export const bulkUpdateValidator = [
  body('ids')
    .isArray({ min: 1 }).withMessage('Au moins un ID est requis'),
  body('ids.*')
    .isMongoId().withMessage('ID de produit invalide'),
  body('update')
    .notEmpty().withMessage('Les données de mise à jour sont requises')
    .isObject().withMessage('Les données doivent être un objet'),
];
