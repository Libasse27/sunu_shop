import { Router } from 'express';
import { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../controllers/coupon.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import { createCouponValidator, updateCouponValidator, couponIdValidator, applyCouponValidator } from '../validators/coupon.validator';

const router = Router();

/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     summary: Valider et appliquer un code promo
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, orderAmount]
 *             properties:
 *               code: { type: string, example: "PROMO20" }
 *               orderAmount:
 *                 type: integer
 *                 example: 150000
 *                 description: Montant du panier en FCFA (pour vérifier minOrderAmount)
 *     responses:
 *       200:
 *         description: Coupon valide — remise calculée retournée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         coupon: { $ref: '#/components/schemas/Coupon' }
 *                         discount:
 *                           type: integer
 *                           example: 30000
 *                           description: Montant de la remise en FCFA
 *                         finalAmount:
 *                           type: integer
 *                           example: 120000
 *                           description: Montant final après remise
 *       400:
 *         description: Code expiré, désactivé, ou montant minimum non atteint
 *       404:
 *         description: Code promo introuvable
 */
router.post('/validate', protect, applyCouponValidator, validate, validateCoupon);

// ─── Admin ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: Liste de tous les coupons (admin)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [percentage, fixed_amount, free_shipping] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Liste paginée des coupons
 *       403:
 *         description: Rôle insuffisant
 */
router.get('/', protect, adminOnly, getCoupons);

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Créer un code promo (admin)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, type, value]
 *             properties:
 *               code: { type: string, example: "ETE2025" }
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed_amount, free_shipping]
 *               value:
 *                 type: number
 *                 example: 15
 *                 description: "Pourcentage (0-100) ou montant FCFA selon le type"
 *               minOrderAmount: { type: integer, example: 50000, description: "Montant minimum de commande en FCFA" }
 *               maxUses: { type: integer, example: 100, description: "Nombre maximum d'utilisations totales" }
 *               maxUsesPerUser: { type: integer, example: 1, default: 1 }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *               isActive: { type: boolean, default: true }
 *               applicableCategories:
 *                 type: array
 *                 items: { type: string }
 *                 description: "ObjectIds de catégories (vide = toutes)"
 *               applicableProducts:
 *                 type: array
 *                 items: { type: string }
 *                 description: "ObjectIds de produits (vide = tous)"
 *     responses:
 *       201:
 *         description: Coupon créé
 *       400:
 *         description: Code déjà existant ou données invalides
 *       403:
 *         description: Rôle insuffisant
 */
router.post('/', protect, adminOnly, createCouponValidator, validate, createCoupon);

/**
 * @swagger
 * /coupons/{id}:
 *   put:
 *     summary: Mettre à jour un code promo (admin)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value: { type: number }
 *               isActive: { type: boolean }
 *               endDate: { type: string, format: date-time }
 *               maxUses: { type: integer }
 *     responses:
 *       200:
 *         description: Coupon mis à jour
 *       404:
 *         description: Coupon non trouvé
 */
router.put('/:id', protect, adminOnly, updateCouponValidator, validate, updateCoupon);

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     summary: Supprimer un code promo (admin)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Coupon supprimé
 *       404:
 *         description: Coupon non trouvé
 */
router.delete('/:id', protect, adminOnly, couponIdValidator, validate, deleteCoupon);

export default router;
