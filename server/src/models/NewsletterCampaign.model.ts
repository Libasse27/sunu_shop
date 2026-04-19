import mongoose, { Schema, Document } from 'mongoose';

export interface INewsletterCampaign extends Document {
  subject: string;
  body: string;
  recipientCount: number;
  status: 'sent' | 'failed';
  sentBy: mongoose.Types.ObjectId;
  sentAt: Date;
  errorMessage?: string;
}

const NewsletterCampaignSchema = new Schema<INewsletterCampaign>({
  subject: { type: String, required: true },
  body: { type: String, required: true },
  recipientCount: { type: Number, default: 0 },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sentAt: { type: Date, default: Date.now },
  errorMessage: { type: String },
}, { timestamps: true });

NewsletterCampaignSchema.index({ sentAt: -1 });

export default mongoose.model<INewsletterCampaign>('NewsletterCampaign', NewsletterCampaignSchema);
