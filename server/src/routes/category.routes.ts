import { Router } from 'express';
import {
  getCategories, getCategoryBySlug, getCategoryTree,
  getAdminCategories, createCategory, updateCategory, deleteCategory,
} from '../controllers/category.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import { createCategoryValidator, updateCategoryValidator, categoryIdValidator } from '../validators/category.validator';
import { cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache.middleware';

const CATEGORIES_CACHE = 'cache:/api/v1/categories*';

const router = Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Catégories actives (pour le menu et les filtres boutique)
 *     tags: [Categories]
 *     security: []
 *     responses:
 *       200:
 *         description: Liste des catégories actives avec productCount
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Category' }
 */
router.get('/', cacheMiddleware(900), getCategories);

/**
 * @swagger
 * /categories/tree:
 *   get:
 *     summary: Arborescence hiérarchique des catégories (parent → enfants)
 *     tags: [Categories]
 *     security: []
 *     description: |
 *       Retourne les catégories racines (level=0) avec leur tableau `children`
 *       contenant les sous-catégories. Utile pour les mega-menus et les sidebars.
 *     responses:
 *       200:
 *         description: Arborescence complète
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Category'
 *                           - type: object
 *                             properties:
 *                               children:
 *                                 type: array
 *                                 items: { $ref: '#/components/schemas/Category' }
 */
router.get('/tree', cacheMiddleware(900), getCategoryTree);

/**
 * @swagger
 * /categories/admin/list:
 *   get:
 *     summary: Toutes les catégories (actives et inactives) — admin
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste complète (admin)
 *       403:
 *         description: Rôle insuffisant
 */
router.get('/admin/list', protect, adminOnly, getAdminCategories);

/**
 * @swagger
 * /categories/{slug}:
 *   get:
 *     summary: Détail d'une catégorie par son slug
 *     tags: [Categories]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         example: informatique
 *     responses:
 *       200:
 *         description: Catégorie trouvée avec ses sous-catégories
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Category' }
 *       404:
 *         description: Catégorie non trouvée ou inactive
 */
router.get('/:slug', cacheMiddleware(600), getCategoryBySlug);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Créer une catégorie (admin)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Informatique" }
 *               description: { type: string }
 *               parent: { type: string, nullable: true, description: "ObjectId de la catégorie parente (null pour racine)" }
 *               image:
 *                 type: object
 *                 properties:
 *                   url: { type: string }
 *                   publicId: { type: string }
 *               sortOrder: { type: integer, default: 0 }
 *               isActive: { type: boolean, default: true }
 *               isFeatured: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Catégorie créée (slug auto-généré)
 *       400:
 *         description: Validation échouée ou slug déjà existant
 *       403:
 *         description: Rôle insuffisant
 */
router.post('/', protect, adminOnly, createCategoryValidator, validate, invalidateCacheMiddleware(CATEGORIES_CACHE), createCategory);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Mettre à jour une catégorie (admin)
 *     tags: [Categories]
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
 *               name: { type: string }
 *               description: { type: string }
 *               isActive: { type: boolean }
 *               isFeatured: { type: boolean }
 *               sortOrder: { type: integer }
 *     responses:
 *       200:
 *         description: Catégorie mise à jour
 *       404:
 *         description: Catégorie non trouvée
 */
router.put('/:id', protect, adminOnly, updateCategoryValidator, validate, invalidateCacheMiddleware(CATEGORIES_CACHE), updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Supprimer une catégorie (admin)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     description: |
 *       Impossible de supprimer une catégorie avec des produits actifs.
 *       Désactiver d'abord les produits ou les réassigner.
 *     responses:
 *       200:
 *         description: Catégorie supprimée
 *       400:
 *         description: Catégorie contient des produits actifs
 *       404:
 *         description: Catégorie non trouvée
 */
router.delete('/:id', protect, adminOnly, categoryIdValidator, validate, invalidateCacheMiddleware(CATEGORIES_CACHE), deleteCategory);

export default router;
