// Badges de statuts pour commandes et paiements

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// ─── Config des styles ────────────────────────────────────────────────────────

const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending: {
    label: 'En attente',
    bg: 'rgba(252,209,22,0.15)',
    text: '#8B7000',
    dot: '#FCD116',
  },
  confirmed: {
    label: 'Confirmée',
    bg: 'rgba(0,154,68,0.1)',
    text: '#007A35',
    dot: '#009A44',
  },
  processing: {
    label: 'En traitement',
    bg: '#f3e8ff',
    text: '#6b21a8',
    dot: '#a855f7',
  },
  shipped: {
    label: 'Expédiée',
    bg: '#e0e7ff',
    text: '#3730a3',
    dot: '#6366f1',
  },
  delivered: {
    label: 'Livrée',
    bg: 'rgba(0,154,68,0.12)',
    text: '#003D1C',
    dot: '#009A44',
  },
  cancelled: {
    label: 'Annulée',
    bg: 'rgba(227,27,35,0.1)',
    text: '#B81219',
    dot: '#E31B23',
  },
  returned: {
    label: 'Retournée',
    bg: '#fffde6',
    text: '#7A5C00',
    dot: '#CCB000',
  },
  refunded: {
    label: 'Remboursée',
    bg: '#f1f5f9',
    text: '#475569',
    dot: '#94a3b8',
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending: {
    label: 'En attente',
    bg: 'rgba(252,209,22,0.15)',
    text: '#8B7000',
    dot: '#FCD116',
  },
  completed: {
    label: 'Payé',
    bg: 'rgba(0,154,68,0.1)',
    text: '#007A35',
    dot: '#009A44',
  },
  failed: {
    label: 'Échoué',
    bg: 'rgba(227,27,35,0.1)',
    text: '#B81219',
    dot: '#E31B23',
  },
  refunded: {
    label: 'Remboursé',
    bg: '#f1f5f9',
    text: '#475569',
    dot: '#94a3b8',
  },
};

// ─── Composant générique interne ──────────────────────────────────────────────

function StatusBadge({
  label,
  bg,
  text,
  dot,
}: {
  label: string;
  bg: string;
  text: string;
  dot: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: bg, color: text }}
    >
      <span
        className="inline-block rounded-full shrink-0"
        style={{ width: 6, height: 6, backgroundColor: dot }}
      />
      {label}
    </span>
  );
}

// ─── Composants exportés ──────────────────────────────────────────────────────

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = ORDER_STATUS_CONFIG[status as OrderStatus];
  if (!config) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
        {status}
      </span>
    );
  }
  return <StatusBadge {...config} />;
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus | string;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = PAYMENT_STATUS_CONFIG[status as PaymentStatus];
  if (!config) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
        {status}
      </span>
    );
  }
  return <StatusBadge {...config} />;
}
