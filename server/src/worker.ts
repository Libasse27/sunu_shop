// =============================================================
// worker.ts — Point d'entrée du process dédié aux workers
//
// Usage en production (Docker service séparé) :
//   node dist/worker.js
//
// Le process worker :
//   - Se connecte à MongoDB (pour les workers qui lisent la BDD)
//   - Se connecte à Redis (via BullMQ)
//   - Lance tous les workers
//   - Gère le shutdown proprement (SIGTERM)
// =============================================================

import { connectDatabase } from './config/database';
import { env } from './config/env';
import { startWorkers, stopWorkers } from './workers';

const startWorkerProcess = async () => {
  try {
    await connectDatabase();
    startWorkers();

    console.log(`\n⚙️  Worker process démarré`);
    console.log(`🌍 Environnement : ${env.NODE_ENV}`);
    console.log(`📋 Queues actives : emails, notifications, invoices\n`);
  } catch (error) {
    console.error('❌ Erreur au démarrage du worker process:', error);
    process.exit(1);
  }
};

startWorkerProcess();

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n${signal} reçu — arrêt en cours...`);
  await stopWorkers();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
