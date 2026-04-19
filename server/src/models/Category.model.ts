import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: { url: string; publicId?: string };
  icon?: string;
  parent: mongoose.Types.ObjectId | null;
  level: number;
  order: number;
  isActive: boolean;
  productCount: number;
  seoTitle?: string;
  seoDescription?: string;
  metadata?: {
    filterOptions: Array<{ name: string; values: string[] }>;
  };
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, maxlength: 500 },
  image: {
    url: String,
    publicId: String,
  },
  icon: String,
  parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  level: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  productCount: { type: Number, default: 0 },
  seoTitle: String,
  seoDescription: String,
  metadata: {
    filterOptions: [{
      name: String,
      values: [String],
    }],
  },
}, { timestamps: true });

CategorySchema.index({ parent: 1, order: 1 });

export default mongoose.model<ICategory>('Category', CategorySchema);
