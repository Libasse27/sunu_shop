import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, X, Wrench, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { adminServicesApi } from '../../services/admin.api';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Service {
  _id: string; title: string; slug: string; shortDescription?: string;
  description: string; category: string; startingPrice: number;
  estimatedDuration?: string; image?: string; isAvailable: boolean;
  order: number; whatsappMessage?: string; features: string[];
}

interface ServiceForm {
  title: string; slug: string; shortDescription: string; description: string;
  category: string; startingPrice: number; estimatedDuration: string;
  image: string; isAvailable: boolean; order: number; whatsappMessage: string; features: string[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const SERVICE_CATEGORIES = [
  'Réparation', 'Installation', 'Maintenance', 'Formation',
  'Conseil', 'Récupération de données', 'Réseau', 'Autre',
];

const EMPTY_FORM: ServiceForm = {
  title: '', slug: '', shortDescription: '', description: '',
  category: '', startingPrice: 0, estimatedDuration: '', image: '',
  isAvailable: true, order: 0, whatsappMessage: '', features: [''],
};

function generateSlug(title: string) {
  return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>({ ...EMPTY_FORM, features: [''] });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data } = await adminServicesApi.getList();
      setServices(data.data || []);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const openModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setForm({
        title: service.title, slug: service.slug, shortDescription: service.shortDescription || '',
        description: service.description, category: service.category,
        startingPrice: service.startingPrice, estimatedDuration: service.estimatedDuration || '',
        image: service.image || '', isAvailable: service.isAvailable, order: service.order,
        whatsappMessage: service.whatsappMessage || '',
        features: service.features.length > 0 ? [...service.features] : [''],
      });
    } else {
      setEditingService(null);
      setForm({ ...EMPTY_FORM, features: [''] });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingService(null); };
  const set = (key: keyof ServiceForm, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const handleTitleChange = (title: string) => {
    setForm(prev => ({ ...prev, title, slug: editingService ? prev.slug : generateSlug(title) }));
  };

  const updateFeature = (i: number, value: string) => {
    setForm(prev => { const features = [...prev.features]; features[i] = value; return { ...prev, features }; });
  };
  const addFeature = () => setForm(prev => ({ ...prev, features: [...prev.features, ''] }));
  const removeFeature = (i: number) => setForm(prev => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Le titre est requis'); return; }
    if (!form.category) { toast.error('La catégorie est requise'); return; }
    if (!form.description.trim()) { toast.error('La description est requise'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        features: form.features.filter(f => f.trim()),
        whatsappMessage: form.whatsappMessage || undefined,
        image: form.image || undefined,
        estimatedDuration: form.estimatedDuration || undefined,
        shortDescription: form.shortDescription || undefined,
      };
      if (editingService) {
        await adminServicesApi.update(editingService._id, payload);
        toast.success('Service mis à jour');
      } else {
        await adminServicesApi.create(payload);
        toast.success('Service créé');
      }
      fetchServices();
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
      await adminServicesApi.delete(deleteTarget._id);
      toast.success('Service supprimé');
      setDeleteTarget(null);
      fetchServices();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const toggleAvailable = async (service: Service) => {
    try {
      await adminServicesApi.update(service._id, { isAvailable: !service.isAvailable });
      toast.success(service.isAvailable ? 'Service désactivé' : 'Service activé');
      fetchServices();
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <>
      <Helmet><title>Admin — Services | Sunu Shop</title></Helmet>
      <AdminLayout title="Services">
        <AdminPageHeader
          title="Services"
          subtitle={`${services.length} service${services.length !== 1 ? 's' : ''}`}
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Services' }]}
          actions={
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 text-sm text-white px-4 py-2 rounded-lg border-0 font-medium"
              style={{ backgroundColor: '#009A44' }}
            >
              <Plus size={16} /> Nouveau service
            </button>
          }
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
                <div className="w-full h-28 bg-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="flex gap-2"><div className="h-8 bg-gray-200 rounded-lg flex-1" /><div className="h-8 bg-gray-200 rounded-lg flex-1" /></div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <AdminEmptyState
              icon={Wrench}
              title="Aucun service créé"
              description="Créez votre premier service pour l'afficher sur le site."
              action={{ label: 'Créer un service', onClick: () => openModal() }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(service => (
              <div
                key={service._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-opacity"
                style={{ opacity: service.isAvailable ? 1 : 0.65 }}
              >
                {service.image && (
                  <img src={service.image} alt={service.title} className="w-full object-cover" style={{ height: 128 }} />
                )}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">{service.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{service.category}</span>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium ml-2 shrink-0"
                      style={{ backgroundColor: service.isAvailable ? 'rgba(0,154,68,0.1)' : '#f3f4f6', color: service.isAvailable ? '#009A44' : '#6b7280' }}
                    >
                      {service.isAvailable ? 'Disponible' : 'Inactif'}
                    </span>
                  </div>

                  {service.shortDescription && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">{service.shortDescription}</p>
                  )}

                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="font-bold text-gray-900">À partir de {formatPrice(service.startingPrice)}</span>
                    {service.estimatedDuration && <span className="text-xs text-gray-400">{service.estimatedDuration}</span>}
                  </div>

                  {service.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {service.features.slice(0, 3).map((f, i) => (
                        <span key={i} className="text-xs rounded-full px-2 py-0.5" style={{ backgroundColor: 'rgba(0,154,68,0.07)', color: '#009A44' }}>{f}</span>
                      ))}
                      {service.features.length > 3 && <span className="text-xs text-gray-400">+{service.features.length - 3}</span>}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => toggleAvailable(service)} title={service.isAvailable ? 'Désactiver' : 'Activer'}
                      className="p-1.5 rounded-lg border-0 cursor-pointer"
                      style={{ backgroundColor: service.isAvailable ? '#f3f4f6' : 'rgba(0,154,68,0.1)', color: service.isAvailable ? '#9ca3af' : '#009A44' }}>
                      {service.isAvailable ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button onClick={() => openModal(service)} className="p-1.5 rounded-lg border-0 cursor-pointer" style={{ backgroundColor: 'rgba(0,154,68,0.1)', color: '#009A44' }}>
                      <Edit size={15} />
                    </button>
                    <button onClick={() => setDeleteTarget(service)} className="p-1.5 rounded-lg border-0 cursor-pointer" style={{ backgroundColor: '#fef2f2', color: '#f87171' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal service (custom) */}
        {showModal && (
          <div className="fixed inset-0" style={{ zIndex: 60 }}>
            <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
            <div className="absolute inset-0 flex items-start justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl w-full shadow-2xl my-3" style={{ maxWidth: 672 }}>
                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
                  <h2 className="font-bold text-gray-900 text-lg mb-0">
                    {editingService ? 'Modifier le service' : 'Nouveau service'}
                  </h2>
                  <button onClick={closeModal} className="p-2 rounded-lg border-0 bg-gray-100 text-gray-500 cursor-pointer"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="p-6 flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Titre <span className="text-red-500">*</span></label>
                        <input type="text" value={form.title} onChange={e => handleTitleChange(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Slug URL</label>
                        <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ fontFamily: 'monospace' }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Catégorie <span className="text-red-500">*</span></label>
                        <select value={form.category} onChange={e => set('category', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" required>
                          <option value="">Choisir...</option>
                          {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Prix de départ (FCFA)</label>
                        <input type="number" value={form.startingPrice} onChange={e => set('startingPrice', Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" min="0" step="500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description courte</label>
                      <textarea value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" rows={2} maxLength={300} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description complète <span className="text-red-500">*</span></label>
                      <textarea value={form.description} onChange={e => set('description', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" rows={4} required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Durée estimée</label>
                        <input type="text" value={form.estimatedDuration} onChange={e => set('estimatedDuration', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="Ex: 1-2 jours" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Image URL</label>
                        <input type="url" value={form.image} onChange={e => set('image', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="https://..." />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Message WhatsApp</label>
                      <textarea value={form.whatsappMessage} onChange={e => set('whatsappMessage', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" rows={2}
                        placeholder="Bonjour Sunu Shop, je souhaite un devis pour..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Fonctionnalités / Points clés</label>
                      <div className="flex flex-col gap-2">
                        {form.features.map((feature, i) => (
                          <div key={i} className="flex gap-2">
                            <input type="text" value={feature} onChange={e => updateFeature(i, e.target.value)}
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder={`Point ${i + 1}...`} />
                            <button type="button" onClick={() => removeFeature(i)} className="p-2 rounded-lg border-0 text-red-400 cursor-pointer"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addFeature} className="flex items-center gap-2 text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 bg-white mt-2 cursor-pointer">
                        <Plus size={14} /> Ajouter un point
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Ordre d'affichage</label>
                        <input type="number" value={form.order} onChange={e => set('order', Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" min="0" />
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={form.isAvailable} onChange={e => set('isAvailable', e.target.checked)} className="w-5 h-5 accent-[#009A44]" />
                          <div>
                            <p className="text-sm font-medium mb-0">Service disponible</p>
                            <p className="text-xs text-gray-500 mb-0">Affiché sur le site</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
                    <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white cursor-pointer">
                      Annuler
                    </button>
                    <button type="submit" disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm text-white border-0 cursor-pointer disabled:opacity-60"
                      style={{ backgroundColor: '#009A44' }}>
                      {saving ? 'Enregistrement...' : editingService ? 'Mettre à jour' : 'Créer le service'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>

      <AdminConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Supprimer le service ?"
        message={`"${deleteTarget?.title}" sera supprimé définitivement.`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </>
  );
}
