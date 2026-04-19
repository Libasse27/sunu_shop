/**
 * order.service.ts — Couche service pour la gestion des commandes
 *
 * Centralise la logique métier extraite du controller :
 *   - Validation du stock produit (atomique via findOneAndUpdate)
 *   - Application des coupons de réduction
 *   - Calcul des totaux (sous-total, livraison, remise, total)
 *   - Création de commande avec rollback stock si échec
 *   - Annulation de commande et restitution du stock
 *   - Pagination de l'historique commandes utilisateur
 */

import Order, { IOrder } from '../models/Order.model';
import Product from '../models/Product.model';
import Coupon, { ICoupon } from '../models/Coupon.model';
import User from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { sendEmail, emailTemplates } from '../utils/sendEmail';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../utils/constants';
import { getPagination, getPaginationResult } from '../utils/pagination';
import logger from '../utils/logger';
import mongoose from 'mongoose';

// ─── Types internes ────────────────────────────────────────────────────────────

interface OrderItem {
  product: string | mongoose.Types.ObjectId;
  quantity: number;
  variant?: { name: string; value: string };
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region?: string;
  country: string;
  postalCode?: string;
  instructions?: string;
}

interface PaymentInput {
  method: string;
}

interface CreateOrderInput {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  payment: PaymentInput;
  couponCode?: string;
  customerNote?: string;
  isGift?: boolean;
  giftMessage?: string;
}

interface PaginatedOrders {
  orders: IOrder[];
  pagination: ReturnType<typeof getPaginationResult>;
}

// ─── Helpers internes ─────────────────────────────────────────────────────────

/** Valide le stock disponible pour tous les items et retourne un cache produit. */
async function validateItemsStock(
  items: OrderItem[],
): Promise<{ preSubtotal: number; productCache: Record<string, { name: string; price: number; images: Array<{ url: string }> }> }> {
  let preSubtotal = 0;
  const productCache: Record<string, { name: string; price: number; images: Array<{ url: string }> }> = {};

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) throw ApiError.notFound(`Produit ${item.product} non trouvé`);
    if (product.stock < item.quantity) {
      throw ApiError.badRequest(`Stock insuffisant pour ${product.name}`);
    }
    preSubtotal += product.price * item.quantity;
    productCache[item.product.toString()] = {
      name:   product.name,
      price:  product.price,
      images: product.images,
    };
  }

  return { preSubtotal, productCache };
}

interface CouponResult {
  discount: number;
  appliedCoupon: ICoupon | null;
}

/** Valide et calcule la remise coupon si un code est fourni. */
async function validateCoupon(
  couponCode: string | undefined,
  userId: string,
  preSubtotal: number,
): Promise<CouponResult> {
  if (!couponCode) return { discount: 0, appliedCoupon: null };

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
  if (!coupon) return { discount: 0, appliedCoupon: null };

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) return { discount: 0, appliedCoupon: null };

  const userUsage  = coupon.usedBy.filter(u => u.user.toString() === userId).length;
  const notExhausted = !coupon.maxUsage || coupon.usedCount < coupon.maxUsage;

  if (!notExhausted || userUsage >= coupon.maxUsagePerUser || preSubtotal < coupon.minOrderAmount) {
    return { discount: 0, appliedCoupon: null };
  }

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = Math.round((preSubtotal * coupon.value) / 100);
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === 'fixed_amount') {
    discount = Math.min(coupon.value, preSubtotal);
  }

  return { discount, appliedCoupon: coupon };
}

/** Déduit le stock de manière atomique avec rollback automatique en cas d'erreur. */
async function deductStockAtomic(
  items: OrderItem[],
  productCache: Record<string, { name: string; price: number; images: Array<{ url: string }> }>,
): Promise<{ subtotal: number; orderItems: IOrder['items'] }> {
  let subtotal = 0;
  const orderItems: IOrder['items'] = [];
  const deducted: Array<{ id: string; qty: number }> = [];

  for (const item of items) {
    const product = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity, totalSold: item.quantity } },
      { new: true },
    );

    if (!product) {
      // Rollback des déductions précédentes
      await Promise.all(
        deducted.map(d =>
          Product.findByIdAndUpdate(d.id, { $inc: { stock: d.qty, totalSold: -d.qty } }),
        ),
      );
      throw ApiError.badRequest('Stock insuffisant pour un produit (concurrence)');
    }

    deducted.push({ id: item.product.toString(), qty: item.quantity });
    const cached = productCache[item.product.toString()];
    const itemSubtotal = cached.price * item.quantity;
    subtotal += itemSubtotal;

    orderItems.push({
      product:  product._id,
      name:     cached.name,
      image:    cached.images[0]?.url || '',
      variant:  item.variant,
      price:    cached.price,
      quantity: item.quantity,
      subtotal: itemSubtotal,
    });
  }

  return { subtotal, orderItems };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class OrderService {
  /**
   * Crée une commande après validation stock et coupon.
   * Décrémente le stock de façon atomique et envoie l'email de confirmation.
   *
   * @param userId - ID de l'utilisateur connecté
   * @param input  - Corps de la requête typé
   */
  async createOrder(userId: string, input: CreateOrderInput): Promise<IOrder> {
    const { items, shippingAddress, payment, couponCode, customerNote, isGift, giftMessage } = input;

    if (!items?.length) throw ApiError.badRequest('Le panier est vide');

    // 1. Validation du stock + cache produit
    const { preSubtotal, productCache } = await validateItemsStock(items);

    // 2. Validation coupon
    const { discount, appliedCoupon } = await validateCoupon(couponCode, userId, preSubtotal);

    // 3. Déduction stock atomique
    const { subtotal, orderItems } = await deductStockAtomic(items, productCache);

    // 4. Création de la commande (avec rollback stock si echec)
    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal + shippingCost - discount;

    let order: IOrder;
    try {
      order = await Order.create({
        user:     userId,
        items:    orderItems,
        shippingAddress,
        pricing:  { subtotal, shippingCost, tax: 0, discount, total },
        payment:  { method: payment.method, status: 'pending' },
        status:   'pending',
        statusHistory: [{ status: 'pending', date: new Date(), note: 'Commande créée' }],
        shipping: { method: 'standard' },
        customerNote,
        isGift,
        giftMessage,
      });
    } catch (err) {
      // Restitution du stock si la création de commande échoue
      await Promise.all(
        orderItems.map(i =>
          Product.findByIdAndUpdate(i.product, { $inc: { stock: i.quantity, totalSold: -i.quantity } }),
        ),
      );
      throw err;
    }

    // 5. Mise à jour du coupon (post-création — non bloquant pour la transaction)
    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      appliedCoupon.usedBy.push({ user: new mongoose.Types.ObjectId(userId), date: new Date() });
      await appliedCoupon.save();
    }

    // 6. Email de confirmation (non bloquant)
    this._sendConfirmationEmail(userId, order).catch(err =>
      logger.warn('Email de confirmation non envoyé', { orderId: order._id, error: (err as Error).message }),
    );

    logger.info('Commande créée', { orderId: order._id, orderNumber: order.orderNumber, total });
    return order;
  }

  /**
   * Annule une commande et restitue le stock.
   * Un client ne peut annuler que ses propres commandes en statut pending/confirmed.
   *
   * @param orderId - ID de la commande
   * @param userId  - ID de l'utilisateur demandant l'annulation
   */
  async cancelOrder(orderId: string, userId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Commande non trouvée');

    if (order.user.toString() !== userId) {
      throw ApiError.forbidden('Accès non autorisé');
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw ApiError.badRequest('Cette commande ne peut plus être annulée');
    }

    // Restitution du stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, totalSold: -item.quantity },
      });
    }

    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', date: new Date(), note: 'Annulée par le client' });
    await order.save();

    logger.info('Commande annulée', { orderId: order._id, orderNumber: order.orderNumber });
    return order;
  }

  /**
   * Récupère les commandes paginées d'un utilisateur.
   *
   * @param userId  - ID de l'utilisateur
   * @param query   - Query string Express (page, limit)
   */
  async getUserOrders(
    userId: string,
    query: Record<string, unknown>,
  ): Promise<PaginatedOrders> {
    const { page, limit } = getPagination(query);
    const filter = { user: userId };

    const total  = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<IOrder[]>();

    return { orders, pagination: getPaginationResult(total, { page, limit }) };
  }

  /** Envoie l'email de confirmation — méthode interne non bloquante. */
  private async _sendConfirmationEmail(userId: string, order: IOrder): Promise<void> {
    const user = await User.findById(userId);
    if (user?.email) {
      const template = emailTemplates.orderConfirmation(
        order.orderNumber,
        order.pricing.total,
        order.items,
      );
      await sendEmail({ to: user.email, ...template });
    }
  }
}

export const orderService = new OrderService();
