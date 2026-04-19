// =============================================================
// email.worker.ts — Worker BullMQ pour l'envoi d'emails
//
// Traitements :
//   - 5 emails en parallèle (concurrency: 5)
//   - Rate limit SMTP : 50 emails / minute
//   - 3 tentatives avec backoff exponentiel (2s → 4s → 8s)
// =============================================================

import { Worker, Job } from 'bullmq';
import { bullConnection, EmailJobData } from '../config/queue';
import { sendEmail } from '../utils/sendEmail';
import { queueJobsCompleted, queueJobsFailed, queueJobDuration } from '../utils/metrics';
import { env } from '../config/env';
import logger from '../utils/logger';

const emailWorker = new Worker<EmailJobData>(
  'emails',

  async (job: Job<EmailJobData>) => {
    const start = Date.now();
    const { type, to, subject, html, text } = job.data;

    if (env.NODE_ENV !== 'test') {
      logger.info('Email en cours d\'envoi', { jobId: job.id, type, to });
    }

    await sendEmail({ to, subject, html, text });

    const duration = Date.now() - start;
    queueJobsCompleted.inc({ queue: 'emails' });
    queueJobDuration.observe({ queue: 'emails' }, duration);
  },

  {
    connection:  bullConnection as any, // BullMQ bundles its own ioredis
    concurrency: 5,
    limiter: {
      max:      50,    // max 50 jobs traités
      duration: 60000, // par minute (respect du rate limit SMTP)
    },
  },
);

emailWorker.on('completed', (job) => {
  if (env.NODE_ENV === 'development') {
    logger.info('Email job terminé', {
      jobId:    job.id,
      type:     job.data.type,
      duration: job.processedOn! - job.timestamp,
    });
  }
});

emailWorker.on('failed', (job, err) => {
  queueJobsFailed.inc({ queue: 'emails' });
  logger.error('Email job échoué', {
    jobId:    job?.id,
    type:     job?.data?.type,
    attempt:  job?.attemptsMade,
    maxAttempts: job?.opts?.attempts,
    error:    err.message,
  });
});

emailWorker.on('error', (err) => {
  logger.error('EmailWorker erreur', { error: err.message });
});

export default emailWorker;
