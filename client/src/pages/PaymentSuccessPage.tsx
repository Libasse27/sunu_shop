import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Package, ArrowRight, Truck, Mail, MessageCircle, MapPin, Star, CheckCircle, Check, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { clearCart } from '../features/cart/cartSlice';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { WHATSAPP_NUMBER } from '../utils/constants';
interface OrderDetails {
  _id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  items: { name: string; image: string; quantity: number; price: number; subtotal: number; variant?: { name: string; value: string } }[];
  pricing: { subtotal: number; shippingCost: number; discount: number; total: number };
  payment: { method: string; status: string };
  shippingAddress: { fullName: string; phone: string; street: string; city: string; country: string };
}

const METHOD_LABELS: Record<string, string> = {
  stripe: 'Carte bancaire',
  orange_money: 'Orange Money',
  wave: 'Wave',
  cash_on_delivery: 'Paiement à la livraison',
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const orderId = searchParams.get('order');
  const method = searchParams.get('method') || '';
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    dispatch(clearCart());

    if (!orderId) { setLoading(false); return; }

    const isExternalRedirect = ['wave', 'orange_money'].includes(method);

    api.get(`/orders/${orderId}`)
      .then(res => {
        const fetched: OrderDetails = res.data.data;
        setOrder(fetched);

        // Polling uniquement si le paiement est encore en attente après une
        // redirection externe (Wave/Orange Money redirect vers success_url)
        if (isExternalRedirect && fetched.payment.status !== 'completed') {
          setPolling(true);
          let tries = 0;
          const MAX = 12; // 12 × 3s = 36s max
          const id = setInterval(async () => {
            tries++;
            try {
              const r = await api.get(`/orders/${orderId}`);
              const updated: OrderDetails = r.data.data;
              setOrder(updated);
              if (updated.payment.status === 'completed' || tries >= MAX) {
                clearInterval(id);
                setPolling(false);
              }
            } catch {
              clearInterval(id);
              setPolling(false);
            }
          }, 3000);
          return () => clearInterval(id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId, method, dispatch]);

  const handleCopy = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCashOnDelivery = method === 'cash_on_delivery';

  const whatsappMsg = order
    ? `Bonjour Sunu Shop, j'ai besoin d'aide pour ma commande #${order.orderNumber}`
    : `Bonjour Sunu Shop, j'ai besoin d'aide pour ma commande`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(whatsappMsg)}`;

  const nextSteps = [
    {
      icon: Mail,
      label: 'Email de confirmation envoyé',
      desc: 'Consultez votre boîte mail pour retrouver les détails de votre commande.',
      done: true,
    },
    {
      icon: Package,
      label: 'Préparation en cours',
      desc: 'Nos équipes préparent votre commande avec soin.',
      done: false,
    },
    {
      icon: Truck,
      label: isCashOnDelivery ? 'Livraison & paiement à la réception' : 'Livraison sous 2–5 jours ouvrés',
      desc: isCashOnDelivery
        ? 'Vous paierez en espèces directement au livreur.'
        : 'Vous recevrez un SMS dès que votre colis est en route.',
      done: false,
    },
  ];

  return (
    <>
      <Helmet><title>Commande confirmée — Sunu Shop</title></Helmet>
      <div className="container-custom py-12">
        <div className="mx-auto" style={{ maxWidth: 672 }}>

          {/* Hero */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ width: 96, height: 96, background: 'linear-gradient(135deg, #009A44, #007A35)' }}
            >
              <CheckCircle size={48} className="text-white" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h1 className="font-bold text-3xl mb-2">
                {isCashOnDelivery ? 'Commande confirmée !' : 'Paiement réussi !'}
              </h1>
              <p className="text-gray-600">
                {isCashOnDelivery
                  ? 'Votre commande a été enregistrée. Vous paierez à la livraison.'
                  : `Paiement par ${METHOD_LABELS[method] || method} traité avec succès.`
                }
              </p>
            </motion.div>
          </div>

          {/* Polling indicator — paiement Wave/OM encore en attente de confirmation */}
          {polling && order?.payment.status !== 'completed' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3 text-sm"
              style={{ background: 'rgba(252,209,22,0.1)', border: '1px solid rgba(252,209,22,0.3)' }}>
              <div className="rounded-full border-2 border-yellow-500 shrink-0 animate-spin" style={{ width: 16, height: 16, borderTopColor: 'transparent' }} />
              <span style={{ color: '#92400e' }}>Vérification du paiement en cours… cela peut prendre quelques secondes.</span>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-3 mb-4 animate-pulse">
              <div className="rounded bg-gray-200" style={{ height: 20, width: '50%' }} />
              <div className="rounded bg-gray-200" style={{ height: 16, width: '75%' }} />
              <div className="rounded bg-gray-200" style={{ height: 16, width: '66%' }} />
              <div className="rounded bg-gray-200" style={{ height: 16, width: '50%' }} />
            </div>
          )}

          {!loading && order && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-3 mb-6"
            >
              {/* Order header + items + pricing */}
              <motion.div variants={itemVariants} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-500 uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Numéro de commande</p>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg font-mono mb-0">#{order.orderNumber}</p>
                      <button
                        onClick={handleCopy}
                        className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
                        title="Copier"
                      >
                        {copied
                          ? <Check size={15} style={{ color: '#009A44' }} />
                          : <Copy size={15} />
                        }
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Date</p>
                    <p className="font-medium text-sm mb-0">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  {order.items.map((item, i) => (
                    <div
                      key={i}
                      className="py-3 flex gap-3 items-center"
                      style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : undefined }}
                    >
                      <img
                        src={item.image || '/placeholder.png'}
                        alt={item.name}
                        className="rounded-lg object-cover shrink-0"
                        style={{ width: 56, height: 56, background: '#f3f4f6' }}
                      />
                      <div className="flex-1" style={{ minWidth: 0 }}>
                        <p className="text-sm font-medium truncate mb-0">{item.name}</p>
                        {item.variant && (
                          <p className="text-sm text-gray-500 mt-1 mb-0">{item.variant.name}: {item.variant.value}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1 mb-0">
                          {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <p className="font-bold text-sm whitespace-nowrap mb-0">
                        {formatPrice(item.subtotal ?? item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pricing breakdown */}
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

              {/* Shipping address */}
              <motion.div variants={itemVariants} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-semibold text-sm uppercase text-gray-500 flex items-center gap-2 mb-4" style={{ letterSpacing: '0.05em' }}>
                  <MapPin size={15} className="text-primary" /> Adresse de livraison
                </h3>
                <div className="rounded-lg p-4 text-sm flex flex-col" style={{ gap: '2px', backgroundColor: 'rgba(0,154,68,0.06)' }}>
                  <p className="font-semibold mb-0">{order.shippingAddress.fullName}</p>
                  <p className="text-gray-600 mb-0">{order.shippingAddress.phone}</p>
                  <p className="text-gray-600 mt-1 mb-0">{order.shippingAddress.street}</p>
                  <p className="text-gray-600 mb-0">
                    {order.shippingAddress.city}, {order.shippingAddress.country}
                  </p>
                </div>
              </motion.div>

              {/* Next steps */}
              <motion.div variants={itemVariants} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-semibold mb-4">Prochaines étapes</h3>
                <div className="flex flex-col gap-6">
                  {nextSteps.map((step, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div
                        className="rounded-full flex items-center justify-center shrink-0"
                        style={{
                          width: 40, height: 40,
                          background: step.done ? 'rgba(0,154,68,0.12)' : 'rgba(0,154,68,0.07)',
                        }}
                      >
                        <step.icon size={18} style={{ color: step.done ? '#16a34a' : '#009A44' }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm mb-0">{step.label}</p>
                          {step.done && (
                            <span
                              className="rounded-full text-xs font-medium px-2 py-0.5"
                              style={{ background: 'rgba(0,154,68,0.12)', color: '#007A35', fontSize: '10px' }}
                            >
                              Fait
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 mb-0">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Fallback when no order data */}
          {!loading && !order && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center text-gray-500 mb-6">
              <Package size={40} className="mx-auto mb-4 text-gray-400 opacity-50" />
              <p className="mb-0">Votre commande a bien été enregistrée.</p>
              <p className="text-sm mt-1 mb-0">Consultez votre email pour les détails.</p>
            </div>
          )}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: loading ? 0.2 : 0.6 }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/mon-compte/commandes"
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Package size={18} /> Mes commandes
              </Link>
              <Link
                to="/boutique"
                className="btn-outline flex-1 flex items-center justify-center gap-2"
              >
                Continuer les achats <ArrowRight size={18} />
              </Link>
            </div>

            {order && (
              <Link
                to={`/suivi-commande?number=${order.orderNumber}`}
                className="block text-center text-sm text-primary py-1 no-underline hover:underline"
              >
                Suivre ma commande →
              </Link>
            )}

            {order && order.items.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-0.5 flex items-center gap-2">
                    <Star size={14} style={{ color: '#FCD116' }} /> Donnez votre avis
                  </p>
                  <p className="text-xs text-gray-500 mb-0">
                    Une fois votre commande livrée, partagez votre expérience depuis "Mes commandes".
                  </p>
                </div>
                <Link
                  to="/mon-compte/commandes"
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border no-underline transition-colors"
                  style={{ color: '#009A44', borderColor: 'rgba(0,154,68,0.3)' }}
                >
                  Mes commandes →
                </Link>
              </div>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 px-6 text-sm text-white rounded-xl font-medium"
              style={{ background: '#009A44' }}
            >
              <MessageCircle size={18} />
              Besoin d'aide ? Contactez-nous sur WhatsApp
            </a>
          </motion.div>

        </div>
      </div>
    </>
  );
}
