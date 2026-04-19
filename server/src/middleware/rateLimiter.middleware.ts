// =============================================================
// rateLimiter.middleware.ts — Rate limiting avec store Redis
//
// Store Redis = compteurs persistants entre redémarrages,
// partagés entre plusieurs instances Node.js.
//
// Limiteurs :
//   generalLimiter  → 500 req / 15min
//   authLimiter     → 5 req / 10min (anti brute-force login)
//   passwordLimiter → 3 req / heure (reset password)
//   uploadLimiter   → 50 req / heure
// =============================================================

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response } from 'express';
import { redis } from '../config/redis';
import { authRateLimitHits } from '../utils/metrics';

const isDev = process.env.NODE_ENV !== 'production';

// Factory — store Redis avec fallback mémoire si Redis indisponible
const makeStore = (prefix: string) => {
  try {
    return new RedisStore({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sendCommand: (...args: string[]) => (redis.call as any)(...args),
      prefix:      `rl:${prefix}:`,
    });
  } catch {
    return undefined;
  }
};

// Handler 429 standardisé
const rateLimitHandler = (message: string) =>
  (_req: Request, res: Response) => {
    authRateLimitHits.inc();
    res.status(429).json({
      success:    false,
      message,
      retryAfter: res.getHeader('Retry-After'),
    });
  };

export const generalLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             isDev ? 5000 : 500,
  store:           makeStore('general'),
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            () => isDev,
  message:         { success: false, message: 'Trop de requêtes, réessayez dans 15 minutes' },
});

// Anti brute-force : 5 tentatives / 10min par IP+email
export const authLimiter = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             5,
  store:           makeStore('auth'),
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         rateLimitHandler('Trop de tentatives de connexion. Réessayez dans 10 minutes.'),
  keyGenerator:    (req: Request) => {
    const body = req.body as { email?: string };
    return `${req.ip}:${body?.email || 'unknown'}`;
  },
});

// Reset password : 3 tentatives / heure
export const passwordLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             3,
  store:           makeStore('password'),
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         rateLimitHandler('Trop de demandes de réinitialisation. Réessayez dans 1 heure.'),
});

export const uploadLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             50,
  store:           makeStore('upload'),
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, message: "Trop d'uploads, réessayez plus tard" },
});
