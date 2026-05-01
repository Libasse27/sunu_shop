import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: 'order_status' | 'payment' | 'promotion' | 'system' | 'review';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['order_status', 'payment', 'promotion', 'system', 'review'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: Schema.Types.Mixed,
  isRead: { type: Boolean, default: false, index: true },
  readAt: Date,
}, { timestamps: true });

NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ user: 1, createdAt: -1 }); // timeline des notifs d'un utilisateur

export default mongoose.model<INotification>('Notification', NotificationSchema);
