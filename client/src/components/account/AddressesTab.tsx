import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit2, Map, Check, Phone,
  MapPin, Home, Briefcase, Tag,
} from 'lucide-react';
import { Address } from '../../types/user.types';
import AddressMap from './AddressMap';
import api from '../../services/api';
import { getApiError } from '../../utils/getApiError';
import toast from 'react-hot-toast';
import { SN } from './accountConstants';

// ─── Config étiquettes d'adresse ─────────────────────────────────────────────

const LABEL_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  domicile: { icon: Home,      label: 'Domicile', color: SN.green },
  bureau:   { icon: Briefcase, label: 'Bureau',   color: SN.goldDark },
  autre:    { icon: Tag,       label: 'Autre',    color: SN.redDark },
};

const EMPTY_FORM = {
  label: 'domicile', fullName: '', phone: '', street: '',
  city: 'Dakar', country: 'Sénégal', isDefault: false,
};

// ─── AddressesTab ─────────────────────────────────────────────────────────────

export default function AddressesTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedMap, setExpandedMap] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/users/me/addresses');
      setAddresses(data.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, []);

  const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/users/me/addresses/${editId}`, form);
        toast.success('Adresse modifiée');
      } else {
        await api.post('/users/me/addresses', form);
        toast.success('Adresse ajoutée');
      }
      fetchAddresses();
      resetForm();
    } catch (err: unknown) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette adresse ?')) return;
    try {
      await api.delete(`/users/me/addresses/${id}`);
      toast.success('Adresse supprimée');
      fetchAddresses();
    } catch { toast.error('Erreur'); }
  };

  const handleEdit = (addr: Address) => {
    setForm({
      label: addr.label || 'domicile', fullName: addr.fullName,
      phone: addr.phone, street: addr.street,
      city: addr.city, country: addr.country || 'Sénégal',
      isDefault: addr.isDefault,
    });
    setEditId(addr._id ?? null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-gray-900 mb-0">Mes Adresses</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus size={14} /> Ajouter une adresse
          </button>
        )}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 mb-0 text-sm">
              {editId ? "Modifier l'adresse" : 'Nouvelle adresse'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer p-1">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            {/* Type d'adresse */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</label>
              <div className="flex gap-2">
                {(['domicile', 'bureau', 'autre'] as const).map(lbl => {
                  const cfg = LABEL_CONFIG[lbl];
                  const Icon = cfg.icon;
                  const active = form.label === lbl;
                  return (
                    <button
                      key={lbl} type="button"
                      onClick={() => setForm({ ...form, label: lbl })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
                      style={{
                        background: active ? `${cfg.color}15` : 'white',
                        color: active ? cfg.color : '#6b7280',
                        borderColor: active ? cfg.color : '#e5e7eb',
                      }}
                    >
                      <Icon size={13} /> {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nom complet *</label>
                <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Téléphone *</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" required placeholder="+221 77 XXX XX XX" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Adresse (rue, quartier) *</label>
                <input type="text" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} className="input-field" required placeholder="Rue 10, Plateau" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ville *</label>
                <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pays</label>
                <input type="text" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="input-field" />
              </div>
            </div>

            {form.street && form.city && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Map size={12} /> Aperçu sur la carte
                </p>
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <AddressMap street={form.street} city={form.city} country={form.country} label={LABEL_CONFIG[form.label]?.label || form.label} />
                </div>
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div onClick={() => setForm({ ...form, isDefault: !form.isDefault })} className="relative flex-shrink-0 cursor-pointer" style={{ width: 40, height: 22 }}>
                <div className="absolute inset-0 rounded-full transition-colors duration-200" style={{ background: form.isDefault ? '#009A44' : '#d1d5db' }} />
                <div className="absolute top-1 rounded-full bg-white shadow transition-transform duration-200" style={{ width: 14, height: 14, left: 4, transform: form.isDefault ? 'translateX(18px)' : 'translateX(0)' }} />
              </div>
              <span className="text-sm text-gray-700">Définir comme adresse par défaut</span>
            </label>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={submitting} className="btn-primary text-sm">
                {submitting ? 'Enregistrement...' : editId ? "Modifier l'adresse" : "Ajouter l'adresse"}
              </button>
              <button type="button" onClick={resetForm} className="btn-ghost text-sm">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Liste vide */}
      {addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,154,68,0.08)' }}>
            <MapPin size={28} style={{ color: '#009A44' }} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Aucune adresse enregistrée</p>
            <p className="text-sm text-gray-400 mb-0">Ajoutez une adresse pour accélérer vos commandes.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-2">
            <Plus size={14} /> Ajouter une adresse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addresses.map((addr) => {
            const cfg = LABEL_CONFIG[addr.label] || LABEL_CONFIG.autre;
            const Icon = cfg.icon;
            return (
              <div key={addr._id} className="bg-white rounded-2xl border overflow-hidden transition-all" style={{ borderColor: addr.isDefault ? '#009A44' : '#e5e7eb' }}>
                <div className="h-1" style={{ background: addr.isDefault ? '#009A44' : '#e5e7eb' }} />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: `${cfg.color}12`, color: cfg.color }}>
                      <Icon size={12} /> {cfg.label}
                    </div>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#009A44', color: '#fff' }}>
                        <Check size={10} /> Par défaut
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">{addr.fullName}</p>
                  <p className="text-sm text-gray-500 mb-0">{addr.street}</p>
                  <p className="text-sm text-gray-500 mb-0">{addr.city}, {addr.country}</p>
                  <p className="text-xs text-gray-400 mt-1 mb-0 flex items-center gap-1"><Phone size={10} /> {addr.phone}</p>

                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
                    <button onClick={() => handleEdit(addr)} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors border-0 bg-transparent cursor-pointer" style={{ color: '#009A44' }}>
                      <Edit2 size={11} /> Modifier
                    </button>
                    <button onClick={() => handleDelete(addr._id ?? '')} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors border-0 bg-transparent cursor-pointer" style={{ color: '#E31B23' }}>
                      <Trash2 size={11} /> Supprimer
                    </button>
                    <button onClick={() => setExpandedMap(expandedMap === addr._id ? null : (addr._id ?? null))} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors border-0 bg-transparent cursor-pointer text-gray-400 ml-auto">
                      <Map size={11} /> {expandedMap === addr._id ? 'Masquer' : 'Carte'}
                    </button>
                  </div>
                </div>

                {expandedMap === addr._id && (
                  <div className="border-t border-gray-100">
                    <AddressMap street={addr.street} city={addr.city} country={addr.country} label={addr.fullName} mini />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
