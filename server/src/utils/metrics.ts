// =============================================================
// metrics.ts — Métriques Prometheus (prom-client)
//
// Exposées sur GET /api/metrics (accès interne uniquement)
// Prometheus scrape depuis le réseau Docker interne
//
// Métriques collectées :
//   - Système Node.js (CPU, mémoire, event loop, GC)
//   - Requêtes HTTP (count, durée, statut)
//   - Queues BullMQ (jobs en attente, actifs, échoués)
//   - Cache Redis (hits/misses)
//   - Connexions Socket.io actives
// =============================================================

import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
  Summary,
} from 'prom-client';

export const registry = new Registry();
registry.setDefaultLabels({ app: 'sunushop', env: process.env.NODE_ENV || 'development' });

// Métriques système Node.js (mémoire, CPU, event loop, GC…)
collectDefaultMetrics({ register: registry, prefix: 'ta_node_' });

// ---- Requêtes HTTP ----
export const httpRequestsTotal = new Counter({
  name:       'ta_http_requests_total',
  help:       'Nombre total de requêtes HTTP reçues',
  labelNames: ['method', 'route', 'status_code'],
  registers:  [registry],
});

export const httpRequestDurationMs = new Histogram({
  name:       'ta_http_request_duration_ms',
  help:       'Durée des requêtes HTTP en millisecondes',
  labelNames: ['method', 'route', 'status_code'],
  buckets:    [5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000],
  registers:  [registry],
});

export const httpActiveRequests = new Gauge({
  name:      'ta_http_active_requests',
  help:      'Nombre de requêtes HTTP en cours de traitement',
  registers: [registry],
});

// ---- API Erreurs ----
export const httpErrorsTotal = new Counter({
  name:       'ta_http_errors_total',
  help:       'Nombre total d\'erreurs HTTP (4xx + 5xx)',
  labelNames: ['method', 'route', 'status_code'],
  registers:  [registry],
});

// ---- Queues BullMQ ----
export const queueJobsAdded = new Counter({
  name:       'ta_queue_jobs_added_total',
  help:       'Nombre de jobs ajoutés aux queues',
  labelNames: ['queue'],
  registers:  [registry],
});

export const queueJobsCompleted = new Counter({
  name:       'ta_queue_jobs_completed_total',
  help:       'Nombre de jobs terminés avec succès',
  labelNames: ['queue'],
  registers:  [registry],
});

export const queueJobsFailed = new Counter({
  name:       'ta_queue_jobs_failed_total',
  help:       'Nombre de jobs échoués',
  labelNames: ['queue'],
  registers:  [registry],
});

export const queueJobDuration = new Histogram({
  name:       'ta_queue_job_duration_ms',
  help:       'Durée de traitement des jobs BullMQ en millisecondes',
  labelNames: ['queue'],
  buckets:    [50, 100, 500, 1000, 5000, 10000, 30000, 60000],
  registers:  [registry],
});

export const queueDepth = new Gauge({
  name:       'ta_queue_depth',
  help:       'Nombre de jobs en attente dans la queue',
  labelNames: ['queue', 'state'],
  registers:  [registry],
});

// ---- Cache Redis ----
export const redisCacheHits = new Counter({
  name:       'ta_redis_cache_hits_total',
  help:       'Nombre de hits dans le cache Redis',
  labelNames: ['cache_name'],
  registers:  [registry],
});

export const redisCacheMisses = new Counter({
  name:       'ta_redis_cache_misses_total',
  help:       'Nombre de misses dans le cache Redis',
  labelNames: ['cache_name'],
  registers:  [registry],
});

// ---- Socket.io ----
export const socketConnections = new Gauge({
  name:      'ta_socket_active_connections',
  help:      'Nombre de connexions WebSocket Socket.io actives',
  registers: [registry],
});

// ---- MongoDB ----
export const mongodbQueryDuration = new Histogram({
  name:       'ta_mongodb_query_duration_ms',
  help:       'Durée des requêtes MongoDB en millisecondes',
  labelNames: ['operation', 'collection'],
  buckets:    [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2000],
  registers:  [registry],
});

// ---- Auth ----
export const authLoginAttempts = new Counter({
  name:       'ta_auth_login_attempts_total',
  help:       'Tentatives de connexion',
  labelNames: ['status'], // success | failed
  registers:  [registry],
});

export const authRateLimitHits = new Counter({
  name:      'ta_auth_rate_limit_hits_total',
  help:      'Nombre de fois qu\'un rate limit auth a été déclenché',
  registers: [registry],
});

// ---- Commandes / Paiements ----
export const ordersCreated = new Counter({
  name:       'ta_orders_created_total',
  help:       'Nombre de commandes créées',
  labelNames: ['payment_method'],
  registers:  [registry],
});

export const paymentsProcessed = new Counter({
  name:       'ta_payments_processed_total',
  help:       'Nombre de paiements traités',
  labelNames: ['method', 'status'],
  registers:  [registry],
});

export const orderValueFcfa = new Summary({
  name:       'ta_order_value_fcfa',
  help:       'Valeur des commandes en FCFA',
  labelNames: ['payment_method'],
  percentiles: [0.5, 0.9, 0.95, 0.99],
  registers:  [registry],
});
