import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Calendar, MapPin, ChevronRight, ArrowLeft, Truck, XCircle, Star } from 'lucide-react';
import { IOrder, IOrderItem } from '../../types/order.types';
import { OrderRowSkeleton } from '../skeletons';
import api from '../../services/api';
import { getApiError } from '../../utils/getApiError';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';
import { STATUS_CONFIG, formatDate } from './accountConstants';

export default function OrdersTab() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    api.get('/orders/my-orders', { signal: controller.signal })
      .then(res => { if (mountedRef.current) setOrders(res.data.data || []); })
      .catch(() => {})
      .finally(() => { if (mountedRef.current) setLoading(false); });
    return () => { mountedRef.current = false; controller.abort(); };
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;
    try {
      await api.put(`/orders/${id}/cancel`);
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: 'cancelled' } : o));
      setSelectedOrder(null);
      toast.success('Commande annulée');
    } catch (err: unknown) {
      toast.error(getApiError(err));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => <OrderRowSkeleton key={i} />)}
      </div>
    );
  }

  // ── Détail commande ──
  if (selectedOrder) {
    const cfg = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG.pending;
    const StatusIcon = cfg.icon;

    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => setSelectedOrder(null)}
          className="self-start flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={15} /> Retour aux commandes
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1.5 w-full" style={{ background: cfg.color }} />
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-gray-900 mb-0">#{selectedOrder.orderNumber}</h3>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  <StatusIcon size={11} /> {cfg.label}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-0 flex items-center gap-1">
                <Calendar size={12} /> {formatDate(selectedOrder.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0">Total commande</p>
              <p className="text-2xl font-bold mb-0" style={{ color: '#009A44', fontFamily: 'DM Sans, sans-serif' }}>
                {formatPrice(selectedOrder.pricing?.total || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h4 className="font-semibold text-gray-900 mb-4 text-sm">Articles ({selectedOrder.items?.length || 0})</h4>
          <div className="flex flex-col divide-y divide-gray-50">
            {selectedOrder.items?.map((item: IOrderItem, i: number) => (
              <div key={i} className="flex gap-4 py-3 first:pt-0 last:pb-0 items-center">
                <div className="rounded-xl overflow-hidden bg-gray-50 shrink-0" style={{ width: 60, height: 60 }}>
                  {item.image
                    ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-gray-300" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-0 truncate">{item.name}</p>
                  {item.variant && <p className="text-xs text-gray-400 mb-0">{item.variant.name}: {item.variant.value}</p>}
                  <p className="text-xs text-gray-400 mb-0">Qté : {item.quantity}</p>
                </div>
                <span className="text-sm font-bold text-gray-900 shrink-0">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Récapitulatif prix */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h4 className="font-semibold text-gray-900 mb-4 text-sm">Récapitulatif</h4>
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total</span><span>{formatPrice(selectedOrder.pricing?.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Livraison</span>
              <span>
                {selectedOrder.pricing?.shippingCost === 0
                  ? <span className="font-semibold" style={{ color: '#009A44' }}>Gratuite</span>
                  : formatPrice(selectedOrder.pricing?.shippingCost)
                }
              </span>
            </div>
            {selectedOrder.pricing?.discount > 0 && (
              <div className="flex justify-between font-semibold" style={{ color: '#009A44' }}>
                <span>Réduction</span><span>-{formatPrice(selectedOrder.pricing?.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
              <span>Total</span>
              <span style={{ color: '#009A44' }}>{formatPrice(selectedOrder.pricing?.total)}</span>
            </div>
          </div>
        </div>

        {/* Adresse */}
        {selectedOrder.shippingAddress && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
              <MapPin size={14} className="text-primary" /> Adresse de livraison
            </h4>
            <p className="text-sm font-medium text-gray-900 mb-0.5">{selectedOrder.shippingAddress.fullName}</p>
            <p className="text-sm text-gray-500 mb-0">{selectedOrder.shippingAddress.street}</p>
            <p className="text-sm text-gray-500 mb-0">{selectedOrder.shippingAddress.city}</p>
            <p className="text-sm text-gray-400 mt-1 mb-0">{selectedOrder.shippingAddress.phone}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/suivi-commande?number=${selectedOrder.orderNumber}`)}
            className="btn-primary text-sm"
          >
            <Truck size={14} /> Suivre la commande
          </button>
          {['pending', 'confirmed'].includes(selectedOrder.status) && (
            <button
              onClick={() => handleCancel(selectedOrder._id)}
              className="btn-ghost text-sm"
              style={{ color: '#E31B23', borderColor: '#fca5a5' }}
            >
              <XCircle size={14} /> Annuler la commande
            </button>
          )}
        </div>

        {/* CTA Avis — visible uniquement pour les commandes livrées */}
        {selectedOrder.status === 'delivered' && selectedOrder.items?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Star size={14} style={{ color: '#FCD116' }} /> Votre avis compte !
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedOrder.items.slice(0, 3).map((item, i) => (
                <Link
                  key={i}
                  to={`/produit/${(item as IOrderItem & { slug?: string }).slug || ''}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium no-underline text-gray-700 hover:border-primary hover:text-primary transition-colors"
                >
                  <Star size={10} style={{ color: '#FCD116' }} />
                  {item.name.length > 28 ? item.name.slice(0, 28) + '…' : item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Liste des commandes ──
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-gray-900 mb-0">Mes Commandes</h2>
        {orders.length > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,154,68,0.1)', color: '#009A44' }}>
            {orders.length} commande{orders.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,154,68,0.08)' }}>
            <Package size={28} style={{ color: '#009A44' }} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Aucune commande pour le moment</p>
            <p className="text-sm text-gray-400 mb-0">Vos commandes apparaîtront ici une fois passées.</p>
          </div>
          <Link to="/boutique" className="btn-primary text-sm mt-2">Découvrir la boutique</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const thumbnails = (order.items || []).slice(0, 3);

            return (
              <button
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all p-4 group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 mb-0.5 text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mb-0 flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <StatusIcon size={10} /> {cfg.label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {thumbnails.map((item, i) => (
                      <div key={i} className="rounded-lg overflow-hidden bg-gray-100 border border-gray-100" style={{ width: 36, height: 36 }}>
                        {item.image
                          ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-gray-300" /></div>
                        }
                      </div>
                    ))}
                    {(order.items?.length || 0) > 3 && (
                      <div className="rounded-lg flex items-center justify-center text-xs font-semibold border border-gray-100 bg-gray-50 text-gray-500" style={{ width: 36, height: 36 }}>
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base" style={{ color: '#009A44', fontFamily: 'DM Sans, sans-serif' }}>
                      {formatPrice(order.pricing?.total || 0)}
                    </span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
