import { body, param, query } from 'express-validator';

export const createOrderValidator = [
  body('items')
    .isArray({ min: 1 }).withMessage('Au moins un article est requis'),
  body('items.*.product')
    .isMongoId().withMessage('ID de produit invalide'),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('La quantité doit être au moins 1'),
  body('shippingAddress.fullName')
    .trim()
    .notEmpty().withMessage('Le nom complet est requis'),
  body('shippingAddress.phone')
    .trim()
    .notEmpty().withMessage('Le téléphone est requis'),
  body('shippingAddress.street')
    .trim()
    .notEmpty().withMessage("L'adresse est requise"),
  body('shippingAddress.city')
    .trim()
    .notEmpty().withMessage('La ville est requise'),
  body('shippingAddress.country')
    .optional()
    .trim(),
  body('payment.method')
    .notEmpty().withMessage('La méthode de paiement est requise')
    .isIn(['stripe', 'orange_money', 'wave', 'cash_on_delivery']).withMessage('Méthode de paiement invalide'),
];

export const orderIdValidator = [
  param('id').isMongoId().withMessage('ID de commande invalide'),
];

export const updateOrderStatusValidator = [
  param('id').isMongoId().withMessage('ID de commande invalide'),
  body('status')
    .notEmpty().withMessage('Le statut est requis')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'])
    .withMessage('Statut invalide'),
  body('note')
    .optional()
    .trim(),
];

export const orderQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide'),
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'])
    .withMessage('Statut invalide'),
];
