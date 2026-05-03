import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import passport from 'passport';
// @ts-ignore — pas de types officiels pour mongo-sanitize
import mongoSanitize from 'mongo-sanitize';
// @ts-ignore — pas de types officiels pour xss-clean
import xss from 'xss-clean';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import './config/passport';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler.middleware';
import { generalLimiter } from './middleware/rateLimiter.middleware';
import { registry, httpRequestsTotal, httpRequestDurationMs, httpActiveRequests } from './utils/metrics';
import { emailQueue, notificationQueue, invoiceQueue } from './config/queue';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { protect } from './middleware/auth.middleware';
import { adminOnly } from './middleware/admin.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import orderRoutes from './routes/order.routes';
import reviewRoutes from './routes/review.routes';
import couponRoutes from './routes/coupon.routes';
import wishlistRoutes from './routes/wishlist.routes';
import analyticsRoutes from './routes/analytics.routes';
import paymentRoutes from './routes/payment.routes';
import uploadRoutes from './routes/upload.routes';
import notificationRoutes from './routes/notification.routes';
import serviceRoutes from './routes/service.routes';
import bannerRoutes from './routes/banner.routes';
import announcementRoutes from './routes/announcement.routes';
import newsletterRoutes from './routes/newsletter.routes';
import paymentSettingsRoutes from './routes/paymentSettings.routes';
import contactRoutes from './routes/contact.routes';
import sitemapRoutes from './routes/sitemap.routes';

const app = express();

// Security
app.use(helmet({
  // CSP géré par Nginx en production (règles plus précises avec Cloudinary/Stripe)
  // En développement, Helmet applique un CSP minimal
  contentSecurityPolicy: env.NODE_ENV === 'production' ? false : {
    directives: {
      defaultSrc:              ["'self'"],
      scriptSrc:               ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
      styleSrc:                ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:                 ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:                  ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
      connectSrc:              ["'self'", 'ws://localhost:*', 'wss://localhost:*', 'https://api.stripe.com', 'https://api.wave.com'],
      frameSrc:                ['https://js.stripe.com'],
      objectSrc:               ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // HSTS — synchronisé avec Nginx (1 an, includeSubDomains, preload)
  hsts: {
    maxAge:            31536000,
    includeSubDomains: true,
    preload:           true,
  },
  // Désactivé : Cloudinary sert des images cross-origin (produits)
  crossOriginEmbedderPolicy: false,
  // Autoriser les assets CDN cross-origin (Cloudinary, Google Fonts)
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow: web client, mobile Flutter (no origin header), Postman/dev tools
    if (!origin || origin === env.CLIENT_URL) return callback(null, true);
    callback(new Error('CORS non autorisé'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature', 'wave-signature', 'X-Client'],
}));

// Stripe webhook needs raw body - must be before express.json()
app.post('/api/v1/payments/stripe/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  // This will be handled by the payment routes
  next();
});

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Sanitization — protection NoSQL injection et XSS
// mongo-sanitize nettoie req.body, req.query et req.params des clés commençant par $
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.body) req.body = mongoSanitize(req.body);
  if (req.query) req.query = mongoSanitize(req.query);
  if (req.params) req.params = mongoSanitize(req.params);
  next();
});
app.use(xss());

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Passport
app.use(passport.initialize());

// Rate limiting
app.use('/api/', generalLimiter);

// Métriques HTTP (enregistrer toutes les requêtes)
app.use((req: Request, res: Response, next: NextFunction) => {
  httpActiveRequests.inc();
  const start = Date.now();
  res.on('finish', () => {
    httpActiveRequests.dec();
    const duration = Date.now() - start;
    const route = (req.route?.path as string) || req.path;
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    httpRequestsTotal.inc(labels);
    httpRequestDurationMs.observe(labels, duration);
  });
  next();
});

// Bull Board — dashboard des queues (admin uniquement)
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queues: [
    new BullMQAdapter(emailQueue as any),
    new BullMQAdapter(notificationQueue as any),
    new BullMQAdapter(invoiceQueue as any),
  ] as any[],
  serverAdapter,
});
app.use('/admin/queues', protect, adminOnly, serverAdapter.getRouter());

// Documentation Swagger (uniquement hors production)
if (env.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'TechAfrique API Docs',
    customCss: '.swagger-ui .topbar { background-color: #0EA5E9; }',
  }));
  // JSON brut de la spec OpenAPI
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/newsletter', newsletterRoutes);
app.use('/api/v1/payment-settings', paymentSettingsRoutes);
app.use('/api/v1/contact', contactRoutes);

// CSP violation reports — content-type: application/csp-report (not application/json)
// Needs its own body parser; global express.json() skips non-JSON content-types
const CSP_NOISE_PREFIXES = ['chrome-extension://', 'moz-extension://', 'safari-extension://', 'about:', 'data:'];

app.post('/api/v1/csp-report',
  express.json({ type: ['application/json', 'application/csp-report'], limit: '2kb' }),
  (req: Request, res: Response) => {
    const r = req.body?.['csp-report'] ?? req.body;
    const blocked = r?.['blocked-uri'] as string | undefined;

    if (blocked && !CSP_NOISE_PREFIXES.some(p => blocked.startsWith(p))) {
      const severity = blocked.startsWith('https://') ? 'warn' : 'error';
      console[severity]('[CSP] blocked=%s directive=%s source-file=%s document=%s',
        blocked,
        r['violated-directive'],
        r['source-file'] ?? '',
        r['document-uri']);
    }
    res.status(204).end();
  }
);

// SEO — sitemap et robots.txt (servis à la racine, pas sous /api)
app.use('/', sitemapRoutes);

// Health check enrichi
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status:      'OK',
    timestamp:   new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime:      Math.floor(process.uptime()),
  });
});

// Métriques Prometheus (interne — protégé par token, bloqué par Nginx en externe)
app.get('/api/metrics', async (req: Request, res: Response) => {
  const token = req.headers['x-metrics-token'];
  if (env.NODE_ENV === 'production' && token !== env.METRICS_SECRET) {
    res.status(401).json({ message: 'Non autorisé' });
    return;
  }
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
