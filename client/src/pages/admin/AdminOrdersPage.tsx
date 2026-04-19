import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Search, X, ClipboardList, Eye, Package, MapPin, CreditCard,
  Clock, Download, Loader2,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/admin/AdminStatusBadge';
import { adminOrdersApi } from '../../services/admin.api';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderUser { firstName: string; lastName: string; email: string; phone?: string }
interface OrderItem { name: string; image?: string; quantity: number; price: number; subtotal: number; variant?: { name: string; value: string } }
interface OrderPricing { subtotal: number; shippingCost: number; discount: number; total: number; couponCode?: string }
interface OrderShipping { trackingNumber?: string }
interface OrderPayment { method: string; status: string; transactionId?: string; paidAt?: string }
interface StatusHistoryItem { status: string; date: string; note?: string }
interface Order {
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

// ─── Config ───────────────────────────────────────────────────────────────────

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

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [savingTracking, setSavingTracking] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await adminOrdersApi.getList({
        page,
        limit: 25,
        status: statusFilter || undefined,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setOrders(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter, search, startDate, endDate]);

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setTrackingInput(order.shipping?.trackingNumber || '');
    setNoteInput(order.notes || '');
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await adminOrdersApi.updateStatus(orderId, status);
      toast.success('Statut mis à jour');
      fetchOrders();
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status } : prev);
      }
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const saveTracking = async () => {
    if (!selectedOrder) return;
    setSavingTracking(true);
    try {
      await adminOrdersApi.updateTracking(selectedOrder._id, trackingInput);
      toast.success('Numéro de suivi enregistré');
      setSelectedOrder(prev => prev ? { ...prev, shipping: { ...prev.shipping, trackingNumber: trackingInput } } : prev);
      fetchOrders();
    } catch {
      toast.error('Erreur');
    } finally {
      setSavingTracking(false);
    }
  };

  const saveNote = async () => {
    if (!selectedOrder) return;
    setSavingNote(true);
    try {
      await adminOrdersApi.updateNotes(selectedOrder._id, noteInput);
      toast.success('Note enregistrée');
      setSelectedOrder(prev => prev ? { ...prev, notes: noteInput } : prev);
    } catch {
      toast.error('Erreur');
    } finally {
      setSavingNote(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await adminOrdersApi.exportCSV({
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const url = URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export CSV téléchargé');
    } catch {
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Helmet><title>Admin — Commandes | Sunu Shop</title></Helmet>
      <AdminLayout title="Commandes">
        <AdminPageHeader
          title="Commandes"
          subtitle={total > 0 ? `${total} commande${total > 1 ? 's' : ''}` : undefined}
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Commandes' }]}
          actions={
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Exporter CSV
            </button>
          }
        />

        <div className="flex flex-col gap-4">
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative" style={{ minWidth: 200 }}>
              <Search size={15} className="absolute text-gray-400" style={{ left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full border border-gray-200 rounded-lg text-sm py-2 pr-3 focus:outline-none"
                style={{ paddingLeft: 34 }}
                placeholder="N° commande, client..."
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg text-sm py-2 px-3 bg-white focus:outline-none"
            >
              <option value="">Tous les statuts</option>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg text-sm py-2 px-3 bg-white focus:outline-none"
            />
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg text-sm py-2 px-3 bg-white focus:outline-none"
            />
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-4 flex flex-col gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="bg-gray-200 rounded h-4 w-28" />
                    <div className="flex-1 bg-gray-200 rounded h-4" />
                    <div className="bg-gray-200 rounded h-6 w-20" />
                    <div className="bg-gray-200 rounded h-6 w-20" />
                    <div className="bg-gray-200 rounded h-6 w-8" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <AdminEmptyState
                icon={ClipboardList}
                title="Aucune commande trouvée"
                description={statusFilter || search ? 'Essayez de modifier les filtres.' : 'Les commandes apparaîtront ici.'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">N° Commande</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paiement</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Modifier</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors border-t">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 mb-0">{order.user?.firstName} {order.user?.lastName}</p>
                          <p className="text-xs text-gray-400 mb-0">{order.user?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-900 text-sm whitespace-nowrap">{formatPrice(order.pricing?.total || 0)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500">{order.payment?.method ? (PAYMENT_LABELS[order.payment.method] || order.payment.method) : '—'}</span>
                            <PaymentStatusBadge status={order.payment?.status || ''} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            onChange={e => updateStatus(order._id, e.target.value)}
                            className="border border-gray-200 rounded-lg text-xs px-2 py-1 bg-white focus:outline-none"
                          >
                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openDetail(order)}
                            className="p-1.5 rounded-lg border-0 cursor-pointer"
                            style={{ backgroundColor: 'rgba(0,154,68,0.1)', color: '#009A44' }}
                            title="Voir le détail"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 bg-white"
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 bg-white"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Panneau de détail (drawer custom sans Headless UI) ─────────────── */}
        {selectedOrder && (
          <div className="fixed inset-0" style={{ zIndex: 60 }}>
            {/* Overlay */}
            <div
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => setSelectedOrder(null)}
            />
            {/* Panel */}
            <div
              className="absolute top-0 right-0 bottom-0 bg-white shadow-2xl flex flex-col overflow-hidden"
              style={{ width: '100%', maxWidth: 576 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-white shrink-0">
                <div>
                  <h2 className="font-bold text-gray-900 text-base mb-0">{selectedOrder.orderNumber}</h2>
                  <p className="text-sm text-gray-500 mb-0 mt-0.5">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-lg border-0 bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                {/* Statut */}
                <div className="flex items-center justify-between rounded-xl p-4 bg-gray-50">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Statut actuel</p>
                    <OrderStatusBadge status={selectedOrder.status} />
                  </div>
                  <select
                    value={selectedOrder.status}
                    onChange={e => updateStatus(selectedOrder._id, e.target.value)}
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
                    <p className="font-semibold text-gray-900 mb-0">{selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</p>
                    <p className="text-sm text-gray-500 mb-0">{selectedOrder.user?.email}</p>
                    {selectedOrder.user?.phone && <p className="text-sm text-gray-500 mb-0">{selectedOrder.user.phone}</p>}
                  </div>
                </div>

                {/* Articles */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Articles ({selectedOrder.items?.length})
                  </h4>
                  <div className="flex flex-col gap-2">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="rounded-lg object-cover shrink-0" style={{ width: 44, height: 44 }} />
                        )}
                        <div className="flex-1" style={{ minWidth: 0 }}>
                          <p className="text-sm font-medium text-gray-900 mb-0 truncate">{item.name}</p>
                          {item.variant && <p className="text-xs text-gray-500 mb-0">{item.variant.name}: {item.variant.value}</p>}
                          <p className="text-xs text-gray-500 mb-0">{item.quantity} × {formatPrice(item.price)}</p>
                        </div>
                        <p className="font-bold text-gray-900 shrink-0 mb-0 text-sm">{formatPrice(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Récapitulatif */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Récapitulatif</h4>
                  <div className="rounded-xl p-4 bg-gray-50 flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sous-total</span>
                      <span>{formatPrice(selectedOrder.pricing?.subtotal || 0)}</span>
                    </div>
                    {(selectedOrder.pricing?.shippingCost || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Livraison</span>
                        <span>{formatPrice(selectedOrder.pricing.shippingCost)}</span>
                      </div>
                    )}
                    {(selectedOrder.pricing?.discount || 0) > 0 && (
                      <div className="flex justify-between" style={{ color: '#009A44' }}>
                        <span>
                          Réduction
                          {selectedOrder.pricing?.couponCode && (
                            <code className="ml-1 text-xs px-1 rounded" style={{ backgroundColor: 'rgba(0,154,68,0.1)', fontSize: 11 }}>
                              {selectedOrder.pricing.couponCode}
                            </code>
                          )}
                        </span>
                        <span>−{formatPrice(selectedOrder.pricing.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>{formatPrice(selectedOrder.pricing?.total || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Adresse */}
                {selectedOrder.shippingAddress && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MapPin size={14} /> Adresse de livraison
                    </h4>
                    <div className="rounded-xl p-4 bg-gray-50 text-sm text-gray-600 flex flex-col gap-0.5">
                      <p className="font-semibold text-gray-900 mb-0">{selectedOrder.shippingAddress.fullName}</p>
                      <p className="mb-0">{selectedOrder.shippingAddress.phone}</p>
                      <p className="mb-0">{selectedOrder.shippingAddress.street}</p>
                      <p className="mb-0">{selectedOrder.shippingAddress.city}{selectedOrder.shippingAddress.region && `, ${selectedOrder.shippingAddress.region}`}</p>
                      <p className="mb-0">{selectedOrder.shippingAddress.country}</p>
                      {selectedOrder.shippingAddress.instructions && (
                        <p className="mt-1 italic mb-0">"{selectedOrder.shippingAddress.instructions}"</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Paiement */}
                {selectedOrder.payment && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CreditCard size={14} /> Paiement
                    </h4>
                    <div className="rounded-xl p-4 bg-gray-50 text-sm flex flex-col gap-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Méthode</span>
                        <span className="font-medium">{PAYMENT_LABELS[selectedOrder.payment.method] || selectedOrder.payment.method}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Statut</span>
                        <PaymentStatusBadge status={selectedOrder.payment.status} />
                      </div>
                      {selectedOrder.payment.transactionId && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Transaction</span>
                          <code style={{ fontSize: 11 }}>{selectedOrder.payment.transactionId}</code>
                        </div>
                      )}
                      {selectedOrder.payment.paidAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Payé le</span>
                          <span>{new Date(selectedOrder.payment.paidAt).toLocaleDateString('fr-FR')}</span>
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
                      onChange={e => setTrackingInput(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      placeholder="Ex: DHL-1234567890"
                    />
                    <button
                      onClick={saveTracking}
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
                {(selectedOrder.statusHistory?.length || 0) > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Clock size={14} /> Historique
                    </h4>
                    <div className="flex flex-col gap-2">
                      {[...(selectedOrder.statusHistory || [])].reverse().map((h, i) => (
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
                    onChange={e => setNoteInput(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                    rows={3}
                    placeholder="Note visible uniquement par l'équipe admin..."
                  />
                  <button
                    onClick={saveNote}
                    disabled={savingNote}
                    className="mt-2 px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 flex items-center gap-2 disabled:opacity-60"
                  >
                    {savingNote && <Loader2 size={13} className="animate-spin" />}
                    Enregistrer la note
                  </button>
                </div>

                {/* Message client */}
                {selectedOrder.customerNote && (
                  <div className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(0,154,68,0.07)', borderColor: 'rgba(0,154,68,0.2)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#009A44' }}>Message du client</p>
                    <p className="text-sm italic mb-0" style={{ color: '#003D1C' }}>"{selectedOrder.customerNote}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
