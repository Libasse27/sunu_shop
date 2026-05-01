// ─── Carte de récapitulatif de commande (PaymentSuccessPage) ─────────────────

import { CheckCircle, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatPrice } from '../../utils/formatPrice';

interface OrderItem {
  name: string; image: string; quantity: number; price: number; subtotal: number;
  variant?: { name: string; value: string };
}

export interface OrderSummaryData {
  orderNumber: string;
  createdAt: string;
  items: OrderItem[];
  pricing: { subtotal: number; shippingCost: number; discount: number; total: number };
  payment: { method: string; status: string };
}

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const METHOD_LABELS: Record<string, string> = {
  stripe: 'Carte bancaire',
  orange_money: 'Orange Money',
  wave: 'Wave',
  cash_on_delivery: 'Paiement à la livraison',
};

interface Props {
  order: OrderSummaryData;
  copied: boolean;
  onCopy: () => void;
}

export function OrderSummaryCard({ order, copied, onCopy }: Props) {
  return (
    <motion.div variants={itemVariants} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500 uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Numéro de commande</p>
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg font-mono mb-0">#{order.orderNumber}</p>
            <button onClick={onCopy} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors" title="Copier">
              {copied ? <Check size={15} style={{ color: '#009A44' }} /> : <Copy size={15} />}
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Date</p>
          <p className="font-medium text-sm mb-0">
            {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Items */}
      <div>
        {order.items.map((item, i) => (
          <div key={i} className="py-3 flex gap-3 items-center" style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : undefined }}>
            <img
              src={item.image || '/placeholder.png'} alt={item.name}
              className="rounded-lg object-cover shrink-0"
              style={{ width: 56, height: 56, background: '#f3f4f6' }}
            />
            <div className="flex-1" style={{ minWidth: 0 }}>
              <p className="text-sm font-medium truncate mb-0">{item.name}</p>
              {item.variant && <p className="text-sm text-gray-500 mt-1 mb-0">{item.variant.name}: {item.variant.value}</p>}
              <p className="text-sm text-gray-500 mt-1 mb-0">{item.quantity} × {formatPrice(item.price)}</p>
            </div>
            <p className="font-bold text-sm whitespace-nowrap mb-0">{formatPrice(item.subtotal ?? item.price * item.quantity)}</p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="mt-4 pt-4 border-t flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Sous-total</span>
          <span>{formatPrice(order.pricing.subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Livraison</span>
          <span>
            {order.pricing.shippingCost === 0
              ? <span className="font-medium" style={{ color: '#009A44' }}>Gratuite</span>
              : formatPrice(order.pricing.shippingCost)
            }
          </span>
        </div>
        {order.pricing.discount > 0 && (
          <div className="flex justify-between font-medium" style={{ color: '#009A44' }}>
            <span>Réduction</span>
            <span>−{formatPrice(order.pricing.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold pt-2 border-t">
          <span>Total payé</span>
          <span className="text-primary">{formatPrice(order.pricing.total)}</span>
        </div>
      </div>

      {/* Payment method */}
      <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
        <span className="text-gray-500">Moyen de paiement</span>
        <span className="inline-flex items-center gap-2 font-medium">
          <CheckCircle size={14} style={{ color: '#009A44' }} />
          {METHOD_LABELS[order.payment.method] || order.payment.method}
        </span>
      </div>
    </motion.div>
  );
}
