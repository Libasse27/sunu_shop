import { Router, Request, Response } from 'express';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import Product from '../models/Product.model';
import Category from '../models/Category.model';
import Service from '../models/Service.model';
import logger from '../utils/logger';
import { env } from '../config/env';

const router = Router();

const HOSTNAME = env.CLIENT_URL || 'https://sunushop.sn';

/**
 * @swagger
 * /sitemap.xml:
 *   get:
 *     summary: Sitemap XML dynamique (SEO)
 *     tags: [SEO]
 *     security: []
 *     description: |
 *       Sitemap généré dynamiquement depuis la base de données.
 *       Inclut : pages statiques, produits actifs, catégories actives, services.
 *       Mis en cache 1 heure (Cache-Control).
 *     responses:
 *       200:
 *         description: Sitemap XML
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 */
router.get('/sitemap.xml', async (_req: Request, res: Response) => {
  try {
    // Récupérer les données depuis MongoDB en parallèle
    const [products, categories, services] = await Promise.all([
      Product.find({ isActive: true }, 'slug updatedAt name images isFeatured stock').lean<Array<{ slug: string; updatedAt: Date; name: string; images: Array<{ url: string; isPrimary?: boolean }>; isFeatured?: boolean; stock: number }>>(),
      Category.find({ isActive: true }, 'slug updatedAt').lean<Array<{ slug: string; updatedAt: Date }>>(),
      Service.find({ isAvailable: true }, 'slug updatedAt').lean<Array<{ slug: string; updatedAt: Date }>>(),
    ]);

    const links: any[] = [
      // Pages statiques
      { url: '/',                   priority: 1.0, changefreq: 'daily' },
      { url: '/boutique',           priority: 0.9, changefreq: 'daily' },
      { url: '/services',           priority: 0.8, changefreq: 'weekly' },
      { url: '/a-propos',           priority: 0.5, changefreq: 'monthly' },
      { url: '/contact',            priority: 0.5, changefreq: 'monthly' },
      { url: '/faq',                priority: 0.5, changefreq: 'monthly' },

      // Catégories
      ...categories.map(cat => ({
        url: `/boutique/${cat.slug}`,
        priority: 0.8,
        changefreq: 'weekly',
        lastmod: cat.updatedAt,
      })),

      // Produits
      ...products.map(p => {
        const primaryImg = p.images?.find((img: any) => img.isPrimary) ?? p.images?.[0];
        return {
          url: `/produit/${p.slug}`,
          priority: p.isFeatured ? 0.9 : p.stock > 0 ? 0.7 : 0.5,
          changefreq: 'weekly' as const,
          lastmod: p.updatedAt,
          ...(primaryImg?.url ? {
            img: [{
              url: primaryImg.url,
              caption: p.name,
              title: p.name,
            }],
          } : {}),
        };
      }),

      // Services
      ...services.map(s => ({
        url: `/services/${s.slug}`,
        priority: 0.6,
        changefreq: 'monthly',
        lastmod: s.updatedAt,
      })),
    ];

    const stream = new SitemapStream({ hostname: HOSTNAME });
    const xml = await streamToPromise(Readable.from(links).pipe(stream));

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // cache 1 heure
    res.send(xml.toString());
  } catch (err: unknown) {
    logger.error('Sitemap generation error', { error: err });
    res.status(500).send('Erreur génération sitemap');
  }
});

/**
 * @swagger
 * /robots.txt:
 *   get:
 *     summary: Fichier robots.txt
 *     tags: [SEO]
 *     security: []
 *     responses:
 *       200:
 *         description: Instructions pour les robots d'indexation
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/robots.txt', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 24h
  res.send(
    `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /connexion
Disallow: /inscription
Disallow: /mon-compte
Disallow: /commande
Disallow: /panier

Sitemap: ${HOSTNAME}/sitemap.xml
`
  );
});

export default router;
