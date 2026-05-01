import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  type: 'hero' | 'promo';
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  image?: string;
  buttonText: string;
  buttonLink: string;
  highlight?: string;
  accentColor?: string;
  isActive: boolean;
  order: number;
}

const BannerSchema = new Schema<IBanner>({
  type:        { type: String, enum: ['hero', 'promo'], required: true, default: 'hero' },
  title:       { type: String, required: true, trim: true, maxlength: 200 },
  subtitle:    { type: String, trim: true, maxlength: 200 },
  description: { type: String, maxlength: 500 },
  badge:       { type: String, maxlength: 100 },
  image:       { type: String },
  buttonText:  { type: String, required: true, trim: true, maxlength: 100, default: 'Voir la boutique' },
  buttonLink:  { type: String, required: true, trim: true, default: '/boutique' },
  highlight:   { type: String, trim: true, maxlength: 80 },
  accentColor: { type: String, default: '#EF4444' },
  isActive:    { type: Boolean, default: true },
  order:       { type: Number, default: 0 },
}, { timestamps: true });

BannerSchema.index({ type: 1, isActive: 1, order: 1 });

export default mongoose.model<IBanner>('Banner', BannerSchema);
