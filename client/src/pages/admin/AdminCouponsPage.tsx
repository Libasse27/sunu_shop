import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, X, Tag, Copy, Check, Ticket } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { adminCouponsApi } from '../../services/admin.api';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Coupon {
  _id: string;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  maxUsage?: number;
  usageCount: number;
  maxUsagePerUser?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

interface CouponFormData {
  code: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minOrderAmount: number;
  maxDiscount: number;
  maxUsage: number;
  maxUsagePerUser: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

type FilterTab = 'all' | 'active' | 'expired';

// ─── Constantes ────────────────────────────────────────────────────────────────

const EMPTY_FORM: CouponFormData = {
  code: '',
  description: '',
  type: 'percentage',
  value: 10,
  minOrderAmount: 0,
  maxDiscount: 0,
  maxUsage: 0,
  maxUsagePerUser: 1,
  startDate: '',
  endDate: '',
  isActive: true,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getCouponStatus(coupon: Coupon): { label: string; bg: string; color: string } {
  if (!coupon.isActive) {
    return { label: 'Désactivé', bg: 'rgba(227,27,35,0.1)', color: '#E31B23' };
  }
  const now = new Date();
  if (coupon.endDate && new Date(coupon.endDate) < now) {
    return { label: 'Expiré', bg: '#f3f4f6', color: '#6b7280' };
  }
  if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
    return { label: 'Épuisé', bg: 'rgba(252,209,22,0.15)', color: '#8B7000' };
  }
  return { label: 'Actif', bg: 'rgba(0,154,68,0.1)', color: '#007A35' };
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-t">
          <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded animate-pulse w-24" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-20" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-16" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-16" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-20" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-16" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-16" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-16" /></td>
        </tr>
      ))}
    </>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className="rounded-full border-0 relative shrink-0"
      style={{
        width: 40,
        height: 20,
        backgroundColor: checked ? '#009A44' : '#d1d5db',
        transition: 'background-color 0.2s',
        padding: 0,
      }}
    >
      <span
        className="absolute rounded-full bg-white shadow"
        style={{
          top: 2,
          left: 2,
          width: 16,
          height: 16,
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s',
        }}
      />
    </button>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>({ ...EMPTY_FORM });
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await adminCouponsApi.getList();
      setCoupons(data.data || []);
    } catch {
      toast.error('Erreur lors du chargement des coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount || 0,
        maxDiscount: coupon.maxDiscount || 0,
        maxUsage: coupon.maxUsage || 0,
        maxUsagePerUser: coupon.maxUsagePerUser || 1,
        startDate: coupon.startDate ? coupon.startDate.split('T')[0] : '',
        endDate: coupon.endDate ? coupon.endDate.split('T')[0] : '',
        isActive: coupon.isActive,
      });
    } else {
      setEditingCoupon(null);
      setFormData({ ...EMPTY_FORM });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) { toast.error('Le code est requis'); return; }
    if (formData.type !== 'free_shipping' && formData.value <= 0) {
      toast.error('La valeur doit être supérieure à 0'); return;
    }
    if (formData.type === 'percentage' && formData.value > 100) {
      toast.error('Le pourcentage ne peut pas dépasser 100%'); return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...formData,
        minOrderAmount: formData.minOrderAmount > 0 ? formData.minOrderAmount : undefined,
        maxDiscount: formData.maxDiscount > 0 ? formData.maxDiscount : undefined,
        maxUsage: formData.maxUsage > 0 ? formData.maxUsage : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      };
      if (editingCoupon) {
        await adminCouponsApi.update(editingCoupon._id, payload);
        toast.success('Coupon mis à jour');
      } else {
        await adminCouponsApi.create(payload);
        toast.success('Coupon créé');
      }
      await fetchCoupons();
      closeModal();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminCouponsApi.delete(deleteTarget._id);
      toast.success('Coupon supprimé');
      setDeleteTarget(null);
      await fetchCoupons();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copié');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtrage selon l'onglet actif
  const filteredCoupons = coupons.filter(coupon => {
    if (activeFilter === 'all') return true;
    const status = getCouponStatus(coupon);
    if (activeFilter === 'active') return status.label === 'Actif';
    if (activeFilter === 'expired') return status.label === 'Expiré' || status.label === 'Désactivé';
    return true;
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'active', label: 'Actifs' },
    { key: 'expired', label: 'Expirés / Désactivés' },
  ];

  return (
    <>
      <Helmet><title>Admin — Coupons</title></Helmet>

      <AdminLayout title="Coupons">
        <AdminPageHeader
          title="Coupons"
          subtitle={`${coupons.length} coupon${coupons.length > 1 ? 's' : ''} au total`}
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Coupons' }]}
          actions={
            <button
              onClick={() => openModal()}
              style={{ backgroundColor: '#009A44' }}
              className="text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Plus size={16} />
              Créer un coupon
            </button>
          }
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Onglets de filtre */}
          <div className="flex border-b border-gray-100 px-4 pt-3">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className="px-4 py-2 text-sm font-medium mr-1 rounded-t-lg border-0 transition-colors"
                style={{
                  backgroundColor: activeFilter === tab.key ? 'rgba(0,154,68,0.08)' : 'transparent',
                  color: activeFilter === tab.key ? '#009A44' : '#6b7280',
                  borderBottom: activeFilter === tab.key ? '2px solid #009A44' : '2px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">Code</th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">Type</th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">Valeur</th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">Min. commande</th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">Utilisations</th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">Expiration</th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">Statut</th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton />
                ) : filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <AdminEmptyState
                        icon={Ticket}
                        title="Aucun coupon"
                        description="Aucun coupon ne correspond à ce filtre."
                        action={activeFilter === 'all' ? { label: 'Créer un coupon', onClick: () => openModal() } : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map(coupon => {
                    const status = getCouponStatus(coupon);
                    return (
                      <tr key={coupon._id} className="hover:bg-gray-50 transition-colors border-t border-gray-100">
                        {/* Code */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code
                              className="font-bold px-2 py-1 rounded text-sm"
                              style={{
                                color: '#009A44',
                                backgroundColor: 'rgba(0,154,68,0.06)',
                                fontFamily: 'monospace',
                              }}
                            >
                              {coupon.code}
                            </code>
                            <button
                              onClick={() => handleCopyCode(coupon.code)}
                              className="p-1 rounded border-0 bg-gray-100 hover:bg-gray-200 transition-colors"
                              title="Copier le code"
                            >
                              {copiedCode === coupon.code
                                ? <Check size={13} style={{ color: '#16a34a' }} />
                                : <Copy size={13} className="text-gray-400" />
                              }
                            </button>
                          </div>
                          {coupon.description && (
                            <p className="text-xs text-gray-400 mt-1 truncate" style={{ maxWidth: 200 }}>
                              {coupon.description}
                            </p>
                          )}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            {coupon.type === 'percentage' ? '%' : coupon.type === 'fixed' ? 'FCFA' : 'Livraison'}
                          </span>
                        </td>

                        {/* Valeur */}
                        <td className="px-4 py-3 font-semibold text-gray-900 text-sm">
                          {coupon.type === 'percentage' && `${coupon.value}%`}
                          {coupon.type === 'fixed' && formatPrice(coupon.value)}
                          {coupon.type === 'free_shipping' && 'Gratuit'}
                        </td>

                        {/* Min commande */}
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {coupon.minOrderAmount ? formatPrice(coupon.minOrderAmount) : '—'}
                        </td>

                        {/* Utilisations */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {coupon.usageCount}
                            {coupon.maxUsage ? ` / ${coupon.maxUsage}` : ''}
                          </span>
                        </td>

                        {/* Expiration */}
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {coupon.endDate
                            ? new Date(coupon.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>

                        {/* Statut */}
                        <td className="px-4 py-3">
                          <span
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ backgroundColor: status.bg, color: status.color }}
                          >
                            {status.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openModal(coupon)}
                              className="p-1.5 rounded-lg border-0 transition-colors"
                              style={{ backgroundColor: 'rgba(0,154,68,0.08)', color: '#009A44' }}
                              title="Modifier"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(coupon)}
                              className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AdminLayout>

      {/* Modal créer / éditer */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div
            className="relative bg-white rounded-2xl w-full shadow-2xl overflow-y-auto"
            style={{ maxWidth: 640, maxHeight: '92vh', zIndex: 1 }}
          >
                {/* En-tête */}
                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl" style={{ zIndex: 2 }}>
                  <h2 className="font-bold text-lg mb-0">
                    {editingCoupon ? 'Modifier le coupon' : 'Nouveau coupon'}
                  </h2>
                  <button onClick={closeModal} className="p-1.5 rounded-lg border-0 bg-gray-100 text-gray-500 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4">
                  {/* Code */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Code <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.code}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
                        style={{ fontFamily: 'monospace' }}
                        placeholder="EX: PROMO2025"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, code: generateRandomCode() }))}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        Générer
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44] resize-none"
                      rows={2}
                      placeholder="Ex: Réduction de 10% sur tous les produits"
                    />
                  </div>

                  {/* Type + Valeur */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Type de réduction <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-col gap-2">
                        {(['percentage', 'fixed', 'free_shipping'] as const).map(t => (
                          <label key={t} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="couponType"
                              value={t}
                              checked={formData.type === t}
                              onChange={() => setFormData({ ...formData, type: t })}
                              className="accent-[#009A44]"
                            />
                            <span className="text-sm text-gray-700">
                              {t === 'percentage' ? 'Pourcentage (%)' : t === 'fixed' ? 'Montant fixe (FCFA)' : 'Livraison gratuite'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {formData.type !== 'free_shipping' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Valeur <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.value}
                            onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44] pr-14"
                            min="0"
                            step={formData.type === 'percentage' ? '1' : '100'}
                            required
                          />
                          <span
                            className="absolute text-gray-400 text-sm"
                            style={{ right: 12, top: '50%', transform: 'translateY(-50%)' }}
                          >
                            {formData.type === 'percentage' ? '%' : 'FCFA'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Montant min + max discount */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Montant minimum de commande</label>
                      <input
                        type="number"
                        value={formData.minOrderAmount}
                        onChange={e => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
                        min="0"
                        step="1000"
                        placeholder="0 = aucun minimum"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nombre max d'utilisations</label>
                      <input
                        type="number"
                        value={formData.maxUsage}
                        onChange={e => setFormData({ ...formData, maxUsage: parseInt(e.target.value) || 0 })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
                        min="0"
                        placeholder="0 = illimité"
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date de début</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date d'expiration</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
                      />
                    </div>
                  </div>

                  {/* Toggle isActive */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <Toggle
                      checked={formData.isActive}
                      onChange={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {formData.isActive ? 'Coupon actif' : 'Coupon désactivé'}
                    </span>
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{ backgroundColor: '#009A44', opacity: saving ? 0.7 : 1 }}
                      className="flex-1 px-4 py-2 rounded-lg text-sm text-white border-0 font-medium"
                    >
                      {saving ? 'Enregistrement...' : editingCoupon ? 'Mettre à jour' : 'Créer'}
                    </button>
                  </div>
                </form>
          </div>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <AdminConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Supprimer le coupon ?"
        message={`Le coupon "${deleteTarget?.code}" sera supprimé définitivement.`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </>
  );
}
