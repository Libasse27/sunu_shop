import { Package, Truck, CheckCircle2, XCircle, Clock, RotateCcw, ArrowLeftRight } from 'lucide-react';

// ─── Palette drapeau sénégalais ───────────────────────────────────────────────
export const SN = {
  green:     '#009A44',
  greenDark: '#007A35',
  greenDeep: '#003D1C',
  gold:      '#FCD116',
  goldDark:  '#D4A800',
  red:       '#E31B23',
  redDark:   '#A50D1E',
} as const;

// ─── Status commandes ─────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<string, {
  label: string; bg: string; color: string; icon: React.ElementType
}> = {
  pending:    { label: 'En attente',      bg: 'rgba(252,209,22,0.18)', color: '#D4A800', icon: Clock },
  confirmed:  { label: 'Confirmée',       bg: 'rgba(0,154,68,0.10)',   color: '#009A44', icon: CheckCircle2 },
  processing: { label: 'En préparation',  bg: 'rgba(0,154,68,0.15)',   color: '#007A35', icon: Package },
  shipped:    { label: 'Expédiée',        bg: 'rgba(252,209,22,0.15)', color: '#B8960A', icon: Truck },
  delivered:  { label: 'Livrée',          bg: 'rgba(0,154,68,0.12)',   color: '#007A35', icon: CheckCircle2 },
  cancelled:  { label: 'Annulée',         bg: 'rgba(206,17,38,0.10)',  color: '#E31B23', icon: XCircle },
  returned:   { label: 'Retournée',       bg: 'rgba(124,58,237,0.10)', color: '#7C3AED', icon: ArrowLeftRight },
  refunded:   { label: 'Remboursée',      bg: 'rgba(206,17,38,0.08)',  color: '#A50D1E', icon: RotateCcw },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getInitials(firstName?: string, lastName?: string): string {
  return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (pwd.length >= 12)          score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: 'Très faible', color: '#E31B23' };
  if (score === 2) return { score, label: 'Faible',     color: '#CCB000' };
  if (score === 3) return { score, label: 'Moyen',      color: '#FCD116' };
  if (score === 4) return { score, label: 'Fort',       color: '#009A44' };
  return             { score, label: 'Très fort',       color: '#007A35' };
}
