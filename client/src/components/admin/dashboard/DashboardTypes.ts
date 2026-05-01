// ─── Shared types for AdminDashboardPage sub-components ────────────────────────

export interface DashboardStats {
  revenue?: { value: number; change: number };
  orders?: { value: number; change: number };
  customers?: { value: number; change: number };
  products?: { value: number; change: number };
  avgOrder?: { value: number };
}

export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrder: number;
  revenueGrowth: number | null;
  ordersGrowth: number | null;
  prevRevenue: number;
}

export interface SalesPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface StatusDistribution { name: string; value: number; color: string }

export interface TopProduct {
  _id: string; name: string; price: number; totalSold: number;
  images?: Array<{ url: string }>;
}

export interface LowStockProduct { _id: string; name: string; sku: string; stock: number }

export interface ActivityItemData {
  orderNumber?: string;
  status?: string;
  pricing?: { total: number };
  user?: { firstName: string; lastName: string };
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface ActivityItem {
  _id?: string;
  type: 'order' | 'user' | string;
  data: ActivityItemData;
  createdAt: string;
}

export interface PaymentMethodData { method: string; count: number; total: number }

export interface CategoryRevenue {
  _id: string; category: string; slug: string;
  revenue: number; orders: number; ordersCount: number;
  avgOrderValue: number; share: number;
}

export interface TopCustomer {
  _id: string; firstName: string; lastName: string; email: string;
  totalSpent: number; orderCount: number; avgOrderValue: number;
  lastOrderDate: string;
}

export interface HomepageSections {
  heroCount: number;
  heroActive: number;
  featuredCount: number;
  promoBannerActive: boolean;
  servicesCount: number;
}

export interface NewsletterData {
  total: number;
  recent: Array<{ _id: string; email: string; subscribedAt: string }>;
}
