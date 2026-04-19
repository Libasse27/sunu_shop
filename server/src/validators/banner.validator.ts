import { body } from 'express-validator';

export const createBannerValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Le titre est requis')
    .isLength({ max: 200 }).withMessage('Le titre ne peut pas dépasser 200 caractères'),
  body('subtitle')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Le sous-titre ne peut pas dépasser 200 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La description ne peut pas dépasser 500 caractères'),
  body('badge')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Le badge ne peut pas dépasser 100 caractères'),
  body('cta')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Le CTA ne peut pas dépasser 100 caractères'),
  body('link')
    .optional()
    .trim(),
  body('image')
    .trim()
    .notEmpty().withMessage("L'image est requise"),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage("L'ordre doit être un entier positif"),
];

export const updateBannerValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Le titre ne peut pas dépasser 200 caractères'),
  body('subtitle')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Le sous-titre ne peut pas dépasser 200 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La description ne peut pas dépasser 500 caractères'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage("L'ordre doit être un entier positif"),
];

export const reorderBannersValidator = [
  body('items')
    .isArray({ min: 1 }).withMessage('items doit être un tableau non vide'),
  body('items.*.id')
    .isMongoId().withMessage('ID de bannière invalide'),
  body('items.*.order')
    .isInt({ min: 0 }).withMessage("L'ordre doit être un entier positif"),
];
