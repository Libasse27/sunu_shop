// ─── Shared types and constants for the product form modal ───────────────────

export const TABS = ['Général', 'Prix & Stock', 'Images', 'Spécifications', 'SEO', 'Fournisseur'];

export const EMPTY_SUPPLIER = {
  supplierName: '', supplierContact: '', supplierPhone: '',
  supplierEmail: '', supplierCountry: '', supplierDeliveryDays: 0,
  supplierTracking: '', supplierOrderRef: '', supplierNotes: '',
};

export const EMPTY_FORM = {
  name: '', slug: '', sku: '', shortDescription: '', description: '',
  brand: '', category: '', tags: '',
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

export type ProductForm = typeof EMPTY_FORM;

export const SPEC_SUGGESTIONS = [
  'Processeur', 'RAM', 'Stockage', 'Écran', 'Batterie',
  "Système d'exploitation", 'Carte graphique', 'Connectivité', 'Poids', 'Couleur',
];

export const FLAGS = [
  { key: 'isActive', label: 'Actif' },
  { key: 'isFeatured', label: 'En vedette' },
  { key: 'isNewArrival', label: 'Nouveau' },
  { key: 'isBestSeller', label: 'Meilleure vente' },
  { key: 'isOnSale', label: 'En promotion' },
];

export function generateSlug(name: string) {
  return name.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export interface Category { _id: string; name: string; parent?: { _id: string } | null }
