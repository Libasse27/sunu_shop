import { Request, Response } from 'express';
import { buildSearchRegex } from '../utils/regex.utils';
import Order, { IOrder } from '../models/Order.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { getPagination, getPaginationResult } from '../utils/pagination';
import { orderService } from '../services/order.service';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createOrder(String(req.user!._id), req.body);
  ApiResponse.created(res, order, 'Commande créée avec succès');
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const { orders, pagination } = await orderService.getUserOrders(String(req.user!._id), req.query);
  ApiResponse.paginated(res, orders, pagination);
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'supplier sku')
    .lean<IOrder>();

  if (!order) throw ApiError.notFound('Commande non trouvée');

  if (req.user!.role === 'client' && order.user.toString() !== req.user!._id.toString()) {
    throw ApiError.forbidden('Accès non autorisé');
  }

  ApiResponse.success(res, order);
});

export const trackOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber })
    .select('orderNumber status statusHistory shipping shippingAddress pricing items createdAt');

  if (!order) throw ApiError.notFound('Commande non trouvée');
  ApiResponse.success(res, order);
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.cancelOrder(req.params.id, String(req.user!._id));
  ApiResponse.success(res, order, 'Commande annulée');
});

// Admin
export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req.query);
  const { status, paymentStatus, paymentMethod, search, startDate, endDate } = req.query;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (paymentStatus) filter['payment.status'] = paymentStatus;
  if (paymentMethod) filter['payment.method'] = paymentMethod;
  if (search) filter.orderNumber = buildSearchRegex(search as string);
  if (startDate || endDate) {
    const dateRange: { $gte?: Date; $lte?: Date } = {};
    if (startDate) dateRange.$gte = new Date(startDate as string);
    if (endDate)   dateRange.$lte = new Date(endDate as string);
    filter.createdAt = dateRange;
  }

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'supplier sku')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean<IOrder[]>();

  ApiResponse.paginated(res, orders, getPaginationResult(total, { page, limit }));
});

/**
 * Exporte les commandes au format CSV (admin uniquement).
 * Paramètres optionnels : startDate, endDate, status.
 * Génère un fichier avec BOM UTF-8 pour une compatibilité Excel correcte.
 */
export const exportOrdersCSV = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, status } = req.query;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) (filter.createdAt as Record<string, unknown>).$gte = new Date(startDate as string);
    if (endDate) (filter.createdAt as Record<string, unknown>).$lte = new Date(endDate as string);
  }

  const orders = await Order.find(filter)
    .select('orderNumber status createdAt pricing.total payment.method payment.status user')
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .lean();

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Dakar',
    });

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('fr-SN', { style: 'decimal' }).format(amount) + ' FCFA';

  const escapeCsvField = (value: string) => `"${String(value).replace(/"/g, '""')}"`;

  const headers = [
    'N° Commande',
    'Date',
    'Client',
    'Email',
    'Total',
    'Méthode paiement',
    'Statut paiement',
    'Statut commande',
  ].map(escapeCsvField).join(';');

  const rows = orders.map((order) => {
    const user = order.user as any;
    const clientName = user ? `${user.firstName} ${user.lastName}` : 'Inconnu';
    const clientEmail = user?.email ?? '';

    return [
      order.orderNumber,
      formatDate((order as any).createdAt),
      clientName,
      clientEmail,
      formatPrice(order.pricing.total),
      order.payment.method,
      order.payment.status,
      order.status,
    ].map(escapeCsvField).join(';');
  });

  const today = new Date().toISOString().slice(0, 10);
  const csvContent = '\uFEFF' + [headers, ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=commandes-${today}.csv`);
  res.status(200).send(csvContent);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Commande non trouvée');

  order.status = status;
  order.statusHistory.push({ status, date: new Date(), note, updatedBy: req.user!._id });

  if (status === 'delivered') {
    order.shipping.deliveredAt = new Date();
  }

  await order.save();
  ApiResponse.success(res, order, 'Statut mis à jour');
});

export const updateOrderTracking = asyncHandler(async (req: Request, res: Response) => {
  const { trackingNumber, carrier } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { $set: { 'shipping.trackingNumber': trackingNumber, ...(carrier ? { 'shipping.carrier': carrier } : {}) } },
    { new: true },
  );
  if (!order) throw ApiError.notFound('Commande non trouvée');
  ApiResponse.success(res, order, 'Numéro de suivi mis à jour');
});

export const updateOrderNotes = asyncHandler(async (req: Request, res: Response) => {
  const { adminNote } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { $set: { notes: adminNote } },
    { new: true },
  );
  if (!order) throw ApiError.notFound('Commande non trouvée');
  ApiResponse.success(res, order, 'Note enregistrée');
});
