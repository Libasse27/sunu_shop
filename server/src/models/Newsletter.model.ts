import mongoose, { Schema, Document } from 'mongoose';

export interface INewsletter extends Document {
  email: string;
  isActive: boolean;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  unsubscribeToken: string;
}

const NewsletterSchema = new Schema<INewsletter>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  isActive: { type: Boolean, default: true },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: { type: Date },
  unsubscribeToken: { type: String, unique: true, sparse: true },
}, { timestamps: true });

NewsletterSchema.index({ isActive: 1, subscribedAt: -1 });

export default mongoose.model<INewsletter>('Newsletter', NewsletterSchema);
