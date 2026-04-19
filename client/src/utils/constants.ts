// ─── Site identity ────────────────────────────────────────────────────────────
export const SITE_NAME = 'TechAfrique';
export const SITE_DESCRIPTION = 'Boutique en ligne de matériel informatique, électronique, électroménager et téléphonie';
export const SITE_URL = 'https://sunushop.sn';

// ─── Contact ─────────────────────────────────────────────────────────────────
export const WHATSAPP_NUMBER = '+221773828522';
export const CONTACT_EMAIL = 'contact@sunushop.sn';
export const CONTACT_PHONE = '+221 77 382 85 22';
export const CONTACT_ADDRESS = 'Plateau, Centre-ville — Dakar, Sénégal';

// ─── Shipping ────────────────────────────────────────────────────────────────
export const FREE_SHIPPING_THRESHOLD = 25000;
export const SHIPPING_COST = 3000;

// ─── Inventory ───────────────────────────────────────────────────────────────
export const LOW_STOCK_THRESHOLD = 5;

// ─── Social links ─────────────────────────────────────────────────────────────
export const SOCIAL_LINKS = {
  facebook: 'https://facebook.com/sunushop',
  instagram: 'https://instagram.com/sunushop',
  twitter: 'https://twitter.com/sunushop',
  whatsapp: `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Bonjour TechAfrique, j'ai une question.`,
};

// ─── Categories nav ───────────────────────────────────────────────────────────
export const CATEGORIES_NAV = [
  { name: 'Informatique', slug: 'informatique', icon: '💻' },
  { name: 'Téléphonie Mobile', slug: 'telephones', icon: '📱' },
  { name: 'Électronique & TV', slug: 'electronique', icon: '📺' },
  { name: 'Électroménager', slug: 'electromenager', icon: '🏠' },
  { name: 'Accessoires', slug: 'accessoires', icon: '🖱️' },
  { name: 'Gaming', slug: 'gaming', icon: '🎮' },
  { name: 'Caméra & Surveillance', slug: 'cameras', icon: '📷' },
];

// ─── Payment methods ─────────────────────────────────────────────────────────
export const PAYMENT_METHODS = [
  { key: 'orange_money', label: 'Orange Money', emoji: '🟠', color: '#FF6600' },
  { key: 'wave', label: 'Wave', emoji: '🌊', color: '#1DC8FF' },
  { key: 'stripe', label: 'Carte bancaire', emoji: '💳', color: '#635BFF' },
  { key: 'cash_on_delivery', label: 'Paiement à la livraison', emoji: '🤝', color: '#009A44' },
] as const;

export const PAYMENT_LABELS: Record<string, string> = {
  orange_money: '🟠 Orange Money',
  wave: '🌊 Wave',
  stripe: '💳 Carte bancaire',
  cash_on_delivery: '🤝 Paiement à la livraison',
};

// ─── Order statuses ───────────────────────────────────────────────────────────
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  processing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#009A44',
  processing: '#007A35',
  shipped: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#E31B23',
  refunded: '#64748B',
};

// ─── Pan-African palette ──────────────────────────────────────────────────────
export const COLORS = {
  green: '#009A44',
  greenDark: '#007A35',
  greenDeep: '#003D1C',
  gold: '#FCD116',
  goldDark: '#D4A800',
  red: '#E31B23',
  redDark: '#A50D1E',
} as const;

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;

// ─── Review ───────────────────────────────────────────────────────────────────
export const MAX_REVIEW_IMAGES = 3;
export const MIN_REVIEW_LENGTH = 10;
