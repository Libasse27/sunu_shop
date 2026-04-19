import { Router } from 'express';
import { getMe, updateMe, changePassword, getAddresses, addAddress, updateAddress, deleteAddress, updatePreferences, getAllUsers, updateUserRole, toggleUserStatus } from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import { changePasswordValidator, updateProfileValidator } from '../validators/auth.validator';

const router = Router();

router.use(protect);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Profil de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données du profil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 */
router.get('/me', getMe);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Mettre à jour le profil
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string, example: "Amadou" }
 *               lastName: { type: string, example: "Diallo" }
 *               phone: { type: string, example: "+221770000001" }
 *     responses:
 *       200:
 *         description: Profil mis à jour (seuls les champs fournis sont modifiés)
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.put('/me', updateProfileValidator, validate, updateMe);

/**
 * @swagger
 * /users/me/password:
 *   put:
 *     summary: Changer le mot de passe
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, example: "AncienMotDePasse1!" }
 *               newPassword: { type: string, minLength: 8, example: "NouveauMotDePasse1!" }
 *     responses:
 *       200:
 *         description: Mot de passe changé — tous les refresh tokens invalidés
 *       400:
 *         description: Mot de passe actuel incorrect ou nouveau mot de passe trop faible
 *       401:
 *         description: Non authentifié
 */
router.put('/me/password', changePasswordValidator, validate, changePassword);

/**
 * @swagger
 * /users/me/addresses:
 *   get:
 *     summary: Liste des adresses de livraison enregistrées
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tableau d'adresses
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
 *                           label: { type: string, example: "Maison" }
 *                           fullName: { type: string }
 *                           phone: { type: string }
 *                           street: { type: string }
 *                           city: { type: string }
 *                           region: { type: string }
 *                           country: { type: string, example: "Sénégal" }
 *                           isDefault: { type: boolean }
 */
router.get('/me/addresses', getAddresses);

/**
 * @swagger
 * /users/me/addresses:
 *   post:
 *     summary: Ajouter une adresse de livraison
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, phone, street, city, country]
 *             properties:
 *               label: { type: string, example: "Bureau" }
 *               fullName: { type: string, example: "Amadou Diallo" }
 *               phone: { type: string, example: "+221770000001" }
 *               street: { type: string, example: "12 Av. Cheikh Anta Diop" }
 *               city: { type: string, example: "Dakar" }
 *               region: { type: string, example: "Dakar" }
 *               country: { type: string, example: "Sénégal" }
 *               isDefault: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Adresse ajoutée
 *       400:
 *         description: Données invalides
 */
router.post('/me/addresses', addAddress);

/**
 * @swagger
 * /users/me/addresses/{id}:
 *   put:
 *     summary: Mettre à jour une adresse
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID de l'adresse (sous-document MongoDB)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label: { type: string }
 *               fullName: { type: string }
 *               phone: { type: string }
 *               street: { type: string }
 *               city: { type: string }
 *               isDefault: { type: boolean }
 *     responses:
 *       200:
 *         description: Adresse mise à jour
 *       404:
 *         description: Adresse non trouvée
 */
router.put('/me/addresses/:id', updateAddress);

/**
 * @swagger
 * /users/me/addresses/{id}:
 *   delete:
 *     summary: Supprimer une adresse
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Adresse supprimée
 *       404:
 *         description: Adresse non trouvée
 */
router.delete('/me/addresses/:id', deleteAddress);

/**
 * @swagger
 * /users/me/preferences:
 *   put:
 *     summary: Mettre à jour les préférences (notifications, newsletter, langue, devise)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newsletter: { type: boolean }
 *               notifications:
 *                 type: object
 *                 properties:
 *                   email: { type: boolean }
 *                   sms: { type: boolean }
 *                   push: { type: boolean }
 *               language: { type: string, example: "fr" }
 *               currency: { type: string, example: "XOF" }
 *     responses:
 *       200:
 *         description: Préférences mises à jour
 */
router.put('/me/preferences', updatePreferences);

// ─── Admin ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Liste de tous les utilisateurs (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Recherche par nom, email ou téléphone
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [client, admin, superadmin] }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Liste paginée des utilisateurs
 *       403:
 *         description: Rôle insuffisant
 */
router.get('/', adminOnly, getAllUsers);

/**
 * @swagger
 * /users/{id}/role:
 *   put:
 *     summary: Modifier le rôle d'un utilisateur (admin)
 *     tags: [Users]
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [client, admin, superadmin]
 *                 example: admin
 *     responses:
 *       200:
 *         description: Rôle mis à jour
 *       403:
 *         description: Rôle insuffisant (superadmin requis pour promouvoir en superadmin)
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/:id/role', adminOnly, updateUserRole);

/**
 * @swagger
 * /users/{id}/status:
 *   put:
 *     summary: Activer / désactiver un compte utilisateur (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Statut basculé (isActive toggled)
 *       403:
 *         description: Rôle insuffisant
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/:id/status', adminOnly, toggleUserStatus);

export default router;
