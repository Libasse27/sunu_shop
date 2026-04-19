import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, X, Image, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { adminBannersApi } from '../../services/admin.api';
import toast from 'react-hot-toast';

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  image: string;
  cta: string;
  link: string;
  isActive: boolean;
  order: number;
}

interface BannerForm {
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  image: string;
  cta: string;
  link: string;
  isActive: boolean;
  order: number;
}

const emptyForm: BannerForm = {
  title: '',
  subtitle: '',
  description: '',
  badge: '',
  image: '',
  cta: 'Voir la boutique',
  link: '/boutique',
  isActive: true,
  order: 0,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // État pour le dialog de suppression
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null; deleting: boolean }>({
    open: false,
    id: null,
    deleting: false,
  });

  const fetchBanners = async () => {
    try {
      const { data } = await adminBannersApi.getList();
      setBanners(data.data || []);
    } catch {
      toast.error('Erreur lors du chargement des bannières');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, order: banners.length });
    setModalOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      badge: banner.badge || '',
      image: banner.image,
      cta: banner.cta,
      link: banner.link || '',
      isActive: banner.isActive,
      order: banner.order,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.image.trim()) {
      toast.error("Le titre et l'URL de l'image sont obligatoires");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle || undefined,
        description: form.description || undefined,
        badge: form.badge || undefined,
        image: form.image,
        cta: form.cta,
        link: form.link || undefined,
        isActive: form.isActive,
        order: form.order,
      };
      if (editing) {
        await adminBannersApi.update(editing._id, payload);
        toast.success('Bannière mise à jour');
      } else {
        await adminBannersApi.create(payload);
        toast.success('Bannière créée');
      }
      setModalOpen(false);
      fetchBanners();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.id) return;
    setDeleteDialog(prev => ({ ...prev, deleting: true }));
    try {
      await adminBannersApi.delete(deleteDialog.id);
      toast.success('Bannière supprimée');
      setBanners(prev => prev.filter(b => b._id !== deleteDialog.id));
      setDeleteDialog({ open: false, id: null, deleting: false });
    } catch {
      toast.error('Erreur lors de la suppression');
      setDeleteDialog(prev => ({ ...prev, deleting: false }));
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await adminBannersApi.update(banner._id, { isActive: !banner.isActive });
      setBanners(prev =>
        prev.map(b => b._id === banner._id ? { ...b, isActive: !b.isActive } : b)
      );
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Déplace un élément vers le haut ou vers le bas et envoie le nouvel ordre à l'API
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newBanners = [...banners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBanners.length) return;
    [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]];
    const updated = newBanners.map((b, i) => ({ ...b, order: i }));
    setBanners(updated);
    try {
      await adminBannersApi.reorder(updated.map(b => ({ id: b._id, order: b.order })));
      toast.success('Ordre mis à jour');
    } catch {
      toast.error("Erreur lors de la mise à jour de l'ordre");
      fetchBanners();
    }
  };

  return (
    <AdminLayout title="Hero Slider">
      <Helmet><title>Hero Slider — Admin Sunu Shop</title></Helmet>

      <AdminPageHeader
        title="Hero Slider"
        subtitle="Gérez les bannières de la page d'accueil"
        breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Hero Slider' }]}
        actions={
          <button
            onClick={handleOpenCreate}
            style={{ backgroundColor: '#009A44' }}
            className="text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} />
            Ajouter une bannière
          </button>
        }
      />

      {loading ? (
        <div className="text-center py-10 text-gray-500 text-sm">Chargement...</div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <AdminEmptyState
            icon={Image}
            title="Aucune bannière créée"
            description="Les bannières s'affichent dans le slider principal de la page d'accueil."
            action={{ label: 'Créer la première bannière', onClick: handleOpenCreate }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {banners.map((banner, index) => (
            <div
              key={banner._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-stretch overflow-hidden"
              style={{ opacity: banner.isActive ? 1 : 0.6 }}
            >
              {/* Boutons de réordonnancement */}
              <div className="flex flex-col items-center justify-center px-2 gap-1 border-r border-gray-100">
                <button
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 border-0 bg-transparent cursor-pointer"
                  aria-label="Déplacer vers le haut"
                >
                  <ChevronUp size={16} />
                </button>
                <span
                  className="flex items-center justify-center rounded-full text-xs font-bold text-gray-500"
                  style={{ width: 24, height: 24, background: '#f3f4f6' }}
                >
                  {index + 1}
                </span>
                <button
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === banners.length - 1}
                  className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 border-0 bg-transparent cursor-pointer"
                  aria-label="Déplacer vers le bas"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* Miniature image */}
              <div
                className="shrink-0 overflow-hidden bg-gray-100"
                style={{ width: 96, height: 60, alignSelf: 'center', margin: '0 0' }}
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/96x60?text=Image';
                  }}
                />
              </div>

              {/* Informations */}
              <div className="flex-1 px-4 py-3 overflow-hidden">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm text-gray-900 truncate mb-0">{banner.title}</p>
                  <span
                    className="text-xs rounded-full font-medium px-2 py-0.5 shrink-0"
                    style={
                      banner.isActive
                        ? { background: 'rgba(0,154,68,0.1)', color: '#009A44' }
                        : { background: '#f3f4f6', color: '#6b7280' }
                    }
                  >
                    {banner.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                {banner.subtitle && (
                  <p className="text-sm text-gray-500 truncate mb-0">{banner.subtitle}</p>
                )}
                {banner.link && (
                  <p className="text-xs text-gray-400 truncate mt-1 mb-0">
                    Lien : <span className="text-gray-600">{banner.link}</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 px-3 border-l border-gray-100">
                <button
                  onClick={() => handleToggleActive(banner)}
                  title={banner.isActive ? 'Masquer' : 'Afficher'}
                  className="p-2 rounded-lg border-0 bg-transparent cursor-pointer"
                  style={{ color: banner.isActive ? '#16a34a' : '#9ca3af' }}
                >
                  {banner.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => handleOpenEdit(banner)}
                  className="p-2 rounded-lg border-0 bg-transparent text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label="Modifier"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => setDeleteDialog({ open: true, id: banner._id, deleting: false })}
                  className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm"
                  aria-label="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <AdminConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, deleting: false })}
        onConfirm={handleDeleteConfirm}
        loading={deleteDialog.deleting}
        title="Supprimer cette bannière ?"
        message="Cette action est irréversible. La bannière sera définitivement supprimée."
        confirmLabel="Supprimer"
        variant="danger"
      />

      {/* Modal créer / modifier */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !saving && setModalOpen(false)} />
          <div
            className="relative bg-white rounded-2xl w-full shadow-2xl overflow-y-auto"
            style={{ maxWidth: 640, maxHeight: '90vh', zIndex: 1 }}
          >
                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl" style={{ zIndex: 2 }}>
                  <h2 className="font-bold text-lg mb-0">
                    {editing ? 'Modifier la bannière' : 'Nouvelle bannière'}
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
                  {/* Aperçu image */}
                  {form.image && (
                    <div className="w-full rounded-xl overflow-hidden border bg-gray-100" style={{ height: 140 }}>
                      <img
                        src={form.image}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      URL de l'image <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={form.image}
                      onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                      placeholder="https://images.unsplash.com/..."
                      className="input-field text-sm py-2"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1 mb-0">
                      Image large recommandée (1200×600px minimum)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Titre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Votre partenaire tech"
                        className="input-field text-sm py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Sous-titre</label>
                      <input
                        type="text"
                        value={form.subtitle}
                        onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                        placeholder="en Afrique de l'Ouest"
                        className="input-field text-sm py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Description</label>
                      <textarea
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Laptops, smartphones, TV — tout le matériel tech..."
                        className="input-field text-sm py-2"
                        style={{ resize: 'none' }}
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Badge</label>
                      <input
                        type="text"
                        value={form.badge}
                        onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                        placeholder="Nouveauté, Promo, -20%..."
                        className="input-field text-sm py-2"
                      />
                      <p className="text-xs text-gray-400 mt-1 mb-0">Étiquette affichée sur la bannière</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Lien de destination</label>
                      <input
                        type="text"
                        value={form.link}
                        onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                        placeholder="/boutique"
                        className="input-field text-sm py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Texte du bouton CTA</label>
                      <input
                        type="text"
                        value={form.cta}
                        onChange={e => setForm(f => ({ ...f, cta: e.target.value }))}
                        placeholder="Explorer la boutique"
                        className="input-field text-sm py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Ordre d'affichage</label>
                      <input
                        type="number"
                        value={form.order}
                        onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                        min={0}
                        className="input-field text-sm py-2"
                      />
                    </div>
                    <div className="flex items-center pb-1 gap-3">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                        role="switch"
                        aria-checked={form.isActive}
                        className="relative inline-flex h-6 w-11 shrink-0 rounded-full border-0 transition-colors duration-200 cursor-pointer"
                        style={{ backgroundColor: form.isActive ? '#009A44' : '#9ca3af', padding: 0 }}
                      >
                        <span
                          className="pointer-events-none inline-block rounded-full bg-white shadow"
                          style={{ width: 16, height: 16, marginTop: 4, transform: form.isActive ? 'translateX(24px)' : 'translateX(4px)', transition: 'transform 0.2s' }}
                        />
                      </button>
                      <span className="text-sm font-semibold text-gray-900">
                        {form.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      disabled={saving}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white text-gray-600 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 text-white px-3 py-2 rounded-lg text-sm font-medium border-0 cursor-pointer"
                      style={{ backgroundColor: '#009A44', opacity: saving ? 0.6 : 1 }}
                    >
                      {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer la bannière'}
                    </button>
                  </div>
                </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
