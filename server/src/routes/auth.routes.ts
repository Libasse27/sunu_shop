import { Router } from 'express';
import passport from 'passport';
import { register, login, logout, refreshToken, forgotPassword, resetPassword, socialAuthCallback, socialExchange } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator,
} from '../validators/auth.validator';
import { env } from '../config/env';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Créer un nouveau compte
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Données invalides (email, mot de passe trop court, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       429:
 *         description: Trop de tentatives (rate limit — 5 requêtes / 10 min)
 */
router.post('/register', authLimiter, registerValidator, validate, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Se connecter
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Connexion réussie — refreshToken en cookie HttpOnly
 *         headers:
 *           Set-Cookie:
 *             description: Cookie refreshToken HttpOnly (7 jours)
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Identifiants incorrects ou compte verrouillé
 *       429:
 *         description: Trop de tentatives
 */
router.post('/login', authLimiter, loginValidator, validate, login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Se déconnecter
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie — cookie refreshToken effacé
 *       401:
 *         description: Non authentifié
 */
router.post('/logout', protect, logout);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Renouveler l'accessToken via le cookie refreshToken
 *     tags: [Auth]
 *     security: []
 *     description: |
 *       Utilise le cookie HttpOnly `refreshToken` (navigateur) ou le corps de la requête (mobile).
 *       Retourne un nouvel accessToken valide 15 minutes.
 *     requestBody:
 *       description: Pour les clients mobiles uniquement (sinon le cookie est utilisé automatiquement)
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nouveau token retourné
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
 *                         accessToken:
 *                           type: string
 *       401:
 *         description: Refresh token manquant ou invalide
 */
router.post('/refresh-token', refreshToken);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Demander un lien de réinitialisation du mot de passe
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: amadou@example.com
 *     responses:
 *       200:
 *         description: Email envoyé si le compte existe (réponse identique même si inexistant — anti-énumération)
 *       429:
 *         description: Trop de tentatives (3 requêtes / heure)
 */
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Réinitialiser le mot de passe avec le token reçu par email
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de réinitialisation (valide 1 heure)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: NouveauMotDePasse1!
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé
 *       400:
 *         description: Token invalide ou expiré
 */
router.post('/reset-password/:token', resetPasswordValidator, validate, resetPassword);

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Connexion via Google OAuth
 *     tags: [Auth]
 *     security: []
 *     description: Redirige vers Google. Callback sur `/auth/google/callback`.
 *     responses:
 *       302:
 *         description: Redirection vers Google
 */
/**
 * @swagger
 * /auth/social/exchange:
 *   get:
 *     summary: Échanger le code OTP OAuth contre l'accessToken
 *     tags: [Auth]
 *     security: []
 *     description: |
 *       Échange le code temporaire (30s, usage unique) reçu après un redirect OAuth
 *       contre le vrai accessToken. Évite d'exposer le JWT dans l'URL.
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Code OTP reçu dans le redirect OAuth
 *     responses:
 *       200:
 *         description: accessToken et données utilisateur retournés
 *       400:
 *         description: Code manquant
 *       401:
 *         description: Code invalide ou expiré
 */
router.get('/social/exchange', socialExchange);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${env.CLIENT_URL}/connexion?error=google` }),
  socialAuthCallback
);

/**
 * @swagger
 * /auth/facebook:
 *   get:
 *     summary: Connexion via Facebook OAuth
 *     tags: [Auth]
 *     security: []
 *     description: Redirige vers Facebook. Callback sur `/auth/facebook/callback`.
 *     responses:
 *       302:
 *         description: Redirection vers Facebook
 */
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));
router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: `${env.CLIENT_URL}/connexion?error=facebook` }),
  socialAuthCallback
);

export default router;
