// ─── Modal créer / modifier une bannière hero slider ─────────────────────────

import { X } from 'lucide-react';

export interface BannerForm {
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  order: number;
}

interface Props {
  open: boolean;
  isEditing: boolean;
  form: BannerForm;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (patch: Partial<BannerForm>) => void;
}

export function BannerFormModal({ open, isEditing, form, saving, onClose, onSubmit, onChange }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={() => !saving && onClose()} />
      <div
        className="relative bg-white rounded-2xl w-full shadow-2xl overflow-y-auto"
        style={{ maxWidth: 640, maxHeight: '90vh', zIndex: 1 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl" style={{ zIndex: 2 }}>
          <h2 className="font-bold text-lg mb-0">
            {isEditing ? 'Modifier la bannière' : 'Nouvelle bannière'}
          </h2>
          <button
            onClick={onClose} disabled={saving}
            className="p-2 rounded-lg border-0 bg-gray-100 text-gray-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 flex flex-col gap-4">
          {/* Aperçu image */}
          {form.image && (
            <div className="w-full rounded-xl overflow-hidden border bg-gray-100" style={{ height: 140 }}>
              <img
                src={form.image} alt="Aperçu" className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}

          {/* URL image */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              URL de l'image <span className="text-red-500">*</span>
            </label>
            <input
              type="url" value={form.image}
              onChange={e => onChange({ image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44] transition-colors"
              required
            />
            <p className="text-xs text-gray-400 mt-1 mb-0">Image large recommandée (1200×600px minimum)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text" value={form.title}
                onChange={e => onChange({ title: e.target.value })}
                placeholder="Votre partenaire tech"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Sous-titre</label>
              <input
                type="text" value={form.subtitle}
                onChange={e => onChange({ subtitle: e.target.value })}
                placeholder="en Afrique de l'Ouest"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => onChange({ description: e.target.value })}
                placeholder="Laptops, smartphones, TV..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44] transition-colors"
                style={{ resize: 'none' }}
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Badge</label>
              <input
                type="text" value={form.badge}
                onChange={e => onChange({ badge: e.target.value })}
                placeholder="Nouveauté, Promo, -20%..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44] transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1 mb-0">Étiquette affichée sur la bannière</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Lien de destination</label>
              <input
                type="text" value={form.buttonLink}
                onChange={e => onChange({ buttonLink: e.target.value })}
                placeholder="/boutique"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Texte du bouton CTA</label>
              <input
                type="text" value={form.buttonText}
                onChange={e => onChange({ buttonText: e.target.value })}
                placeholder="Explorer la boutique"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Ordre d'affichage</label>
              <input
                type="number" value={form.order}
                onChange={e => onChange({ order: Number(e.target.value) })}
                min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44] transition-colors"
              />
            </div>
            <div className="flex items-center pb-1 gap-3">
              <button
                type="button"
                onClick={() => onChange({ isActive: !form.isActive })}
                role="switch" aria-checked={form.isActive}
                className="relative inline-flex h-6 w-11 shrink-0 rounded-full border-0 transition-colors duration-200 cursor-pointer"
                style={{ backgroundColor: form.isActive ? '#009A44' : '#9ca3af', padding: 0 }}
              >
                <span
                  className="pointer-events-none inline-block rounded-full bg-white shadow"
                  style={{ width: 16, height: 16, marginTop: 4, transform: form.isActive ? 'translateX(24px)' : 'translateX(4px)', transition: 'transform 0.2s' }}
                />
              </button>
              <span className="text-sm font-semibold text-gray-900">{form.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <button
              type="button" onClick={onClose} disabled={saving}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white text-gray-600 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 text-white px-3 py-2 rounded-lg text-sm font-medium border-0 cursor-pointer"
              style={{ backgroundColor: '#009A44', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer la bannière'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
