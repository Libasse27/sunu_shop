import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  rating: number;
  title?: string;
  comment: string;
  images: Array<{ url: string; publicId?: string }>;
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  isApproved: boolean; // conservé pour compatibilité ascendante avec getProductReviews
  helpfulCount: number;
  reportCount: number;
  adminReply?: { text: string; date: Date };
}

const ReviewSchema = new Schema<IReview>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, maxlength: 100 },
  comment: { type: String, required: true, maxlength: 2000 },
  images: [{ url: String, publicId: String }],
  isVerifiedPurchase: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  isApproved: { type: Boolean, default: false }, // dérivé de status — ne jamais écrire directement
  helpfulCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  adminReply: {
    text: String,
    date: Date,
  },
}, { timestamps: true });

ReviewSchema.index({ product: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });
ReviewSchema.index({ status: 1, product: 1 });                        // avis par statut et produit
ReviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });    // agrégation rating approuvé

// Maintient isApproved en phase avec status — source de vérité unique
ReviewSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.isApproved = this.status === 'approved';
  }
  next();
});

export default mongoose.model<IReview>('Review', ReviewSchema);
