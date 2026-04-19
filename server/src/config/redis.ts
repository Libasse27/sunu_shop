// =============================================================
// redis.ts — Client Redis (ioredis)
//
// Trois instances séparées :
//   redis     → cache API, sessions, rate limiting
//   redisPub  → publication Socket.io (adapter Redis)
//   redisSub  → souscription Socket.io (adapter Redis)
//
// Le fait d'avoir des instances séparées évite les conflits
// entre commandes normales et mode pub/sub.
// =============================================================

import Redis from 'ioredis';
import { env } from './env';
import logger from '../utils/logger';

const redisOptions = {
  maxRetriesPerRequest: null,  // obligatoire pour BullMQ
  enableReadyCheck:     false,
  lazyConnect:          true,
  retryStrategy: (times: number) => {
    if (times > 5) {
      logger.error('Redis : impossible de se connecter après 5 tentatives');
      return null; // arrêter les tentatives
    }
    return Math.min(times * 200, 3000); // backoff exponentiel plafonné à 3s
  },
};

// Client principal
export const redis = new Redis(env.REDIS_URL, redisOptions);

// Clients dédiés pour l'adapter Socket.io (ne peuvent pas être en mode subscribe + envoyer d'autres commandes)
export const redisPub = new Redis(env.REDIS_URL, redisOptions);
export const redisSub = new Redis(env.REDIS_URL, redisOptions);

// Logs de connexion
redis.on('connect',      () => logger.info('Redis connecté'));
redis.on('ready',        () => logger.info('Redis prêt'));
redis.on('reconnecting', () => logger.warn('Redis reconnexion...'));
redis.on('error', (err: Error) => {
  // Masque le password dans l'URL (ex: redis://:secret@host → redis://***@host)
  const msg = err.message.replace(/\/\/[^@]+@/, '//***@');
  logger.error('Redis erreur', { error: msg });
});

// Connexion explicite au démarrage
export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();
    await redisPub.connect();
    await redisSub.connect();
  } catch (err: unknown) {
    logger.warn('Redis connexion échouée (non bloquant)', {
      error: (err as Error).message,
    });
  }
};

export default redis;
