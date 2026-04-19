import { Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Home, MessageCircle, Search, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatPrice } from '../../utils/formatPrice';
import { WHATSAPP_NUMBER } from '../../utils/constants';

interface OrderData {
  orderNumber: string;
  total: number;
  paymentMethod: string;
  estimatedDelivery?: string;
}

interface Props {
  order: OrderData;
}

const paymentLabels: Record<string, string> = {
  orange_money: '🟠 Orange Money',
  wave: '🌊 Wave',
  stripe: '💳 Carte bancaire',
  cash_on_delivery: '🤝 Paiement à la livraison',
};

export default function OrderConfirmation({ order }: Props) {
  const whatsappMsg = `Bonjour Sunu Shop, j'ai besoin d'aide pour ma commande #${order.orderNumber}`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto py-12 px-4"
      style={{ maxWidth: '512px' }}
    >
      {/* Success icon */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="flex items-center justify-center rounded-xl shadow-lg mx-auto mb-6"
          style={{ width: '96px', height: '96px', background: 'linear-gradient(135deg, #009A44, #007A35)' }}
        >
          <CheckCircle size={44} className="text-white" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Merci pour votre commande !
        </h1>
        <p className="text-gray-500 text-sm mx-auto" style={{ maxWidth: '280px' }}>
          Votre commande a été confirmée. Un email de confirmation vous a été envoyé.
        </p>
      </div>

      {/* Order summary card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {/* Tricolor strip */}
        <div className="flex" style={{ height: '4px' }}>
          <div className="flex-1" style={{ background: '#009A44' }} />
          <div className="flex-1" style={{ background: '#FCD116' }} />
          <div className="flex-1" style={{ background: '#E31B23' }} />
        </div>
        <div className="p-6 flex flex-col gap-2">
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-500 text-sm">N° de commande</span>
            <span className="font-bold text-sm rounded px-2 py-1 bg-gray-50 font-mono">
              #{order.orderNumber}
            </span>
          </div>
          <div className="border-t border-gray-100" />
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-500 text-sm">Total</span>
            <span className="font-bold text-lg" style={{ color: '#009A44' }}>
              {formatPrice(order.total)}
            </span>
          </div>
          <div className="border-t border-gray-100" />
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-500 text-sm">Paiement</span>
            <span className="text-sm font-semibold text-gray-900">
              {paymentLabels[order.paymentMethod] || order.paymentMethod}
            </span>
          </div>
          {order.estimatedDelivery && (
            <>
              <div className="border-t border-gray-100" />
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 text-sm">Livraison estimée</span>
                <span className="text-sm font-semibold text-gray-900">{order.estimatedDelivery}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Prep notice */}
      <div
        className="flex items-center justify-center gap-2 text-sm mb-6 rounded-lg p-4"
        style={{ background: 'rgba(252,209,22,0.1)', border: '1px solid rgba(252,209,22,0.3)' }}
      >
        <Clock size={15} className="shrink-0" style={{ color: '#9A7A00' }} />
        <span className="font-semibold" style={{ color: '#9A7A00' }}>Préparation de votre commande sous 24–48h</span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            to="/mon-compte/commandes"
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Package size={16} /> Mes commandes
          </Link>
          <Link
            to={`/suivi-commande?number=${order.orderNumber}`}
            className="btn-outline flex-1 flex items-center justify-center gap-2"
          >
            <Search size={16} /> Suivre ma commande
          </Link>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-4 px-6 text-sm text-white rounded-lg font-semibold no-underline"
          style={{ background: 'linear-gradient(135deg, #009A44, #007A35)' }}
        >
          <MessageCircle size={16} />
          Contacter le support WhatsApp
        </a>

        <div className="flex items-center justify-between pt-1">
          <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 no-underline">
            <Home size={14} /> Accueil
          </Link>
          <Link
            to="/boutique"
            className="flex items-center gap-1 text-sm font-semibold no-underline"
            style={{ color: '#009A44' }}
          >
            Continuer mes achats <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
