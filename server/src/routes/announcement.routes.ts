import { Router } from 'express';
import {
  getActiveAnnouncements, getAllAnnouncements,
  createAnnouncement, updateAnnouncement, deleteAnnouncement, reorderAnnouncements,
} from '../controllers/announcement.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import { createAnnouncementValidator, updateAnnouncementValidator, reorderAnnouncementsValidator } from '../validators/announcement.validator';
import { cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache.middleware';

const ANNOUNCEMENTS_CACHE = 'cache:/api/v1/announcements*';

const router = Router();

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: Bandeaux d'annonce actifs (bandeau défilant en haut de page)
 *     tags: [Announcements]
 *     security: []
 *     responses:
 *       200:
 *         description: Liste des annonces actives triées par ordre
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
 *                           _id: { type: string }
 *                           text: { type: string, example: "Livraison gratuite dès 25 000 FCFA" }
 *                           link: { type: string, nullable: true }
 *                           linkLabel: { type: string, nullable: true }
 *                           bgColor: { type: string, example: "#1E293B" }
 *                           textColor: { type: string, example: "#ffffff" }
 *                           order: { type: integer }
 */
router.get('/', cacheMiddleware(300), getActiveAnnouncements);

/**
 * @swagger
 * /announcements/admin/all:
 *   get:
 *     summary: Toutes les annonces (actives et inactives) — admin
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste complète triée par ordre
 *       403:
 *         description: Rôle insuffisant
 */
router.get('/admin/all', protect, adminOnly, getAllAnnouncements);

/**
 * @swagger
 * /announcements:
 *   post:
 *     summary: Créer un bandeau d'annonce (admin)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: string, example: "Livraison gratuite dès 25 000 FCFA !" }
 *               link: { type: string, example: "/boutique" }
 *               linkLabel: { type: string, example: "Voir les offres" }
 *               bgColor: { type: string, example: "#009A44" }
 *               textColor: { type: string, example: "#ffffff" }
 *               isActive: { type: boolean, default: true }
 *               order: { type: integer, default: 0 }
 *     responses:
 *       201:
 *         description: Annonce créée
 *       403:
 *         description: Rôle insuffisant
 */
router.post('/', protect, adminOnly, createAnnouncementValidator, validate, invalidateCacheMiddleware(ANNOUNCEMENTS_CACHE), createAnnouncement);

/**
 * @swagger
 * /announcements/reorder:
 *   put:
 *     summary: Réordonner les annonces (drag & drop admin)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [id, order]
 *                   properties:
 *                     id: { type: string }
 *                     order: { type: integer }
 *     responses:
 *       200:
 *         description: Ordre mis à jour
 */
router.put('/reorder', protect, adminOnly, reorderAnnouncementsValidator, validate, invalidateCacheMiddleware(ANNOUNCEMENTS_CACHE), reorderAnnouncements);

/**
 * @swagger
 * /announcements/{id}:
 *   put:
 *     summary: Mettre à jour un bandeau d'annonce (admin)
 *     tags: [Announcements]
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
 *               text: { type: string }
 *               isActive: { type: boolean }
 *               bgColor: { type: string }
 *               order: { type: integer }
 *     responses:
 *       200:
 *         description: Annonce mise à jour
 *       404:
 *         description: Annonce non trouvée
 */
router.put('/:id', protect, adminOnly, updateAnnouncementValidator, validate, invalidateCacheMiddleware(ANNOUNCEMENTS_CACHE), updateAnnouncement);

/**
 * @swagger
 * /announcements/{id}:
 *   delete:
 *     summary: Supprimer un bandeau d'annonce (admin)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Annonce supprimée
 *       404:
 *         description: Annonce non trouvée
 */
router.delete('/:id', protect, adminOnly, invalidateCacheMiddleware(ANNOUNCEMENTS_CACHE), deleteAnnouncement);

export default router;
