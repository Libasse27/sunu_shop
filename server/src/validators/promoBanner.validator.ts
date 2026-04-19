import { body } from 'express-validator';

export const createPromoBannerValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Le titre est requis')
    .isLength({ max: 200 }).withMessage('Le titre ne peut pas dépasser 200 caractères'),
  body('badge')
    .optional()
    .trim()
    .isLength({ max: 80 }).withMessage('Le badge ne peut pas dépasser 80 caractères'),
  body('highlight')
    .optional()
    .trim()
    .isLength({ max: 80 }).withMessage('Le highlight ne peut pas dépasser 80 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('La description ne peut pas dépasser 300 caractères'),
  body('buttonText')
    .optional()
    .trim()
    .isLength({ max: 80 }).withMessage('Le texte du bouton ne peut pas dépasser 80 caractères'),
  body('buttonLink')
    .optional()
    .trim(),
  body('accentColor')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{3,6}$/).withMessage('accentColor doit être une couleur hexadécimale valide'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage("L'ordre doit être un entier positif"),
];

export const updatePromoBannerValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Le titre ne peut pas dépasser 200 caractères'),
  body('accentColor')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{3,6}$/).withMessage('accentColor doit être une couleur hexadécimale valide'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage("L'ordre doit être un entier positif"),
];
