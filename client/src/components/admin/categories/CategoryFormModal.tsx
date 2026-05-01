// ─── Modal créer / éditer une catégorie ──────────────────────────────────────

import React from 'react';
import { X, FolderTree } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  icon: string;
  parent: string;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
}

interface ParentOption { _id: string; name: string }

interface Props {
  open: boolean;
  isEditing: boolean;
  formData: CategoryFormData;
  saving: boolean;
  availableParents: ParentOption[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onNameChange: (name: string) => void;
  onChange: (patch: Partial<CategoryFormData>) => void;
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button" onClick={onChange} role="switch" aria-checked={checked}
      className="rounded-full border-0 relative shrink-0"
      style={{ width: 40, height: 20, backgroundColor: checked ? '#009A44' : '#d1d5db', transition: 'background-color 0.2s', padding: 0 }}
    >
      <span
        className="absolute rounded-full bg-white shadow"
        style={{ top: 2, left: 2, width: 16, height: 16, transform: checked ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s' }}
      />
    </button>
  );
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function CategoryFormModal({
  open, isEditing, formData, saving, availableParents,
  onClose, onSubmit, onNameChange, onChange,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl w-full shadow-2xl overflow-y-auto"
        style={{ maxWidth: 512, maxHeight: '92vh', zIndex: 1 }}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl" style={{ zIndex: 2 }}>
          <h2 className="font-bold text-lg mb-0">
            {isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg border-0 bg-gray-100 text-gray-500 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-4 flex flex-col gap-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={formData.name}
              onChange={e => onNameChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
              placeholder="Ex: Informatique"
              required autoFocus
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <input
              type="text" value={formData.slug}
              onChange={e => onChange({ slug: e.target.value })}
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
              onChange={e => onChange({ description: e.target.value })}
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
                type="url" value={formData.imageUrl}
                onChange={e => onChange({ imageUrl: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icône (emoji)</label>
              <input
                type="text" value={formData.icon}
                onChange={e => onChange({ icon: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
                placeholder="💻"
              />
            </div>
          </div>

          {/* Aperçu image */}
          {formData.imageUrl && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <img
                src={formData.imageUrl} alt="Aperçu"
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
              onChange={e => onChange({ parent: e.target.value })}
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
              type="number" value={formData.order}
              onChange={e => onChange({ order: parseInt(e.target.value) || 0 })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009A44]/25 focus:border-[#009A44]"
              style={{ width: 112 }}
              min="0"
            />
            <p className="text-xs text-gray-400 mt-1">Valeur basse = affiché en premier</p>
          </div>

          {/* Toggles active + featured */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Toggle checked={formData.isActive} onChange={() => onChange({ isActive: !formData.isActive })} />
              <span className="text-sm font-medium text-gray-900">
                {formData.isActive ? 'Catégorie active' : 'Catégorie inactive'}
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Toggle checked={formData.isFeatured} onChange={() => onChange({ isFeatured: !formData.isFeatured })} />
              <span className="text-sm font-medium text-gray-900">Catégorie mise en avant</span>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose} disabled={saving}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit" disabled={saving}
              style={{ backgroundColor: '#009A44', opacity: saving ? 0.7 : 1 }}
              className="flex-1 px-4 py-2 rounded-lg text-sm text-white border-0 font-medium"
            >
              {saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Carte catégorie ──────────────────────────────────────────────────────────

import { Edit, Trash2 } from 'lucide-react';

export interface CategoryCardData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { url: string; publicId?: string };
  icon?: string;
  parent?: { _id: string; name: string } | string | null;
  level: number;
  order: number;
  isActive: boolean;
  isFeatured?: boolean;
  productCount?: number;
}

interface CategoryCardProps {
  category: CategoryCardData;
  parentName: string | null;
  onEdit: (cat: CategoryCardData) => void;
  onDelete: (cat: CategoryCardData) => void;
}

export function CategoryCard({ category: cat, parentName, onEdit, onDelete }: CategoryCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {/* Image ou placeholder */}
      <div className="relative w-full flex items-center justify-center bg-gray-50" style={{ height: 112 }}>
        {cat.image?.url ? (
          <img src={cat.image.url} alt={cat.name} className="w-full h-full object-cover" />
        ) : cat.icon ? (
          <span style={{ fontSize: 40 }}>{cat.icon}</span>
        ) : (
          <FolderTree size={36} className="text-gray-300" />
        )}
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
        <p className="text-xs text-gray-400 mb-1 truncate" style={{ fontFamily: 'monospace' }}>/{cat.slug}</p>
        {parentName && (
          <span className="inline-flex items-center text-xs text-gray-500 mb-1">
            Sous-catégorie de <strong className="ml-1">{parentName}</strong>
          </span>
        )}
        <p className="text-xs text-gray-400 mt-auto mb-3">
          {cat.productCount ?? 0} produit{(cat.productCount ?? 0) > 1 ? 's' : ''}
        </p>
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onEdit(cat)}
            style={{ backgroundColor: '#009A44' }}
            className="text-white px-4 py-2 rounded-lg text-sm font-medium flex-1 flex items-center justify-center gap-1.5"
          >
            <Edit size={14} /> Éditer
          </button>
          <button
            onClick={() => onDelete(cat)}
            className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm transition-colors border border-red-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
