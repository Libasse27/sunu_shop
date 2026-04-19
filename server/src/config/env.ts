import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// ─── Guard production ─────────────────────────────────────────────────────────
// Refuse de démarrer si des secrets critiques ont encore leur valeur par défaut.
// Évite les forgeries de tokens JWT en production par un secret connu.
function requireProductionSecrets(nodeEnv: string | undefined) {
  if (nodeEnv !== 'production') return;
  const defaults = [
    'dev-access-secret-change-in-production',
    'dev-refresh-secret-change-in-production',
  ];
  const accessSecret = process.env.JWT_ACCESS_SECRET || '';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || '';
  if (defaults.includes(accessSecret) || !accessSecret) {
    throw new Error('[FATAL] JWT_ACCESS_SECRET doit être défini et sécurisé en production');
  }
  if (defaults.includes(refreshSecret) || !refreshSecret) {
    throw new Error('[FATAL] JWT_REFRESH_SECRET doit être défini et sécurisé en production');
  }

  // Vérification des secrets monitoring — valeurs par défaut inacceptables en prod
  const metricsSecret = process.env.METRICS_SECRET;
  if (!metricsSecret || metricsSecret === 'dev-metrics-secret') {
    throw new Error('[FATAL] METRICS_SECRET must be set and not be the default value in production');
  }
  const grafanaPassword = process.env.GRAFANA_PASSWORD;
  if (!grafanaPassword || grafanaPassword === 'admin') {
    throw new Error('[FATAL] GRAFANA_PASSWORD must be changed from default in production');
  }
}

requireProductionSecrets(process.env.NODE_ENV);

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/sunushop',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',

  REDIS_URL:      process.env.REDIS_URL      || 'redis://localhost:6379',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@techafrique.sn',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'TechAfrique',

  ORANGE_MONEY_CLIENT_ID: process.env.ORANGE_MONEY_CLIENT_ID || '',
  ORANGE_MONEY_CLIENT_SECRET: process.env.ORANGE_MONEY_CLIENT_SECRET || '',
  ORANGE_MONEY_MERCHANT_KEY: process.env.ORANGE_MONEY_MERCHANT_KEY || '',

  WAVE_API_KEY: process.env.WAVE_API_KEY || '',
  WAVE_WEBHOOK_SECRET: process.env.WAVE_WEBHOOK_SECRET || '',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '',
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',

  // Monitoring
  METRICS_SECRET:   process.env.METRICS_SECRET   || 'dev-metrics-secret',
  GRAFANA_PASSWORD: process.env.GRAFANA_PASSWORD || 'admin',

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
