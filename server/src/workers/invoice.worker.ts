// =============================================================
// invoice.worker.ts — Worker pour génération de factures
//
// Tâches :
//   1. Récupère la commande depuis MongoDB
//   2. Génère le HTML de la facture
//   3. Envoie par email au client
//
// Extension possible : générer un PDF avec Puppeteer
// =============================================================

import { Worker, Job } from 'bullmq';
import { bullConnection, InvoiceJobData, queueEmail } from '../config/queue';
import { queueJobsCompleted, queueJobsFailed } from '../utils/metrics';
import logger from '../utils/logger';
import type { IOrder } from '../models/Order.model';

const invoiceWorker = new Worker<InvoiceJobData>(
  'invoices',

  async (job: Job<InvoiceJobData>) => {
    const { orderId, userId, email, orderNumber } = job.data;

    // Lazy import pour éviter les dépendances circulaires
    const Order = (await import('../models/Order.model')).default;

    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name images')
      .lean<IOrder>();

    if (!order) {
      throw new Error(`Commande ${orderId} introuvable pour la facture`);
    }

    // Générer le contenu HTML de la facture
    const invoiceHtml = buildInvoiceHtml(order, orderNumber);

    // Envoyer la facture par email
    await queueEmail({
      type:    'orderConfirmation',
      to:      email,
      subject: `Facture TechAfrique — Commande ${orderNumber}`,
      html:    invoiceHtml,
    });

    queueJobsCompleted.inc({ queue: 'invoices' });
    logger.info('Facture générée et envoyée', { orderNumber, email });
  },

  {
    connection:  bullConnection as any, // BullMQ bundles its own ioredis
    concurrency: 3, // génération plus lourde
  },
);

// ─── Type pour la commande populée (produits résolus en objets) ───────────────
interface PopulatedOrderItem {
  product?: { name?: string };
  quantity: number;
  price:    number;
}

interface PopulatedOrder {
  items?:   PopulatedOrderItem[];
  pricing?: { total?: number };
}

// --- Génération HTML de la facture ---
function buildInvoiceHtml(order: PopulatedOrder, orderNumber: string): string {
  const PRIMARY = '#16A34A';

  const itemsRows = (order.items || []).map((item: PopulatedOrderItem) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${item.product?.name || 'Produit'}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${item.price?.toLocaleString('fr-FR')} FCFA</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8" /></head>
    <body style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">
      <div style="background:${PRIMARY};color:white;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="margin:0;font-size:24px;">TechAfrique</h1>
        <p style="margin:8px 0 0;">FACTURE — ${orderNumber}</p>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
        <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:8px;text-align:left;">Produit</th>
              <th style="padding:8px;">Qté</th>
              <th style="padding:8px;text-align:right;">Prix unit.</th>
              <th style="padding:8px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
        <div style="text-align:right;font-size:18px;font-weight:bold;color:${PRIMARY};">
          Total : ${order.pricing?.total?.toLocaleString('fr-FR')} FCFA
        </div>
        <p style="margin-top:24px;color:#6b7280;font-size:13px;text-align:center;">
          TechAfrique — Dakar, Sénégal | contact@techafrique.sn
        </p>
      </div>
    </body></html>
  `;
}

invoiceWorker.on('failed', (job, err) => {
  queueJobsFailed.inc({ queue: 'invoices' });
  logger.error('Invoice job échoué', { jobId: job?.id, error: err.message });
});

export default invoiceWorker;
