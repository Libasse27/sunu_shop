// =============================================================
// notification.worker.ts — Worker pour notifications temps réel
//
// Chaque job :
//   1. Émet via Socket.io (temps réel dans le navigateur)
//   2. TODO: Peut être étendu pour sauvegarder en BDD
// =============================================================

import { Worker, Job } from 'bullmq';
import { bullConnection, NotificationJobData } from '../config/queue';
import { emitNotificationToUser } from '../config/socket';
import { queueJobsCompleted, queueJobsFailed } from '../utils/metrics';
import logger from '../utils/logger';

const notificationWorker = new Worker<NotificationJobData>(
  'notifications',

  async (job: Job<NotificationJobData>) => {
    const { userId, type, title, message, link, data } = job.data;

    emitNotificationToUser(userId, {
      id:        job.id,
      type,
      title,
      message,
      link,
      data,
      timestamp: new Date().toISOString(),
    });

    queueJobsCompleted.inc({ queue: 'notifications' });
  },

  {
    connection:  bullConnection as any, // BullMQ bundles its own ioredis
    concurrency: 20, // notifications légères, haute concurrence
  },
);

notificationWorker.on('failed', (job, err) => {
  queueJobsFailed.inc({ queue: 'notifications' });
  logger.error('Notification job échoué', { jobId: job?.id, error: err.message });
});

export default notificationWorker;
