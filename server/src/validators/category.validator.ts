import { body, param } from 'express-validator';

export const createCategoryValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom de la catégorie est requis')
    .isLength({ max: 100 }).withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La description ne peut pas dépasser 500 caractères'),
  body('parent')
    .optional({ values: 'null' })
    .isMongoId().withMessage('ID de catégorie parent invalide'),
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage("L'ordre doit être un entier positif"),
  body('image.url')
    .optional()
    .isURL().withMessage("URL d'image invalide"),
];

export const updateCategoryValidator = [
  param('id').isMongoId().withMessage('ID de catégorie invalide'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La description ne peut pas dépasser 500 caractères'),
  body('parent')
    .optional({ values: 'null' })
    .isMongoId().withMessage('ID de catégorie parent invalide'),
];

export const categoryIdValidator = [
  param('id').isMongoId().withMessage('ID de catégorie invalide'),
];
