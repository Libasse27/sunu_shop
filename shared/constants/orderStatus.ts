export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_METHODS = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
  ORANGE_MONEY: 'orange_money',
  WAVE: 'wave',
  FREE_MONEY: 'free_money',
  CASH_ON_DELIVERY: 'cash_on_delivery',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  processing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  returned: 'Retournée',
  refunded: 'Remboursée',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  processing: 'En cours',
  completed: 'Complété',
  failed: 'Échoué',
  refunded: 'Remboursé',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  stripe: 'Carte bancaire',
  paypal: 'PayPal',
  orange_money: 'Orange Money',
  wave: 'Wave',
  free_money: 'Free Money',
  cash_on_delivery: 'Paiement à la livraison',
};
