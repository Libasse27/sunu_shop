import { Router } from 'express';
import {
  getProducts, getProductBySlug, getProductById, getFeaturedProducts,
  getNewArrivals, getBestSellers, getOnSaleProducts, getRelatedProducts,
  getProductsByCategory, createProduct, updateProduct, deleteProduct,
  getAdminProducts, updateStock, bulkUpdateProducts, bulkDeleteProducts,
} from '../controllers/product.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createProductValidator, updateProductValidator, productIdValidator,
  productQueryValidator, updateStockValidator, bulkUpdateValidator,
} from '../validators/product.validator';
import { cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache.middleware';

const PRODUCTS_CACHE = 'cache:/api/v1/products*';

const router = Router();

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Liste des produits avec filtres et pagination
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Recherche fulltext (nom, description, tags)
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: ID de la catégorie
 *       - in: query
 *         name: minPrice
 *         schema: { type: integer }
 *         description: Prix minimum en FCFA
 *       - in: query
 *         name: maxPrice
 *         schema: { type: integer }
 *         description: Prix maximum en FCFA
 *       - in: query
 *         name: rating
 *         schema: { type: number, minimum: 1, maximum: 5 }
 *       - in: query
 *         name: inStock
 *         schema: { type: boolean }
 *       - in: query
 *         name: onSale
 *         schema: { type: boolean }
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, newest, popular, rating, bestseller]
 *     responses:
 *       200:
 *         description: Liste paginée des produits actifs
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
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', productQueryValidator, validate, cacheMiddleware(120), getProducts);

/**
 * @swagger
 * /products/featured:
 *   get:
 *     summary: Produits en vedette (homepage)
 *     tags: [Products]
 *     security: []
 *     responses:
 *       200:
 *         description: Jusqu'à 8 produits isFeatured=true
 */
router.get('/featured', cacheMiddleware(300), getFeaturedProducts);

/**
 * @swagger
 * /products/new-arrivals:
 *   get:
 *     summary: Nouvelles arrivées
 *     tags: [Products]
 *     security: []
 *     responses:
 *       200:
 *         description: Jusqu'à 8 produits isNewArrival=true
 */
router.get('/new-arrivals', cacheMiddleware(300), getNewArrivals);

/**
 * @swagger
 * /products/best-sellers:
 *   get:
 *     summary: Meilleures ventes
 *     tags: [Products]
 *     security: []
 *     responses:
 *       200:
 *         description: Jusqu'à 8 produits triés par totalSold
 */
router.get('/best-sellers', cacheMiddleware(300), getBestSellers);

/**
 * @swagger
 * /products/on-sale:
 *   get:
 *     summary: Produits en promotion
 *     tags: [Products]
 *     security: []
 *     responses:
 *       200:
 *         description: Jusqu'à 12 produits isOnSale=true
 */
router.get('/on-sale', cacheMiddleware(300), getOnSaleProducts);

/**
 * @swagger
 * /products/slug/{slug}:
 *   get:
 *     summary: Détail d'un produit par son slug (URL SEO)
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         example: laptop-asus-vivobook-15
 *     responses:
 *       200:
 *         description: Produit trouvé (incrémente viewCount)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       404:
 *         description: Produit non trouvé ou inactif
 */
router.get('/slug/:slug', cacheMiddleware(600), getProductBySlug);

/**
 * @swagger
 * /products/category/{categoryId}:
 *   get:
 *     summary: Produits d'une catégorie spécifique
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Liste paginée des produits de la catégorie
 */
router.get('/category/:categoryId', cacheMiddleware(120), getProductsByCategory);

/**
 * @swagger
 * /products/admin/list:
 *   get:
 *     summary: Liste admin — tous les produits (actifs et inactifs)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: isFeatured
 *         schema: { type: boolean }
 *       - in: query
 *         name: isOnSale
 *         schema: { type: boolean }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste paginée (admin)
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Rôle insuffisant
 */
router.get('/admin/list', protect, adminOnly, getAdminProducts);

/**
 * @swagger
 * /products/admin/bulk-update:
 *   put:
 *     summary: Mise à jour en masse de produits
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids, update]
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: string }
 *               update:
 *                 type: object
 *                 description: "Champs autorisés: isActive, isFeatured, isNewArrival, isBestSeller, isOnSale, category"
 *     responses:
 *       200:
 *         description: Nombre de produits mis à jour
 */
router.put('/admin/bulk-update', protect, adminOnly, bulkUpdateValidator, validate, invalidateCacheMiddleware(PRODUCTS_CACHE), bulkUpdateProducts);

/**
 * @swagger
 * /products/admin/bulk-delete:
 *   delete:
 *     summary: Suppression en masse (soft delete — isActive = false)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Nombre de produits désactivés
 */
router.delete('/admin/bulk-delete', protect, adminOnly, invalidateCacheMiddleware(PRODUCTS_CACHE), bulkDeleteProducts);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Créer un produit
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, sku, price, category, images]
 *             properties:
 *               name: { type: string, example: "Laptop Asus VivoBook 15" }
 *               description: { type: string }
 *               shortDescription: { type: string }
 *               sku: { type: string, example: "SKU-ASUS-001" }
 *               price: { type: integer, example: 350000, description: "Prix en FCFA" }
 *               compareAtPrice: { type: integer, example: 400000 }
 *               category: { type: string, description: "ObjectId de la catégorie" }
 *               stock: { type: integer, example: 10, default: 0 }
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url: { type: string }
 *                     isPrimary: { type: boolean, default: false }
 *               isFeatured: { type: boolean, default: false }
 *               isNewArrival: { type: boolean, default: false }
 *               isOnSale: { type: boolean, default: false }
 *               tags: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Produit créé (slug auto-généré depuis name)
 *       400:
 *         description: Validation échouée
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Rôle insuffisant
 */
router.post('/', protect, adminOnly, createProductValidator, validate, invalidateCacheMiddleware(PRODUCTS_CACHE), createProduct);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Détail d'un produit par ID
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Produit trouvé
 *       404:
 *         description: Produit non trouvé
 */
router.get('/:id', productIdValidator, validate, cacheMiddleware(600), getProductById);

/**
 * @swagger
 * /products/{id}/related:
 *   get:
 *     summary: Produits connexes (même catégorie ou tags)
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Jusqu'à 4 produits connexes
 */
router.get('/:id/related', productIdValidator, validate, cacheMiddleware(300), getRelatedProducts);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Mettre à jour un produit
 *     tags: [Products]
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
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Produit mis à jour
 *       404:
 *         description: Produit non trouvé
 */
router.put('/:id', protect, adminOnly, updateProductValidator, validate, invalidateCacheMiddleware(PRODUCTS_CACHE), updateProduct);

/**
 * @swagger
 * /products/{id}/stock:
 *   patch:
 *     summary: Mettre à jour le stock d'un produit
 *     tags: [Products]
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
 *             required: [stock]
 *             properties:
 *               stock: { type: integer, minimum: 0, example: 25 }
 *     responses:
 *       200:
 *         description: Stock mis à jour
 */
router.patch('/:id/stock', protect, adminOnly, updateStockValidator, validate, invalidateCacheMiddleware(PRODUCTS_CACHE), updateStock);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Supprimer un produit (soft delete — isActive = false)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Produit désactivé
 *       404:
 *         description: Produit non trouvé
 */
router.delete('/:id', protect, adminOnly, productIdValidator, validate, invalidateCacheMiddleware(PRODUCTS_CACHE), deleteProduct);

export default router;
