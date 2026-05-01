/**
 * logger.ts — Logger structuré Winston
 *
 * - Développement : sortie colorisée lisible dans le terminal
 * - Production    : format JSON structuré + rotation fichiers
 *
 * Usage : import logger from '../utils/logger'
 *         logger.info('message', { meta: 'value' })
 *         logger.error('message', { error: err.message })
 */

import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, errors, colorize, printf, json } = winston.format;

/** Format console développement : `2026-04-18 12:00:00 [info]: message {"key":"val"}` */
const devFormat = combine(
  colorize({ all: true }),
  printf(({ timestamp: ts, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}]: ${message}${metaStr}`;
  }),
);

const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    env.NODE_ENV === 'production' ? json() : devFormat,
  ),
  defaultMeta: { service: 'sunushop-api' },
  transports: [
    new winston.transports.Console(),
    ...(env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level:    'error',
            maxsize:  10 * 1024 * 1024, // 10 Mo
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize:  10 * 1024 * 1024, // 10 Mo
            maxFiles: 10,
          }),
        ]
      : []),
  ],
});

export default logger;
