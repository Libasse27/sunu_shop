import { Router } from 'express';
import { getProductReviews, createReview, updateReview, deleteReview, markHelpful, getAllReviews, approveReview, rejectReview, replyToReview } from '../controllers/review.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache.middleware';

const REVIEWS_CACHE = 'cache:/api/v1/reviews*';

const router = Router();

/**
 * @swagger
 * /reviews/product/{productId}:
 *   get:
 *     summary: Avis approuvés d'un produit
 *     tags: [Reviews]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, highest, lowest, helpful]
 *           default: newest
 *     responses:
 *       200:
 *         description: Liste paginée des avis approuvés
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
 *                         reviews:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Review' }
 *                         stats:
 *                           type: object
 *                           properties:
 *                             average: { type: number, example: 4.3 }
 *                             total: { type: integer, example: 18 }
 *                             distribution:
 *                               type: object
 *                               example: { "5": 10, "4": 5, "3": 2, "2": 1, "1": 0 }
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/product/:productId', cacheMiddleware(120), getProductReviews);

router.use(protect);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Soumettre un avis produit
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product, rating, comment]
 *             properties:
 *               product: { type: string, description: "ObjectId du produit" }
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               title: { type: string, example: "Très bon produit" }
 *               comment: { type: string, example: "Livraison rapide, produit conforme." }
 *               pros: { type: array, items: { type: string } }
 *               cons: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Avis soumis — en attente de modération (status = pending)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         description: Champs requis manquants ou avis déjà soumis pour ce produit
 *       401:
 *         description: Non authentifié
 */
router.post('/', invalidateCacheMiddleware(REVIEWS_CACHE), createReview);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Modifier son propre avis
 *     tags: [Reviews]
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
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               title: { type: string }
 *               comment: { type: string }
 *     responses:
 *       200:
 *         description: Avis mis à jour (repassé en pending pour re-modération)
 *       403:
 *         description: L'avis n'appartient pas à l'utilisateur connecté
 *       404:
 *         description: Avis non trouvé
 */
router.put('/:id', invalidateCacheMiddleware(REVIEWS_CACHE), updateReview);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Supprimer son propre avis (ou admin)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Avis supprimé
 *       403:
 *         description: Non propriétaire et non admin
 *       404:
 *         description: Avis non trouvé
 */
router.delete('/:id', invalidateCacheMiddleware(REVIEWS_CACHE), deleteReview);

/**
 * @swagger
 * /reviews/{id}/helpful:
 *   post:
 *     summary: Marquer un avis comme utile (toggle)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Vote enregistré ou retiré
 */
router.post('/:id/helpful', markHelpful);

// ─── Admin ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Tous les avis — modération admin
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filtrer par statut de modération
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Recherche dans le commentaire ou le produit
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Liste paginée avec filtre statut
 *       403:
 *         description: Rôle insuffisant (admin requis)
 */
router.get('/', adminOnly, getAllReviews);

/**
 * @swagger
 * /reviews/{id}/approve:
 *   patch:
 *     summary: Approuver un avis (admin)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Avis approuvé — isApproved=true, status=approved, rating produit mis à jour
 *       403:
 *         description: Rôle insuffisant
 *       404:
 *         description: Avis non trouvé
 */
router.put('/:id/approve', adminOnly, invalidateCacheMiddleware(REVIEWS_CACHE), approveReview);    // rétrocompat
router.patch('/:id/approve', adminOnly, invalidateCacheMiddleware(REVIEWS_CACHE), approveReview);  // client admin API

/**
 * @swagger
 * /reviews/{id}/reject:
 *   patch:
 *     summary: Rejeter un avis (admin)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Avis rejeté — isApproved=false, status=rejected
 *       403:
 *         description: Rôle insuffisant
 */
router.patch('/:id/reject', adminOnly, invalidateCacheMiddleware(REVIEWS_CACHE), rejectReview);

/**
 * @swagger
 * /reviews/{id}/reply:
 *   post:
 *     summary: Répondre à un avis (admin)
 *     tags: [Reviews]
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
 *             required: [reply]
 *             properties:
 *               reply: { type: string, example: "Merci pour votre retour, nous prenons note." }
 *     responses:
 *       200:
 *         description: Réponse enregistrée
 *       403:
 *         description: Rôle insuffisant
 */
router.post('/:id/reply', adminOnly, replyToReview);

export default router;
