import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Search, Package, CheckCircle, XCircle, Clock, Truck, MapPin } from 'lucide-react';
import Breadcrumb from '../components/common/Breadcrumb';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import toast from 'react-hot-toast';

interface OrderItem {
  name: string;
  image: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  pricing: {
    subtotal: number;
    shippingCost: number;
    total: number;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    country: string;
  };
  shipping?: {
    trackingNumber?: string;
  };
  createdAt: string;
  statusHistory?: {
    status: string;
    date: string;
    message?: string;
  }[];
}

const statusConfig = {
  pending:    { label: 'En attente',     icon: Clock },
  confirmed:  { label: 'Confirmée',      icon: CheckCircle },
  processing: { label: 'En préparation', icon: Package },
  shipped:    { label: 'Expédiée',       icon: Truck },
  delivered:  { label: 'Livrée',         icon: CheckCircle },
  cancelled:  { label: 'Annulée',        icon: XCircle },
};

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-search if ?number= is provided in URL (e.g. from AccountPage)
  useEffect(() => {
    const numberParam = searchParams.get('number');
    if (numberParam) {
      setOrderNumber(numberParam);
      setLoading(true);
      setError('');
      api.get(`/orders/track/${numberParam.trim()}`)
        .then(res => setOrder(res.data.data))
        .catch(err => {
          const message = err.response?.data?.message || 'Commande introuvable. Vérifiez le numéro et réessayez.';
          setError(message);
          toast.error(message);
        })
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      toast.error('Veuillez saisir un numéro de commande');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const { data } = await api.get(`/orders/track/${orderNumber.trim()}`);
      setOrder(data.data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Commande introuvable. Vérifiez le numéro et réessayez.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? statusSteps.indexOf(order.status) : -1;

  const getStatusBadgeStyle = (status: string): React.CSSProperties => {
    if (status === 'confirmed') return { backgroundColor: 'rgba(0,154,68,0.10)', color: '#009A44' };
    if (status === 'shipped') return { backgroundColor: 'rgba(124,58,237,0.10)', color: '#7c3aed' };
    if (status === 'pending') return { backgroundColor: 'rgba(245,158,11,0.15)', color: '#d97706' };
    if (status === 'processing') return { backgroundColor: 'rgba(245,158,11,0.10)', color: '#d97706' };
    if (status === 'delivered') return { backgroundColor: 'rgba(34,197,94,0.10)', color: '#16a34a' };
    if (status === 'cancelled') return { backgroundColor: 'rgba(239,68,68,0.10)', color: '#dc2626' };
    return {};
  };

  return (
    <>
      <Helmet>
        <title>Suivre ma commande — Sunu Shop</title>
        <meta name="description" content="Suivez votre commande Sunu Shop en temps réel avec votre numéro de commande" />
      </Helmet>

      {/* Hero sénégalais */}
      <section className="relative border-b py-6 overflow-hidden" style={{ background: 'linear-gradient(135deg, #003D1C 0%, #005C29 50%, #003D1C 100%)' }}>
        <div className="absolute left-0 top-0 bottom-0 flex flex-col" style={{ width: '5px' }}>
          <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
          <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
        </div>
        <div className="container-custom relative z-10 text-center">
          <div className="flex justify-start mb-2">
            <Breadcrumb items={[{ label: 'Suivi de commande' }]} />
          </div>
          <h1 className="font-bold text-2xl text-white mb-1">Suivre ma commande</h1>
          <p className="text-sm mb-0" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Entrez votre numéro de commande pour suivre son état en temps réel
          </p>
        </div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container-custom py-8"
      >
        <div className="mx-auto" style={{ maxWidth: 900 }}>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <label htmlFor="orderNumber" className="block font-medium mb-2">
              Numéro de commande
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={18} className="absolute text-gray-400" style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Ex: ORD-20260215-1234"
                  className="input-field w-full"
                  style={{ paddingLeft: 40 }}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <div
                      className="rounded-full border-2 border-white inline-block"
                      style={{ width: 16, height: 16, borderTopColor: 'transparent', animation: 'spin 0.75s linear infinite' }}
                    />
                    Recherche...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Rechercher
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2 mb-0">
              Le numéro de commande vous a été envoyé par e-mail lors de la confirmation de votre commande
            </p>
          </form>

          {/* Error State */}
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center"
            >
              <XCircle size={48} className="mx-auto text-red-500 mb-4" />
              <h3 className="font-bold text-lg mb-2">Commande introuvable</h3>
              <p className="text-gray-500 mb-0">{error}</p>
            </motion.div>
          )}

          {/* Order Details */}
          {order && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-6"
            >
              {/* Status Timeline */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="font-bold text-lg mb-6">État de la commande</h2>

                {order.status === 'cancelled' ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50">
                    <XCircle size={32} className="text-red-500" />
                    <div>
                      <p className="font-bold mb-0" style={{ color: '#7f1d1d' }}>Commande annulée</p>
                      <p className="text-sm mb-0" style={{ color: '#E31B23' }}>Cette commande a été annulée</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Progress bar */}
                    <div className="absolute left-0 right-0 bg-gray-100" style={{ top: 20, height: 4 }}>
                      <div
                        className="h-full transition-all"
                        style={{ backgroundColor: '#009A44', width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`, transition: 'width 0.5s' }}
                      />
                    </div>

                    {/* Steps */}
                    <div className="relative flex justify-between">
                      {statusSteps.map((step, index) => {
                        const config = statusConfig[step as keyof typeof statusConfig];
                        const Icon = config.icon;
                        const isActive = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                          <div key={step} className="flex flex-col items-center gap-2 flex-1">
                            <div
                              className="rounded-full flex items-center justify-center transition-all"
                              style={{
                                width: 40,
                                height: 40,
                                backgroundColor: isActive ? '#009A44' : '#e5e7eb',
                                color: isActive ? '#fff' : '#9ca3af',
                                boxShadow: isCurrent ? '0 0 0 4px rgba(0,154,68,0.20)' : undefined,
                              }}
                            >
                              <Icon size={20} />
                            </div>
                            <p
                              className="text-sm font-medium text-center mb-0"
                              style={{ color: isActive ? '#111827' : '#9ca3af' }}
                            >
                              {config.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Current Status Badge */}
                <div className="mt-6 flex items-center justify-center gap-2">
                  <span
                    className="px-3 py-2 rounded-full text-sm font-medium"
                    style={getStatusBadgeStyle(order.status)}
                  >
                    Statut actuel : {statusConfig[order.status].label}
                  </span>
                </div>

                {/* Tracking Number */}
                {order.shipping?.trackingNumber && (
                  <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(0,154,68,0.08)' }}>
                    <p className="text-sm text-gray-500 mb-1">Numéro de suivi</p>
                    <p className="font-bold mb-0 font-mono" style={{ color: '#003D1C' }}>{order.shipping.trackingNumber}</p>
                  </div>
                )}
              </div>

              {/* Order Info */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="font-bold text-lg mb-4">Informations de commande</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Numéro de commande</p>
                    <p className="font-bold font-mono mb-0">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Date de commande</p>
                    <p className="font-medium mb-0">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="font-bold text-lg mb-4">Articles commandés</h2>
                <div>
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="py-4 flex gap-3"
                      style={{ borderTop: index > 0 ? '1px solid #f3f4f6' : undefined }}
                    >
                      <img
                        src={item.image || '/placeholder.png'}
                        alt={item.name}
                        className="rounded-lg object-cover bg-gray-50 shrink-0"
                        style={{ width: 80, height: 80, objectFit: 'cover' }}
                      />
                      <div className="flex-1">
                        <p className="font-medium mb-1">{item.name}</p>
                        <p className="text-sm text-gray-500 mb-0">Quantité : {item.quantity}</p>
                      </div>
                      <p className="font-bold mb-0">{formatPrice(item.subtotal)}</p>
                    </div>
                  ))}
                </div>

                {/* Pricing Summary */}
                <div className="mt-6 pt-4 border-t flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sous-total</span>
                    <span>{formatPrice(order.pricing.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Frais de livraison</span>
                    <span>
                      {order.pricing.shippingCost === 0 ? 'Gratuit' : formatPrice(order.pricing.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span style={{ color: '#009A44' }}>{formatPrice(order.pricing.total)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <MapPin size={20} style={{ color: '#009A44' }} />
                  Adresse de livraison
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium mb-1">{order.shippingAddress.fullName}</p>
                  <p className="text-sm text-gray-500 mb-1">{order.shippingAddress.phone}</p>
                  <p className="text-sm text-gray-500 mb-1">{order.shippingAddress.street}</p>
                  <p className="text-sm text-gray-500 mb-0">
                    {order.shippingAddress.city}, {order.shippingAddress.country}
                  </p>
                </div>
              </div>

              {/* Status History */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="font-bold text-lg mb-4">Historique</h2>
                  <div className="flex flex-col gap-3">
                    {order.statusHistory.map((history, index) => (
                      <div key={index} className="flex gap-3">
                        <div
                          className="rounded-full flex items-center justify-center shrink-0"
                          style={{ width: 32, height: 32, backgroundColor: 'rgba(0,154,68,0.10)' }}
                        >
                          <div className="rounded-full" style={{ width: 12, height: 12, backgroundColor: '#009A44' }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium mb-0">
                            {statusConfig[history.status as keyof typeof statusConfig]?.label || history.status}
                          </p>
                          {history.message && <p className="text-sm text-gray-500 mb-0">{history.message}</p>}
                          <p className="text-sm text-gray-500 mb-0" style={{ fontSize: '0.75rem' }}>
                            {new Date(history.date).toLocaleString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Empty State */}
          {!order && !error && !loading && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <Package size={64} className="mx-auto text-gray-400 mb-4" style={{ opacity: 0.4 }} />
              <h3 className="font-bold text-lg mb-2">Aucune commande recherchée</h3>
              <p className="text-gray-500 mb-0">
                Utilisez le formulaire ci-dessus pour rechercher votre commande
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
