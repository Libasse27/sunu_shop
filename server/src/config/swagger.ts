import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SunuShop API',
      version: '1.0.0',
      description: `
API e-commerce SunuShop — Informatique, Téléphonie, Électronique, Électroménager, Accessoires & Gaming.

**Marché cible :** Sénégal, Mali, Guinée (Afrique de l'Ouest)
**Devise principale :** FCFA (XOF)
**Paiements :** Stripe, Orange Money, Wave, Cash on Delivery

### Authentification
Utiliser le header \`Authorization: Bearer <accessToken>\` sur les routes protégées.
Le token d'accès expire en **15 minutes**. Utiliser \`POST /auth/refresh-token\` pour en obtenir un nouveau.
      `.trim(),
      contact: {
        name: 'SunuShop Support',
        email: 'support@sunushop.sn',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Développement local',
      },
      {
        url: 'https://api.sunushop.sn/api/v1',
        description: 'Production',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT généré lors de la connexion (expire en 15 min)',
        },
      },
      schemas: {
        // ─── Réponse standard ─────────────────────────────────────────────
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Succès' },
            data: { type: 'object', nullable: true },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Message d\'erreur' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 150 },
            totalPages: { type: 'integer', example: 8 },
          },
        },
        // ─── Utilisateur ──────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '64a0f1234567890abcdef123' },
            firstName: { type: 'string', example: 'Amadou' },
            lastName: { type: 'string', example: 'Diallo' },
            email: { type: 'string', format: 'email', example: 'amadou@example.com' },
            phone: { type: 'string', example: '+221770000001' },
            role: { type: 'string', enum: ['client', 'admin', 'superadmin'], example: 'client' },
            avatar: { type: 'string', nullable: true, example: 'https://res.cloudinary.com/...' },
            isVerified: { type: 'boolean', example: false },
          },
        },
        // ─── Auth ─────────────────────────────────────────────────────────
        RegisterRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password'],
          properties: {
            firstName: { type: 'string', example: 'Amadou' },
            lastName: { type: 'string', example: 'Diallo' },
            email: { type: 'string', format: 'email', example: 'amadou@example.com' },
            password: { type: 'string', minLength: 8, example: 'MonMotDePasse1!' },
            phone: { type: 'string', example: '+221770000001' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'amadou@example.com' },
            password: { type: 'string', example: 'MonMotDePasse1!' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },
        // ─── Produit ──────────────────────────────────────────────────────
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Laptop Asus VivoBook 15' },
            slug: { type: 'string', example: 'laptop-asus-vivobook-15' },
            sku: { type: 'string', example: 'SKU-ASUS-001' },
            description: { type: 'string' },
            shortDescription: { type: 'string' },
            price: { type: 'integer', example: 350000, description: 'Prix en FCFA' },
            compareAtPrice: { type: 'integer', example: 400000, nullable: true },
            currency: { type: 'string', example: 'XOF' },
            stock: { type: 'integer', example: 15 },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  isPrimary: { type: 'boolean' },
                  alt: { type: 'string' },
                },
              },
            },
            category: { type: 'object', properties: { _id: { type: 'string' }, name: { type: 'string' }, slug: { type: 'string' } } },
            rating: { type: 'number', example: 4.5 },
            numReviews: { type: 'integer', example: 23 },
            isActive: { type: 'boolean', example: true },
            isFeatured: { type: 'boolean', example: false },
            isOnSale: { type: 'boolean', example: false },
            isNewArrival: { type: 'boolean', example: true },
            discountPercentage: { type: 'number', example: 12.5 },
          },
        },
        // ─── Commande ─────────────────────────────────────────────────────
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            orderNumber: { type: 'string', example: 'ORD-20250405-0001' },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'],
              example: 'pending',
            },
            pricing: {
              type: 'object',
              properties: {
                subtotal: { type: 'integer', example: 350000 },
                shippingCost: { type: 'integer', example: 0, description: 'Gratuit ≥ 25 000 FCFA' },
                discount: { type: 'integer', example: 0 },
                total: { type: 'integer', example: 350000 },
              },
            },
            payment: {
              type: 'object',
              properties: {
                method: { type: 'string', enum: ['stripe', 'orange_money', 'wave', 'free_money', 'cash_on_delivery', 'paypal'] },
                status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Catégorie ────────────────────────────────────────────────────
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Informatique' },
            slug: { type: 'string', example: 'informatique' },
            description: { type: 'string', nullable: true },
            image: { type: 'object', properties: { url: { type: 'string' } }, nullable: true },
            parent: { type: 'string', nullable: true, description: 'ID de la catégorie parente' },
            level: { type: 'integer', example: 0 },
            isActive: { type: 'boolean', example: true },
            productCount: { type: 'integer', example: 47 },
          },
        },
        // ─── Coupon ───────────────────────────────────────────────────────
        Coupon: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'PROMO20' },
            type: { type: 'string', enum: ['percentage', 'fixed_amount', 'free_shipping'] },
            value: { type: 'number', example: 20 },
            minOrderAmount: { type: 'integer', example: 50000 },
            isActive: { type: 'boolean' },
            endDate: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Inscription, connexion, gestion des tokens' },
      { name: 'Users', description: 'Profil, adresses, préférences utilisateur — gestion admin' },
      { name: 'Products', description: 'Catalogue produits — lecture publique, CRUD admin' },
      { name: 'Categories', description: 'Catégories produits (hiérarchie parent/enfant)' },
      { name: 'Orders', description: 'Commandes client et gestion admin' },
      { name: 'Payments', description: 'Stripe, Orange Money, Wave, remboursements' },
      { name: 'Reviews', description: 'Avis produits — modération admin' },
      { name: 'Coupons', description: 'Codes promo et validation' },
      { name: 'Wishlist', description: 'Liste de souhaits utilisateur' },
      { name: 'Services', description: 'Services réparation/installation (contact WhatsApp)' },
      { name: 'Notifications', description: 'Notifications temps réel utilisateur' },
      { name: 'Upload', description: 'Upload images vers Cloudinary' },
      { name: 'Analytics', description: 'Statistiques et tableaux de bord admin (protégé)' },
      { name: 'Newsletter', description: 'Abonnements et campagnes newsletter' },
      { name: 'Banners', description: 'Bannières hero et promo homepage (type=hero|promo)' },
      { name: 'Announcements', description: 'Bandeaux d\'annonce en haut de page' },
      { name: 'PaymentSettings', description: 'QR codes et numéros pour Wave / Orange Money' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
