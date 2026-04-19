// =============================================================
// cache.middleware.ts — Cache API avec Redis
//
// Usage dans une route :
//   router.get('/products', cacheMiddleware(300), getProducts);
//   router.post('/products', invalidateCacheMiddleware('cache:/api/v1/products*'), createProduct);
//
// Le cache est automatiquement bypassé si Redis est indisponible.
// =============================================================

import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { redisCacheHits, redisCacheMisses } from '../utils/metrics';
import { env } from '../config/env';

/**
 * Middleware de cache Redis pour les routes GET.
 * @param ttlSeconds  Durée de vie du cache en secondes (défaut: 60)
 * @param keyFn       Fonction optionnelle pour personnaliser la clé de cache
 */
export const cacheMiddleware = (
  ttlSeconds = 60,
  keyFn?: (req: Request) => string,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Bypass cache pour les requêtes non-GET et en développement (optionnel)
    if (req.method !== 'GET') return next();

    const cacheKey = keyFn ? keyFn(req) : `cache:${req.originalUrl}`;

    try {
      const cached = await redis.get(cacheKey);

      if (cached) {
        redisCacheHits.inc({ cache_name: 'api' });
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', env.NODE_ENV === 'development' ? cacheKey : 'hidden');
        return res.json(JSON.parse(cached));
      }

      redisCacheMisses.inc({ cache_name: 'api' });
      res.setHeader('X-Cache', 'MISS');

      // Intercepter res.json pour stocker la réponse en cache
      const originalJson = res.json.bind(res);
      res.json = (data: unknown) => {
        // Ne mettre en cache que les réponses 2xx
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.setex(cacheKey, ttlSeconds, JSON.stringify(data)).catch(() => {});
        }
        return originalJson(data);
      };

      next();
    } catch {
      // Redis indisponible → continuer sans cache
      next();
    }
  };
};

/**
 * Middleware d'invalidation de cache (à appeler sur POST/PUT/DELETE).
 * @param patterns  Patterns Redis (ex: 'cache:/api/v1/products*')
 */
export const invalidateCacheMiddleware = (...patterns: string[]) => {
  return async (_req: Request, res: Response, next: NextFunction) => {
    // Invalider après que la réponse a été envoyée
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await invalidateCache(...patterns);
      }
    });
    next();
  };
};

/**
 * Scanne les clés Redis par pattern sans bloquer le thread principal.
 * Remplace redis.keys() qui est O(N) et bloquant sur les grands keyspaces.
 * @param redisClient - Instance Redis ioredis
 * @param pattern     - Pattern glob (ex: 'cache:/api/v1/products*')
 */
const scanKeys = async (redisClient: typeof redis, pattern: string): Promise<string[]> => {
  const keys: string[] = [];
  let cursor = '0';
  do {
    const [nextCursor, found] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
    cursor = nextCursor;
    keys.push(...found);
  } while (cursor !== '0');
  return keys;
};

/**
 * Invalide les clés Redis correspondant aux patterns donnés.
 */
export const invalidateCache = async (...patterns: string[]): Promise<void> => {
  try {
    for (const pattern of patterns) {
      const keys = await scanKeys(redis, pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        if (env.NODE_ENV === 'development') {
          console.log(`[Cache] Invalidé ${keys.length} clé(s) pour: ${pattern}`);
        }
      }
    }
  } catch {
    // Silencieux — l'invalidation de cache ne doit jamais bloquer
  }
};

/**
 * Crée une clé de cache incluant l'utilisateur connecté (données personnalisées).
 */
export const userCacheKey = (req: Request): string => {
  const userId = (req as any).user?._id || 'anonymous';
  return `cache:user:${userId}:${req.originalUrl}`;
};
