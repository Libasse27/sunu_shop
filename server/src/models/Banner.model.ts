import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  cta: string;
  link: string;
  image: string;
  isActive: boolean;
  order: number;
}

const BannerSchema = new Schema<IBanner>({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  subtitle: { type: String, trim: true, maxlength: 200 },
  description: { type: String, maxlength: 500 },
  badge: { type: String, maxlength: 100 },
  cta: { type: String, required: true, trim: true, maxlength: 100, default: 'Voir la boutique' },
  link: { type: String, required: true, trim: true, default: '/boutique' },
  image: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

BannerSchema.index({ isActive: 1, order: 1 });

export default mongoose.model<IBanner>('Banner', BannerSchema);
