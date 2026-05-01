import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, FolderTree, Search } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { CategoryFormModal, CategoryCard } from '../../components/admin/categories/CategoryFormModal';
import type { CategoryFormData, CategoryCardData } from '../../components/admin/categories/CategoryFormModal';
import { adminCategoriesApi } from '../../services/admin.api';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_FORM: CategoryFormData = {
  name: '', slug: '', description: '', imageUrl: '', icon: '',
  parent: '', order: 0, isActive: true, isFeatured: false,
};

function getCategoryParentId(cat: CategoryCardData): string {
  if (!cat.parent) return '';
  if (typeof cat.parent === 'string') return cat.parent;
  return (cat.parent as { _id: string })._id;
}

function getCategoryParentName(cat: CategoryCardData): string | null {
  if (!cat.parent) return null;
  if (typeof cat.parent === 'object' && cat.parent !== null) {
    return (cat.parent as { name: string }).name;
  }
  return null;
}

function generateSlug(name: string): string {
  return name.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildImageObject(url?: string, existingPublicId?: string) {
  if (!url?.trim()) return undefined;
  return { url: url.trim(), ...(existingPublicId ? { publicId: existingPublicId } : {}) };
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
  const [categories, setCategories] = useState<CategoryCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryCardData | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<CategoryCardData | null>(null);

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

  const openCreate = () => {
    setEditingCategory(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (cat: CategoryCardData) => {
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
      isFeatured: cat.isFeatured ?? false,
    });
    setShowModal(true);
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
        image: buildImageObject(formData.imageUrl, editingCategory?.image?.publicId),
        icon: formData.icon.trim() || undefined,
        parent: formData.parent || null,
        order: formData.order,
        isFeatured: formData.isFeatured,
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
      setShowModal(false);
      setEditingCategory(null);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
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
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const availableParents = categories.filter(c => c.level === 0 && c._id !== editingCategory?._id);

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
              <Plus size={16} /> Ajouter une catégorie
            </button>
          }
        />

        {/* Barre de recherche */}
        <div className="mb-5">
          <div className="relative" style={{ maxWidth: 360 }}>
            <Search size={16} className="absolute text-gray-400" style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une catégorie..."
              className="w-full border border-gray-200 rounded-lg text-sm py-2 pr-4 focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
              style={{ paddingLeft: 38 }}
            />
          </div>
        </div>

        {/* Grille */}
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
            {filtered.map(cat => (
              <CategoryCard
                key={cat._id}
                category={cat}
                parentName={getCategoryParentName(cat)}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </AdminLayout>

      <CategoryFormModal
        open={showModal}
        isEditing={!!editingCategory}
        formData={formData}
        saving={saving}
        availableParents={availableParents}
        onClose={() => { setShowModal(false); setEditingCategory(null); }}
        onSubmit={handleSubmit}
        onNameChange={name => setFormData(prev => ({ ...prev, name, slug: generateSlug(name) }))}
        onChange={patch => setFormData(prev => ({ ...prev, ...patch }))}
      />

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
