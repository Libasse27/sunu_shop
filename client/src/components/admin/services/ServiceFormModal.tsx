// ─── Modal créer / modifier un service ───────────────────────────────────────

import React from 'react';
import { X, Plus } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceForm {
  title: string; slug: string; shortDescription: string; description: string;
  category: string; startingPrice: number; estimatedDuration: string;
  image: string; isAvailable: boolean; order: number; whatsappMessage: string; features: string[];
}

const SERVICE_CATEGORIES = [
  'Réparation', 'Installation', 'Maintenance', 'Formation',
  'Conseil', 'Récupération de données', 'Réseau', 'Autre',
];

interface Props {
  open: boolean;
  isEditing: boolean;
  form: ServiceForm;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onTitleChange: (title: string) => void;
  onChange: (key: keyof ServiceForm, value: unknown) => void;
  onUpdateFeature: (i: number, value: string) => void;
  onAddFeature: () => void;
  onRemoveFeature: (i: number) => void;
}

export function ServiceFormModal({
  open, isEditing, form, saving,
  onClose, onSubmit, onTitleChange, onChange, onUpdateFeature, onAddFeature, onRemoveFeature,
}: Props) {
  if (!open) return null;

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none';

  return (
    <div className="fixed inset-0" style={{ zIndex: 60 }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full shadow-2xl my-3" style={{ maxWidth: 672 }}>
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
            <h2 className="font-bold text-gray-900 text-lg mb-0">
              {isEditing ? 'Modifier le service' : 'Nouveau service'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg border-0 bg-gray-100 text-gray-500 cursor-pointer">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Titre <span className="text-red-500">*</span></label>
                  <input type="text" value={form.title} onChange={e => onTitleChange(e.target.value)} className={inputCls} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug URL</label>
                  <input type="text" value={form.slug} onChange={e => onChange('slug', e.target.value)} className={inputCls} style={{ fontFamily: 'monospace' }} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie <span className="text-red-500">*</span></label>
                  <select value={form.category} onChange={e => onChange('category', e.target.value)} className={`${inputCls} bg-white`} required>
                    <option value="">Choisir...</option>
                    {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prix de départ (FCFA)</label>
                  <input type="number" value={form.startingPrice} onChange={e => onChange('startingPrice', Number(e.target.value))} className={inputCls} min="0" step="500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description courte</label>
                <textarea value={form.shortDescription} onChange={e => onChange('shortDescription', e.target.value)} className={`${inputCls} resize-none`} rows={2} maxLength={300} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description complète <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={e => onChange('description', e.target.value)} className={`${inputCls} resize-none`} rows={4} required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Durée estimée</label>
                  <input type="text" value={form.estimatedDuration} onChange={e => onChange('estimatedDuration', e.target.value)} className={inputCls} placeholder="Ex: 1-2 jours" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input type="url" value={form.image} onChange={e => onChange('image', e.target.value)} className={inputCls} placeholder="https://..." />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message WhatsApp</label>
                <textarea value={form.whatsappMessage} onChange={e => onChange('whatsappMessage', e.target.value)} className={`${inputCls} resize-none`} rows={2}
                  placeholder="Bonjour Sunu Shop, je souhaite un devis pour..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fonctionnalités / Points clés</label>
                <div className="flex flex-col gap-2">
                  {form.features.map((feature, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={feature} onChange={e => onUpdateFeature(i, e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder={`Point ${i + 1}...`} />
                      <button type="button" onClick={() => onRemoveFeature(i)} className="p-2 rounded-lg border-0 text-red-400 cursor-pointer"><X size={14} /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={onAddFeature} className="flex items-center gap-2 text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 bg-white mt-2 cursor-pointer">
                  <Plus size={14} /> Ajouter un point
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ordre d'affichage</label>
                  <input type="number" value={form.order} onChange={e => onChange('order', Number(e.target.value))} className={inputCls} min="0" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.isAvailable} onChange={e => onChange('isAvailable', e.target.checked)} className="w-5 h-5 accent-[#009A44]" />
                    <div>
                      <p className="text-sm font-medium mb-0">Service disponible</p>
                      <p className="text-xs text-gray-500 mb-0">Affiché sur le site</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white cursor-pointer">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm text-white border-0 cursor-pointer disabled:opacity-60" style={{ backgroundColor: '#009A44' }}>
                {saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
