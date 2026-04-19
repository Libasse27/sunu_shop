import { body } from 'express-validator';

export const createAnnouncementValidator = [
  // text required only when no image is provided
  body('text')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 300 }).withMessage('Le texte ne peut pas dépasser 300 caractères')
    .custom((value, { req }) => {
      if (!value && !req.body.image) {
        throw new Error("Le texte est requis quand aucune image n'est fournie");
      }
      return true;
    }),
  body('image')
    .optional()
    .trim()
    .isURL().withMessage("L'URL de l'image doit être valide"),
  body('link')
    .optional()
    .trim(),
  body('linkLabel')
    .optional()
    .trim()
    .isLength({ max: 60 }).withMessage('Le label du lien ne peut pas dépasser 60 caractères'),
  body('bgColor')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{3,6}$/).withMessage('bgColor doit être une couleur hexadécimale valide'),
  body('textColor')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{3,6}$/).withMessage('textColor doit être une couleur hexadécimale valide'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage("L'ordre doit être un entier positif"),
];

export const updateAnnouncementValidator = [
  body('text')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 300 }).withMessage('Le texte ne peut pas dépasser 300 caractères'),
  body('image')
    .optional()
    .trim()
    .isURL().withMessage("L'URL de l'image doit être valide"),
  body('link')
    .optional()
    .trim(),
  body('linkLabel')
    .optional()
    .trim()
    .isLength({ max: 60 }).withMessage('Le label du lien ne peut pas dépasser 60 caractères'),
  body('bgColor')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{3,6}$/).withMessage('bgColor doit être une couleur hexadécimale valide'),
  body('textColor')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{3,6}$/).withMessage('textColor doit être une couleur hexadécimale valide'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage("L'ordre doit être un entier positif"),
];

export const reorderAnnouncementsValidator = [
  body('items')
    .isArray({ min: 1 }).withMessage('items doit être un tableau non vide'),
  body('items.*.id')
    .isMongoId().withMessage("ID d'annonce invalide"),
  body('items.*.order')
    .isInt({ min: 0 }).withMessage("L'ordre doit être un entier positif"),
];
