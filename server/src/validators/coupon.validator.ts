import { body, param } from 'express-validator';

export const createCouponValidator = [
  body('code')
    .trim()
    .notEmpty().withMessage('Le code du coupon est requis')
    .isLength({ min: 3, max: 20 }).withMessage('Le code doit contenir entre 3 et 20 caractères'),
  body('type')
    .notEmpty().withMessage('Le type est requis')
    .isIn(['percentage', 'fixed_amount', 'free_shipping']).withMessage('Type invalide'),
  body('value')
    .notEmpty().withMessage('La valeur est requise')
    .isFloat({ min: 0 }).withMessage('La valeur doit être positive'),
  body('startDate')
    .notEmpty().withMessage('La date de début est requise')
    .isISO8601().withMessage('Date de début invalide'),
  body('endDate')
    .notEmpty().withMessage('La date de fin est requise')
    .isISO8601().withMessage('Date de fin invalide'),
  body('minOrderAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le montant minimum doit être positif'),
  body('maxDiscount')
    .optional()
    .isFloat({ min: 0 }).withMessage('La réduction maximale doit être positive'),
  body('maxUsage')
    .optional()
    .isInt({ min: 1 }).withMessage("Le nombre d'utilisations doit être au moins 1"),
  body('maxUsagePerUser')
    .optional()
    .isInt({ min: 1 }).withMessage("Le nombre d'utilisations par utilisateur doit être au moins 1"),
];

export const updateCouponValidator = [
  param('id').isMongoId().withMessage('ID de coupon invalide'),
  body('value')
    .optional()
    .isFloat({ min: 0 }).withMessage('La valeur doit être positive'),
  body('startDate')
    .optional()
    .isISO8601().withMessage('Date de début invalide'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('Date de fin invalide'),
];

export const couponIdValidator = [
  param('id').isMongoId().withMessage('ID de coupon invalide'),
];

export const applyCouponValidator = [
  body('code')
    .trim()
    .notEmpty().withMessage('Le code du coupon est requis'),
];
