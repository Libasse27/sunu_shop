// ─── Modal de création/édition produit avec onglets ──────────────────────────

import { X, Plus, Truck } from 'lucide-react';
import { TABS, FLAGS, SPEC_SUGGESTIONS, generateSlug, type ProductForm, type Category } from './ProductFormTypes';
import type { Product } from '../../../types/product.types';

interface Props {
  form: ProductForm;
  editingProduct: Product | null;
  activeTabIndex: number;
  parentFilter: string;
  saving: boolean;
  categories: Category[];
  onClose: () => void;
  onTabChange: (i: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  set: (key: string, value: unknown) => void;
  handleNameChange: (name: string) => void;
  setParentFilter: (v: string) => void;
  updateImage: (i: number, field: string, value: string) => void;
  setPrimary: (i: number) => void;
  removeImage: (i: number) => void;
  updateSpec: (i: number, field: string, value: string) => void;
  addSpec: (key?: string) => void;
  removeSpec: (i: number) => void;
  handleSpecSuggestion: (label: string) => void;
  setForm: React.Dispatch<React.SetStateAction<ProductForm>>;
}

export default function ProductFormModal({
  form, editingProduct, activeTabIndex, parentFilter, saving, categories,
  onClose, onTabChange, onSubmit, set, handleNameChange, setParentFilter,
  updateImage, setPrimary, removeImage, updateSpec, addSpec, removeSpec,
  handleSpecSuggestion, setForm,
}: Props) {
  const parentCats = categories.filter(c => !c.parent);
  const childCats = categories.filter(
    c => c.parent && ((c.parent as { _id: string })._id === parentFilter || (c.parent as unknown as string) === parentFilter)
  );
  const discountPct = form.compareAtPrice > form.price && form.price > 0
    ? Math.round(((form.compareAtPrice - form.price) / form.compareAtPrice) * 100) : 0;

  return (
    <div className="fixed inset-0" style={{ zIndex: 60 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full shadow-2xl my-3 relative" style={{ maxWidth: 768 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
            <h2 className="font-bold text-gray-900 text-lg mb-0">
              {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg border-0 bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b overflow-x-auto">
            {TABS.map((tab, i) => (
              <button key={tab} type="button" onClick={() => onTabChange(i)}
                className="px-5 py-3 text-sm font-medium whitespace-nowrap border-0 border-b-2 bg-transparent cursor-pointer transition-colors"
                style={{ marginBottom: -1, borderBottomColor: i === activeTabIndex ? '#009A44' : 'transparent', color: i === activeTabIndex ? '#009A44' : '#6b7280' }}>
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit}>
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
                      <select value={parentFilter} onChange={e => { setParentFilter(e.target.value); set('category', e.target.value); }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" required>
                        <option value="">Choisir...</option>
                        {parentCats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {childCats.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Sous-catégorie</label>
                      <select value={form.category} onChange={e => set('category', e.target.value || parentFilter)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
                        <option value={parentFilter}>— Catégorie parente uniquement —</option>
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
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl border"
                    style={{ backgroundColor: 'rgba(14,165,233,0.06)', borderColor: 'rgba(14,165,233,0.2)' }}>
                    <Truck size={16} className="shrink-0 mt-0.5" style={{ color: '#0369a1' }} />
                    <p className="text-sm mb-0" style={{ color: '#0369a1' }}>
                      Ces informations sont internes — elles ne sont pas visibles par les clients.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Identification</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nom du fournisseur</label>
                        <input type="text" value={form.supplierName} onChange={e => set('supplierName', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="Ex : Ali Express..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Pays d'expédition</label>
                        <input type="text" value={form.supplierCountry} onChange={e => set('supplierCountry', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="Ex : Chine, Dubaï..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Personne de contact</label>
                        <input type="text" value={form.supplierContact} onChange={e => set('supplierContact', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Délai de livraison (jours)</label>
                        <input type="number" value={form.supplierDeliveryDays} onChange={e => set('supplierDeliveryDays', Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" min="0" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Contact</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Téléphone / WhatsApp</label>
                        <input type="tel" value={form.supplierPhone} onChange={e => set('supplierPhone', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="+86 xxx xxx xxxx" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" value={form.supplierEmail} onChange={e => set('supplierEmail', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Suivi livraison</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">N° de tracking</label>
                        <input type="text" value={form.supplierTracking} onChange={e => set('supplierTracking', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ fontFamily: 'monospace' }} placeholder="DHL1234567890CN" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Référence commande fournisseur</label>
                        <input type="text" value={form.supplierOrderRef} onChange={e => set('supplierOrderRef', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ fontFamily: 'monospace' }} placeholder="PO-2025-001" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes internes</label>
                    <textarea value={form.supplierNotes} onChange={e => set('supplierNotes', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" rows={3} maxLength={500} />
                    <p className="text-xs text-gray-400 mt-1">{form.supplierNotes.length}/500</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <div className="flex gap-1">
                {TABS.map((_, i) => (
                  <button key={i} type="button" onClick={() => onTabChange(i)} className="rounded-full border-0 transition-all cursor-pointer"
                    style={{ width: i === activeTabIndex ? 16 : 8, height: 8, backgroundColor: i === activeTabIndex ? '#009A44' : '#d1d5db', padding: 0 }} />
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white cursor-pointer">
                  Annuler
                </button>
                {activeTabIndex > 0 && (
                  <button type="button" onClick={() => onTabChange(activeTabIndex - 1)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white cursor-pointer">
                    Précédent
                  </button>
                )}
                {activeTabIndex < TABS.length - 1 ? (
                  <button type="button" onClick={() => onTabChange(activeTabIndex + 1)} className="px-4 py-2 rounded-lg text-sm text-white border-0 cursor-pointer" style={{ backgroundColor: '#009A44' }}>
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
  );
}
