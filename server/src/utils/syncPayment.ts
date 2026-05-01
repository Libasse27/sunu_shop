import Order from '../models/Order.model';
import type { IPayment } from '../models/Payment.model';
import logger from './logger';

export type PaymentOutcomeStatus = 'completed' | 'failed' | 'refunded';

interface PaymentOutcomeOptions {
  status:         PaymentOutcomeStatus;
  transactionId?: string;
  orderNote?:     string;
}

/**
 * Applique le résultat d'un paiement sur le document Payment ET sur le sous-document
 * Order.payment en une seule opération séquentielle, garantissant la cohérence.
 *
 * Règle : toujours appeler cette fonction après avoir positionné payment.providerResponse,
 * juste avant d'envoyer la réponse HTTP.
 */
export async function applyPaymentOutcome(
  payment: IPayment,
  opts:    PaymentOutcomeOptions,
): Promise<void> {
  payment.status = opts.status;
  await payment.save();

  const order = await Order.findById(payment.order);
  if (!order) {
    logger.warn('applyPaymentOutcome: commande introuvable', { paymentId: payment._id });
    return;
  }

  order.payment.status      = opts.status;
  order.payment.transactionId = opts.transactionId ?? order.payment.transactionId;

  if (opts.status === 'completed') {
    order.payment.paidAt = new Date();
    order.status = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      date:   new Date(),
      note:   opts.orderNote ?? 'Paiement confirmé',
    });
  } else if (opts.status === 'failed') {
    order.statusHistory.push({
      status: order.status,
      date:   new Date(),
      note:   opts.orderNote ?? 'Paiement échoué',
    });
  }

  await order.save();
}
