import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, X, Eye, EyeOff, GripVertical, ExternalLink, Megaphone } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { adminAnnouncementsApi } from '../../services/admin.api';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Announcement {
  _id: string;
  text: string;
  link?: string;
  linkLabel?: string;
  image?: string;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  order: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const emptyForm = {
  text: '',
  link: '',
  linkLabel: '',
  image: '',
  bgColor: '#009A44',
  textColor: '#ffffff',
  isActive: true,
  order: 0,
};

const presetColors = [
  { bg: '#009A44', text: '#ffffff', label: 'Vert' },
  { bg: '#E31B23', text: '#ffffff', label: 'Rouge' },
  { bg: '#FCD116', text: '#003D1C', label: 'Or' },
  { bg: '#16A34A', text: '#ffffff', label: 'Vert' },
  { bg: '#DC2626', text: '#ffffff', label: 'Rouge' },
  { bg: '#7C3AED', text: '#ffffff', label: 'Violet' },
  { bg: '#FEF9C3', text: '#92400E', label: 'Jaune' },
  { bg: '#FCD116', text: '#003D1C', label: 'Or' },
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

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const fetchItems = async () => {
    try {
      const { data } = await adminAnnouncementsApi.getList();
      setItems(data.data || []);
    } catch {
      toast.error('Erreur lors du chargement');
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

  const openEdit = (item: Announcement) => {
    setEditing(item);
    setForm({
      text: item.text,
      link: item.link || '',
      linkLabel: item.linkLabel || '',
      image: item.image || '',
      bgColor: item.bgColor,
      textColor: item.textColor,
      isActive: item.isActive,
      order: item.order,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isImageMode = !!form.image?.trim();
    if (!isImageMode && !form.text.trim()) { toast.error('Le texte est obligatoire'); return; }
    setSaving(true);
    const payload = { ...form, image: form.image?.trim() || undefined };
    try {
      if (editing) {
        await adminAnnouncementsApi.update(editing._id, payload);
        toast.success('Annonce mise à jour');
      } else {
        await adminAnnouncementsApi.create(payload);
        toast.success('Annonce créée');
      }
      setModalOpen(false);
      fetchItems();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminAnnouncementsApi.delete(deleteTarget._id);
      toast.success('Annonce supprimée');
      setItems(prev => prev.filter(i => i._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (item: Announcement) => {
    try {
      await adminAnnouncementsApi.update(item._id, { isActive: !item.isActive });
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, isActive: !i.isActive } : i));
    } catch {
      toast.error('Erreur');
    }
  };

  const handleDragStart = (id: string) => setDragId(id);
  const handleDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const reordered = [...items];
    const fromIdx = reordered.findIndex(i => i._id === dragId);
    const toIdx = reordered.findIndex(i => i._id === targetId);
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const updated = reordered.map((i, idx) => ({ ...i, order: idx }));
    setItems(updated);
    setDragId(null);
    try {
      await adminAnnouncementsApi.reorder(updated.map(i => ({ id: i._id, order: i.order })));
      toast.success('Ordre mis à jour');
    } catch {
      toast.error("Erreur lors de la mise à jour de l'ordre");
      fetchItems();
    }
  };

  const isImageMode = !!form.image?.trim();

  return (
    <>
      <Helmet><title>Admin — Annonces | Sunu Shop</title></Helmet>
      <AdminLayout title="Barre d'annonces">
        <AdminPageHeader
          title="Barre d'annonces"
          subtitle={items.length > 0 ? `${items.length} annonce${items.length > 1 ? 's' : ''}` : undefined}
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: "Barre d'annonces" }]}
          actions={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 text-white border-0 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#009A44' }}
            >
              <Plus size={16} /> Nouvelle annonce
            </button>
          }
        />

        {/* Info banner */}
        <div
          className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2"
          style={{ background: 'rgba(0,154,68,0.08)', border: '1px solid rgba(0,154,68,0.2)', color: '#009A44' }}
        >
          <ExternalLink size={15} />
          Les annonces actives défilent dans la barre en haut de chaque page du site.
          <a href="/" target="_blank" rel="noreferrer" className="font-semibold ml-1" style={{ color: '#009A44' }}>Voir le site</a>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 h-16 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <AdminEmptyState
              icon={Megaphone}
              title="Aucune annonce créée"
              description="La barre affichera un message par défaut. Créez des annonces pour personnaliser ce message."
              action={{ label: 'Créer la première annonce', onClick: openCreate }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-400 flex items-center gap-2 mb-1">
              <GripVertical size={13} /> Glissez pour réorganiser l'ordre de défilement
            </p>
            {items.map((item) => (
              <div
                key={item._id}
                draggable
                onDragStart={() => handleDragStart(item._id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(item._id)}
                className="bg-white rounded-xl border overflow-hidden flex items-stretch"
                style={{ opacity: item.isActive ? 1 : 0.55, borderColor: '#e5e7eb', cursor: 'grab' }}
              >
                {/* Drag handle */}
                <div className="flex items-center px-3 text-gray-400 border-r border-gray-100">
                  <GripVertical size={18} />
                </div>

                {/* Order badge */}
                <div className="flex items-center px-3 border-r border-gray-100">
                  <span
                    className="flex items-center justify-center rounded-full text-sm font-bold text-gray-500"
                    style={{ width: 28, height: 28, background: '#f3f4f6' }}
                  >
                    {item.order + 1}
                  </span>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-3 px-3 py-2 flex-1 overflow-hidden">
                  {item.image ? (
                    <div className="relative rounded-xl overflow-hidden border shrink-0" style={{ width: 160, height: 56 }}>
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                      {item.text && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                          <span className="text-white truncate px-1" style={{ fontSize: 10, fontWeight: 500 }}>{item.text}</span>
                        </div>
                      )}
                      <span
                        className="absolute top-0 left-0 mt-1 ml-1 text-white font-bold rounded px-1"
                        style={{ background: '#009A44', fontSize: 9 }}
                      >
                        IMAGE
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-xl border shrink-0" style={{ width: 32, height: 32, backgroundColor: item.bgColor }} />
                  )}
                  <div className="overflow-hidden">
                    {!item.image && (
                      <div
                        className="text-sm rounded inline-block mb-1 truncate"
                        style={{
                          backgroundColor: item.bgColor,
                          color: item.textColor,
                          padding: '2px 12px',
                          maxWidth: '100%',
                          fontSize: 12,
                        }}
                      >
                        {item.text}
                        {item.link && item.linkLabel && (
                          <span className="ml-2" style={{ textDecoration: 'underline', opacity: 0.8 }}>{item.linkLabel}</span>
                        )}
                      </div>
                    )}
                    {item.image && (
                      <p className="text-sm text-gray-900 font-semibold truncate mb-1">{item.text || '—'}</p>
                    )}
                    <div className="flex items-center gap-3">
                      {item.link && (
                        <span className="text-gray-400" style={{ fontSize: 11 }}>
                          Lien : <span className="text-gray-900">{item.link}</span>
                        </span>
                      )}
                      {!item.isActive && (
                        <span className="rounded-full text-gray-500" style={{ fontSize: 10, background: '#f3f4f6', padding: '2px 8px' }}>
                          Masquée
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 px-3 border-l border-gray-100">
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
            style={{ maxWidth: 512, maxHeight: '90vh', zIndex: 1 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl" style={{ zIndex: 2 }}>
              <h2 className="font-bold text-lg mb-0">
                {editing ? "Modifier l'annonce" : 'Nouvelle annonce'}
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
              {/* Mode toggle */}
              <div className="rounded-xl overflow-hidden border flex">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, image: '' }))}
                  className="flex-1 py-2 text-sm font-semibold border-0 cursor-pointer"
                  style={{ background: !form.image ? '#009A44' : 'white', color: !form.image ? 'white' : '#6b7280' }}
                >
                  Texte
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, image: f.image || ' ' }))}
                  className="flex-1 py-2 text-sm font-semibold border-0 cursor-pointer"
                  style={{ background: form.image?.trim() ? '#009A44' : 'white', color: form.image?.trim() ? 'white' : '#6b7280' }}
                >
                  Bannière image
                </button>
              </div>

              {/* Live preview */}
              {isImageMode ? (
                <div className="relative w-full rounded-xl overflow-hidden border bg-gray-100" style={{ height: 100 }}>
                  <img
                    src={form.image.trim()}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                  />
                  {form.text && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                      <span className="text-white font-semibold text-sm" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                        {form.text}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="w-full py-2 px-3 rounded-xl text-sm text-center font-semibold"
                  style={{ backgroundColor: form.bgColor, color: form.textColor }}
                >
                  {form.text || 'Aperçu de votre annonce…'}
                  {form.link && form.linkLabel && (
                    <span className="ml-2" style={{ textDecoration: 'underline', opacity: 0.8 }}>{form.linkLabel}</span>
                  )}
                </div>
              )}

              {/* Image URL (image mode only) */}
              {form.image !== '' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">URL de l'image bannière *</label>
                  <input
                    type="url"
                    value={form.image === ' ' ? '' : form.image}
                    onChange={e => setForm(f => ({ ...f, image: e.target.value || ' ' }))}
                    placeholder="https://images.unsplash.com/... (largeur ~1200px, hauteur ~240px)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                  <p className="text-sm text-gray-500 mt-1 mb-0">
                    Utilisez une image large (ratio ~5:1 recommandé — ex. 1200×240px)
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  {isImageMode ? 'Texte superposé (optionnel)' : "Texte de l'annonce *"}
                </label>
                <input
                  type="text"
                  value={form.text}
                  onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                  placeholder="Livraison gratuite dès 200 000 FCFA | Paiement Wave & Orange Money"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  required={!isImageMode}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Lien (optionnel)</label>
                  <input
                    type="text"
                    value={form.link}
                    onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                    placeholder="/boutique?onSale=true"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Texte du lien</label>
                  <input
                    type="text"
                    value={form.linkLabel}
                    onChange={e => setForm(f => ({ ...f, linkLabel: e.target.value }))}
                    placeholder="Voir les offres →"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Color presets — text mode only */}
              {!isImageMode && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Couleur de fond</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {presetColors.map(({ bg, text, label }) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, bgColor: bg, textColor: text }))}
                        title={label}
                        className="rounded-lg border-0 cursor-pointer"
                        style={{
                          width: 32,
                          height: 32,
                          backgroundColor: bg,
                          outline: form.bgColor === bg ? `2px solid #009A44` : '2px solid transparent',
                          outlineOffset: 2,
                          transform: form.bgColor === bg ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.15s',
                        }}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Couleur personnalisée (fond)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={form.bgColor}
                          onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))}
                          className="rounded border cursor-pointer p-1"
                          style={{ width: 40, height: 36 }}
                        />
                        <input
                          type="text"
                          value={form.bgColor}
                          onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))}
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                          placeholder="#009A44"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Couleur du texte</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={form.textColor}
                          onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))}
                          className="rounded border cursor-pointer p-1"
                          style={{ width: 40, height: 36 }}
                        />
                        <input
                          type="text"
                          value={form.textColor}
                          onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))}
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                    {form.isActive ? 'Visible' : 'Masquée'}
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
                  ref={confirmBtnRef}
                  type="submit"
                  disabled={saving}
                  className="flex-1 text-white px-3 py-2 rounded-lg text-sm font-semibold border-0 cursor-pointer"
                  style={{ background: '#009A44', opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : "Créer l'annonce"}
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
        title="Supprimer l'annonce ?"
        message={deleteTarget ? `L'annonce "${deleteTarget.text || '(sans texte)'}" sera supprimée définitivement.` : ''}
        confirmLabel="Supprimer"
      />
    </>
  );
}
