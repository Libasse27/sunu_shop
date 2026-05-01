import { body } from 'express-validator';

export const createBannerValidator = [
  body('type')
    .optional()
    .isIn(['hero', 'promo']).withMessage('type doit être "hero" ou "promo"'),
  body('title')
    .trim()
    .notEmpty().withMessage('Le titre est requis')
    .isLength({ max: 200 }).withMessage('Le titre ne peut pas dépasser 200 caractères'),
  body('subtitle')
    .optional().trim()
    .isLength({ max: 200 }).withMessage('Le sous-titre ne peut pas dépasser 200 caractères'),
  body('description')
    .optional().trim()
    .isLength({ max: 500 }).withMessage('La description ne peut pas dépasser 500 caractères'),
  body('badge')
    .optional().trim()
    .isLength({ max: 100 }).withMessage('Le badge ne peut pas dépasser 100 caractères'),
  body('buttonText')
    .optional().trim()
    .isLength({ max: 100 }).withMessage('Le texte du bouton ne peut pas dépasser 100 caractères'),
  body('buttonLink')
    .optional().trim(),
  body('image')
    .optional().trim(),
  body('highlight')
    .optional().trim()
    .isLength({ max: 80 }).withMessage('Le texte mis en avant ne peut pas dépasser 80 caractères'),
  body('accentColor')
    .optional().trim()
    .matches(/^#[0-9A-Fa-f]{3,6}$/).withMessage('accentColor doit être une couleur hexadécimale valide'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage("L'ordre doit être un entier positif"),
];

export const updateBannerValidator = [
  body('title')
    .optional().trim()
    .isLength({ max: 200 }).withMessage('Le titre ne peut pas dépasser 200 caractères'),
  body('accentColor')
    .optional().trim()
    .matches(/^#[0-9A-Fa-f]{3,6}$/).withMessage('accentColor doit être une couleur hexadécimale valide'),
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
