import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  text: string;
  link?: string;
  linkLabel?: string;
  image?: string;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  order: number;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  text: { type: String, required: false, default: '', trim: true, maxlength: 300 },
  link: { type: String, trim: true },
  linkLabel: { type: String, trim: true, maxlength: 60 },
  image: { type: String },
  bgColor: { type: String, default: '#1E293B' },
  textColor: { type: String, default: '#ffffff' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

AnnouncementSchema.index({ isActive: 1, order: 1 });

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
