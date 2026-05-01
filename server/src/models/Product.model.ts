import mongoose, { Schema, Document } from 'mongoose';
import { createSlug } from '../utils/slugify';

export interface IProductImage {
  url: string;
  publicId?: string;
  alt?: string;
  isPrimary: boolean;
  order: number;
}

export interface ISupplier {
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  country?: string;
  deliveryDays?: number;
  trackingNumber?: string;
  orderReference?: string;
  notes?: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  currency: string;
  images: IProductImage[];
  category: mongoose.Types.ObjectId;
  tags: string[];
  variants: Array<{
    name: string;
    options: Array<{
      value: string;
      priceModifier: number;
      stock: number;
      sku?: string;
    }>;
  }>;
  specifications: Array<{ key: string; value: string }>;
  stock: number;
  lowStockThreshold: number;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  brand?: string;
  origin?: string;
  material?: string;
  rating: number;
  numReviews: number;
  totalSold: number;
  viewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isOnSale: boolean;
  saleStartDate?: Date;
  saleEndDate?: Date;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  supplier?: ISupplier;
  relatedProducts: mongoose.Types.ObjectId[];
  discountPercentage: number;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true, maxlength: 5000 },
  shortDescription: { type: String, maxlength: 500 },
  sku: { type: String, unique: true, required: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  costPrice: { type: Number, min: 0 },
  currency: { type: String, default: 'XOF' },
  images: [{
    url: { type: String, required: true },
    publicId: String,
    alt: String,
    isPrimary: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  }],
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  tags: [{ type: String, lowercase: true, trim: true }],
  variants: [{
    name: String,
    options: [{
      value: String,
      priceModifier: { type: Number, default: 0 },
      stock: { type: Number, default: 0 },
      sku: String,
    }],
  }],
  specifications: [{
    key: String,
    value: String,
  }],
  stock: { type: Number, required: true, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
  brand: { type: String, trim: true },
  origin: { type: String, trim: true },
  material: { type: String, trim: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isOnSale: { type: Boolean, default: false },
  saleStartDate: Date,
  saleEndDate: Date,
  seoTitle: { type: String, maxlength: 70 },
  seoDescription: { type: String, maxlength: 160 },
  seoKeywords: [String],
  supplier: {
    name: { type: String, trim: true },
    contact: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    country: { type: String, trim: true },
    deliveryDays: { type: Number, min: 0 },
    trackingNumber: { type: String, trim: true },
    orderReference: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  relatedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ category: 1, isActive: 1, price: 1 });  // filtre catalogue par catégorie active + prix
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ totalSold: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ price: 1, rating: -1 });

// Index supplémentaires pour les pages filtrées
ProductSchema.index({ 'supplier.name': 1 });              // filtre par fournisseur (admin)
ProductSchema.index({ isActive: 1, isOnSale: 1 });           // page soldes
ProductSchema.index({ isActive: 1, isNewArrival: 1 });        // nouvelles arrivées
ProductSchema.index({ isActive: 1, stock: 1 });               // alertes stock bas (admin)

// Performance indexes pour filtres secondaires
ProductSchema.index({ isActive: 1, brand: 1 });           // filtre par marque
ProductSchema.index({ isActive: 1, tags: 1 });             // filtre par tags
ProductSchema.index({ isActive: 1, rating: -1 });          // tri par note

ProductSchema.virtual('discountPercentage').get(function () {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

ProductSchema.pre('validate', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = createSlug(this.name);
  }
  next();
});

ProductSchema.set('toJSON', { virtuals: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
