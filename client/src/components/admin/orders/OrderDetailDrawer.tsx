// ─── Panneau de détail commande (drawer latéral) ──────────────────────────────

import { X, Package, MapPin, CreditCard, Clock, Loader2, Truck } from 'lucide-react';
import { OrderStatusBadge, PaymentStatusBadge } from '../AdminStatusBadge';
import { formatPrice } from '../../../utils/formatPrice';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderUser { firstName: string; lastName: string; email: string; phone?: string }
interface OrderItemSupplier {
  name?: string;
  contact?: string;
  phone?: string;
  email?: string;
  country?: string;
  deliveryDays?: number;
  trackingNumber?: string;
  orderReference?: string;
}
interface OrderItem {
  name: string;
  image?: string;
  quantity: number;
  price: number;
  subtotal: number;
  variant?: { name: string; value: string };
  product?: { supplier?: OrderItemSupplier; sku?: string };
}
interface OrderPricing { subtotal: number; shippingCost: number; discount: number; total: number; couponCode?: string }
interface OrderShipping { trackingNumber?: string }
interface OrderPayment { method: string; status: string; transactionId?: string; paidAt?: string }
interface StatusHistoryItem { status: string; date: string; note?: string }

export interface OrderDetailType {
  _id: string;
  orderNumber: string;
  user?: OrderUser;
  items: OrderItem[];
  pricing: OrderPricing;
  shipping?: OrderShipping;
  shippingAddress?: { fullName: string; phone: string; street: string; city: string; region?: string; country: string; instructions?: string };
  payment?: OrderPayment;
  status: string;
  statusHistory?: StatusHistoryItem[];
  notes?: string;
  customerNote?: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: 'pending',    label: 'En attente' },
  { value: 'confirmed',  label: 'Confirmée' },
  { value: 'processing', label: 'En préparation' },
  { value: 'shipped',    label: 'Expédiée' },
  { value: 'delivered',  label: 'Livrée' },
  { value: 'cancelled',  label: 'Annulée' },
  { value: 'returned',   label: 'Retournée' },
  { value: 'refunded',   label: 'Remboursée' },
];

const PAYMENT_LABELS: Record<string, string> = {
  stripe:           'Stripe (CB)',
  orange_money:     'Orange Money',
  wave:             'Wave',
  free_money:       'Free Money',
  cash_on_delivery: 'Paiement à la livraison',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  order: OrderDetailType;
  trackingInput: string;
  noteInput: string;
  savingTracking: boolean;
  savingNote: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, status: string) => void;
  onTrackingChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSaveTracking: () => void;
  onSaveNote: () => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function OrderDetailDrawer({
  order, trackingInput, noteInput, savingTracking, savingNote,
  onClose, onStatusChange, onTrackingChange, onNoteChange,
  onSaveTracking, onSaveNote,
}: Props) {
  return (
    <div className="fixed inset-0" style={{ zIndex: 60 }}>
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="absolute top-0 right-0 bottom-0 bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '100%', maxWidth: 576 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 text-base mb-0">{order.orderNumber}</h2>
            <p className="text-sm text-gray-500 mb-0 mt-0.5">
              {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border-0 bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Statut */}
          <div className="flex items-center justify-between rounded-xl p-4 bg-gray-50">
            <div>
              <p className="text-xs text-gray-500 mb-1">Statut actuel</p>
              <OrderStatusBadge status={order.status} />
            </div>
            <select
              value={order.status}
              onChange={e => onStatusChange(order._id, e.target.value)}
              className="border border-gray-200 rounded-lg text-sm py-2 px-3 bg-white focus:outline-none"
            >
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Client */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Package size={14} /> Client
            </h4>
            <div className="rounded-xl p-4 bg-gray-50">
              <p className="font-semibold text-gray-900 mb-0">{order.user?.firstName} {order.user?.lastName}</p>
              <p className="text-sm text-gray-500 mb-0">{order.user?.email}</p>
              {order.user?.phone && <p className="text-sm text-gray-500 mb-0">{order.user.phone}</p>}
            </div>
          </div>

          {/* Articles */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Articles ({order.items?.length})
            </h4>
            <div className="flex flex-col gap-2">
              {order.items?.map((item, i) => {
                const sup = item.product?.supplier;
                return (
                  <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center gap-3 p-3 bg-gray-50">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="rounded-lg object-cover shrink-0" style={{ width: 44, height: 44 }} />
                      )}
                      <div className="flex-1" style={{ minWidth: 0 }}>
                        <p className="text-sm font-medium text-gray-900 mb-0 truncate">{item.name}</p>
                        {item.product?.sku && <p className="text-xs text-gray-400 mb-0" style={{ fontFamily: 'monospace' }}>{item.product.sku}</p>}
                        {item.variant && <p className="text-xs text-gray-500 mb-0">{item.variant.name}: {item.variant.value}</p>}
                        <p className="text-xs text-gray-500 mb-0">{item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                      <p className="font-bold text-gray-900 shrink-0 mb-0 text-sm">{formatPrice(item.subtotal)}</p>
                    </div>
                    {sup?.name && (
                      <div className="px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t" style={{ backgroundColor: 'rgba(14,165,233,0.05)', borderColor: 'rgba(14,165,233,0.15)' }}>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#0369a1' }}>
                          <Truck size={11} /> {sup.name}
                        </span>
                        {sup.country && <span className="text-xs text-gray-500">{sup.country}</span>}
                        {sup.deliveryDays && <span className="text-xs text-gray-500">{sup.deliveryDays}j livraison</span>}
                        {sup.phone && (
                          <a href={`tel:${sup.phone}`} className="text-xs" style={{ color: '#0369a1' }}>{sup.phone}</a>
                        )}
                        {sup.email && (
                          <a href={`mailto:${sup.email}`} className="text-xs" style={{ color: '#0369a1' }}>{sup.email}</a>
                        )}
                        {sup.orderReference && (
                          <span className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>Réf: {sup.orderReference}</span>
                        )}
                        {sup.trackingNumber && (
                          <span className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>#{sup.trackingNumber}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Récapitulatif */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Récapitulatif</h4>
            <div className="rounded-xl p-4 bg-gray-50 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sous-total</span>
                <span>{formatPrice(order.pricing?.subtotal || 0)}</span>
              </div>
              {(order.pricing?.shippingCost || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Livraison</span>
                  <span>{formatPrice(order.pricing.shippingCost)}</span>
                </div>
              )}
              {(order.pricing?.discount || 0) > 0 && (
                <div className="flex justify-between" style={{ color: '#009A44' }}>
                  <span>
                    Réduction
                    {order.pricing?.couponCode && (
                      <code className="ml-1 text-xs px-1 rounded" style={{ backgroundColor: 'rgba(0,154,68,0.1)', fontSize: 11 }}>
                        {order.pricing.couponCode}
                      </code>
                    )}
                  </span>
                  <span>−{formatPrice(order.pricing.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(order.pricing?.total || 0)}</span>
              </div>
            </div>
          </div>

          {/* Adresse */}
          {order.shippingAddress && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin size={14} /> Adresse de livraison
              </h4>
              <div className="rounded-xl p-4 bg-gray-50 text-sm text-gray-600 flex flex-col gap-0.5">
                <p className="font-semibold text-gray-900 mb-0">{order.shippingAddress.fullName}</p>
                <p className="mb-0">{order.shippingAddress.phone}</p>
                <p className="mb-0">{order.shippingAddress.street}</p>
                <p className="mb-0">
                  {order.shippingAddress.city}
                  {order.shippingAddress.region && `, ${order.shippingAddress.region}`}
                </p>
                <p className="mb-0">{order.shippingAddress.country}</p>
                {order.shippingAddress.instructions && (
                  <p className="mt-1 italic mb-0">"{order.shippingAddress.instructions}"</p>
                )}
              </div>
            </div>
          )}

          {/* Paiement */}
          {order.payment && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard size={14} /> Paiement
              </h4>
              <div className="rounded-xl p-4 bg-gray-50 text-sm flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Méthode</span>
                  <span className="font-medium">{PAYMENT_LABELS[order.payment.method] || order.payment.method}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Statut</span>
                  <PaymentStatusBadge status={order.payment.status} />
                </div>
                {order.payment.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction</span>
                    <code style={{ fontSize: 11 }}>{order.payment.transactionId}</code>
                  </div>
                )}
                {order.payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payé le</span>
                    <span>{new Date(order.payment.paidAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Numéro de suivi */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Numéro de suivi</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={trackingInput}
                onChange={e => onTrackingChange(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                placeholder="Ex: DHL-1234567890"
              />
              <button
                onClick={onSaveTracking}
                disabled={savingTracking}
                className="px-4 py-2 text-sm text-white rounded-lg border-0 shrink-0 disabled:opacity-60 flex items-center gap-2"
                style={{ backgroundColor: '#009A44' }}
              >
                {savingTracking && <Loader2 size={14} className="animate-spin" />}
                Sauvegarder
              </button>
            </div>
          </div>

          {/* Historique */}
          {(order.statusHistory?.length || 0) > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock size={14} /> Historique
              </h4>
              <div className="flex flex-col gap-2">
                {[...(order.statusHistory || [])].reverse().map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="rounded-full shrink-0 mt-1.5" style={{ width: 8, height: 8, backgroundColor: '#009A44' }} />
                    <div>
                      <OrderStatusBadge status={h.status} />
                      <p className="text-xs text-gray-500 mt-1 mb-0">
                        {new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {h.note && <p className="text-xs text-gray-500 mt-0.5 mb-0 italic">"{h.note}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note admin */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Note interne</h4>
            <textarea
              value={noteInput}
              onChange={e => onNoteChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
              rows={3}
              placeholder="Note visible uniquement par l'équipe admin..."
            />
            <button
              onClick={onSaveNote}
              disabled={savingNote}
              className="mt-2 px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 flex items-center gap-2 disabled:opacity-60"
            >
              {savingNote && <Loader2 size={13} className="animate-spin" />}
              Enregistrer la note
            </button>
          </div>

          {/* Message client */}
          {order.customerNote && (
            <div
              className="rounded-xl p-4 border"
              style={{ backgroundColor: 'rgba(0,154,68,0.07)', borderColor: 'rgba(0,154,68,0.2)' }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: '#009A44' }}>Message du client</p>
              <p className="text-sm italic mb-0" style={{ color: '#003D1C' }}>"{order.customerNote}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
