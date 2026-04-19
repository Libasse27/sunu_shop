import { Request, Response } from 'express';
import Order from '../models/Order.model';
import User from '../models/User.model';
import Product from '../models/Product.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [currentMonthOrders, lastMonthOrders, totalCustomers, lastMonthCustomers] = await Promise.all([
    Order.find({ createdAt: { $gte: startOfMonth }, 'payment.status': 'completed' }),
    Order.find({ createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }, 'payment.status': 'completed' }),
    User.countDocuments({ role: 'client' }),
    User.countDocuments({ role: 'client', createdAt: { $lt: startOfMonth } }),
  ]);

  const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + o.pricing.total, 0);
  const lastRevenue = lastMonthOrders.reduce((sum, o) => sum + o.pricing.total, 0);
  const revenueChange = lastRevenue ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100) : 100;
  const ordersChange = lastMonthOrders.length ? Math.round(((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100) : 100;
  const customersChange = lastMonthCustomers ? Math.round(((totalCustomers - lastMonthCustomers) / lastMonthCustomers) * 100) : 100;
  const avgOrder = currentMonthOrders.length ? Math.round(currentRevenue / currentMonthOrders.length) : 0;

  ApiResponse.success(res, {
    revenue: { value: currentRevenue, change: revenueChange },
    orders: { value: currentMonthOrders.length, change: ordersChange },
    customers: { value: totalCustomers, change: customersChange },
    avgOrder: { value: avgOrder },
  });
});

export const getSalesData = asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const sales = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, 'payment.status': 'completed' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$pricing.total' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  ApiResponse.success(res, sales);
});

export const getTopProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find({ isActive: true })
    .sort({ totalSold: -1 })
    .limit(10)
    .select('name slug totalSold price images');

  ApiResponse.success(res, products);
});

export const getLowStockProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find({
    isActive: true,
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
  }).select('name sku stock lowStockThreshold images');

  ApiResponse.success(res, products);
});

export const getOrderStatusDistribution = asyncHandler(async (_req: Request, res: Response) => {
  const distribution = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  ApiResponse.success(res, distribution);
});

export const getPaymentMethodDistribution = asyncHandler(async (_req: Request, res: Response) => {
  const distribution = await Order.aggregate([
    { $match: { 'payment.status': 'completed' } },
    { $group: { _id: '$payment.method', count: { $sum: 1 }, total: { $sum: '$pricing.total' } } },
  ]);
  ApiResponse.success(res, distribution);
});

/**
 * Retourne les 10 dernières activités : 5 dernières commandes + 5 derniers clients,
 * triés par date décroissante.
 */
export const getRecentActivity = asyncHandler(async (_req: Request, res: Response) => {
  const [recentOrders, recentUsers] = await Promise.all([
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName email')
      .select('orderNumber status pricing.total createdAt user')
      .lean(),
    User.find({ role: 'client' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email createdAt')
      .lean(),
  ]);

  const orderActivities = recentOrders.map((o) => ({
    type: 'order' as const,
    data: o,
    createdAt: (o as any).createdAt,
  }));

  const userActivities = recentUsers.map((u) => ({
    type: 'user' as const,
    data: u,
    createdAt: (u as any).createdAt,
  }));

  const activities = [...orderActivities, ...userActivities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  ApiResponse.success(res, activities);
});

/**
 * Retourne les statistiques étendues pour le dashboard admin :
 * CA all-time, commandes en attente, commandes livrées aujourd'hui,
 * nouveaux clients cette semaine, produits en rupture, avis en attente.
 */
export const getRevenueSummary = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [
    totalRevenueResult,
    pendingOrdersCount,
    completedOrdersToday,
    newUsersThisWeek,
    productsOutOfStock,
    pendingReviewsCount,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { 'payment.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: 'delivered', 'shipping.deliveredAt': { $gte: startOfToday } }),
    User.countDocuments({ role: 'client', createdAt: { $gte: startOfWeek } }),
    Product.countDocuments({ isActive: true, stock: 0 }),
    // Modèle Review — importé dynamiquement pour éviter une dépendance circulaire
    (await import('../models/Review.model')).default.countDocuments({ status: 'pending' }),
  ]);

  ApiResponse.success(res, {
    totalRevenueAllTime: totalRevenueResult[0]?.total ?? 0,
    pendingOrdersCount,
    completedOrdersToday,
    newUsersThisWeek,
    productsOutOfStock,
    pendingReviewsCount,
  });
});

/**
 * Retourne le CA par catégorie de produit sur les 30 derniers jours,
 * limité aux 8 premières catégories par CA décroissant.
 */
export const getRevenueByCategory = asyncHandler(async (_req: Request, res: Response) => {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const result = await Order.aggregate([
    {
      $match: {
        'payment.status': 'completed',
        createdAt: { $gte: since },
      },
    },
    // Décomposer les items de la commande
    { $unwind: '$items' },
    // Joindre avec la collection products pour récupérer la catégorie
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productDoc',
      },
    },
    { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: false } },
    // Joindre avec la collection categories pour récupérer le nom
    {
      $lookup: {
        from: 'categories',
        localField: 'productDoc.category',
        foreignField: '_id',
        as: 'categoryDoc',
      },
    },
    { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: false } },
    // Grouper par catégorie
    {
      $group: {
        _id: '$categoryDoc._id',
        name: { $first: '$categoryDoc.name' },
        slug: { $first: '$categoryDoc.slug' },
        total: { $sum: '$items.subtotal' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 8 },
  ]);

  ApiResponse.success(res, result);
});
