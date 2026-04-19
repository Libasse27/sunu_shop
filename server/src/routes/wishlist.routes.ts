import { Router } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlist.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Récupérer la liste de souhaits de l'utilisateur connecté
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des produits dans la wishlist
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Product' }
 *       401:
 *         description: Non authentifié
 */
router.get('/', getWishlist);

/**
 * @swagger
 * /wishlist/{productId}:
 *   post:
 *     summary: Ajouter un produit à la wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *         description: ObjectId du produit à ajouter
 *     responses:
 *       200:
 *         description: Produit ajouté (idempotent — pas d'erreur si déjà présent)
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Produit non trouvé
 */
router.post('/:productId', addToWishlist);

/**
 * @swagger
 * /wishlist/{productId}:
 *   delete:
 *     summary: Retirer un produit de la wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Produit retiré
 *       401:
 *         description: Non authentifié
 */
router.delete('/:productId', removeFromWishlist);

export default router;
