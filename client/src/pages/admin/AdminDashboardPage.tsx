import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingCart, Users, Package, Megaphone, Zap, Wrench, ArrowUpRight } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatsCard from '../../components/admin/AdminStatsCard';
import SalesChartCard from '../../components/admin/dashboard/SalesChartCard';
import CategoryRevenueCard from '../../components/admin/dashboard/CategoryRevenueCard';
import TopCustomersCard from '../../components/admin/dashboard/TopCustomersCard';
import { RecentActivityCard, LowStockCard } from '../../components/admin/dashboard/ActivityAndStockCards';
import { OrderStatusCard, PaymentMethodsCard } from '../../components/admin/dashboard/OrderStatusAndPaymentCards';
import TopProductsCard from '../../components/admin/dashboard/TopProductsCard';
import NewsletterCard from '../../components/admin/dashboard/NewsletterCard';
import { analyticsApi, adminBannersApi, adminPromoBannersApi, adminNewsletterApi } from '../../services/admin.api';
import { formatPrice } from '../../utils/formatPrice';
import api from '../../services/api';
import { STATUS_COLORS, STATUS_LABELS } from '../../components/admin/dashboard/DashboardHelpers';
import type {
  DashboardStats, SalesPoint, SalesSummary, StatusDistribution,
  TopProduct, LowStockProduct, ActivityItem, PaymentMethodData,
  CategoryRevenue, TopCustomer, NewsletterData,
} from '../../components/admin/dashboard/DashboardTypes';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesPoint[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [salesDays, setSalesDays] = useState(30);
  const [salesLoading, setSalesLoading] = useState(false);
  const [statusData, setStatusData] = useState<StatusDistribution[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);
  const [categoryTotal, setCategoryTotal] = useState(0);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [homepageSections, setHomepageSections] = useState({
    heroCount: 0, heroActive: 0, featuredCount: 0,
    promoBannerActive: false, servicesCount: 0,
  });
  const [newsletter, setNewsletter] = useState<NewsletterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [catDays, setCatDays] = useState(30);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [
          statsRes, statusRes, topRes, lowRes, activityRes,
          bannersRes, featuredRes, promoBannersRes, servicesRes, nlRes,
          paymentRes, customersRes,
        ] = await Promise.all([
          analyticsApi.getDashboardStats(),
          analyticsApi.getOrderStatusDistribution(),
          analyticsApi.getTopProducts(),
          analyticsApi.getLowStockProducts(),
          analyticsApi.getRecentActivity(),
          adminBannersApi.getList().catch(() => ({ data: { data: [] } })),
          api.get('/products/featured').catch(() => ({ data: { data: [] } })),
          adminPromoBannersApi.getList().catch(() => ({ data: { data: [] } })),
          api.get('/services').catch(() => ({ data: { data: [] } })),
          adminNewsletterApi.getStats().catch(() => ({ data: { data: null } })),
          analyticsApi.getPaymentMethodDistribution().catch(() => ({ data: { data: [] } })),
          analyticsApi.getTopCustomers().catch(() => ({ data: { data: [] } })),
        ]);

        setStats(statsRes.data.data);

        const sd: Record<string, number> = statusRes.data.data || {};
        setStatusData(
          Object.entries(sd)
            .map(([key, value]) => ({
              name: STATUS_LABELS[key] || key,
              value: value as number,
              color: STATUS_COLORS[key] || '#94A3B8',
            }))
            .filter(d => d.value > 0)
        );

        setTopProducts(topRes.data.data || []);
        setLowStock(lowRes.data.data || []);
        setRecentActivity(activityRes.data.data || []);
        setNewsletter(nlRes.data.data || null);
        setPaymentMethods(paymentRes.data.data || []);
        setTopCustomers(customersRes.data.data || []);

        const bannerList: Array<{ isActive: boolean }> = bannersRes.data.data || [];
        const promoBannerList: Array<{ isActive: boolean }> = promoBannersRes.data.data || [];
        setHomepageSections({
          heroCount: bannerList.length,
          heroActive: bannerList.filter(b => b.isActive).length,
          featuredCount: (featuredRes.data.data || []).length,
          promoBannerActive: promoBannerList.some(b => b.isActive),
          servicesCount: (servicesRes.data.data || []).length,
        });
      } catch {
        // ignore — états vides par défaut
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  useEffect(() => {
    const loadSales = async () => {
      setSalesLoading(true);
      try {
        const res = await analyticsApi.getSalesData(salesDays);
        const d = res.data.data || {};
        setSalesData(d.points || []);
        setSalesSummary(d.summary || null);
      } catch {
        setSalesData([]);
        setSalesSummary(null);
      } finally {
        setSalesLoading(false);
      }
    };
    loadSales();
  }, [salesDays]);

  useEffect(() => {
    analyticsApi.getRevenueByCategory(catDays)
      .then(res => {
        const d = res.data.data || {};
        setCategoryRevenue(d.categories || []);
        setCategoryTotal(d.totalRevenue || 0);
      })
      .catch(() => { setCategoryRevenue([]); setCategoryTotal(0); });
  }, [catDays]);

  return (
    <>
      <Helmet><title>Admin — Tableau de bord | Sunu Shop</title></Helmet>
      <AdminLayout title="Tableau de bord">
        <AdminPageHeader
          title="Tableau de bord"
          subtitle="Vue d'ensemble de Sunu Shop"
          breadcrumb={[{ label: 'Administration' }, { label: 'Tableau de bord' }]}
        />

        <div className="flex flex-col gap-6">

          {/* ── KPIs ──────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <AdminStatsCard
              title="Chiffre d'affaires" value={stats?.revenue?.value ?? 0}
              change={stats?.revenue?.change} icon={DollarSign}
              iconColor="#009A44" iconBg="rgba(0,154,68,0.12)" loading={loading}
              formatValue={v => formatPrice(Number(v))}
            />
            <AdminStatsCard
              title="Commandes" value={stats?.orders?.value ?? 0}
              change={stats?.orders?.change} icon={ShoppingCart}
              iconColor="#E31B23" iconBg="rgba(206,17,38,0.1)" loading={loading}
            />
            <AdminStatsCard
              title="Clients actifs" value={stats?.customers?.value ?? 0}
              change={stats?.customers?.change} icon={Users}
              iconColor="#9A7A00" iconBg="rgba(252,209,22,0.15)" loading={loading}
            />
            <AdminStatsCard
              title="Produits actifs" value={stats?.products?.value ?? 0}
              icon={Package} iconColor="#007A35" iconBg="rgba(0,154,68,0.1)" loading={loading}
            />
          </div>

          {/* ── Sections Page d'accueil ───────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b"
              style={{ background: 'linear-gradient(to right, #003D1C, #005C29)' }}>
              <h3 className="font-bold text-white text-sm mb-0">Sections Page d'accueil</h3>
              <a href="/" target="_blank" rel="noreferrer"
                className="text-white/70 hover:text-white text-xs flex items-center gap-1 no-underline transition-colors">
                <ArrowUpRight size={12} /> Voir le site
              </a>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
              {[
                { icon: Megaphone, color: '#009A44', bg: 'rgba(0,154,68,0.1)', label: 'Hero Slider', value: `${homepageSections.heroActive}/${homepageSections.heroCount} actives`, link: '/admin/bannieres' },
                { icon: Package,   color: '#E31B23', bg: 'rgba(206,17,38,0.08)', label: 'Ventes Flash', value: `${homepageSections.featuredCount} produit${homepageSections.featuredCount !== 1 ? 's' : ''}`, link: '/admin/produits?featured=true' },
                { icon: Zap,       color: '#9A7A00', bg: 'rgba(252,209,22,0.15)', label: 'Bannière Promo', value: homepageSections.promoBannerActive ? 'Active' : 'Inactive', link: '/admin/promo-banner' },
                { icon: Wrench,    color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', label: 'Services', value: `${homepageSections.servicesCount} service${homepageSections.servicesCount !== 1 ? 's' : ''}`, link: '/admin/services' },
              ].map(({ icon: Icon, color, bg, label, value, link }) => (
                <div key={label} className="p-4 flex items-start gap-3">
                  <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 36, height: 36, backgroundColor: bg }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="font-bold text-gray-900 text-sm mb-0">{value}</p>
                    <Link to={link} className="text-xs no-underline font-medium" style={{ color }}>Gérer →</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SalesChartCard
            salesData={salesData} salesSummary={salesSummary}
            salesDays={salesDays} salesLoading={salesLoading}
            onChangeDays={setSalesDays}
          />

          <CategoryRevenueCard
            categoryRevenue={categoryRevenue} categoryTotal={categoryTotal}
            catDays={catDays} loading={loading}
            onChangeDays={setCatDays}
          />

          <TopCustomersCard topCustomers={topCustomers} loading={loading} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <RecentActivityCard recentActivity={recentActivity} loading={loading} />
            <LowStockCard lowStock={lowStock} loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <OrderStatusCard statusData={statusData} loading={loading} />
            <PaymentMethodsCard paymentMethods={paymentMethods} loading={loading} />
          </div>

          <TopProductsCard topProducts={topProducts} loading={loading} />

          <NewsletterCard newsletter={newsletter} />

        </div>
      </AdminLayout>
    </>
  );
}
