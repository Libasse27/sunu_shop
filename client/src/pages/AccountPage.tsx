import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { OrderRowSkeleton } from '../components/skeletons';
import { Helmet } from 'react-helmet-async';
import {
  User, Package, MapPin, Heart, Lock, LogOut, Plus, Trash2, Edit2,
  Check, Map, ChevronRight, ShieldCheck, Calendar, Star, Eye, EyeOff,
  Phone, Mail, Home, Briefcase, Tag, ArrowLeft, Truck, CheckCircle2,
  Clock, XCircle, RotateCcw, AlertCircle,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { logout, setCredentials } from '../features/auth/authSlice';
import api, { tokenStore } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import toast from 'react-hot-toast';
import AddressMap from '../components/account/AddressMap';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extrait le message d'erreur depuis une réponse Axios typée en unknown */
function getErrorMessage(err: unknown, fallback = 'Erreur'): string {
  return (
    (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback
  );
}

function getInitials(firstName?: string, lastName?: string) {
  return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
}

// Palette fixe Sénégal — vert · or · rouge
const SN = {
  green:     '#009A44',
  greenDark: '#007A35',
  greenDeep: '#003D1C',
  gold:      '#FCD116',
  goldDark:  '#D4A800',
  red:       '#E31B23',
  redDark:   '#A50D1E',
} as const;

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: React.ElementType }> = {
  pending:    { label: 'En attente',     bg: 'rgba(252,209,22,0.18)',  color: '#D4A800',  icon: Clock },
  confirmed:  { label: 'Confirmée',     bg: 'rgba(0,154,68,0.10)',    color: '#009A44',  icon: CheckCircle2 },
  processing: { label: 'En préparation', bg: 'rgba(0,154,68,0.15)',   color: '#007A35',  icon: Package },
  shipped:    { label: 'Expédiée',      bg: 'rgba(252,209,22,0.15)',  color: '#B8960A',  icon: Truck },
  delivered:  { label: 'Livrée',        bg: 'rgba(0,154,68,0.12)',    color: '#007A35',  icon: CheckCircle2 },
  cancelled:  { label: 'Annulée',       bg: 'rgba(206,17,38,0.10)',   color: '#E31B23',  icon: XCircle },
  refunded:   { label: 'Remboursée',    bg: 'rgba(206,17,38,0.08)',   color: '#A50D1E',  icon: RotateCcw },
};

// ─── Password strength ──────────────────────────────────────────────────────

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: 'Très faible', color: '#E31B23' };
  if (score === 2) return { score, label: 'Faible',     color: '#CCB000' };
  if (score === 3) return { score, label: 'Moyen',      color: '#FCD116' };
  if (score === 4) return { score, label: 'Fort',       color: '#009A44' };
  return             { score, label: 'Très fort',       color: '#007A35' };
}

// ═══════════════════════════════════════════════════════════════════════════
//  PROFILE TAB
// ═══════════════════════════════════════════════════════════════════════════

function ProfileTab() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    phone:     user?.phone     || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/users/me', form);
      dispatch(setCredentials({ user: { ...user, ...data.data }, accessToken: tokenStore.get() || '' }));
      toast.success('Profil mis à jour');
      setEditing(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Cover gradient — drapeau sénégalais */}
        <div
          className="h-20 relative"
          style={{ background: `linear-gradient(135deg, ${SN.green}, ${SN.greenDark})` }}
        >
          {/* Étoile dorée décorative */}
          <svg
            className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20"
            width="48" height="48" viewBox="0 0 24 24"
            fill={SN.gold}
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          <div className="pan-strip-h absolute bottom-0 left-0 right-0" />
        </div>

        {/* Avatar + name + edit button */}
        <div className="px-6 pb-5">
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div
              className="rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white"
              style={{
                width: 64, height: 64,
                background: `linear-gradient(135deg, ${SN.green}, ${SN.greenDark})`,
                fontSize: '1.3rem',
              }}
            >
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                style={{ color: '#009A44' }}
              >
                <Edit2 size={13} /> Modifier
              </button>
            )}
          </div>

          {!editing ? (
            <>
              <h2 className="font-bold text-xl text-gray-900 mb-0.5">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-gray-500 mb-4">{user?.email}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Mail} label="Email" value={user?.email} />
                <InfoRow icon={Phone} label="Téléphone" value={user?.phone || 'Non renseigné'} muted={!user?.phone} />
                <InfoRow icon={ShieldCheck} label="Rôle" value={user?.role === 'client' ? 'Client' : user?.role} />
                <InfoRow icon={CheckCircle2} label="Compte vérifié" value={user?.isVerified ? 'Oui' : 'Non'} />
              </div>
            </>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Prénom *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nom *</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="input-field"
                    placeholder="+221 77 XXX XX XX"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="input-field"
                    disabled
                  />
                  <p className="text-xs text-gray-400 mt-1">Non modifiable</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-ghost"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Security section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" /> Sécurité
        </h3>
        <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
              <Lock size={15} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-0">Mot de passe</p>
              <p className="text-xs text-gray-400 mb-0">Dernière modification inconnue</p>
            </div>
          </div>
          <Link
            to="/mon-compte/mot-de-passe"
            className="text-xs font-semibold flex items-center gap-1 no-underline"
            style={{ color: '#009A44' }}
          >
            Changer <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon, label, value, muted,
}: {
  icon: React.ElementType; label: string; value?: string; muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0">{label}</p>
        <p className={`text-sm font-medium mb-0 ${muted ? 'text-gray-400 italic' : 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ORDERS TAB
// ═══════════════════════════════════════════════════════════════════════════

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/orders/my-orders')
      .then(res => setOrders(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;
    try {
      await api.put(`/orders/${id}/cancel`);
      setOrders(orders.map(o => o._id === id ? { ...o, status: 'cancelled' } : o));
      setSelectedOrder(null);
      toast.success('Commande annulée');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <OrderRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  // ── Order detail view ──
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

        {/* Header card */}
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
                <Calendar size={12} />
                {formatDate(selectedOrder.createdAt)}
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

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h4 className="font-semibold text-gray-900 mb-4 text-sm">
            Articles ({selectedOrder.items?.length || 0})
          </h4>
          <div className="flex flex-col divide-y divide-gray-50">
            {selectedOrder.items?.map((item: any, i: number) => (
              <div key={i} className="flex gap-4 py-3 first:pt-0 last:pb-0 items-center">
                <div className="rounded-xl overflow-hidden bg-gray-50 shrink-0" style={{ width: 60, height: 60 }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={20} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-0 truncate">{item.name}</p>
                  {item.variant && (
                    <p className="text-xs text-gray-400 mb-0">{item.variant.name}: {item.variant.value}</p>
                  )}
                  <p className="text-xs text-gray-400 mb-0">Qté : {item.quantity}</p>
                </div>
                <span className="text-sm font-bold text-gray-900 shrink-0">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h4 className="font-semibold text-gray-900 mb-4 text-sm">Récapitulatif</h4>
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total</span>
              <span>{formatPrice(selectedOrder.pricing?.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Livraison</span>
              <span>
                {selectedOrder.pricing?.shippingCost === 0
                  ? <span className="font-semibold" style={{ color: '#009A44' }}>Gratuite</span>
                  : formatPrice(selectedOrder.pricing?.shippingCost)}
              </span>
            </div>
            {selectedOrder.pricing?.discount > 0 && (
              <div className="flex justify-between font-semibold" style={{ color: '#009A44' }}>
                <span>Réduction</span>
                <span>-{formatPrice(selectedOrder.pricing?.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
              <span>Total</span>
              <span style={{ color: '#009A44' }}>{formatPrice(selectedOrder.pricing?.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
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
      </div>
    );
  }

  // ── Orders list ──
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-gray-900 mb-0">Mes Commandes</h2>
        {orders.length > 0 && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,154,68,0.1)', color: '#009A44' }}
          >
            {orders.length} commande{orders.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-4 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(0,154,68,0.08)' }}
          >
            <Package size={28} style={{ color: '#009A44' }} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Aucune commande pour le moment</p>
            <p className="text-sm text-gray-400 mb-0">Vos commandes apparaîtront ici une fois passées.</p>
          </div>
          <Link to="/boutique" className="btn-primary text-sm mt-2">
            Découvrir la boutique
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order: any) => {
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
                      {' · '}
                      {order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}
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
                  {/* Product thumbnails */}
                  <div className="flex items-center gap-1">
                    {thumbnails.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-lg overflow-hidden bg-gray-100 border border-gray-100"
                        style={{ width: 36, height: 36 }}
                      >
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={14} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                    ))}
                    {(order.items?.length || 0) > 3 && (
                      <div
                        className="rounded-lg flex items-center justify-center text-xs font-semibold border border-gray-100 bg-gray-50 text-gray-500"
                        style={{ width: 36, height: 36 }}
                      >
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="font-bold text-base"
                      style={{ color: '#009A44', fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {formatPrice(order.pricing?.total || 0)}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-gray-300 group-hover:text-primary transition-colors"
                    />
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

// ═══════════════════════════════════════════════════════════════════════════
//  ADDRESSES TAB
// ═══════════════════════════════════════════════════════════════════════════

const LABEL_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  domicile: { icon: Home,      label: 'Domicile', color: SN.green },
  bureau:   { icon: Briefcase, label: 'Bureau',   color: SN.goldDark },
  autre:    { icon: Tag,       label: 'Autre',    color: SN.redDark },
};

function AddressesTab() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedMap, setExpandedMap] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    label: 'domicile', fullName: '', phone: '', street: '',
    city: 'Dakar', country: 'Sénégal', isDefault: false,
  });

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/users/me/addresses');
      setAddresses(data.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, []);

  const resetForm = () => {
    setForm({ label: 'domicile', fullName: '', phone: '', street: '', city: 'Dakar', country: 'Sénégal', isDefault: false });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/users/me/addresses/${editId}`, form);
        toast.success('Adresse modifiée');
      } else {
        await api.post('/users/me/addresses', form);
        toast.success('Adresse ajoutée');
      }
      fetchAddresses();
      resetForm();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette adresse ?')) return;
    try {
      await api.delete(`/users/me/addresses/${id}`);
      toast.success('Adresse supprimée');
      fetchAddresses();
    } catch { toast.error('Erreur'); }
  };

  const handleEdit = (addr: any) => {
    setForm({
      label: addr.label || 'domicile', fullName: addr.fullName,
      phone: addr.phone, street: addr.street,
      city: addr.city, country: addr.country || 'Sénégal',
      isDefault: addr.isDefault,
    });
    setEditId(addr._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-gray-900 mb-0">Mes Adresses</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm"
          >
            <Plus size={14} /> Ajouter une adresse
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 mb-0 text-sm">
              {editId ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition-colors border-0 bg-transparent cursor-pointer p-1">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            {/* Label picker */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</label>
              <div className="flex gap-2">
                {(['domicile', 'bureau', 'autre'] as const).map(lbl => {
                  const cfg = LABEL_CONFIG[lbl];
                  const Icon = cfg.icon;
                  const active = form.label === lbl;
                  return (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setForm({ ...form, label: lbl })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
                      style={{
                        background: active ? `${cfg.color}15` : 'white',
                        color: active ? cfg.color : '#6b7280',
                        borderColor: active ? cfg.color : '#e5e7eb',
                      }}
                    >
                      <Icon size={13} /> {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nom complet *</label>
                <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Téléphone *</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" required placeholder="+221 77 XXX XX XX" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Adresse (rue, quartier) *</label>
                <input type="text" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} className="input-field" required placeholder="Rue 10, Plateau" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ville *</label>
                <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pays</label>
                <input type="text" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="input-field" />
              </div>
            </div>

            {/* Map preview */}
            {form.street && form.city && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Map size={12} /> Aperçu sur la carte
                </p>
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <AddressMap
                    street={form.street}
                    city={form.city}
                    country={form.country}
                    label={LABEL_CONFIG[form.label]?.label || form.label}
                  />
                </div>
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setForm({ ...form, isDefault: !form.isDefault })}
                className="relative flex-shrink-0 cursor-pointer"
                style={{ width: 40, height: 22 }}
              >
                <div
                  className="absolute inset-0 rounded-full transition-colors duration-200"
                  style={{ background: form.isDefault ? '#009A44' : '#d1d5db' }}
                />
                <div
                  className="absolute top-1 rounded-full bg-white shadow transition-transform duration-200"
                  style={{ width: 14, height: 14, left: 4, transform: form.isDefault ? 'translateX(18px)' : 'translateX(0)' }}
                />
              </div>
              <span className="text-sm text-gray-700">Définir comme adresse par défaut</span>
            </label>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={submitting} className="btn-primary text-sm">
                {submitting ? 'Enregistrement...' : editId ? 'Modifier l\'adresse' : 'Ajouter l\'adresse'}
              </button>
              <button type="button" onClick={resetForm} className="btn-ghost text-sm">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-4 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(0,154,68,0.08)' }}
          >
            <MapPin size={28} style={{ color: '#009A44' }} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Aucune adresse enregistrée</p>
            <p className="text-sm text-gray-400 mb-0">Ajoutez une adresse pour accélérer vos commandes.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-2">
            <Plus size={14} /> Ajouter une adresse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addresses.map((addr: any) => {
            const cfg = LABEL_CONFIG[addr.label] || LABEL_CONFIG.autre;
            const Icon = cfg.icon;
            return (
              <div
                key={addr._id}
                className="bg-white rounded-2xl border overflow-hidden transition-all"
                style={{ borderColor: addr.isDefault ? '#009A44' : '#e5e7eb' }}
              >
                {/* Color bar */}
                <div
                  className="h-1"
                  style={{ background: addr.isDefault ? '#009A44' : '#e5e7eb' }}
                />

                <div className="p-4">
                  {/* Label + default badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: `${cfg.color}12`, color: cfg.color }}
                    >
                      <Icon size={12} /> {cfg.label}
                    </div>
                    {addr.isDefault && (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: '#009A44', color: '#fff' }}
                      >
                        <Check size={10} /> Par défaut
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">{addr.fullName}</p>
                  <p className="text-sm text-gray-500 mb-0">{addr.street}</p>
                  <p className="text-sm text-gray-500 mb-0">{addr.city}, {addr.country}</p>
                  <p className="text-xs text-gray-400 mt-1 mb-0 flex items-center gap-1">
                    <Phone size={10} /> {addr.phone}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
                    <button
                      onClick={() => handleEdit(addr)}
                      className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors border-0 bg-transparent cursor-pointer"
                      style={{ color: '#009A44' }}
                    >
                      <Edit2 size={11} /> Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(addr._id)}
                      className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors border-0 bg-transparent cursor-pointer"
                      style={{ color: '#E31B23' }}
                    >
                      <Trash2 size={11} /> Supprimer
                    </button>
                    <button
                      onClick={() => setExpandedMap(expandedMap === addr._id ? null : addr._id)}
                      className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors border-0 bg-transparent cursor-pointer text-gray-400 ml-auto"
                    >
                      <Map size={11} />
                      {expandedMap === addr._id ? 'Masquer' : 'Carte'}
                    </button>
                  </div>
                </div>

                {expandedMap === addr._id && (
                  <div className="border-t border-gray-100">
                    <AddressMap
                      street={addr.street}
                      city={addr.city}
                      country={addr.country}
                      label={addr.fullName}
                      mini
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  PASSWORD TAB
// ═══════════════════════════════════════════════════════════════════════════

function PasswordTab() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = form.newPassword ? getPasswordStrength(form.newPassword) : null;
  const passwordsMatch = form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/me/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Mot de passe modifié avec succès');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-bold text-lg text-gray-900 mb-0">Changer le mot de passe</h2>

      {/* Security tips */}
      <div
        className="rounded-xl p-4 flex gap-3 text-sm"
        style={{ background: 'rgba(0,154,68,0.06)', border: '1px solid rgba(0,154,68,0.15)' }}
      >
        <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
        <div style={{ color: '#007A35' }}>
          <p className="font-semibold mb-1">Conseils pour un mot de passe fort</p>
          <ul className="flex flex-col gap-0.5 text-xs opacity-80 pl-0 mb-0" style={{ listStyle: 'none' }}>
            <li>• Au moins 8 caractères (12+ recommandé)</li>
            <li>• Mélange de majuscules, minuscules, chiffres et symboles</li>
            <li>• Évitez les informations personnelles (nom, date de naissance)</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" style={{ maxWidth: 420 }}>
          {/* Current password */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Mot de passe actuel *
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                className="input-field pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* New password */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Nouveau mot de passe *
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
                className="input-field pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength bar */}
            {strength && (
              <div className="mt-2.5">
                <div className="flex gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full transition-all duration-300"
                      style={{
                        height: 4,
                        background: i < strength.score ? strength.color : '#e5e7eb',
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium" style={{ color: strength.color }}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Confirmer le mot de passe *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className="input-field pr-10"
                required
                style={
                  form.confirmPassword
                    ? { borderColor: passwordsMatch ? '#009A44' : '#E31B23' }
                    : {}
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.confirmPassword && (
              <p
                className="text-xs mt-1 flex items-center gap-1"
                style={{ color: passwordsMatch ? '#009A44' : '#E31B23' }}
              >
                {passwordsMatch
                  ? <><CheckCircle2 size={11} /> Les mots de passe correspondent</>
                  : <><AlertCircle size={11} /> Les mots de passe ne correspondent pas</>
                }
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !form.currentPassword || !form.newPassword || !passwordsMatch}
            className="btn-primary"
          >
            <Lock size={14} />
            {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN ACCOUNT PAGE
// ═══════════════════════════════════════════════════════════════════════════

const MENU_ITEMS = [
  { path: '/mon-compte',             label: 'Profil',         icon: User,    end: true },
  { path: '/mon-compte/commandes',   label: 'Commandes',      icon: Package },
  { path: '/mon-compte/adresses',    label: 'Adresses',       icon: MapPin },
  { path: '/mon-compte/mot-de-passe', label: 'Mot de passe',  icon: Lock },
  { path: '/favoris',                label: 'Favoris',        icon: Heart },
];

export default function AccountPage() {
  const dispatch   = useDispatch();
  const location   = useLocation();
  const { user }   = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState({ orders: 0, addresses: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/orders/my-orders').catch(() => ({ data: { data: [] } })),
      api.get('/users/me/addresses').catch(() => ({ data: { data: [] } })),
    ]).then(([ordRes, adrRes]) => {
      setStats({
        orders:    (ordRes.data.data || []).length,
        addresses: (adrRes.data.data || []).length,
      });
    });
  }, []);

  const isActive = (path: string, end?: boolean) =>
    end ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <>
      <Helmet><title>Mon Compte — TechAfrique</title></Helmet>
      <div className="bg-gray-50 min-h-screen">
        <div className="container-custom py-8">

          {/* ── Page hero ── */}
          <div
            className="rounded-2xl overflow-hidden mb-6 relative"
            style={{ background: `linear-gradient(135deg, ${SN.green} 0%, ${SN.greenDark} 100%)` }}
          >
            {/* Decorative circles */}
            <div
              className="absolute -top-12 -right-12 rounded-full opacity-10"
              style={{ width: 200, height: 200, background: 'white' }}
            />
            <div
              className="absolute -bottom-8 -left-8 rounded-full opacity-10"
              style={{ width: 140, height: 140, background: 'white' }}
            />

            <div className="relative px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Avatar */}
              <div
                className="rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 shrink-0"
                style={{
                  width: 72, height: 72,
                  background: 'rgba(255,255,255,0.2)',
                  borderColor: 'rgba(255,255,255,0.4)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {getInitials(user?.firstName, user?.lastName)}
              </div>

              {/* Name + email */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white mb-0.5">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-sm text-white/75 mb-0 truncate">{user?.email}</p>
                {user?.role !== 'client' && (
                  <span
                    className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                  >
                    <Star size={10} /> {user?.role}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-4 sm:gap-6 shrink-0">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white mb-0" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {stats.orders}
                  </p>
                  <p className="text-xs text-white/70 mb-0">Commande{stats.orders !== 1 ? 's' : ''}</p>
                </div>
                <div
                  className="w-px self-stretch"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                />
                <div className="text-center">
                  <p className="text-2xl font-bold text-white mb-0" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {stats.addresses}
                  </p>
                  <p className="text-xs text-white/70 mb-0">Adresse{stats.addresses !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Pan-African strip */}
            <div className="pan-strip-h" />
          </div>

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
                <nav className="p-2">
                  {MENU_ITEMS.map(item => {
                    const active = isActive(item.path, item.end);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm no-underline mb-0.5 transition-all group"
                        style={{
                          background: active ? 'rgba(0,154,68,0.08)' : '',
                          color: active ? SN.green : '#4b5563',
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                          style={{
                            background: active ? 'rgba(0,154,68,0.15)' : '#f3f4f6',
                          }}
                        >
                          <Icon size={14} style={{ color: active ? SN.green : '#9ca3af' }} />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {active && (
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: SN.green }}
                          />
                        )}
                      </Link>
                    );
                  })}

                  <div className="mx-3 my-2 border-t border-gray-100" />

                  <button
                    onClick={() => dispatch(logout())}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-red-50 border-0 bg-transparent cursor-pointer text-left"
                    style={{ color: '#E31B23' }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50">
                      <LogOut size={14} style={{ color: '#E31B23' }} />
                    </div>
                    Déconnexion
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <Routes>
                <Route index          element={<ProfileTab />} />
                <Route path="commandes"    element={<OrdersTab />} />
                <Route path="adresses"     element={<AddressesTab />} />
                <Route path="mot-de-passe" element={<PasswordTab />} />
              </Routes>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
