import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, ClipboardList, Download, Loader2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/admin/AdminStatusBadge';
import { OrderDetailDrawer } from '../../components/admin/orders/OrderDetailDrawer';
import type { OrderDetailType } from '../../components/admin/orders/OrderDetailDrawer';
import { adminOrdersApi } from '../../services/admin.api';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';

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
  const [orders, setOrders] = useState<OrderDetailType[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailType | null>(null);
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
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter, search, startDate, endDate]);

  const openDetail = (order: OrderDetailType) => {
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
                type="text" value={search}
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
            <input type="date" value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg text-sm py-2 px-3 bg-white focus:outline-none"
            />
            <input type="date" value={endDate}
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
                      {['N° Commande', 'Client', 'Date', 'Total', 'Paiement', 'Statut', 'Modifier', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
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
                            <span className="text-xs text-gray-500">
                              {order.payment?.method ? (PAYMENT_LABELS[order.payment.method] || order.payment.method) : '—'}
                            </span>
                            <PaymentStatusBadge status={order.payment?.status || ''} />
                          </div>
                        </td>
                        <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
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
                            <Search size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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

        {selectedOrder && (
          <OrderDetailDrawer
            order={selectedOrder}
            trackingInput={trackingInput}
            noteInput={noteInput}
            savingTracking={savingTracking}
            savingNote={savingNote}
            onClose={() => setSelectedOrder(null)}
            onStatusChange={updateStatus}
            onTrackingChange={setTrackingInput}
            onNoteChange={setNoteInput}
            onSaveTracking={saveTracking}
            onSaveNote={saveNote}
          />
        )}
      </AdminLayout>
    </>
  );
}
