import mongoose, { Schema, Document } from 'mongoose';
import { createSlug } from '../utils/slugify';

export interface IService extends Document {
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: string;
  startingPrice: number;
  currency: string;
  estimatedDuration?: string;
  image?: string;
  isAvailable: boolean;
  order: number;
  whatsappMessage?: string;
  features: string[];
}

const ServiceSchema = new Schema<IService>({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true, maxlength: 3000 },
  shortDescription: { type: String, maxlength: 300 },
  category: { type: String, required: true, trim: true },
  startingPrice: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'XOF' },
  estimatedDuration: { type: String },
  image: { type: String },
  isAvailable: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  whatsappMessage: { type: String },
  features: [{ type: String }],
}, { timestamps: true });

ServiceSchema.index({ isAvailable: 1, order: 1 });
ServiceSchema.index({ category: 1 });

ServiceSchema.pre('validate', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = createSlug(this.title);
  }
  next();
});

export default mongoose.model<IService>('Service', ServiceSchema);
