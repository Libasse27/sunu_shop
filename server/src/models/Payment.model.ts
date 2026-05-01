import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  method: string;
  amount: number;
  currency: string;
  status: string;
  transactionId?: string;
  providerResponse?: any;
  phoneNumber?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
  metadata?: any;
}

const PaymentSchema = new Schema<IPayment>({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  method: { type: String, enum: ['stripe', 'paypal', 'orange_money', 'wave', 'free_money', 'cash_on_delivery'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'XOF' },
  status: { type: String, enum: ['initiated', 'pending', 'completed', 'failed', 'cancelled', 'refunded'], default: 'initiated' },
  transactionId: String,
  providerResponse: Schema.Types.Mixed,
  phoneNumber: String,
  refundAmount: Number,
  refundReason: String,
  refundedAt: Date,
  metadata: Schema.Types.Mixed,
}, { timestamps: true });

PaymentSchema.index({ order: 1 });
PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ transactionId: 1 }, { sparse: true }); // webhook callbacks: findOne({ transactionId })

export default mongoose.model<IPayment>('Payment', PaymentSchema);
