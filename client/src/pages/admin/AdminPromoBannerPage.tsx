import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, X, Eye, EyeOff, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { adminPromoBannersApi } from '../../services/admin.api';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PromoBanner {
  _id: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  accentColor: string;
  isActive: boolean;
  order: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const emptyForm = {
  badge: 'Offres Exclusives',
  title: "Jusqu'à",
  highlight: '-40%',
  description: 'Sur une sélection de laptops, smartphones et accessoires',
  buttonText: 'Profiter des offres',
  buttonLink: '/boutique?onSale=true',
  accentColor: '#EF4444',
  isActive: true,
  order: 0,
};

const accentPresets = [
  { color: '#EF4444', label: 'Rouge' },
  { color: '#FCD116', label: 'Or' },
  { color: '#009A44', label: 'Vert' },
  { color: '#16A34A', label: 'Vert foncé' },
  { color: '#7C3AED', label: 'Violet' },
  { color: '#F59E0B', label: 'Ambre' },
];

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className="relative inline-flex h-6 w-11 shrink-0 rounded-full border-0 transition-colors duration-200 cursor-pointer"
      style={{ backgroundColor: checked ? '#009A44' : '#9ca3af', padding: 0 }}
    >
      <span
        className="pointer-events-none inline-block rounded-full bg-white shadow"
        style={{
          width: 16,
          height: 16,
          marginTop: 4,
          transform: checked ? 'translateX(24px)' : 'translateX(4px)',
          transition: 'transform 0.2s',
        }}
      />
    </button>
  );
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AdminPromoBannerPage() {
  const [items, setItems] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PromoBanner | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PromoBanner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = async () => {
    try {
      const { data } = await adminPromoBannersApi.getList();
      setItems(data.data || []);
    } catch {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  // Close modal on Escape
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, order: items.length });
    setModalOpen(true);
  };

  const openEdit = (item: PromoBanner) => {
    setEditing(item);
    setForm({
      badge: item.badge,
      title: item.title,
      highlight: item.highlight,
      description: item.description,
      buttonText: item.buttonText,
      buttonLink: item.buttonLink,
      accentColor: item.accentColor,
      isActive: item.isActive,
      order: item.order,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminPromoBannersApi.update(editing._id, form);
        toast.success('Bannière mise à jour');
      } else {
        await adminPromoBannersApi.create(form);
        toast.success('Bannière créée');
      }
      setModalOpen(false);
      fetchItems();
    } catch {
      toast.error('Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminPromoBannersApi.delete(deleteTarget._id);
      toast.success('Supprimée');
      setItems(prev => prev.filter(i => i._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      toast.error('Erreur suppression');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (item: PromoBanner) => {
    try {
      await adminPromoBannersApi.update(item._id, { isActive: !item.isActive });
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, isActive: !i.isActive } : i));
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <>
      <Helmet><title>Admin — Bannière Promo | Sunu Shop</title></Helmet>
      <AdminLayout title="Bannière Promotionnelle">
        <AdminPageHeader
          title="Bannière Promotionnelle"
          subtitle={items.length > 0 ? `${items.length} bannière${items.length > 1 ? 's' : ''}` : undefined}
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Bannière Promo' }]}
          actions={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 text-white border-0 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#009A44' }}
            >
              <Plus size={16} /> Nouvelle bannière
            </button>
          }
        />

        {/* Position in homepage flow */}
        <div
          className="mb-4 p-3 rounded-lg border text-xs"
          style={{ background: 'rgba(252,209,22,0.06)', borderColor: 'rgba(252,209,22,0.3)' }}
        >
          <p className="font-semibold mb-1.5" style={{ color: '#9A7A00' }}>
            <Zap size={12} className="inline mr-1" />
            Position dans la page d'accueil (style Jumia)
          </p>
          <div className="flex items-center gap-1 flex-wrap text-gray-600">
            {['Hero Slider', 'Catégories', 'Ventes Flash 🔥', 'Duo Bannières', 'Nouveautés', '→ Bannière Promo ←', 'Services', 'Meilleures Ventes'].map((s, i, arr) => (
              <span
                key={s}
                className={`px-2 py-0.5 rounded ${s.includes('←') ? 'font-bold text-white' : 'bg-gray-100 text-gray-600'}`}
                style={s.includes('←') ? { backgroundColor: '#9A7A00' } : {}}
              >
                {s}{i < arr.length - 1 ? ' →' : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Info banner */}
        <div
          className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2"
          style={{ background: 'rgba(0,154,68,0.08)', border: '1px solid rgba(0,154,68,0.2)', color: '#009A44' }}
        >
          <ExternalLink size={15} />
          La première bannière active est affichée sur la{' '}
          <a href="/" target="_blank" rel="noreferrer" className="font-semibold" style={{ color: '#009A44' }}>page d'accueil</a>.
          Les autres sont en réserve.
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 h-40 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <AdminEmptyState
              icon={Zap}
              title="Aucune bannière promo créée"
              description="La section bannière promo ne s'affichera pas sur le site tant qu'aucune bannière active n'est configurée."
              action={{ label: 'Créer la première bannière', onClick: openCreate }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item, idx) => (
              <div
                key={item._id}
                className="rounded-xl overflow-hidden border"
                style={{
                  borderColor: item.isActive && idx === 0 ? '#009A44' : '#e5e7eb',
                  boxShadow: item.isActive && idx === 0 ? '0 4px 12px rgba(0,154,68,0.15)' : 'none',
                }}
              >
                {item.isActive && idx === 0 && (
                  <div className="flex items-center gap-2 px-4 py-2" style={{ background: '#009A44' }}>
                    <span className="rounded-full bg-white" style={{ width: 8, height: 8 }} />
                    <span className="text-white text-sm font-semibold">Actuellement affichée sur le site</span>
                  </div>
                )}

                {/* Preview */}
                <div
                  className={`relative overflow-hidden p-4 lg:p-5${!item.isActive ? ' opacity-75' : ''}`}
                  style={{ background: 'linear-gradient(to right, #003D1C, #005C29, #003D1C)' }}
                >
                  <div className="absolute rounded-full pointer-events-none" style={{ right: -40, top: -40, width: 160, height: 160, backgroundColor: item.accentColor, opacity: 0.1 }} />
                  <div className="absolute rounded-full pointer-events-none" style={{ right: 80, bottom: -32, width: 96, height: 96, backgroundColor: item.accentColor, opacity: 0.08 }} />
                  <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-3" style={{ zIndex: 10 }}>
                    <div>
                      <span
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-bold uppercase mb-3"
                        style={{ backgroundColor: `${item.accentColor}30`, color: item.accentColor, letterSpacing: '0.05em', fontSize: 11 }}
                      >
                        <Zap size={11} /> {item.badge}
                      </span>
                      <h2 className="text-xl font-bold text-white mb-1">
                        {item.title}{' '}
                        {item.highlight && <span style={{ color: item.accentColor }}>{item.highlight}</span>}
                        {' '}de réduction
                      </h2>
                      <p className="text-sm mb-0" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.description}</p>
                    </div>
                    <div
                      className="shrink-0 inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg font-semibold text-sm self-start"
                      style={{ backgroundColor: item.accentColor }}
                    >
                      {item.buttonText} <ArrowRight size={15} />
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="bg-white px-4 py-2 flex items-center justify-between border-t border-gray-100">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>Lien : <span className="text-gray-900 font-semibold">{item.buttonLink}</span></span>
                    {!item.isActive && (
                      <span className="rounded-full text-gray-500" style={{ background: '#f3f4f6', padding: '2px 8px', fontSize: 11 }}>
                        Masquée
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(item)}
                      title={item.isActive ? 'Masquer' : 'Afficher'}
                      className="p-2 rounded-lg border-0 bg-transparent cursor-pointer"
                      style={{ color: item.isActive ? '#16a34a' : '#9ca3af' }}
                    >
                      {item.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={() => openEdit(item)} className="p-2 rounded-lg border-0 bg-transparent text-gray-400 cursor-pointer">
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-2 rounded-lg border-0 bg-transparent cursor-pointer"
                      style={{ color: '#f87171' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminLayout>

      {/* ─── Modal ──────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !saving && setModalOpen(false)} />
          <div
            className="relative bg-white rounded-2xl w-full shadow-2xl overflow-y-auto"
            style={{ maxWidth: 672, maxHeight: '90vh', zIndex: 1 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl" style={{ zIndex: 2 }}>
              <h2 className="font-bold text-xl mb-0">
                {editing ? 'Modifier la bannière' : 'Nouvelle bannière promo'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="p-2 rounded-lg border-0 bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              {/* Live preview */}
              <div
                className="relative overflow-hidden rounded-xl p-4"
                style={{ background: 'linear-gradient(to right, #003D1C, #005C29, #003D1C)' }}
              >
                <div className="absolute rounded-full pointer-events-none" style={{ right: -32, top: -32, width: 128, height: 128, backgroundColor: form.accentColor, opacity: 0.12 }} />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ zIndex: 10 }}>
                  <div>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold uppercase mb-2"
                      style={{ backgroundColor: `${form.accentColor}30`, color: form.accentColor, fontSize: 10, letterSpacing: '0.05em' }}
                    >
                      <Zap size={9} /> {form.badge || 'Badge'}
                    </span>
                    <p className="text-lg font-bold text-white mb-1">
                      {form.title || 'Titre'}{' '}
                      {form.highlight && <span style={{ color: form.accentColor }}>{form.highlight}</span>}
                      {' '}de réduction
                    </p>
                    <p className="text-sm mb-0" style={{ color: 'rgba(255,255,255,0.5)' }}>{form.description}</p>
                  </div>
                  <div
                    className="shrink-0 inline-flex items-center gap-2 text-white px-3 py-2 rounded-lg font-semibold self-start"
                    style={{ backgroundColor: form.accentColor, fontSize: 12 }}
                  >
                    {form.buttonText} <ArrowRight size={12} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Badge (étiquette)</label>
                  <input
                    type="text"
                    value={form.badge}
                    onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                    placeholder="Offres Exclusives"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Texte mis en avant (couleur)</label>
                  <input
                    type="text"
                    value={form.highlight}
                    onChange={e => setForm(f => ({ ...f, highlight: e.target.value }))}
                    placeholder="-40%"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Titre principal *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Jusqu'à"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  required
                />
                <p className="text-sm text-gray-500 mt-1 mb-0">
                  Le texte "de réduction" est ajouté automatiquement après le texte mis en avant.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Sur une sélection de laptops, smartphones et accessoires"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Texte du bouton *</label>
                  <input
                    type="text"
                    value={form.buttonText}
                    onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))}
                    placeholder="Profiter des offres"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Lien du bouton *</label>
                  <input
                    type="text"
                    value={form.buttonLink}
                    onChange={e => setForm(f => ({ ...f, buttonLink: e.target.value }))}
                    placeholder="/boutique?onSale=true"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Accent color */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Couleur d'accentuation</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {accentPresets.map(({ color, label }) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, accentColor: color }))}
                      title={label}
                      className="rounded-lg border-0 cursor-pointer"
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: color,
                        outline: form.accentColor === color ? '2px solid #1a1a1a' : '2px solid transparent',
                        outlineOffset: 2,
                        transform: form.accentColor === color ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.15s',
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
                    className="rounded border cursor-pointer p-1"
                    style={{ width: 40, height: 36 }}
                  />
                  <input
                    type="text"
                    value={form.accentColor}
                    onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    placeholder="#EF4444"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Ordre</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                    min={0}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div className="flex items-center pb-1 gap-3">
                  <Toggle checked={form.isActive} onChange={val => setForm(f => ({ ...f, isActive: val }))} />
                  <span className="text-sm font-semibold text-gray-900">
                    {form.isActive ? 'Active' : 'Masquée'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold bg-white text-gray-600 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 text-white px-3 py-2 rounded-lg text-sm font-semibold border-0 cursor-pointer"
                  style={{ background: '#009A44', opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm suppression */}
      <AdminConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        variant="danger"
        title="Supprimer cette bannière promo ?"
        message="Cette action est irréversible. La bannière sera définitivement supprimée."
        confirmLabel="Supprimer"
      />
    </>
  );
}
