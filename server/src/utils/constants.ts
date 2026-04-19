// ─── Livraison ────────────────────────────────────────────────────────────────
// Source unique de vérité — synchronisé avec client/src/utils/constants.ts
export const FREE_SHIPPING_THRESHOLD = 25_000; // FCFA
export const SHIPPING_COST = 3_000;            // FCFA

export const USER_ROLES = ['client', 'admin', 'superadmin'] as const;
export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'] as const;
export const PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded'] as const;
export const PAYMENT_METHODS = ['stripe', 'paypal', 'orange_money', 'wave', 'free_money', 'cash_on_delivery'] as const;
export const ADDRESS_LABELS = ['domicile', 'bureau', 'autre'] as const;
export const CURRENCIES = ['XOF', 'EUR', 'USD'] as const;
export const LANGUAGES = ['fr', 'en'] as const;
