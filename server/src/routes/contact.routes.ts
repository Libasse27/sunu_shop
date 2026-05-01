import { Router } from 'express';
import { sendContactMessage, contactValidator } from '../controllers/contact.controller';
import { validate } from '../middleware/validate.middleware';
import { generalLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Envoyer un message de contact
 *     tags: [Contact]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, subject, message]
 *             properties:
 *               name:    { type: string, example: "Amadou Diallo" }
 *               email:   { type: string, format: email }
 *               subject: { type: string, example: "Question sur ma commande" }
 *               message: { type: string, example: "Bonjour, je n'ai pas reçu ma commande..." }
 *     responses:
 *       200:
 *         description: Message envoyé avec succès
 *       400:
 *         description: Données invalides
 *       429:
 *         description: Trop de messages — réessayez plus tard
 */
router.post('/', generalLimiter, contactValidator, validate, sendContactMessage);

export default router;
