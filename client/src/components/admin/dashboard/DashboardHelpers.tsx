// ─── Shared helpers and micro-components for AdminDashboardPage ──────────────

import { TrendingUp, TrendingDown } from 'lucide-react';

// ─── Configs affichage ────────────────────────────────────────────────────────

export const CATEGORY_META: Record<string, { emoji: string; label: string; color: string }> = {
  informatique:   { emoji: '💻', label: 'Informatique',      color: '#009A44' },
  telephones:     { emoji: '📱', label: 'Téléphonie Mobile', color: '#E31B23' },
  electronique:   { emoji: '📺', label: 'Électronique & TV', color: '#635BFF' },
  electromenager: { emoji: '🏠', label: 'Électroménager',    color: '#F59E0B' },
  accessoires:    { emoji: '🔌', label: 'Accessoires',       color: '#8B5CF6' },
  gaming:         { emoji: '🎮', label: 'Gaming',            color: '#EC4899' },
};

export const PAYMENT_META: Record<string, { emoji: string; label: string; color: string }> = {
  orange_money:     { emoji: '🟠', label: 'Orange Money',   color: '#FF6600' },
  wave:             { emoji: '🌊', label: 'Wave',           color: '#1DC8FF' },
  stripe:           { emoji: '💳', label: 'Carte / Stripe', color: '#635BFF' },
  free_money:       { emoji: '📱', label: 'Free Money',     color: '#10B981' },
  cash_on_delivery: { emoji: '🤝', label: 'À la livraison', color: '#009A44' },
};

export const STATUS_COLORS: Record<string, string> = {
  pending: '#FCD116', confirmed: '#009A44', processing: '#a855f7',
  shipped: '#6366f1', delivered: '#007A35', cancelled: '#E31B23',
  returned: '#CCB000', refunded: '#94a3b8',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmée', processing: 'En traitement',
  shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée',
  returned: 'Retournée', refunded: 'Remboursée',
};

export const RANK_COLORS = [
  '#FCD116', '#009A44', '#E31B23', '#8B5CF6', '#F59E0B',
  '#6B7280', '#6B7280', '#6B7280', '#6B7280', '#6B7280',
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)}j`;
}

export function getCategoryMeta(slug: string, fallbackName: string) {
  const key = (slug || '').toLowerCase().replace(/[^a-z]/g, '');
  return CATEGORY_META[key] || { emoji: '📦', label: fallbackName, color: '#6B7280' };
}

// ─── Micro-components ─────────────────────────────────────────────────────────

export function GrowthBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const up = value >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
      style={{
        backgroundColor: up ? 'rgba(0,154,68,0.1)' : 'rgba(227,27,35,0.1)',
        color: up ? '#007A35' : '#E31B23',
      }}
    >
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {Math.abs(value)}%
    </span>
  );
}

export function InitialsAvatar({ firstName, lastName, size = 32 }: {
  firstName: string; lastName: string; size?: number;
}) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  const colors = ['#009A44', '#E31B23', '#635BFF', '#F59E0B', '#EC4899', '#10B981'];
  const idx = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length;
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.35, backgroundColor: colors[idx] }}
    >
      {initials}
    </div>
  );
}
