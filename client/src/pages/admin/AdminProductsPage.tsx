import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Search, Edit, Trash2, Eye, Image as ImageIcon, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import ProductFormModal from '../../components/admin/products/ProductFormModal';
import { adminProductsApi, adminCategoriesApi } from '../../services/admin.api';
import { formatPrice } from '../../utils/formatPrice';
import { Product } from '../../types/product.types';
import toast from 'react-hot-toast';
import { getApiError } from '../../utils/getApiError';
import {
  EMPTY_FORM, type ProductForm, type Category,
} from '../../components/admin/products/ProductFormTypes';

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
  const [parentFilter, setParentFilter] = useState('');
  const [form, setForm] = useState<ProductForm>({ ...EMPTY_FORM });
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
      });
      setProducts(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
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

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const productCatId = product.category._id;
      const productCat = categories.find(c => c._id === productCatId);
      const derivedParent = productCat?.parent
        ? (productCat.parent as { _id: string })._id || (productCat.parent as unknown as string)
        : productCatId;
      setParentFilter(derivedParent || '');
      setForm({
        name: product.name || '', slug: product.slug || '', sku: product.sku || '',
        shortDescription: product.shortDescription || '', description: product.description || '',
        brand: product.brand || '',
        category: product.category._id,
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
          ? product.images.map((img: { url: string; alt?: string; isPrimary: boolean }) => ({ url: img.url, alt: img.alt || '', isPrimary: img.isPrimary }))
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
      setParentFilter('');
      setForm({ ...EMPTY_FORM, images: [{ url: '', alt: '', isPrimary: true }], specifications: [{ key: '', value: '' }] });
    }
    setActiveTabIndex(0);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingProduct(null); };
  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().normalize('NFD')
      .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setForm(prev => ({ ...prev, name, slug: editingProduct ? prev.slug : slug }));
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

      const { supplierName: _sn, supplierContact: _sc, supplierPhone: _sp, supplierEmail: _se,
        supplierCountry: _sco, supplierDeliveryDays: _sd, supplierTracking: _st,
        supplierOrderRef: _sor, supplierNotes: _snotes, ...rest } = form;

      const payload = {
        ...rest,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        images: form.images.filter(img => img.url.trim()),
        specifications: form.specifications.filter(s => s.key.trim() && s.value.trim()),
        seoKeywords: form.seoKeywords ? form.seoKeywords.split(',').map(k => k.trim()).filter(Boolean) : [],
        compareAtPrice: form.compareAtPrice > 0 ? form.compareAtPrice : undefined,
        costPrice: form.costPrice > 0 ? form.costPrice : undefined,
        weight: form.weight > 0 ? form.weight : undefined,
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
    } catch (err: unknown) {
      toast.error(getApiError(err, 'Erreur lors de la sauvegarde'));
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

  return (
    <>
      <Helmet><title>Admin — Produits | Sunu Shop</title></Helmet>
      <AdminLayout title="Produits">
        <AdminPageHeader
          title="Produits"
          subtitle={total > 0 ? `${total} produit${total > 1 ? 's' : ''}` : undefined}
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Produits' }]}
          actions={
            <button onClick={() => openModal()} className="flex items-center gap-2 text-sm text-white px-4 py-2 rounded-lg border-0 font-medium" style={{ backgroundColor: '#009A44' }}>
              <Plus size={16} /> Nouveau produit
            </button>
          }
        />

        <div className="flex flex-col gap-4">
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute text-gray-400" style={{ left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg text-sm py-2 pr-3 focus:outline-none" style={{ paddingLeft: 34, width: 240 }} placeholder="Rechercher..." />
            </div>
            <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg text-sm py-2 px-3 bg-white focus:outline-none">
              <option value="">Toutes catégories</option>
              {parentCats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <div className="relative">
              <Truck size={14} className="absolute text-gray-400" style={{ left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" value={supplierFilter} onChange={e => { setSupplierFilter(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg text-sm py-2 pr-3 focus:outline-none" style={{ paddingLeft: 30, width: 180 }} placeholder="Filtrer fournisseur..." />
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
                    <div className="bg-gray-200 rounded h-4 w-20" /><div className="bg-gray-200 rounded h-4 w-10" /><div className="bg-gray-200 rounded h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <AdminEmptyState icon={ImageIcon} title="Aucun produit trouvé"
                description={search || categoryFilter ? 'Essayez de modifier les filtres.' : 'Créez votre premier produit.'}
                action={{ label: 'Ajouter un produit', onClick: () => openModal() }} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['Produit', 'SKU', 'Fournisseur', 'Prix', 'Stock', 'Ventes', 'Statut', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
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
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: 'rgba(14,165,233,0.1)', color: '#0369a1' }}>
                                <Truck size={10} /> {p.supplier.name}
                              </span>
                              {p.supplier.trackingNumber && (
                                <p className="text-xs text-gray-400 mb-0 mt-0.5 truncate" style={{ maxWidth: 130 }}>#{p.supplier.trackingNumber}</p>
                              )}
                              {p.supplier.country && <p className="text-xs text-gray-400 mb-0">{p.supplier.country}</p>}
                            </div>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900 text-sm mb-0">{formatPrice(p.price)}</p>
                          {(p.compareAtPrice ?? 0) > p.price && (
                            <p className="text-xs text-gray-400 mb-0 line-through">{formatPrice(p.compareAtPrice)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-sm"
                            style={{ color: p.stock === 0 ? '#E31B23' : p.stock <= (p.lowStockThreshold || 5) ? '#CCB000' : '#009A44' }}>
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
                            <Link to={`/produit/${p.slug}`} target="_blank" className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"><Eye size={15} /></Link>
                            <button onClick={() => openModal(p)} className="p-1.5 rounded-lg border-0 cursor-pointer" style={{ backgroundColor: 'rgba(0,154,68,0.1)', color: '#009A44' }}><Edit size={15} /></button>
                            <button onClick={() => setDeleteTarget({ id: p._id, name: p.name })} className="p-1.5 rounded-lg border-0 cursor-pointer" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-gray-50">
                <span className="text-xs text-gray-500">{total} produit{total !== 1 ? 's' : ''} · page {page}/{totalPages}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 bg-white cursor-pointer">←</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const mid = Math.min(Math.max(page, 3), totalPages - 2);
                    const pg = totalPages <= 5 ? i + 1 : mid - 2 + i;
                    if (pg < 1 || pg > totalPages) return null;
                    return (
                      <button key={pg} onClick={() => setPage(pg)}
                        className="px-3 py-1.5 border rounded-lg text-sm font-medium cursor-pointer"
                        style={{ borderColor: pg === page ? '#009A44' : '#e5e7eb', background: pg === page ? '#009A44' : 'white', color: pg === page ? 'white' : '#374151' }}>
                        {pg}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 bg-white cursor-pointer">→</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <ProductFormModal
            form={form} editingProduct={editingProduct} activeTabIndex={activeTabIndex}
            parentFilter={parentFilter} saving={saving} categories={categories}
            onClose={closeModal} onTabChange={setActiveTabIndex} onSubmit={handleSubmit}
            set={set} handleNameChange={handleNameChange} setParentFilter={setParentFilter}
            updateImage={updateImage} setPrimary={setPrimary} removeImage={removeImage}
            updateSpec={updateSpec} addSpec={addSpec} removeSpec={removeSpec}
            handleSpecSuggestion={handleSpecSuggestion} setForm={setForm}
          />
        )}
      </AdminLayout>

      <AdminConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm} loading={deleting}
        title="Supprimer le produit ?"
        message={`"${deleteTarget?.name}" sera supprimé définitivement. Cette action est irréversible.`}
        confirmLabel="Supprimer" variant="danger"
      />
    </>
  );
}
