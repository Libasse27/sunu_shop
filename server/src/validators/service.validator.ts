import { body } from 'express-validator';

export const createServiceValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Le titre est requis')
    .isLength({ max: 200 }).withMessage('Le titre ne peut pas dépasser 200 caractères'),
  body('description')
    .trim()
    .notEmpty().withMessage('La description est requise')
    .isLength({ max: 3000 }).withMessage('La description ne peut pas dépasser 3000 caractères'),
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('La description courte ne peut pas dépasser 300 caractères'),
  body('category')
    .trim()
    .notEmpty().withMessage('La catégorie est requise'),
  body('startingPrice')
    .notEmpty().withMessage('Le prix de départ est requis')
    .isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
  body('estimatedDuration')
    .optional()
    .trim(),
  body('whatsappMessage')
    .optional()
    .trim(),
  body('features')
    .optional()
    .isArray().withMessage('Les fonctionnalités doivent être un tableau'),
  body('features.*')
    .optional()
    .trim()
    .isString().withMessage('Chaque fonctionnalité doit être une chaîne'),
  body('isAvailable')
    .optional()
    .isBoolean().withMessage('isAvailable doit être un booléen'),
];

export const updateServiceValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Le titre ne peut pas dépasser 200 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 3000 }).withMessage('La description ne peut pas dépasser 3000 caractères'),
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('La description courte ne peut pas dépasser 300 caractères'),
  body('startingPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
  body('features')
    .optional()
    .isArray().withMessage('Les fonctionnalités doivent être un tableau'),
  body('isAvailable')
    .optional()
    .isBoolean().withMessage('isAvailable doit être un booléen'),
];
