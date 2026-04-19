import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, X, FolderTree, Search } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { adminCategoriesApi } from '../../services/admin.api';
import toast from 'react-hot-toast';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CategoryImage {
  url: string;
  publicId?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: CategoryImage;
  icon?: string;
  parent?: { _id: string; name: string } | string | null;
  level: number;
  order: number;
  isActive: boolean;
  productCount?: number;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  icon: string;
  parent: string;
  order: number;
  isActive: boolean;
}

// ─── Constantes ────────────────────────────────────────────────────────────────

const EMPTY_FORM: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  icon: '',
  parent: '',
  order: 0,
  isActive: true,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getCategoryParentId(cat: Category): string {
  if (!cat.parent) return '';
  if (typeof cat.parent === 'string') return cat.parent;
  return (cat.parent as { _id: string })._id;
}

function getCategoryParentName(cat: Category): string | null {
  if (!cat.parent) return null;
  if (typeof cat.parent === 'object' && cat.parent !== null) {
    return (cat.parent as { name: string }).name;
  }
  return null;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Composant Toggle ──────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="rounded-full border-0 relative shrink-0"
      style={{
        width: 40,
        height: 20,
        backgroundColor: checked ? '#009A44' : '#d1d5db',
        transition: 'background-color 0.2s',
        padding: 0,
      }}
      aria-checked={checked}
      role="switch"
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
      <div className="w-full h-28 bg-gray-200 rounded-lg mb-3" />
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 rounded-lg flex-1" />
        <div className="h-8 bg-gray-200 rounded-lg flex-1" />
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await adminCategoriesApi.getList();
      setCategories(data.data || []);
    } catch {
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleNameChange = (name: string) => {
    setFormData(prev => ({ ...prev, name, slug: generateSlug(name) }));
  };

  const openCreate = () => {
    setEditingCategory(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      imageUrl: cat.image?.url || '',
      icon: cat.icon || '',
      parent: getCategoryParentId(cat),
      order: cat.order,
      isActive: cat.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Le nom est requis'); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        image: formData.imageUrl.trim() || undefined,
        icon: formData.icon.trim() || undefined,
        parent: formData.parent || null,
        order: formData.order,
        isActive: formData.isActive,
      };
      if (editingCategory) {
        await adminCategoriesApi.update(editingCategory._id, payload);
        toast.success('Catégorie mise à jour');
      } else {
        await adminCategoriesApi.create(payload);
        toast.success('Catégorie créée');
      }
      await fetchCategories();
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
      await adminCategoriesApi.delete(deleteTarget._id);
      toast.success('Catégorie supprimée');
      setDeleteTarget(null);
      await fetchCategories();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  // Catégories racines disponibles pour sélection parentale dans le formulaire
  const availableParents = categories.filter(
    c => c.level === 0 && c._id !== editingCategory?._id
  );

  const filtered = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Helmet><title>Admin — Catégories</title></Helmet>

      <AdminLayout title="Catégories">
        <AdminPageHeader
          title="Catégories"
          subtitle={`${categories.length} catégorie${categories.length > 1 ? 's' : ''}`}
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Catégories' }]}
          actions={
            <button
              onClick={openCreate}
              style={{ backgroundColor: '#009A44' }}
              className="text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Plus size={16} />
              Ajouter une catégorie
            </button>
          }
        />

        {/* Barre de recherche */}
        <div className="mb-5">
          <div className="relative" style={{ maxWidth: 360 }}>
            <Search size={16} className="absolute text-gray-400" style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une catégorie..."
              className="w-full border border-gray-200 rounded-lg text-sm py-2 pr-4 focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
              style={{ paddingLeft: 38, focusRingColor: '#009A44' } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Grille de catégories */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <CategoryCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <AdminEmptyState
              icon={FolderTree}
              title={search ? 'Aucune catégorie trouvée' : 'Aucune catégorie créée'}
              description={search ? 'Essayez un autre terme de recherche.' : 'Créez votre première catégorie pour organiser votre catalogue.'}
              action={!search ? { label: 'Créer une catégorie', onClick: openCreate } : undefined}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(cat => {
              const parentName = getCategoryParentName(cat);
              return (
                <div
                  key={cat._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
                >
                  {/* Image ou placeholder */}
                  <div
                    className="relative w-full flex items-center justify-center bg-gray-50"
                    style={{ height: 112 }}
                  >
                    {cat.image?.url ? (
                      <img
                        src={cat.image.url}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    ) : cat.icon ? (
                      <span style={{ fontSize: 40 }}>{cat.icon}</span>
                    ) : (
                      <FolderTree size={36} className="text-gray-300" />
                    )}
                    {/* Badge statut */}
                    <span
                      className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: cat.isActive ? 'rgba(0,154,68,0.1)' : '#f3f4f6',
                        color: cat.isActive ? '#009A44' : '#9ca3af',
                      }}
                    >
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Contenu */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5 truncate">{cat.name}</h3>
                    <p
                      className="text-xs text-gray-400 mb-1 truncate"
                      style={{ fontFamily: 'monospace' }}
                    >
                      /{cat.slug}
                    </p>

                    {/* Parent si sous-catégorie */}
                    {parentName && (
                      <span className="inline-flex items-center text-xs text-gray-500 mb-1">
                        Sous-catégorie de <strong className="ml-1">{parentName}</strong>
                      </span>
                    )}

                    {/* Nombre de produits */}
                    <p className="text-xs text-gray-400 mt-auto mb-3">
                      {cat.productCount ?? 0} produit{(cat.productCount ?? 0) > 1 ? 's' : ''}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => openEdit(cat)}
                        style={{ backgroundColor: '#009A44' }}
                        className="text-white px-4 py-2 rounded-lg text-sm font-medium flex-1 flex items-center justify-center gap-1.5"
                      >
                        <Edit size={14} />
                        Éditer
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm transition-colors border border-red-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminLayout>

      {/* Modal créer / éditer */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div
            className="relative bg-white rounded-2xl w-full shadow-2xl overflow-y-auto"
            style={{ maxWidth: 512, maxHeight: '92vh', zIndex: 1 }}
          >
                {/* En-tête */}
                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl" style={{ zIndex: 2 }}>
                  <h2 className="font-bold text-lg mb-0">
                    {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                  </h2>
                  <button onClick={closeModal} className="p-1.5 rounded-lg border-0 bg-gray-100 text-gray-500 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4">
                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => handleNameChange(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
                      placeholder="Ex: Informatique"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={e => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
                      style={{ fontFamily: 'monospace' }}
                      placeholder="ex: informatique"
                    />
                    <p className="text-xs text-gray-400 mt-1">Généré automatiquement depuis le nom</p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44] resize-none"
                      rows={2}
                      placeholder="Description courte de la catégorie"
                    />
                  </div>

                  {/* Image URL + Icône */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Image URL</label>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Icône (emoji)</label>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={e => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
                        placeholder="💻"
                      />
                    </div>
                  </div>

                  {/* Aperçu image */}
                  {formData.imageUrl && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <img
                        src={formData.imageUrl}
                        alt="Aperçu"
                        className="rounded-lg object-cover border border-gray-200"
                        style={{ width: 56, height: 56 }}
                        onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                      <span className="text-sm text-gray-500">Aperçu de l'image</span>
                    </div>
                  )}

                  {/* Catégorie parente */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Catégorie parente</label>
                    <select
                      value={formData.parent}
                      onChange={e => setFormData({ ...formData, parent: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44] bg-white"
                    >
                      <option value="">— Catégorie racine —</option>
                      {availableParents.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ordre */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Ordre d'affichage</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
                      style={{ width: 112 }}
                      min="0"
                    />
                    <p className="text-xs text-gray-400 mt-1">Valeur basse = affiché en premier</p>
                  </div>

                  {/* Toggle active */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <Toggle
                      checked={formData.isActive}
                      onChange={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {formData.isActive ? 'Catégorie active' : 'Catégorie inactive'}
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
                      {saving ? 'Enregistrement...' : editingCategory ? 'Mettre à jour' : 'Créer'}
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
        title="Supprimer la catégorie ?"
        message={`La catégorie "${deleteTarget?.name}" sera supprimée définitivement. Les produits associés ne seront pas supprimés.`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </>
  );
}
