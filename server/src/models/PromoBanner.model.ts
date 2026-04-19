import mongoose, { Schema, Document } from 'mongoose';

export interface IPromoBanner extends Document {
  badge: string;
  title: string;
  highlight: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  accentColor: string;
  isActive: boolean;
  order: number;
}

const PromoBannerSchema = new Schema<IPromoBanner>({
  badge: { type: String, trim: true, maxlength: 80, default: 'Offres Exclusives' },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  highlight: { type: String, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 300 },
  buttonText: { type: String, required: true, trim: true, maxlength: 80, default: 'Profiter des offres' },
  buttonLink: { type: String, required: true, trim: true, default: '/boutique?onSale=true' },
  accentColor: { type: String, default: '#EF4444' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

PromoBannerSchema.index({ isActive: 1, order: 1 });

export default mongoose.model<IPromoBanner>('PromoBanner', PromoBannerSchema);
