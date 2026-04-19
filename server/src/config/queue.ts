// =============================================================
// queue.ts — Définition des queues BullMQ
//
// Queues disponibles :
//   emailQueue        → envoi d'emails (welcome, commande, reset...)
//   notificationQueue → notifications temps réel (Socket.io)
//   invoiceQueue      → génération de factures PDF
//
// Workers : src/workers/
// Dashboard : /admin/queues (protégé admin)
// =============================================================

import { Queue, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';

// Connexion dédiée BullMQ (maxRetriesPerRequest: null obligatoire)
export const bullConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck:     false,
  retryStrategy: (times: number) => Math.min(times * 200, 3000),
});

bullConnection.on('error', (err: Error) => {
  console.error('❌ BullMQ Redis erreur:', err.message);
});

// Options par défaut pour toutes les queues
const defaultQueueOptions: QueueOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: bullConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type:  'exponential',
      delay: 2000, // 2s → 4s → 8s
    },
    removeOnComplete: { count: 200, age: 24 * 3600 },  // 200 jobs ou 24h
    removeOnFail:     { count: 500, age: 7 * 24 * 3600 }, // 500 jobs ou 7 jours
  },
};

// ---- Définition des queues ----
export const emailQueue        = new Queue('emails',        defaultQueueOptions);
export const notificationQueue = new Queue('notifications', defaultQueueOptions);
export const invoiceQueue      = new Queue('invoices',      defaultQueueOptions);

// ---- Types de données par queue ----

export interface EmailJobData {
  type: 'welcome' | 'orderConfirmation' | 'orderStatusUpdate' |
        'paymentConfirmation' | 'resetPassword' | 'passwordChanged' |
        'refundConfirmation' | 'reviewReply';
  to:      string;
  subject: string;
  html:    string;
  text?:   string;
}

export interface NotificationJobData {
  userId:  string;
  type:    string;
  title:   string;
  message: string;
  link?:   string;
  data?:   Record<string, unknown>;
}

export interface InvoiceJobData {
  orderId: string;
  userId:  string;
  email:   string;
  orderNumber: string;
}

// ---- Helper : ajouter un email en queue ----
export const queueEmail = async (data: EmailJobData, delay?: number) => {
  return emailQueue.add(data.type, data, {
    delay,
    priority: data.type === 'resetPassword' ? 1 : 10, // reset password en priorité haute
  });
};

// ---- Helper : ajouter une notification en queue ----
export const queueNotification = async (data: NotificationJobData) => {
  return notificationQueue.add(data.type, data);
};

// ---- Helper : ajouter une facture en queue ----
export const queueInvoice = async (data: InvoiceJobData) => {
  return invoiceQueue.add('generate', data, {
    delay: 5000, // attendre 5s après confirmation commande
  });
};

export const allQueues = [emailQueue, notificationQueue, invoiceQueue];
