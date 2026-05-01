import mongoose, { Schema, Document } from 'mongoose';
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '@shared/constants/orderStatus';

export interface IOrder extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: Array<{
    product: mongoose.Types.ObjectId;
    name: string;
    image: string;
    variant?: { name: string; value: string };
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    region?: string;
    country: string;
    postalCode?: string;
    instructions?: string;
  };
  pricing: {
    subtotal: number;
    shippingCost: number;
    tax: number;
    discount: number;
    couponCode?: string;
    total: number;
  };
  payment: {
    method: string;
    status: string;
    transactionId?: string;
    paidAt?: Date;
    metadata?: any;
  };
  status: string;
  statusHistory: Array<{
    status: string;
    date: Date;
    note?: string;
    updatedBy?: mongoose.Types.ObjectId;
  }>;
  shipping: {
    method: string;
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: Date;
    deliveredAt?: Date;
  };
  notes?: string;
  customerNote?: string;
  isGift: boolean;
  giftMessage?: string;
  currency: string;
}

const OrderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    image: String,
    variant: { name: String, value: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  }],
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    region: String,
    country: { type: String, default: 'Sénégal' },
    postalCode: String,
    instructions: String,
  },
  pricing: {
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: String,
    total: { type: Number, required: true },
  },
  payment: {
    method: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },
    transactionId: String,
    paidAt: Date,
    metadata: Schema.Types.Mixed,
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING,
    index: true,
  },
  statusHistory: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  }],
  shipping: {
    method: { type: String, enum: ['standard', 'express', 'pickup'], default: 'standard' },
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
  },
  notes: String,
  customerNote: String,
  isGift: { type: Boolean, default: false },
  giftMessage: String,
  currency: { type: String, default: 'XOF' },
}, { timestamps: true });

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ user: 1, status: 1, createdAt: -1 });     // filtre mes commandes par statut
OrderSchema.index({ 'payment.status': 1 });
OrderSchema.index({ 'payment.method': 1, createdAt: -1 });    // analytics par méthode de paiement
OrderSchema.index({ 'payment.status': 1, createdAt: -1 }); // analytics paiement + date

OrderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    this.orderNumber = `ORD-${dateStr}-${random}`;
  }
  next();
});

export default mongoose.model<IOrder>('Order', OrderSchema);
