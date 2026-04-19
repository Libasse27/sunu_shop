import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Search, Edit, Trash2, Eye, X, Image as ImageIcon, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { adminProductsApi, adminCategoriesApi } from '../../services/admin.api';
import { formatPrice } from '../../utils/formatPrice';
import { Product } from '../../types/product.types';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category { _id: string; name: string; parent?: { _id: string } | null }

// ─── Constantes ───────────────────────────────────────────────────────────────

const TABS = ['Général', 'Prix & Stock', 'Images', 'Spécifications', 'SEO', 'Fournisseur'];

const EMPTY_SUPPLIER = {
  supplierName: '', supplierContact: '', supplierPhone: '',
  supplierEmail: '', supplierCountry: '', supplierDeliveryDays: 0,
  supplierTracking: '', supplierOrderRef: '', supplierNotes: '',
};

const EMPTY_FORM = {
  name: '', slug: '', sku: '', shortDescription: '', description: '',
  brand: '', category: '', subCategory: '', tags: '',
  price: 0, compareAtPrice: 0, costPrice: 0,
  stock: 0, lowStockThreshold: 5, weight: 0,
  isActive: true, isFeatured: false, isNewArrival: false,
  isBestSeller: false, isOnSale: false,
  saleStartDate: '', saleEndDate: '',
  images: [{ url: '', alt: '', isPrimary: true }] as { url: string; alt: string; isPrimary: boolean }[],
  specifications: [{ key: '', value: '' }] as { key: string; value: string }[],
  seoTitle: '', seoDescription: '', seoKeywords: '',
  ...EMPTY_SUPPLIER,
};

const SPEC_SUGGESTIONS = [
  'Processeur', 'RAM', 'Stockage', 'Écran', 'Batterie',
  "Système d'exploitation", 'Carte graphique', 'Connectivité', 'Poids', 'Couleur',
];

const FLAGS = [
  { key: 'isActive', label: 'Actif' },
  { key: 'isFeatured', label: 'En vedette' },
  { key: 'isNewArrival', label: 'Nouveau' },
  { key: 'isBestSeller', label: 'Meilleure vente' },
  { key: 'isOnSale', label: 'En promotion' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(name: string) {
  return name.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await adminProductsApi.getList({
        page, limit: 20,
        search: search || undefined,
        category: categoryFilter || undefined,
        supplier: supplierFilter || undefined,
      } as any);
      setProducts(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, search, categoryFilter, supplierFilter]);

  useEffect(() => {
    adminCategoriesApi.getList()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  const openModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setForm({
        name: product.name || '', slug: product.slug || '', sku: product.sku || '',
        shortDescription: product.shortDescription || '', description: product.description || '',
        brand: product.brand || '',
        category: product.category?._id || product.category || '',
        subCategory: product.subCategory?._id || product.subCategory || '',
        tags: (product.tags || []).join(', '),
        price: product.price || 0, compareAtPrice: product.compareAtPrice || 0,
        costPrice: product.costPrice || 0, stock: product.stock || 0,
        lowStockThreshold: product.lowStockThreshold || 5, weight: product.weight || 0,
        isActive: product.isActive ?? true, isFeatured: product.isFeatured ?? false,
        isNewArrival: product.isNewArrival ?? false, isBestSeller: product.isBestSeller ?? false,
        isOnSale: product.isOnSale ?? false,
        saleStartDate: product.saleStartDate ? product.saleStartDate.split('T')[0] : '',
        saleEndDate: product.saleEndDate ? product.saleEndDate.split('T')[0] : '',
        images: product.images?.length
          ? product.images.map((img: any) => ({ url: img.url, alt: img.alt || '', isPrimary: img.isPrimary }))
          : [{ url: '', alt: '', isPrimary: true }],
        specifications: product.specifications?.length ? product.specifications : [{ key: '', value: '' }],
        seoTitle: product.seoTitle || '', seoDescription: product.seoDescription || '',
        seoKeywords: (product.seoKeywords || []).join(', '),
        supplierName: product.supplier?.name || '',
        supplierContact: product.supplier?.contact || '',
        supplierPhone: product.supplier?.phone || '',
        supplierEmail: product.supplier?.email || '',
        supplierCountry: product.supplier?.country || '',
        supplierDeliveryDays: product.supplier?.deliveryDays || 0,
        supplierTracking: product.supplier?.trackingNumber || '',
        supplierOrderRef: product.supplier?.orderReference || '',
        supplierNotes: product.supplier?.notes || '',
      });
    } else {
      setEditingProduct(null);
      setForm({ ...EMPTY_FORM, images: [{ url: '', alt: '', isPrimary: true }], specifications: [{ key: '', value: '' }] });
    }
    setActiveTabIndex(0);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingProduct(null); };
  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const handleNameChange = (name: string) => {
    setForm(prev => ({ ...prev, name, slug: editingProduct ? prev.slug : generateSlug(name) }));
  };

  const updateImage = (i: number, field: string, value: string) => {
    setForm(prev => { const imgs = [...prev.images]; imgs[i] = { ...imgs[i], [field]: value }; return { ...prev, images: imgs }; });
  };
  const setPrimary = (i: number) => {
    setForm(prev => ({ ...prev, images: prev.images.map((img, idx) => ({ ...img, isPrimary: idx === i })) }));
  };
  const removeImage = (i: number) => {
    setForm(prev => {
      const imgs = prev.images.filter((_, idx) => idx !== i);
      if (imgs.length === 0) return { ...prev, images: [{ url: '', alt: '', isPrimary: true }] };
      if (!imgs.some(img => img.isPrimary)) imgs[0].isPrimary = true;
      return { ...prev, images: imgs };
    });
  };
  const updateSpec = (i: number, field: string, value: string) => {
    setForm(prev => { const specs = [...prev.specifications]; specs[i] = { ...specs[i], [field]: value }; return { ...prev, specifications: specs }; });
  };
  const addSpec = (key = '') => setForm(prev => ({ ...prev, specifications: [...prev.specifications, { key, value: '' }] }));
  const removeSpec = (i: number) => setForm(prev => ({ ...prev, specifications: prev.specifications.filter((_, idx) => idx !== i) }));
  const handleSpecSuggestion = (label: string) => {
    const emptyIdx = form.specifications.findIndex(s => !s.key.trim());
    if (emptyIdx >= 0) updateSpec(emptyIdx, 'key', label); else addSpec(label);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Le nom est requis'); setActiveTabIndex(0); return; }
    if (!form.sku.trim()) { toast.error('Le SKU est requis'); setActiveTabIndex(0); return; }
    if (!form.description.trim()) { toast.error('La description est requise'); setActiveTabIndex(0); return; }
    if (!form.category) { toast.error('La catégorie est requise'); setActiveTabIndex(0); return; }
    if (form.price <= 0) { toast.error('Le prix doit être supérieur à 0'); setActiveTabIndex(1); return; }
    setSaving(true);
    try {
      const supplierPayload = form.supplierName.trim() ? {
        name: form.supplierName.trim(),
        contact: form.supplierContact.trim() || undefined,
        phone: form.supplierPhone.trim() || undefined,
        email: form.supplierEmail.trim() || undefined,
        country: form.supplierCountry.trim() || undefined,
        deliveryDays: form.supplierDeliveryDays > 0 ? form.supplierDeliveryDays : undefined,
        trackingNumber: form.supplierTracking.trim() || undefined,
        orderReference: form.supplierOrderRef.trim() || undefined,
        notes: form.supplierNotes.trim() || undefined,
      } : undefined;

      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        images: form.images.filter(img => img.url.trim()),
        specifications: form.specifications.filter(s => s.key.trim() && s.value.trim()),
        seoKeywords: form.seoKeywords ? form.seoKeywords.split(',').map(k => k.trim()).filter(Boolean) : [],
        compareAtPrice: form.compareAtPrice > 0 ? form.compareAtPrice : undefined,
        costPrice: form.costPrice > 0 ? form.costPrice : undefined,
        weight: form.weight > 0 ? form.weight : undefined,
        subCategory: form.subCategory || undefined,
        saleStartDate: form.saleStartDate || undefined,
        saleEndDate: form.saleEndDate || undefined,
        supplier: supplierPayload,
      };
      if (editingProduct) {
        await adminProductsApi.update(editingProduct._id, payload);
        toast.success('Produit mis à jour');
      } else {
        await adminProductsApi.create(payload);
        toast.success('Produit créé');
      }
      fetchProducts();
      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminProductsApi.delete(deleteTarget.id);
      toast.success('Produit supprimé');
      setDeleteTarget(null);
      fetchProducts();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const parentCats = categories.filter(c => !c.parent);
  const childCats = categories.filter(
    c => c.parent && ((c.parent as { _id: string })._id === form.category || (c.parent as unknown as string) === form.category)
  );
  const discountPct = form.compareAtPrice > form.price && form.price > 0
    ? Math.round(((form.compareAtPrice - form.price) / form.compareAtPrice) * 100) : 0;

  return (
    <>
      <Helmet><title>Admin — Produits | Sunu Shop</title></Helmet>
      <AdminLayout title="Produits">
        <AdminPageHeader
          title="Produits"
          subtitle={total > 0 ? `${total} produit${total > 1 ? 's' : ''}` : undefined}
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Produits' }]}
          actions={
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 text-sm text-white px-4 py-2 rounded-lg border-0 font-medium"
              style={{ backgroundColor: '#009A44' }}
            >
              <Plus size={16} /> Nouveau produit
            </button>
          }
        />

        <div className="flex flex-col gap-4">
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute text-gray-400" style={{ left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg text-sm py-2 pr-3 focus:outline-none"
                style={{ paddingLeft: 34, width: 240 }}
                placeholder="Rechercher..."
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg text-sm py-2 px-3 bg-white focus:outline-none"
            >
              <option value="">Toutes catégories</option>
              {parentCats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <div className="relative">
              <Truck size={14} className="absolute text-gray-400" style={{ left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={supplierFilter}
                onChange={e => { setSupplierFilter(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg text-sm py-2 pr-3 focus:outline-none"
                style={{ paddingLeft: 30, width: 180 }}
                placeholder="Filtrer fournisseur..."
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-4 flex flex-col gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="rounded-lg bg-gray-200 shrink-0" style={{ width: 44, height: 44 }} />
                    <div className="flex-1"><div className="bg-gray-200 rounded h-3 w-2/5 mb-1.5" /><div className="bg-gray-200 rounded h-3 w-1/4" /></div>
                    <div className="bg-gray-200 rounded h-4 w-20" />
                    <div className="bg-gray-200 rounded h-4 w-10" />
                    <div className="bg-gray-200 rounded h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <AdminEmptyState
                icon={ImageIcon}
                title="Aucun produit trouvé"
                description={search || categoryFilter ? 'Essayez de modifier les filtres.' : 'Créez votre premier produit.'}
                action={{ label: 'Ajouter un produit', onClick: () => openModal() }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fournisseur</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ventes</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p: any) => (
                      <tr key={p._id} className="hover:bg-gray-50 transition-colors border-t">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.images?.[0]?.url ? (
                              <img src={p.images[0].url} alt="" className="rounded-lg object-cover shrink-0" style={{ width: 44, height: 44 }} />
                            ) : (
                              <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 44, height: 44, backgroundColor: '#f3f4f6' }}>
                                <ImageIcon size={18} style={{ color: '#d1d5db' }} />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 text-sm mb-0 truncate" style={{ maxWidth: 180 }}>{p.name}</p>
                              <p className="text-xs text-gray-400 mb-0">{p.category?.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500" style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.sku}</td>
                        <td className="px-4 py-3">
                          {p.supplier?.name ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: 'rgba(14,165,233,0.1)', color: '#0369a1' }}>
                                  <Truck size={10} />
                                  {p.supplier.name}
                                </span>
                              </div>
                              {p.supplier.trackingNumber && (
                                <p className="text-xs text-gray-400 mb-0 mt-0.5 truncate" style={{ maxWidth: 130 }}>
                                  #{p.supplier.trackingNumber}
                                </p>
                              )}
                              {p.supplier.country && (
                                <p className="text-xs text-gray-400 mb-0">{p.supplier.country}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900 text-sm mb-0">{formatPrice(p.price)}</p>
                          {p.compareAtPrice > p.price && (
                            <p className="text-xs text-gray-400 mb-0 line-through">{formatPrice(p.compareAtPrice)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="font-semibold text-sm"
                            style={{ color: p.stock === 0 ? '#E31B23' : p.stock <= (p.lowStockThreshold || 5) ? '#CCB000' : '#009A44' }}
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-sm">{p.totalSold}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full w-fit"
                              style={{ backgroundColor: p.isActive ? 'rgba(0,154,68,0.1)' : '#f3f4f6', color: p.isActive ? '#007A35' : '#6b7280' }}>
                              {p.isActive ? 'Actif' : 'Inactif'}
                            </span>
                            {p.isFeatured && <span className="text-xs font-medium px-2 py-0.5 rounded-full w-fit" style={{ backgroundColor: 'rgba(0,154,68,0.1)', color: '#009A44' }}>Vedette</span>}
                            {p.isOnSale && <span className="text-xs font-medium px-2 py-0.5 rounded-full w-fit" style={{ backgroundColor: 'rgba(227,27,35,0.1)', color: '#E31B23' }}>Promo</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link to={`/produit/${p.slug}`} target="_blank" className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
                              <Eye size={15} />
                            </Link>
                            <button onClick={() => openModal(p)} className="p-1.5 rounded-lg border-0 cursor-pointer"
                              style={{ backgroundColor: 'rgba(0,154,68,0.1)', color: '#009A44' }}>
                              <Edit size={15} />
                            </button>
                            <button onClick={() => setDeleteTarget({ id: p._id, name: p.name })} className="p-1.5 rounded-lg border-0 cursor-pointer"
                              style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                              <Trash2 size={15} />
                            </button>
                          </div>
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
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 bg-white">
                  Précédent
                </button>
                <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 bg-white">
                  Suivant
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Modal produit (custom sans Headless UI) ──────────────────────── */}
        {showModal && (
          <div className="fixed inset-0" style={{ zIndex: 60 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <div className="absolute inset-0 flex items-start justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl w-full shadow-2xl my-3 relative" style={{ maxWidth: 768 }}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
                  <h2 className="font-bold text-gray-900 text-lg mb-0">
                    {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
                  </h2>
                  <button onClick={closeModal} className="p-2 rounded-lg border-0 bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b overflow-x-auto">
                  {TABS.map((tab, i) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTabIndex(i)}
                      className="px-5 py-3 text-sm font-medium whitespace-nowrap border-0 border-b-2 bg-transparent cursor-pointer transition-colors"
                      style={{
                        marginBottom: -1,
                        borderBottomColor: i === activeTabIndex ? '#009A44' : 'transparent',
                        color: i === activeTabIndex ? '#009A44' : '#6b7280',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="overflow-y-auto" style={{ maxHeight: '58vh' }}>
                    {/* Tab 0: Général */}
                    {activeTabIndex === 0 && (
                      <div className="p-6 flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Nom <span className="text-red-500">*</span></label>
                            <input type="text" value={form.name} onChange={e => handleNameChange(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">SKU <span className="text-red-500">*</span></label>
                            <input type="text" value={form.sku} onChange={e => set('sku', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ fontFamily: 'monospace' }} required />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Slug URL</label>
                          <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ fontFamily: 'monospace' }} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Description courte</label>
                          <textarea value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" rows={2} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Description complète <span className="text-red-500">*</span></label>
                          <textarea value={form.description} onChange={e => set('description', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" rows={5} required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Marque</label>
                            <input type="text" value={form.brand} onChange={e => set('brand', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Catégorie <span className="text-red-500">*</span></label>
                            <select value={form.category} onChange={e => set('category', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" required>
                              <option value="">Choisir...</option>
                              {parentCats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                          </div>
                        </div>
                        {childCats.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium mb-1">Sous-catégorie</label>
                            <select value={form.subCategory} onChange={e => set('subCategory', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
                              <option value="">Aucune</option>
                              {childCats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium mb-1">Tags <span className="text-xs text-gray-500">(séparés par virgule)</span></label>
                          <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Caractéristiques</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {FLAGS.map(flag => (
                              <label key={flag.key} className="flex items-center gap-2 cursor-pointer text-sm">
                                <input type="checkbox" checked={form[flag.key as keyof typeof form] as boolean}
                                  onChange={e => set(flag.key, e.target.checked)} className="w-4 h-4 accent-[#009A44]" />
                                <span className="text-gray-900">{flag.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 1: Prix & Stock */}
                    {activeTabIndex === 1 && (
                      <div className="p-6 flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Prix de vente (FCFA) <span className="text-red-500">*</span></label>
                            <input type="number" value={form.price} onChange={e => set('price', Number(e.target.value))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" min="0" step="100" required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Prix barré (FCFA)</label>
                            <input type="number" value={form.compareAtPrice} onChange={e => set('compareAtPrice', Number(e.target.value))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" min="0" step="100" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Prix d'achat (FCFA)</label>
                            <input type="number" value={form.costPrice} onChange={e => set('costPrice', Number(e.target.value))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" min="0" step="100" />
                          </div>
                        </div>
                        {discountPct > 0 && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                            <span className="text-sm font-medium" style={{ color: '#007A35' }}>Remise affichée : {discountPct}%</span>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Stock <span className="text-red-500">*</span></label>
                            <input type="number" value={form.stock} onChange={e => set('stock', Number(e.target.value))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" min="0" required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Seuil alerte bas</label>
                            <input type="number" value={form.lowStockThreshold} onChange={e => set('lowStockThreshold', Number(e.target.value))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" min="1" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Poids (grammes)</label>
                            <input type="number" value={form.weight} onChange={e => set('weight', Number(e.target.value))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" min="0" />
                          </div>
                        </div>
                        {form.isOnSale && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg border" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
                            <div>
                              <label className="block text-sm font-medium mb-1">Début de la promo</label>
                              <input type="date" value={form.saleStartDate} onChange={e => set('saleStartDate', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Fin de la promo</label>
                              <input type="date" value={form.saleEndDate} onChange={e => set('saleEndDate', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Images */}
                    {activeTabIndex === 2 && (
                      <div className="p-6 flex flex-col gap-4">
                        <p className="text-sm text-gray-500 mb-0">Saisissez les URLs des images (Cloudinary). Cochez "Principale" pour la couverture.</p>
                        {form.images.map((img, i) => (
                          <div key={i} className="flex gap-3 items-start p-4 rounded-xl border border-gray-200 bg-gray-50">
                            <div className="flex-1 flex flex-col gap-2">
                              <input type="url" value={img.url} onChange={e => updateImage(i, 'url', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="https://res.cloudinary.com/..." />
                              <input type="text" value={img.alt} onChange={e => updateImage(i, 'alt', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="Texte alternatif (SEO)..." />
                            </div>
                            <div className="flex flex-col items-center gap-2 shrink-0">
                              {img.url && (
                                <img src={img.url} alt="" className="rounded-lg object-cover" style={{ width: 56, height: 56 }}
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              )}
                              <button type="button" onClick={() => setPrimary(i)} className="rounded-full border-0 text-xs font-medium px-2 py-1 cursor-pointer"
                                style={{ backgroundColor: img.isPrimary ? '#009A44' : '#e5e7eb', color: img.isPrimary ? '#fff' : '#4b5563' }}>
                                {img.isPrimary ? 'Principale' : 'Définir'}
                              </button>
                              <button type="button" onClick={() => removeImage(i)} className="p-1 rounded border-0 text-red-400 hover:text-red-600 cursor-pointer">
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {form.images.length < 8 && (
                          <button type="button"
                            onClick={() => setForm(prev => ({ ...prev, images: [...prev.images, { url: '', alt: '', isPrimary: false }] }))}
                            className="flex items-center gap-2 text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-600 bg-white w-fit cursor-pointer">
                            <Plus size={15} /> Ajouter une image
                          </button>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Spécifications */}
                    {activeTabIndex === 3 && (
                      <div className="p-6 flex flex-col gap-4">
                        <p className="text-sm text-gray-500 mb-0">Spécifications techniques (processeur, RAM, écran, etc.)</p>
                        {form.specifications.map((spec, i) => (
                          <div key={i} className="flex gap-3 items-center">
                            <input type="text" value={spec.key} onChange={e => updateSpec(i, 'key', e.target.value)}
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="Spécification" />
                            <input type="text" value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)}
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="Valeur" />
                            <button type="button" onClick={() => removeSpec(i)} className="p-2 rounded-lg border-0 shrink-0 text-red-400 cursor-pointer">
                              <X size={15} />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addSpec()} className="flex items-center gap-2 text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-600 bg-white w-fit cursor-pointer">
                          <Plus size={15} /> Ajouter une spécification
                        </button>
                        <div className="pt-2 border-t">
                          <p className="text-sm text-gray-500 mb-2">Suggestions :</p>
                          <div className="flex flex-wrap gap-2">
                            {SPEC_SUGGESTIONS.map(s => (
                              <button key={s} type="button" onClick={() => handleSpecSuggestion(s)}
                                className="rounded-full border border-gray-200 text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">
                                + {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 4: SEO */}
                    {activeTabIndex === 4 && (
                      <div className="p-6 flex flex-col gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Titre SEO <span className="text-xs text-gray-500">(max 70 caractères)</span></label>
                          <input type="text" value={form.seoTitle} onChange={e => set('seoTitle', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" maxLength={70} placeholder={form.name} />
                          <p className="text-xs text-gray-500 mt-1">{form.seoTitle.length}/70</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Méta description <span className="text-xs text-gray-500">(max 160 caractères)</span></label>
                          <textarea value={form.seoDescription} onChange={e => set('seoDescription', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" rows={3} maxLength={160} />
                          <p className="text-xs text-gray-500 mt-1">{form.seoDescription.length}/160</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Mots-clés SEO <span className="text-xs text-gray-500">(séparés par virgule)</span></label>
                          <input type="text" value={form.seoKeywords} onChange={e => set('seoKeywords', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                        </div>
                        {(form.seoTitle || form.name) && (
                          <div className="p-4 border rounded-xl bg-gray-50">
                            <p className="text-sm text-gray-500 font-medium mb-2">Aperçu Google</p>
                            <p className="font-medium mb-0" style={{ color: '#1558d6' }}>{form.seoTitle || form.name}</p>
                            <p className="text-sm mb-1" style={{ color: '#006621' }}>sunushop.sn/produit/{form.slug || generateSlug(form.name)}</p>
                            <p className="text-gray-500 text-sm mb-0">{form.seoDescription || form.shortDescription}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Tab 5: Fournisseur */}
                    {activeTabIndex === 5 && (
                      <div className="p-6 flex flex-col gap-5">
                        {/* Bandeau info */}
                        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border"
                          style={{ backgroundColor: 'rgba(14,165,233,0.06)', borderColor: 'rgba(14,165,233,0.2)' }}>
                          <Truck size={16} className="shrink-0 mt-0.5" style={{ color: '#0369a1' }} />
                          <p className="text-sm mb-0" style={{ color: '#0369a1' }}>
                            Ces informations sont internes — elles ne sont pas visibles par les clients.
                            Elles permettent de suivre la livraison par fournisseur.
                          </p>
                        </div>

                        {/* Identification */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Identification</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Nom du fournisseur</label>
                              <input type="text" value={form.supplierName} onChange={e => set('supplierName', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                placeholder="Ex : Ali Express, Duba Supplier, Local..." />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Pays d'expédition</label>
                              <input type="text" value={form.supplierCountry} onChange={e => set('supplierCountry', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                placeholder="Ex : Chine, Dubaï, Sénégal..." />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Personne de contact</label>
                              <input type="text" value={form.supplierContact} onChange={e => set('supplierContact', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                placeholder="Prénom / Nom du contact" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Délai de livraison estimé (jours)</label>
                              <input type="number" value={form.supplierDeliveryDays} onChange={e => set('supplierDeliveryDays', Number(e.target.value))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" min="0" placeholder="Ex : 14" />
                            </div>
                          </div>
                        </div>

                        {/* Contact */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Contact</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Téléphone / WhatsApp</label>
                              <input type="tel" value={form.supplierPhone} onChange={e => set('supplierPhone', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                placeholder="+86 xxx xxx xxxx" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Email</label>
                              <input type="email" value={form.supplierEmail} onChange={e => set('supplierEmail', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                placeholder="fournisseur@exemple.com" />
                            </div>
                          </div>
                        </div>

                        {/* Suivi livraison */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Suivi livraison</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">N° de tracking</label>
                              <input type="text" value={form.supplierTracking} onChange={e => set('supplierTracking', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                style={{ fontFamily: 'monospace' }} placeholder="Ex : DHL1234567890CN" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Référence commande fournisseur</label>
                              <input type="text" value={form.supplierOrderRef} onChange={e => set('supplierOrderRef', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                style={{ fontFamily: 'monospace' }} placeholder="Ex : PO-2025-001" />
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Notes internes</label>
                          <textarea value={form.supplierNotes} onChange={e => set('supplierNotes', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" rows={3}
                            maxLength={500} placeholder="Informations utiles sur ce fournisseur (conditions, délais spéciaux, remarques...)" />
                          <p className="text-xs text-gray-400 mt-1">{form.supplierNotes.length}/500</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
                    <div className="flex gap-1">
                      {TABS.map((_, i) => (
                        <button key={i} type="button" onClick={() => setActiveTabIndex(i)} className="rounded-full border-0 transition-all cursor-pointer"
                          style={{ width: i === activeTabIndex ? 16 : 8, height: 8, backgroundColor: i === activeTabIndex ? '#009A44' : '#d1d5db', padding: 0 }} />
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white cursor-pointer">
                        Annuler
                      </button>
                      {activeTabIndex > 0 && (
                        <button type="button" onClick={() => setActiveTabIndex(t => t - 1)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white cursor-pointer">
                          Précédent
                        </button>
                      )}
                      {activeTabIndex < TABS.length - 1 ? (
                        <button type="button" onClick={() => setActiveTabIndex(t => t + 1)} className="px-4 py-2 rounded-lg text-sm text-white border-0 cursor-pointer" style={{ backgroundColor: '#009A44' }}>
                          Suivant
                        </button>
                      ) : (
                        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm text-white border-0 cursor-pointer disabled:opacity-60" style={{ backgroundColor: '#009A44', minWidth: 140 }}>
                          {saving ? 'Enregistrement...' : editingProduct ? 'Mettre à jour' : 'Créer le produit'}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>

      {/* Confirm suppression */}
      <AdminConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Supprimer le produit ?"
        message={`"${deleteTarget?.name}" sera supprimé définitivement. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </>
  );
}
