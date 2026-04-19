import { body } from 'express-validator';

export const subscribeValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage("L'email est requis")
    .isEmail().withMessage("L'email est invalide")
    .normalizeEmail(),
];

export const unsubscribeValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage("L'email est requis")
    .isEmail().withMessage("L'email est invalide")
    .normalizeEmail(),
];

export const sendNewsletterValidator = [
  body('subject')
    .trim()
    .notEmpty().withMessage("L'objet est requis")
    .isLength({ max: 200 }).withMessage("L'objet ne peut pas dépasser 200 caractères"),
  body('body')
    .trim()
    .notEmpty().withMessage('Le contenu est requis'),
];
