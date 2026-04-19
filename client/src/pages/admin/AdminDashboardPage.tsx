import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  DollarSign, ShoppingCart, Users, Package, AlertTriangle,
  Star, ArrowUpRight, Activity, Megaphone, Zap, Wrench, Mail,
  CheckCircle, XCircle, Flame, Send,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatsCard from '../../components/admin/AdminStatsCard';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import {
  analyticsApi,
} from '../../services/admin.api';
import { formatPrice } from '../../utils/formatPrice';
import api from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  revenue?: { value: number; change: number };
  orders?: { value: number; change: number };
  customers?: { value: number; change: number };
  products?: { value: number; change: number };
}

interface SalesPoint {
  date: string;
  revenue: number;
  orders?: number;
}

interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

interface TopProduct {
  _id: string;
  name: string;
  price: number;
  totalSold: number;
  images?: Array<{ url: string }>;
}

interface LowStockProduct {
  _id: string;
  name: string;
  sku: string;
  stock: number;
}

interface ActivityItem {
  _id: string;
  type: 'order' | 'user' | 'review' | string;
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending: '#FCD116',
  confirmed: '#009A44',
  processing: '#a855f7',
  shipped: '#6366f1',
  delivered: '#007A35',
  cancelled: '#E31B23',
  returned: '#CCB000',
  refunded: '#94a3b8',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  processing: 'En traitement',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  returned: 'Retournée',
  refunded: 'Remboursée',
};

const SALES_FILTERS = [
  { label: '7j', value: 7 },
  { label: '14j', value: 14 },
  { label: '30j', value: 30 },
  { label: '90j', value: 90 },
];

// ─── Utilitaire date relative ─────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesPoint[]>([]);
  const [salesDays, setSalesDays] = useState(30);
  const [salesLoading, setSalesLoading] = useState(false);
  const [statusData, setStatusData] = useState<StatusDistribution[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [homepageSections, setHomepageSections] = useState({
    heroCount: 0, heroActive: 0,
    featuredCount: 0,
    promoBannerActive: false,
    servicesCount: 0,
  });
  const [newsletter, setNewsletter] = useState<{ total: number; recent: Array<{ _id: string; email: string; subscribedAt: string }> } | null>(null);
  const [loading, setLoading] = useState(true);

  // Chargement initial de toutes les données du dashboard
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [
          statsRes, statusRes, topRes, lowRes, activityRes,
          bannersRes, featuredRes, promoBannersRes, servicesRes, nlRes,
        ] = await Promise.all([
          analyticsApi.getDashboardStats(),
          analyticsApi.getOrderStatusDistribution(),
          analyticsApi.getTopProducts(),
          analyticsApi.getLowStockProducts(),
          analyticsApi.getRecentActivity(),
          api.get('/banners/admin/all').catch(() => ({ data: { data: [] } })),
          api.get('/products/featured').catch(() => ({ data: { data: [] } })),
          api.get('/promo-banners/admin/all').catch(() => ({ data: { data: [] } })),
          api.get('/services').catch(() => ({ data: { data: [] } })),
          api.get('/newsletter/stats').catch(() => ({ data: { data: null } })),
        ]);

        setStats(statsRes.data.data);

        // Transformation du statut des commandes pour le PieChart
        const sd = statusRes.data.data || {};
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
        // Continuer avec état vide en cas d'erreur partielle
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  // Rechargement des données de vente quand le filtre change
  useEffect(() => {
    const loadSales = async () => {
      setSalesLoading(true);
      try {
        const res = await analyticsApi.getSalesData(salesDays);
        setSalesData(res.data.data || []);
      } catch {
        setSalesData([]);
      } finally {
        setSalesLoading(false);
      }
    };
    loadSales();
  }, [salesDays]);

  // Skeleton loading pour les cartes de stats
  const statsLoading = loading;

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
          {/* ── KPIs Row ─────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <AdminStatsCard
              title="Chiffre d'affaires"
              value={stats?.revenue?.value ?? 0}
              change={stats?.revenue?.change}
              icon={DollarSign}
              iconColor="#009A44"
              iconBg="rgba(0,154,68,0.12)"
              loading={statsLoading}
              formatValue={v => formatPrice(Number(v))}
            />
            <AdminStatsCard
              title="Commandes"
              value={stats?.orders?.value ?? 0}
              change={stats?.orders?.change}
              icon={ShoppingCart}
              iconColor="#E31B23"
              iconBg="rgba(206,17,38,0.1)"
              loading={statsLoading}
            />
            <AdminStatsCard
              title="Clients actifs"
              value={stats?.customers?.value ?? 0}
              change={stats?.customers?.change}
              icon={Users}
              iconColor="#9A7A00"
              iconBg="rgba(252,209,22,0.15)"
              loading={statsLoading}
            />
            <AdminStatsCard
              title="Produits actifs"
              value={stats?.products?.value ?? 0}
              icon={Package}
              iconColor="#007A35"
              iconBg="rgba(0,154,68,0.1)"
              loading={statsLoading}
            />
          </div>

          {/* ── Sections Page d'accueil ───────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ background: 'linear-gradient(to right, #003D1C, #005C29)' }}
            >
              <h3 className="font-bold text-white text-sm mb-0 flex items-center gap-2">
                Sections Page d'accueil
              </h3>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="text-white/70 hover:text-white text-xs flex items-center gap-1 no-underline transition-colors"
              >
                <ArrowUpRight size={12} /> Voir le site
              </a>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
              {/* Hero Slider */}
              <div className="p-4 flex items-start gap-3">
                <div className="rounded-lg flex items-center justify-center shrink-0"
                  style={{ width: 36, height: 36, backgroundColor: 'rgba(0,154,68,0.1)' }}>
                  <Megaphone size={16} style={{ color: '#009A44' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Hero Slider</p>
                  <p className="font-bold text-gray-900 text-sm mb-0">
                    {homepageSections.heroActive}/{homepageSections.heroCount} actives
                  </p>
                  <Link to="/admin/bannieres" className="text-xs no-underline font-medium" style={{ color: '#009A44' }}>
                    Gérer →
                  </Link>
                </div>
              </div>

              {/* Ventes Flash */}
              <div className="p-4 flex items-start gap-3">
                <div className="rounded-lg flex items-center justify-center shrink-0"
                  style={{ width: 36, height: 36, backgroundColor: 'rgba(206,17,38,0.08)' }}>
                  <Flame size={16} style={{ color: '#E31B23' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Ventes Flash</p>
                  <p className="font-bold text-gray-900 text-sm mb-0">
                    {homepageSections.featuredCount} produit{homepageSections.featuredCount !== 1 ? 's' : ''}
                  </p>
                  <Link to="/admin/produits?featured=true" className="text-xs no-underline font-medium" style={{ color: '#E31B23' }}>
                    Gérer →
                  </Link>
                </div>
              </div>

              {/* Bannière Promo */}
              <div className="p-4 flex items-start gap-3">
                <div className="rounded-lg flex items-center justify-center shrink-0"
                  style={{ width: 36, height: 36, backgroundColor: 'rgba(252,209,22,0.15)' }}>
                  <Zap size={16} style={{ color: '#9A7A00' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Bannière Promo</p>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {homepageSections.promoBannerActive
                      ? <CheckCircle size={13} style={{ color: '#009A44' }} />
                      : <XCircle size={13} className="text-gray-400" />}
                    <p className="font-bold text-sm mb-0"
                      style={{ color: homepageSections.promoBannerActive ? '#009A44' : '#9CA3AF' }}>
                      {homepageSections.promoBannerActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <Link to="/admin/promo-banner" className="text-xs no-underline font-medium" style={{ color: '#9A7A00' }}>
                    Gérer →
                  </Link>
                </div>
              </div>

              {/* Services */}
              <div className="p-4 flex items-start gap-3">
                <div className="rounded-lg flex items-center justify-center shrink-0"
                  style={{ width: 36, height: 36, backgroundColor: 'rgba(124,58,237,0.08)' }}>
                  <Wrench size={16} style={{ color: '#7C3AED' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Services</p>
                  <p className="font-bold text-gray-900 text-sm mb-0">
                    {homepageSections.servicesCount} service{homepageSections.servicesCount !== 1 ? 's' : ''}
                  </p>
                  <Link to="/admin/services" className="text-xs no-underline font-medium" style={{ color: '#7C3AED' }}>
                    Gérer →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── Graphe Ventes ─────────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base mb-0">Chiffre d'affaires</h3>
              <div className="flex gap-1">
                {SALES_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setSalesDays(f.value)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border-0 transition-colors cursor-pointer"
                    style={{
                      backgroundColor: salesDays === f.value ? '#009A44' : '#f1f5f9',
                      color: salesDays === f.value ? '#fff' : '#64748b',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {salesLoading ? (
              <div className="animate-pulse bg-gray-100 rounded-xl" style={{ height: 240 }} />
            ) : salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={salesData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#009A44" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#009A44" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ border: 'none', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                    formatter={(value: unknown) => [formatPrice(value as number), 'Revenus']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#009A44"
                    strokeWidth={2.5}
                    fill="url(#salesGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#009A44' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <AdminEmptyState
                title="Aucune donnée de vente"
                description="Les données de vente apparaîtront ici une fois des commandes enregistrées."
              />
            )}
          </div>

          {/* ── Activité récente + Ruptures de stock ─────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Activité récente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-base mb-0 flex items-center gap-2">
                  <Activity size={17} style={{ color: '#009A44' }} />
                  Activité récente
                </h3>
              </div>
              {loading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="animate-pulse bg-gray-200 rounded-full shrink-0" style={{ width: 32, height: 32 }} />
                      <div className="flex-1">
                        <div className="animate-pulse bg-gray-200 rounded h-3 w-3/4 mb-1.5" />
                        <div className="animate-pulse bg-gray-200 rounded h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <AdminEmptyState
                  title="Aucune activité"
                  description="Les événements récents apparaîtront ici."
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {recentActivity.slice(0, 10).map(item => (
                    <div key={item._id} className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0">
                      <div
                        className="rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          width: 30,
                          height: 30,
                          backgroundColor: item.type === 'order'
                            ? 'rgba(0,154,68,0.1)'
                            : item.type === 'user'
                            ? 'rgba(206,17,38,0.08)'
                            : '#f3f4f6',
                        }}
                      >
                        {item.type === 'order'
                          ? <ShoppingCart size={14} style={{ color: '#009A44' }} />
                          : item.type === 'user'
                          ? <Users size={14} style={{ color: '#E31B23' }} />
                          : <Activity size={14} className="text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 mb-0 leading-snug">{item.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5 mb-0">{relativeTime(item.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Produits en rupture de stock */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-base mb-0 flex items-center gap-2">
                  <AlertTriangle size={17} style={{ color: '#E31B23' }} />
                  Alertes Stock
                </h3>
                <Link to="/admin/produits" className="text-sm no-underline flex items-center gap-1" style={{ color: '#009A44' }}>
                  Gérer <ArrowUpRight size={12} />
                </Link>
              </div>
              {loading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="animate-pulse bg-gray-200 rounded flex-1 h-8" />
                      <div className="animate-pulse bg-gray-200 rounded h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : lowStock.length === 0 ? (
                <AdminEmptyState
                  title="Aucune alerte de stock"
                  description="Tous les produits sont bien approvisionnés."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {lowStock.slice(0, 6).map(p => (
                    <div key={p._id} className="flex items-center gap-3">
                      <Package size={17} className="shrink-0" style={{ color: '#E31B23' }} />
                      <div className="flex-1" style={{ minWidth: 0 }}>
                        <p className="text-sm font-medium text-gray-900 mb-0 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500 mb-0">SKU: {p.sku}</p>
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                        style={{
                          backgroundColor: p.stock === 0 ? 'rgba(227,27,35,0.1)' : 'rgba(252,209,22,0.15)',
                          color: p.stock === 0 ? '#E31B23' : '#8B7000',
                        }}
                      >
                        {p.stock === 0 ? 'Rupture' : `${p.stock} restant${p.stock > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Distribution statuts + Top produits ──────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* PieChart statuts commandes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 text-base mb-4">Statuts des commandes</h3>
              {loading ? (
                <div className="animate-pulse bg-gray-100 rounded-xl" style={{ height: 220 }} />
              ) : statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={52}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={value => <span style={{ fontSize: 12, color: '#4B5563' }}>{value}</span>}
                    />
                    <Tooltip
                      contentStyle={{ border: 'none', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <AdminEmptyState title="Aucune commande" description="Les données de statuts apparaîtront ici." />
              )}
            </div>

            {/* Top produits */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-base mb-0 flex items-center gap-2">
                  <Star size={17} style={{ color: '#FCD116' }} />
                  Top Produits
                </h3>
                <Link to="/admin/produits" className="text-sm no-underline flex items-center gap-1" style={{ color: '#009A44' }}>
                  Voir tout <ArrowUpRight size={12} />
                </Link>
              </div>
              {loading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="animate-pulse bg-gray-200 rounded h-10 w-10 shrink-0" />
                      <div className="flex-1">
                        <div className="animate-pulse bg-gray-200 rounded h-3 w-2/3 mb-1.5" />
                        <div className="animate-pulse bg-gray-200 rounded h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <AdminEmptyState title="Aucune donnée" />
              ) : (
                <div className="flex flex-col gap-3">
                  {topProducts.slice(0, 5).map((p, i) => (
                    <div key={p._id} className="flex items-center gap-3">
                      <span
                        className="rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{ width: 24, height: 24, backgroundColor: 'rgba(0,154,68,0.1)', color: '#009A44' }}
                      >
                        {i + 1}
                      </span>
                      <img
                        src={p.images?.[0]?.url}
                        alt=""
                        className="rounded-lg object-cover shrink-0"
                        style={{ width: 40, height: 40, backgroundColor: '#f3f4f6' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="flex-1" style={{ minWidth: 0 }}>
                        <p className="text-sm font-medium text-gray-900 mb-0 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500 mb-0">{p.totalSold} vente{p.totalSold !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 shrink-0">{formatPrice(p.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Newsletter Widget ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-base mb-0 flex items-center gap-2">
                <Mail size={17} style={{ color: '#009A44' }} />
                Newsletter
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(0,154,68,0.1)', color: '#009A44' }}
                >
                  {newsletter?.total ?? 0} abonnés
                </span>
                <Link to="/admin/newsletter" className="text-sm no-underline flex items-center gap-1" style={{ color: '#009A44' }}>
                  Gérer <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
            {!newsletter?.recent?.length ? (
              <p className="text-sm text-gray-500 text-center py-4 mb-0">Aucun abonné pour l'instant</p>
            ) : (
              <div className="flex flex-col gap-2">
                {newsletter.recent.map(s => (
                  <div key={s._id} className="flex items-center gap-3 py-1">
                    <div
                      className="rounded-full flex items-center justify-center shrink-0"
                      style={{ width: 28, height: 28, backgroundColor: 'rgba(0,154,68,0.1)' }}
                    >
                      <Mail size={13} style={{ color: '#009A44' }} />
                    </div>
                    <span className="text-sm text-gray-900 flex-1 truncate">{s.email}</span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {new Date(s.subscribedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link
              to="/admin/newsletter"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold text-white rounded-xl no-underline transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #009A44, #007A35)' }}
            >
              <Send size={14} /> Envoyer une newsletter
            </Link>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
