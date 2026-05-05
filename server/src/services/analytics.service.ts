/**
 * analytics.service.ts — Couche service pour tous les calculs analytiques
 *
 * Centralise toutes les agrégations MongoDB pour le dashboard admin :
 *   - KPIs du mois (CA, commandes, clients, panier moyen)
 *   - Évolution des ventes sur N jours avec résumé période
 *   - Revenus par catégorie avec parts de marché
 *   - Top produits vendus
 *   - Top clients par CA
 *   - Distribution des statuts de commande
 *   - Distribution des modes de paiement
 *   - Activité récente (timeline)
 *   - Alertes stock
 *   - Résumé global all-time
 */

import Order from '../models/Order.model';
import User from '../models/User.model';
import Product from '../models/Product.model';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardKPIs {
  revenue:   { value: number; change: number };
  orders:    { value: number; change: number };
  customers: { value: number; change: number };
  products:  { value: number; change: number };
  avgOrder:  { value: number };
}

export interface SalesPoint {
  date:    string;
  revenue: number;
  orders:  number;
}

export interface SalesData {
  points:  SalesPoint[];
  summary: {
    totalRevenue:   number;
    totalOrders:    number;
    avgOrder:       number;
    revenueGrowth:  number | null;
    ordersGrowth:   number | null;
    prevRevenue:    number;
    prevOrders:     number;
  };
}

export interface CategoryRevenueItem {
  _id:            string;
  category:       string;
  slug:           string;
  revenue:        number;
  orders:         number;
  ordersCount:    number;
  avgOrderValue:  number;
  share:          number; // % du CA total
}

export interface CategoryRevenueData {
  categories:    CategoryRevenueItem[];
  totalRevenue:  number;
}

export interface TopProductItem {
  _id:      string;
  name:     string;
  slug:     string;
  price:    number;
  totalSold: number;
  revenue:  number;
  images:   Array<{ url: string }>;
}

export interface TopCustomerItem {
  _id:            string;
  firstName:      string;
  lastName:       string;
  email:          string;
  totalSpent:     number;
  orderCount:     number;
  avgOrderValue:  number;
  lastOrderDate:  Date;
}

export interface ActivityItem {
  type:      'order' | 'user';
  data:      Record<string, unknown>;
  createdAt: Date;
}

export interface RevenueSummary {
  totalRevenueAllTime:  number;
  pendingOrdersCount:   number;
  completedOrdersToday: number;
  newUsersThisWeek:     number;
  productsOutOfStock:   number;
  pendingReviewsCount:  number;
  avgOrderAllTime:      number;
  totalOrdersAllTime:   number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class AnalyticsService {

  // ── KPIs Dashboard ───────────────────────────────────────────────────────

  /**
   * KPIs du mois en cours vs mois précédent.
   * Retourne le CA, nb commandes, nb clients, produits actifs et panier moyen.
   */
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const now = new Date();
    const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [currentOrders, lastOrders, totalCustomers, lastMonthCustomers, totalActiveProducts] =
      await Promise.all([
        Order.find({ createdAt: { $gte: startOfMonth }, 'payment.status': 'completed' }).lean(),
        Order.find({ createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }, 'payment.status': 'completed' }).lean(),
        User.countDocuments({ role: 'client' }),
        User.countDocuments({ role: 'client', createdAt: { $lt: startOfMonth } }),
        Product.countDocuments({ isActive: true }),
      ]);

    const curRevenue = currentOrders.reduce((s, o) => s + o.pricing.total, 0);
    const prevRevenue = lastOrders.reduce((s, o) => s + o.pricing.total, 0);

    const revenueChange   = prevRevenue ? Math.round(((curRevenue - prevRevenue) / prevRevenue) * 100) : 100;
    const ordersChange    = lastOrders.length ? Math.round(((currentOrders.length - lastOrders.length) / lastOrders.length) * 100) : 100;
    const customersChange = lastMonthCustomers ? Math.round(((totalCustomers - lastMonthCustomers) / lastMonthCustomers) * 100) : 100;
    const avgOrder        = currentOrders.length ? Math.round(curRevenue / currentOrders.length) : 0;

    return {
      revenue:   { value: curRevenue,           change: revenueChange },
      orders:    { value: currentOrders.length, change: ordersChange },
      customers: { value: totalCustomers,       change: customersChange },
      products:  { value: totalActiveProducts,  change: 0 },
      avgOrder:  { value: avgOrder },
    };
  }

  // ── Données de ventes ─────────────────────────────────────────────────────

  /**
   * Évolution des ventes sur N jours avec comparaison période précédente.
   *
   * @param days - Nombre de jours (7, 14, 30, 90)
   */
  async getSalesData(days: number): Promise<SalesData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - days);

    const [points, curAgg, prevAgg] = await Promise.all([
      // Points quotidiens pour le graphe
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, 'payment.status': 'completed' } },
        {
          $group: {
            _id:     { $dateToString: { format: '%d/%m', date: '$createdAt' } },
            revenue: { $sum: '$pricing.total' },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', revenue: 1, orders: 1 } },
      ]),
      // Totaux période courante
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
      ]),
      // Totaux période précédente
      Order.aggregate([
        { $match: { createdAt: { $gte: prevStart, $lt: startDate }, 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
      ]),
    ]);

    const cur  = curAgg[0]  ?? { total: 0, count: 0 };
    const prev = prevAgg[0] ?? { total: 0, count: 0 };

    const revenueGrowth = prev.total ? Math.round(((cur.total - prev.total) / prev.total) * 100) : null;
    const ordersGrowth  = prev.count ? Math.round(((cur.count - prev.count) / prev.count) * 100) : null;

    return {
      points,
      summary: {
        totalRevenue:  cur.total,
        totalOrders:   cur.count,
        avgOrder:      cur.count ? Math.round(cur.total / cur.count) : 0,
        revenueGrowth,
        ordersGrowth,
        prevRevenue:   prev.total,
        prevOrders:    prev.count,
      },
    };
  }

  // ── CA par catégorie ──────────────────────────────────────────────────────

  /**
   * CA réalisé par catégorie de produit sur N jours.
   * Inclut part de marché, nombre de commandes distinctes, panier moyen.
   *
   * @param days - Fenêtre temporelle en jours
   */
  async getRevenueByCategory(days: number): Promise<CategoryRevenueData> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const result = await Order.aggregate([
      { $match: { 'payment.status': 'completed', createdAt: { $gte: since } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDoc',
        },
      },
      { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDoc.category',
          foreignField: '_id',
          as: 'categoryDoc',
        },
      },
      { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id:          '$categoryDoc._id',
          category:     { $first: '$categoryDoc.name' },
          slug:         { $first: '$categoryDoc.slug' },
          revenue:      { $sum: '$items.subtotal' },
          orders:       { $sum: 1 },
          uniqueOrders: { $addToSet: '$_id' },
        },
      },
      {
        $addFields: {
          ordersCount:   { $size: '$uniqueOrders' },
          avgOrderValue: {
            $cond: [{ $gt: ['$orders', 0] }, { $divide: ['$revenue', '$orders'] }, 0],
          },
        },
      },
      { $project: { uniqueOrders: 0 } },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]);

    const totalRevenue = result.reduce((s, r) => s + r.revenue, 0);

    const categories: CategoryRevenueItem[] = result.map(r => ({
      _id:           String(r._id),
      category:      r.category,
      slug:          r.slug ?? '',
      revenue:       r.revenue,
      orders:        r.orders,
      ordersCount:   r.ordersCount,
      avgOrderValue: Math.round(r.avgOrderValue),
      share:         totalRevenue ? Math.round((r.revenue / totalRevenue) * 100) : 0,
    }));

    return { categories, totalRevenue };
  }

  // ── Top produits ──────────────────────────────────────────────────────────

  /**
   * Produits les plus vendus (par quantité), avec CA généré.
   */
  async getTopProducts(limit = 10): Promise<TopProductItem[]> {
    // Top par totalSold (compteur maintenu à chaque commande)
    const products = await Product.find({ isActive: true })
      .sort({ totalSold: -1 })
      .limit(limit)
      .select('name slug totalSold price images')
      .lean();

    return products.map(p => ({
      _id:       String(p._id),
      name:      p.name,
      slug:      p.slug,
      price:     p.price,
      totalSold: p.totalSold ?? 0,
      revenue:   (p.totalSold ?? 0) * p.price,
      images:    p.images ?? [],
    }));
  }

  // ── Top clients ───────────────────────────────────────────────────────────

  /**
   * Clients générant le plus de CA (commandes payées all-time).
   */
  async getTopCustomers(limit = 10): Promise<TopCustomerItem[]> {
    const result = await Order.aggregate([
      { $match: { 'payment.status': 'completed' } },
      {
        $group: {
          _id:           '$user',
          totalSpent:    { $sum: '$pricing.total' },
          orderCount:    { $sum: 1 },
          lastOrderDate: { $max: '$createdAt' },
          avgOrderValue: { $avg: '$pricing.total' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDoc',
        },
      },
      { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          totalSpent:    1,
          orderCount:    1,
          lastOrderDate: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 0] },
          firstName:     { $ifNull: ['$userDoc.firstName', 'Client'] },
          lastName:      { $ifNull: ['$userDoc.lastName', 'supprimé'] },
          email:         { $ifNull: ['$userDoc.email', '—'] },
        },
      },
    ]);

    return result.map(r => ({
      _id:           String(r._id),
      firstName:     r.firstName,
      lastName:      r.lastName,
      email:         r.email,
      totalSpent:    r.totalSpent,
      orderCount:    r.orderCount,
      avgOrderValue: r.avgOrderValue,
      lastOrderDate: r.lastOrderDate,
    }));
  }

  // ── Distributions ─────────────────────────────────────────────────────────

  /**
   * Distribution des statuts de commande → objet {status: count}.
   */
  async getOrderStatusDistribution(): Promise<Record<string, number>> {
    const rows = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const distribution: Record<string, number> = {};
    rows.forEach(r => { distribution[r._id] = r.count; });
    return distribution;
  }

  /**
   * Distribution des modes de paiement (commandes complétées).
   */
  async getPaymentMethodDistribution(): Promise<Array<{ method: string; count: number; total: number }>> {
    const rows = await Order.aggregate([
      { $match: { 'payment.status': 'completed' } },
      {
        $group: {
          _id:   '$payment.method',
          count: { $sum: 1 },
          total: { $sum: '$pricing.total' },
        },
      },
      { $sort: { total: -1 } },
    ]);
    return rows.map(r => ({ method: r._id, count: r.count, total: r.total }));
  }

  // ── Activité récente ──────────────────────────────────────────────────────

  /**
   * Timeline combinant les 5 dernières commandes + 5 derniers clients.
   * Triée par date décroissante.
   */
  async getRecentActivity(): Promise<ActivityItem[]> {
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

    const activities: ActivityItem[] = [
      ...recentOrders.map(o => ({ type: 'order' as const, data: o as unknown as Record<string, unknown>, createdAt: (o as any).createdAt })),
      ...recentUsers.map(u  => ({ type: 'user'  as const, data: u as unknown as Record<string, unknown>, createdAt: (u as any).createdAt })),
    ];

    return activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ── Résumé global ─────────────────────────────────────────────────────────

  /**
   * Métriques all-time pour le dashboard étendu.
   */
  async getRevenueSummary(): Promise<RevenueSummary> {
    const now        = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startWeek  = new Date(now);
    startWeek.setDate(now.getDate() - 7);

    const [
      totalRevenueAgg,
      avgOrderAgg,
      pendingOrders,
      deliveredToday,
      newUsers,
      outOfStock,
      pendingReviews,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { 'payment.status': 'completed' } },
        { $group: { _id: null, avg: { $avg: '$pricing.total' } } },
      ]),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered', 'shipping.deliveredAt': { $gte: startToday } }),
      User.countDocuments({ role: 'client', createdAt: { $gte: startWeek } }),
      Product.countDocuments({ isActive: true, stock: 0 }),
      (await import('../models/Review.model')).default.countDocuments({ status: 'pending' }),
    ]);

    const t = totalRevenueAgg[0] ?? { total: 0, count: 0 };

    return {
      totalRevenueAllTime:  t.total,
      totalOrdersAllTime:   t.count,
      avgOrderAllTime:      Math.round(avgOrderAgg[0]?.avg ?? 0),
      pendingOrdersCount:   pendingOrders,
      completedOrdersToday: deliveredToday,
      newUsersThisWeek:     newUsers,
      productsOutOfStock:   outOfStock,
      pendingReviewsCount:  pendingReviews,
    };
  }

  // ── Produits stock faible ─────────────────────────────────────────────────

  /**
   * Produits actifs dont le stock ≤ seuil d'alerte.
   */
  async getLowStockProducts(): Promise<Array<{ _id: string; name: string; sku: string; stock: number }>> {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .select('name sku stock')
      .sort({ stock: 1 })
      .limit(20)
      .lean();

    return products.map(p => ({ _id: String(p._id), name: p.name, sku: p.sku, stock: p.stock }));
  }

  // ── Métriques avancées ────────────────────────────────────────────────────

  /**
   * Ventilation du CA par fenêtre temporelle + mensuel pour l'année en cours.
   * Retourne : today, week, month (+ croissance vs mois précédent), year, allTime, panier moyen.
   * + tableau de 12 mois pour l'année courante et l'année précédente.
   */
  async getRevenueBreakdown(): Promise<{
    today:        number;
    week:         number;
    month:        number;
    monthGrowth:  number | null;
    year:         number;
    allTime:      number;
    avgOrder:     number;
    totalOrders:  number;
    monthly:      Array<{ month: number; label: string; current: number; prev: number }>;
  }> {
    const now        = new Date();
    const y          = now.getFullYear();
    const m          = now.getMonth();

    const startToday    = new Date(y, m, now.getDate());
    const startWeek     = new Date(now); startWeek.setDate(now.getDate() - 7);
    const startMonth    = new Date(y, m, 1);
    const startPrevMonth = new Date(y, m - 1, 1);
    const endPrevMonth   = new Date(y, m, 1);
    const startYear     = new Date(y, 0, 1);
    const startPrevYear = new Date(y - 1, 0, 1);
    const endPrevYear   = new Date(y, 0, 1);

    const match = (from: Date, to?: Date) => ({
      'payment.status': 'completed',
      createdAt: to ? { $gte: from, $lt: to } : { $gte: from },
    });

    const sum = (agg: Array<{ total: number }>) => agg[0]?.total ?? 0;

    const [todayAgg, weekAgg, monthAgg, prevMonthAgg, yearAgg, allAgg, avgAgg, monthlyCurrentAgg, monthlyPrevAgg] =
      await Promise.all([
        Order.aggregate([{ $match: match(startToday) }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
        Order.aggregate([{ $match: match(startWeek)  }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
        Order.aggregate([{ $match: match(startMonth) }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
        Order.aggregate([{ $match: match(startPrevMonth, endPrevMonth) }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
        Order.aggregate([{ $match: match(startYear)  }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
        Order.aggregate([{ $match: { 'payment.status': 'completed' } }, { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } }]),
        Order.aggregate([{ $match: { 'payment.status': 'completed' } }, { $group: { _id: null, avg: { $avg: '$pricing.total' } } }]),
        // Mensuel année courante
        Order.aggregate([
          { $match: { 'payment.status': 'completed', createdAt: { $gte: startYear } } },
          { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$pricing.total' } } },
          { $sort: { _id: 1 } },
        ]),
        // Mensuel année précédente
        Order.aggregate([
          { $match: { 'payment.status': 'completed', createdAt: { $gte: startPrevYear, $lt: endPrevYear } } },
          { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$pricing.total' } } },
          { $sort: { _id: 1 } },
        ]),
      ]);

    const curMonth  = sum(monthAgg);
    const prevMonth = sum(prevMonthAgg);
    const monthGrowth = prevMonth ? Math.round(((curMonth - prevMonth) / prevMonth) * 100) : null;

    const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const curMap  = new Map(monthlyCurrentAgg.map((r: { _id: number; total: number }) => [r._id, r.total]));
    const prevMap = new Map(monthlyPrevAgg.map((r: { _id: number; total: number }) => [r._id, r.total]));

    const monthly = MONTHS.map((label, i) => ({
      month:   i + 1,
      label,
      current: (curMap.get(i + 1) ?? 0) as number,
      prev:    (prevMap.get(i + 1) ?? 0) as number,
    }));

    return {
      today:       sum(todayAgg),
      week:        sum(weekAgg),
      month:       curMonth,
      monthGrowth,
      year:        sum(yearAgg),
      allTime:     allAgg[0]?.total   ?? 0,
      avgOrder:    Math.round(avgAgg[0]?.avg ?? 0),
      totalOrders: allAgg[0]?.count   ?? 0,
      monthly,
    };
  }

  /**
   * Taux de conversion : (commandes payées / total commandes créées) × 100.
   */
  async getConversionRate(): Promise<number> {
    const [total, paid] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ 'payment.status': 'completed' }),
    ]);
    return total ? Math.round((paid / total) * 100) : 0;
  }

  /**
   * Taux d'annulation : (commandes annulées / total) × 100.
   */
  async getCancellationRate(): Promise<number> {
    const [total, cancelled] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'cancelled' }),
    ]);
    return total ? Math.round((cancelled / total) * 100) : 0;
  }

  /**
   * CA hebdomadaire des N dernières semaines (pour comparatif).
   */
  async getWeeklyRevenue(weeks = 8): Promise<Array<{ week: string; revenue: number; orders: number }>> {
    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);

    const result = await Order.aggregate([
      { $match: { 'payment.status': 'completed', createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$createdAt' },
            week: { $isoWeek: '$createdAt' },
          },
          revenue: { $sum: '$pricing.total' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    return result.map(r => ({
      week:    `S${r._id.week}/${r._id.year}`,
      revenue: r.revenue,
      orders:  r.orders,
    }));
  }

  /**
   * Panier moyen par méthode de paiement.
   */
  async getAvgOrderByPaymentMethod(): Promise<Array<{ method: string; avgOrder: number; count: number }>> {
    const result = await Order.aggregate([
      { $match: { 'payment.status': 'completed' } },
      {
        $group: {
          _id:      '$payment.method',
          avgOrder: { $avg: '$pricing.total' },
          count:    { $sum: 1 },
        },
      },
      { $sort: { avgOrder: -1 } },
    ]);

    return result.map(r => ({
      method:   r._id,
      avgOrder: Math.round(r.avgOrder),
      count:    r.count,
    }));
  }

  /**
   * Produits les plus consultés sans achat (potentiel de conversion).
   * Basé sur viewCount vs totalSold.
   */
  async getHighViewLowSalesProducts(limit = 10): Promise<Array<{
    _id: string; name: string; viewCount: number; totalSold: number; conversionRate: number;
  }>> {
    const products = await Product.find({ isActive: true, viewCount: { $gt: 0 } })
      .select('name viewCount totalSold')
      .sort({ viewCount: -1 })
      .limit(limit * 3)
      .lean();

    return products
      .map(p => ({
        _id:            String(p._id),
        name:           p.name,
        viewCount:      p.viewCount ?? 0,
        totalSold:      p.totalSold ?? 0,
        conversionRate: p.viewCount ? Math.round(((p.totalSold ?? 0) / p.viewCount) * 100) : 0,
      }))
      .sort((a, b) => a.conversionRate - b.conversionRate)
      .slice(0, limit);
  }
}

export const analyticsService = new AnalyticsService();
