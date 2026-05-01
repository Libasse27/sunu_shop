import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, Wrench, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { ServiceFormModal } from '../../components/admin/services/ServiceFormModal';
import type { ServiceForm } from '../../components/admin/services/ServiceFormModal';
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

const EMPTY_FORM: ServiceForm = {
  title: '', slug: '', shortDescription: '', description: '',
  category: '', startingPrice: 0, estimatedDuration: '', image: '',
  isAvailable: true, order: 0, whatsappMessage: '', features: [''],
};

function generateSlug(title: string) {
  return title.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>({ ...EMPTY_FORM });
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

  const handleTitleChange = (title: string) => {
    setForm(prev => ({ ...prev, title, slug: editingService ? prev.slug : generateSlug(title) }));
  };

  const handleChange = (key: keyof ServiceForm, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const updateFeature = (i: number, value: string) =>
    setForm(prev => { const features = [...prev.features]; features[i] = value; return { ...prev, features }; });

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
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Erreur lors de la sauvegarde');
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
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded-lg flex-1" />
                  <div className="h-8 bg-gray-200 rounded-lg flex-1" />
                </div>
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
      </AdminLayout>

      <ServiceFormModal
        open={showModal}
        isEditing={!!editingService}
        form={form}
        saving={saving}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onTitleChange={handleTitleChange}
        onChange={handleChange}
        onUpdateFeature={updateFeature}
        onAddFeature={addFeature}
        onRemoveFeature={removeFeature}
      />

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
