import { Router } from 'express';
import {
  getDashboardStats,
  getSalesData,
  getTopProducts,
  getLowStockProducts,
  getOrderStatusDistribution,
  getPaymentMethodDistribution,
  getRecentActivity,
  getRevenueSummary,
  getRevenueByCategory,
  getTopCustomers,
  getRevenueBreakdown,
} from '../controllers/analytics.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';

const router = Router();

router.use(protect, adminOnly);

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: KPIs principaux du tableau de bord admin
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     description: Retourne revenus, commandes, nouveaux clients et produits bas en stock pour la période courante vs précédente.
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [today, week, month, year], default: month }
 *     responses:
 *       200:
 *         description: KPIs avec variations en pourcentage
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
 *                         revenue: { type: integer, example: 4250000 }
 *                         orders: { type: integer, example: 38 }
 *                         newCustomers: { type: integer, example: 12 }
 *                         lowStockCount: { type: integer, example: 5 }
 *       403:
 *         description: Rôle insuffisant (admin requis)
 */
router.get('/dashboard', getDashboardStats);

/**
 * @swagger
 * /analytics/sales:
 *   get:
 *     summary: Données de ventes sur une période (courbe graphique)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [week, month, quarter, year], default: month }
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, enum: [day, week, month], default: day }
 *     responses:
 *       200:
 *         description: Série temporelle — revenus et nombre de commandes par point
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
 *                         type: object
 *                         properties:
 *                           date: { type: string, format: date, example: "2025-04-01" }
 *                           revenue: { type: integer, example: 350000 }
 *                           orders: { type: integer, example: 4 }
 */
router.get('/sales', getSalesData);

/**
 * @swagger
 * /analytics/products/top:
 *   get:
 *     summary: Top produits par revenus ou ventes
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [revenue, sold, views], default: revenue }
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [week, month, year, all], default: month }
 *     responses:
 *       200:
 *         description: Liste classée des produits avec revenus, ventes et marge si disponible
 */
router.get('/products/top', getTopProducts);

/**
 * @swagger
 * /analytics/products/low-stock:
 *   get:
 *     summary: Produits dont le stock est inférieur au seuil d'alerte
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Liste des produits à réapprovisionner (stock ≤ lowStockThreshold)
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
 *                           - $ref: '#/components/schemas/Product'
 *                           - type: object
 *                             properties:
 *                               lowStockThreshold: { type: integer, example: 5 }
 */
router.get('/products/low-stock', getLowStockProducts);

/**
 * @swagger
 * /analytics/orders/status:
 *   get:
 *     summary: Répartition des commandes par statut (camembert)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [week, month, year, all], default: month }
 *     responses:
 *       200:
 *         description: Nombre de commandes par statut
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
 *                         type: object
 *                         properties:
 *                           status: { type: string, example: "delivered" }
 *                           count: { type: integer, example: 24 }
 */
router.get('/orders/status', getOrderStatusDistribution);

/**
 * @swagger
 * /analytics/payments/methods:
 *   get:
 *     summary: Répartition des paiements par méthode (Wave, Orange Money, Stripe, etc.)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [week, month, year, all], default: month }
 *     responses:
 *       200:
 *         description: Montant et nombre de transactions par méthode de paiement
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
 *                         type: object
 *                         properties:
 *                           method: { type: string, example: "wave" }
 *                           count: { type: integer, example: 18 }
 *                           total: { type: integer, example: 1800000, description: "Total en FCFA" }
 */
router.get('/payments/methods', getPaymentMethodDistribution);

/**
 * @swagger
 * /analytics/recent-activity:
 *   get:
 *     summary: Activité récente (dernières commandes, inscriptions, avis)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Flux d'activité récente toutes sources confondues
 */
router.get('/recent-activity', getRecentActivity);

/**
 * @swagger
 * /analytics/revenue-summary:
 *   get:
 *     summary: Résumé des revenus — aujourd'hui, cette semaine, ce mois, cette année
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenus agrégés sur 4 fenêtres temporelles
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
 *                         today: { type: integer, example: 420000 }
 *                         week: { type: integer, example: 2100000 }
 *                         month: { type: integer, example: 8750000 }
 *                         year: { type: integer, example: 87500000 }
 */
router.get('/revenue-summary', getRevenueSummary);

/**
 * @swagger
 * /analytics/revenue-by-category:
 *   get:
 *     summary: Revenus ventilés par catégorie produit
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [week, month, year, all], default: month }
 *     responses:
 *       200:
 *         description: Part de chaque catégorie dans le chiffre d'affaires total
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
 *                         type: object
 *                         properties:
 *                           category: { type: string, example: "Informatique" }
 *                           revenue: { type: integer, example: 3200000 }
 *                           percentage: { type: number, example: 36.6 }
 */
router.get('/revenue-by-category', getRevenueByCategory);

/**
 * @swagger
 * /analytics/customers/top:
 *   get:
 *     summary: Meilleurs clients par montant total dépensé
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [month, quarter, year, all], default: year }
 *     responses:
 *       200:
 *         description: Clients classés par revenus générés
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
 *                         type: object
 *                         properties:
 *                           user: { $ref: '#/components/schemas/User' }
 *                           totalSpent: { type: integer, example: 1250000 }
 *                           orderCount: { type: integer, example: 8 }
 */
router.get('/customers/top', getTopCustomers);

router.get('/revenue-breakdown', getRevenueBreakdown);

export default router;
