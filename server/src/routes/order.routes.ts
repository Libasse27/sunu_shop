import { Router } from 'express';
import { createOrder, getMyOrders, getOrderById, trackOrder, cancelOrder, getAllOrders, updateOrderStatus, updateOrderTracking, updateOrderNotes, exportOrdersCSV } from '../controllers/order.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import { createOrderValidator, orderIdValidator, updateOrderStatusValidator, orderQueryValidator } from '../validators/order.validator';

const router = Router();

/**
 * @swagger
 * /orders/track/{orderNumber}:
 *   get:
 *     summary: Suivi d'une commande (public — sans authentification)
 *     tags: [Orders]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema: { type: string }
 *         example: ORD-20250405-0001
 *     responses:
 *       200:
 *         description: Statut et historique de la commande
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       404:
 *         description: Numéro de commande introuvable
 */
router.get('/track/:orderNumber', trackOrder);

router.use(protect);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Passer une commande
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, shippingAddress, payment]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product, quantity]
 *                   properties:
 *                     product: { type: string, description: "ObjectId du produit" }
 *                     quantity: { type: integer, minimum: 1 }
 *                     variant: { type: string, description: "Variante choisie (optionnel)" }
 *               shippingAddress:
 *                 type: object
 *                 required: [fullName, phone, street, city, country]
 *                 properties:
 *                   fullName: { type: string, example: "Amadou Diallo" }
 *                   phone: { type: string, example: "+221770000001" }
 *                   street: { type: string, example: "12 Avenue Cheikh Anta Diop" }
 *                   city: { type: string, example: "Dakar" }
 *                   region: { type: string, example: "Dakar" }
 *                   country: { type: string, example: "Sénégal" }
 *               payment:
 *                 type: object
 *                 required: [method]
 *                 properties:
 *                   method:
 *                     type: string
 *                     enum: [stripe, orange_money, wave, free_money, cash_on_delivery]
 *               couponCode: { type: string, example: "PROMO20" }
 *               customerNote: { type: string }
 *               isGift: { type: boolean, default: false }
 *               giftMessage: { type: string }
 *     responses:
 *       201:
 *         description: Commande créée — numéro de commande généré (ORD-YYYYMMDD-XXXX)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       400:
 *         description: Stock insuffisant ou données invalides
 *       401:
 *         description: Non authentifié
 */
router.post('/', createOrderValidator, validate, createOrder);

/**
 * @swagger
 * /orders/my-orders:
 *   get:
 *     summary: Mes commandes
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Liste paginée des commandes de l'utilisateur connecté
 */
router.get('/my-orders', orderQueryValidator, validate, getMyOrders);

// NOTE: /export doit être déclaré avant /:id pour éviter la capture par le paramètre dynamique
router.get('/export', adminOnly, exportOrdersCSV);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Détail d'une commande
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Détail de la commande
 *       403:
 *         description: Commande appartenant à un autre utilisateur
 *       404:
 *         description: Commande non trouvée
 */
router.get('/:id', orderIdValidator, validate, getOrderById);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   put:
 *     summary: Annuler une commande (uniquement si statut pending ou confirmed)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Commande annulée — stock restauré
 *       400:
 *         description: Commande non annulable (déjà expédiée, livrée, etc.)
 *       403:
 *         description: Non propriétaire de la commande
 */
router.put('/:id/cancel', orderIdValidator, validate, cancelOrder);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Toutes les commandes (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled, returned, refunded]
 *       - in: query
 *         name: paymentStatus
 *         schema: { type: string, enum: [pending, completed, failed, refunded] }
 *       - in: query
 *         name: paymentMethod
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string, description: "Recherche par numéro de commande" }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Liste paginée des commandes (admin)
 *       403:
 *         description: Rôle insuffisant
 */
router.get('/', adminOnly, orderQueryValidator, validate, getAllOrders);

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Mettre à jour le statut d'une commande (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, processing, shipped, delivered, cancelled, returned, refunded]
 *               note: { type: string, example: "Colis expédié via DHL - numéro SN123456" }
 *     responses:
 *       200:
 *         description: Statut mis à jour avec notification client
 *       404:
 *         description: Commande non trouvée
 */
router.put('/:id/status',   adminOnly, updateOrderStatusValidator, validate, updateOrderStatus);
router.put('/:id/tracking', adminOnly, updateOrderTracking);
router.put('/:id/notes',    adminOnly, updateOrderNotes);

export default router;
