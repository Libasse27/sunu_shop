/**
 * order.service.ts — Couche service pour la gestion des commandes
 *
 * Délègue à pricing.service, inventory.service et coupon.service.
 * Ne contient plus de logique de calcul dupliquée.
 */

import Order, { IOrder } from '../models/Order.model';
import Product from '../models/Product.model';
import User from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { emailService } from './email.service';
import { getPagination, getPaginationResult } from '../utils/pagination';
import { pricingService } from './pricing.service';
import { inventoryService } from './inventory.service';
import { couponService } from './coupon.service';
import logger from '../utils/logger';
import mongoose from 'mongoose';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface CreateOrderInput {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  payment: { method: string };
  couponCode?: string;
  customerNote?: string;
  isGift?: boolean;
  giftMessage?: string;
}

interface PaginatedOrders {
  orders: IOrder[];
  pagination: ReturnType<typeof getPaginationResult>;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class OrderService {

  /**
   * Crée une commande :
   *   1. Valide le stock via inventoryService
   *   2. Valide et calcule le coupon via couponService
   *   3. Calcule les prix via pricingService
   *   4. Déduit le stock de façon atomique via inventoryService
   *   5. Persiste la commande (rollback stock si échec)
   *   6. Enregistre l'usage du coupon
   *   7. Envoie l'email de confirmation (non bloquant)
   */
  async createOrder(userId: string, input: CreateOrderInput): Promise<IOrder> {
    const { items, shippingAddress, payment, couponCode, customerNote, isGift, giftMessage } = input;

    if (!items?.length) throw ApiError.badRequest('Le panier est vide');

    // 1. Validation du stock
    const stockItems = items.map(i => ({ productId: String(i.product), quantity: i.quantity, variant: i.variant }));
    const stockCheck = await inventoryService.validateStock(stockItems);
    if (!stockCheck.valid) {
      const msg = stockCheck.errors.map(e => `${e.name} : ${e.requested} demandé(s), ${e.available} disponible(s)`).join(' | ');
      throw ApiError.badRequest(`Stock insuffisant — ${msg}`);
    }

    // 2. Récupération des produits en une seule requête (évite N+1)
    const productIds = items.map(i => String(i.product));
    const foundProducts = await Product.find({ _id: { $in: productIds } })
      .select('name price images isActive')
      .lean();
    const productMap = new Map(foundProducts.map(p => [String(p._id), p]));

    const productCache: Record<string, { name: string; price: number; images: Array<{ url: string }> }> = {};
    let preSubtotal = 0;
    for (const item of items) {
      const p = productMap.get(String(item.product));
      if (!p) throw ApiError.notFound(`Produit ${item.product} non trouvé`);
      if (!p.isActive) throw ApiError.badRequest(`Produit ${p.name} n'est plus disponible`);
      productCache[String(item.product)] = { name: p.name, price: p.price, images: p.images };
      preSubtotal += p.price * item.quantity;
    }

    // 3. Validation coupon
    let couponDiscount = 0;
    let appliedCoupon = null;
    let couponType: string | undefined;
    if (couponCode) {
      const couponResult = await couponService.validateCoupon(couponCode, userId, preSubtotal);
      if (couponResult.valid && couponResult.coupon) {
        couponDiscount = couponResult.discount;
        appliedCoupon  = couponResult.coupon;
        couponType     = appliedCoupon.type;
      }
    }

    // 4. Déduction stock atomique
    const deductResults = await inventoryService.deductStock(stockItems);

    // 5-6. Construction items + pricing + persistance — tout dans le même try/catch
    // pour garantir le rollback stock si n'importe quelle étape lève une erreur
    let order: IOrder;
    try {
      // Construire les items de commande depuis le cache
      const orderItems: IOrder['items'] = [];
      let subtotal = 0;
      for (const item of items) {
        const cached = productCache[String(item.product)];
        deductResults.find(d => d.productId === String(item.product));
        const itemSubtotal = cached.price * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
          product:  new mongoose.Types.ObjectId(String(item.product)),
          name:     cached.name,
          image:    cached.images[0]?.url || '',
          variant:  item.variant,
          price:    cached.price,
          quantity: item.quantity,
          subtotal: itemSubtotal,
        });
      }

      // Calcul des totaux via pricingService
      const pricing = pricingService.calculateOrderPricing(
        subtotal,
        couponDiscount,
        couponType,
        couponCode,
      );

      // Création de la commande
      order = await Order.create({
        user:     userId,
        items:    orderItems,
        shippingAddress,
        pricing,
        payment:  { method: payment.method, status: 'pending' },
        status:   'pending',
        statusHistory: [{ status: 'pending', date: new Date(), note: 'Commande créée' }],
        shipping: { method: 'standard' },
        customerNote,
        isGift,
        giftMessage,
      });
    } catch (err) {
      // Rollback du stock sur toute erreur survenue après deductStock
      await inventoryService.restoreStock(
        stockItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
      );
      throw err;
    }

    // 7. Enregistrement usage coupon
    if (appliedCoupon) {
      await couponService.recordUsage(appliedCoupon, userId);
    }

    // 8. Email de confirmation (non bloquant)
    this._sendConfirmationEmail(userId, order).catch(err =>
      logger.warn('Email confirmation non envoyé', { orderId: order._id, error: (err as Error).message }),
    );

    logger.info('Commande créée', { orderId: order._id, orderNumber: order.orderNumber });
    return order;
  }

  /**
   * Annule une commande et restitue le stock via inventoryService.
   * Révoque également l'usage du coupon si applicable.
   */
  async cancelOrder(orderId: string, userId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Commande non trouvée');

    if (order.user.toString() !== userId) throw ApiError.forbidden('Accès non autorisé');

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw ApiError.badRequest('Cette commande ne peut plus être annulée');
    }

    // Restitution du stock
    await inventoryService.restoreStock(
      order.items.map(i => ({ productId: String(i.product), quantity: i.quantity })),
    );

    // Révocation coupon
    if (order.pricing.couponCode) {
      await couponService.revokeUsage(order.pricing.couponCode, userId);
    }

    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', date: new Date(), note: 'Annulée par le client' });
    await order.save();

    logger.info('Commande annulée', { orderId: order._id, orderNumber: order.orderNumber });
    return order;
  }

  /**
   * Historique paginé des commandes d'un utilisateur.
   */
  async getUserOrders(userId: string, query: Record<string, unknown>): Promise<PaginatedOrders> {
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

  private async _sendConfirmationEmail(userId: string, order: IOrder): Promise<void> {
    const user = await User.findById(userId).select('email').lean();
    if (user?.email) {
      await emailService.sendOrderConfirmation(
        user.email,
        order.orderNumber,
        order.pricing.total,
        order.items,
      );
    }
  }
}

export const orderService = new OrderService();
