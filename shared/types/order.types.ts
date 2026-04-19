export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'stripe' | 'paypal' | 'orange_money' | 'wave' | 'free_money' | 'cash_on_delivery';
export type ShippingMethod = 'standard' | 'express' | 'pickup';

export interface IOrderItem {
  product: string;
  name: string;
  image: string;
  variant?: { name: string; value: string };
  price: number;
  quantity: number;
  subtotal: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region?: string;
  country: string;
  postalCode?: string;
  instructions?: string;
}

export interface IOrderPricing {
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  couponCode?: string;
  total: number;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  user: string;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  pricing: IOrderPricing;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
    paidAt?: string;
  };
  status: OrderStatus;
  statusHistory: Array<{
    status: string;
    date: string;
    note?: string;
  }>;
  shipping: {
    method: ShippingMethod;
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
    deliveredAt?: string;
  };
  notes?: string;
  customerNote?: string;
  isGift: boolean;
  giftMessage?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}
