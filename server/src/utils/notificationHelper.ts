import Notification from '../models/Notification.model';
import { emitNotificationToUser } from '../config/socket';
import mongoose from 'mongoose';
import logger from './logger';

interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  type: 'order_status' | 'payment' | 'promotion' | 'system' | 'review';
  title: string;
  message: string;
  data?: any;
}

export const createNotification = async (params: CreateNotificationParams): Promise<void> => {
  try {
    const notification = await Notification.create({
      user: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data,
    });

    // Emit via Socket.io — sérialiser _id (ObjectId → string) pour le payload socket
    const obj = notification.toObject();
    emitNotificationToUser(params.userId.toString(), { ...obj, _id: obj._id.toString() });
  } catch (error) {
    logger.error('Erreur création notification', { error });
  }
};

// Predefined notification templates
export const notificationTemplates = {
  orderConfirmed: (orderNumber: string) => ({
    type: 'order_status' as const,
    title: 'Commande confirmée',
    message: `Votre commande ${orderNumber} a été confirmée et sera bientôt traitée.`,
  }),

  orderShipped: (orderNumber: string, trackingNumber?: string) => ({
    type: 'order_status' as const,
    title: 'Commande expédiée',
    message: trackingNumber
      ? `Votre commande ${orderNumber} a été expédiée. Numéro de suivi: ${trackingNumber}`
      : `Votre commande ${orderNumber} a été expédiée.`,
  }),

  orderDelivered: (orderNumber: string) => ({
    type: 'order_status' as const,
    title: 'Commande livrée',
    message: `Votre commande ${orderNumber} a été livrée avec succès. Merci pour votre achat!`,
  }),

  orderCancelled: (orderNumber: string) => ({
    type: 'order_status' as const,
    title: 'Commande annulée',
    message: `Votre commande ${orderNumber} a été annulée.`,
  }),

  paymentCompleted: (orderNumber: string, amount: number) => ({
    type: 'payment' as const,
    title: 'Paiement confirmé',
    message: `Votre paiement de ${amount.toLocaleString('fr-FR')} FCFA pour la commande ${orderNumber} a été confirmé.`,
  }),

  paymentFailed: (orderNumber: string) => ({
    type: 'payment' as const,
    title: 'Échec du paiement',
    message: `Le paiement pour la commande ${orderNumber} a échoué. Veuillez réessayer.`,
  }),

  paymentRefunded: (orderNumber: string, amount: number) => ({
    type: 'payment' as const,
    title: 'Paiement remboursé',
    message: `Votre paiement de ${amount.toLocaleString('fr-FR')} FCFA pour la commande ${orderNumber} a été remboursé.`,
  }),

  promotionAlert: (title: string, message: string) => ({
    type: 'promotion' as const,
    title,
    message,
  }),

  reviewRequest: (orderNumber: string, productName: string) => ({
    type: 'review' as const,
    title: 'Donnez votre avis',
    message: `Partagez votre expérience avec ${productName} de la commande ${orderNumber}.`,
  }),
};
