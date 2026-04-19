// =============================================================
// workers/index.ts — Démarrage de tous les workers BullMQ
//
// Importé par :
//   - server.ts   (mode monolithique, même process que l'API)
//   - worker.ts   (mode séparé, process dédié aux workers)
// =============================================================

import emailWorker        from './email.worker';
import notificationWorker from './notification.worker';
import invoiceWorker      from './invoice.worker';
import { emailQueue, notificationQueue, invoiceQueue } from '../config/queue';
import { queueDepth } from '../utils/metrics';

export const startWorkers = (): void => {
  console.log('🔄 Démarrage des workers BullMQ...');
  console.log(`   ✅ emailWorker        (concurrence: 5)`);
  console.log(`   ✅ notificationWorker (concurrence: 20)`);
  console.log(`   ✅ invoiceWorker      (concurrence: 3)`);

  // Mise à jour périodique des métriques de profondeur des queues
  setInterval(async () => {
    try {
      const [emailCounts, notifCounts, invoiceCounts] = await Promise.all([
        emailQueue.getJobCounts(),
        notificationQueue.getJobCounts(),
        invoiceQueue.getJobCounts(),
      ]);

      for (const [state, count] of Object.entries(emailCounts)) {
        queueDepth.set({ queue: 'emails', state }, count as number);
      }
      for (const [state, count] of Object.entries(notifCounts)) {
        queueDepth.set({ queue: 'notifications', state }, count as number);
      }
      for (const [state, count] of Object.entries(invoiceCounts)) {
        queueDepth.set({ queue: 'invoices', state }, count as number);
      }
    } catch {
      // Redis potentiellement indisponible — ignorer
    }
  }, 30_000); // toutes les 30s
};

// Graceful shutdown — fermer proprement les workers
export const stopWorkers = async (): Promise<void> => {
  console.log('⏹  Arrêt des workers...');
  await Promise.allSettled([
    emailWorker.close(),
    notificationWorker.close(),
    invoiceWorker.close(),
  ]);
  console.log('✅ Workers arrêtés proprement');
};

export { emailWorker, notificationWorker, invoiceWorker };
